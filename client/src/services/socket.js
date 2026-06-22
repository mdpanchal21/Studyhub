/**
 * socket.js — Singleton Socket.IO client
 *
 * Design decisions:
 *  - autoConnect: false  → we control exactly when to connect (after auth)
 *  - transports: ['polling', 'websocket']  → polling first so the connection
 *    is confirmed before upgrading; this is the only reliable pattern through
 *    proxies (Vite dev, nginx, etc.)
 *  - Dispatcher pattern  → one underlying socket.on per event, fanned out to
 *    N React subscribers; safe to call on() before socket exists
 */

import { io } from 'socket.io-client'

let socket = null
let reconnectHandlers = []

// Map<eventName, Map<id, { current: handler }>>
const handlerRefs = new Map()
// Map<eventName, (data) => void>  — the single socket.on listener per event
const dispatchers = new Map()

// ─── Internal helpers ──────────────────────────────────────────────────────

const attachDispatcher = (event) => {
  if (dispatchers.has(event)) return
  const dispatcher = (data) => {
    handlerRefs.get(event)?.forEach((ref) => ref.current(data))
  }
  dispatchers.set(event, dispatcher)
  if (socket) {
    socket.on(event, dispatcher)
  }
}

const reattachAllDispatchers = () => {
  dispatchers.forEach((dispatcher, event) => {
    socket.off(event, dispatcher) // prevent duplication
    socket.on(event, dispatcher)
  })
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Call once after the user is authenticated.
 * Safe to call multiple times — returns existing socket if already connected.
 */
export const connectSocket = (token) => {
  if (socket) {
    if (socket.connected) return socket
    // Socket exists but disconnected — update auth token and reconnect
    socket.auth = { token }
    socket.connect()
    return socket
  }

  // In development: let Vite proxy handle it by connecting to the same origin ('').
  // In production: VITE_API_URL is the real API server (e.g. https://api.yourdomain.com).
  const serverUrl = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '')

  socket = io(serverUrl, {
    auth: { token },
    // CRITICAL: start with polling so connection is confirmed before WS upgrade.
    // This is what makes it reliable through Vite proxy, nginx, etc.
    transports: ['polling', 'websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  })

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket.id)
    // Re-attach all dispatchers to the new socket (after reconnect, socket.id changes)
    reattachAllDispatchers()
    // Notify all reconnect subscribers (e.g. Room.jsx re-emits join-room)
    reconnectHandlers.forEach((fn) => fn())
  })

  socket.on('connect_error', (err) => {
    console.warn('[Socket] Connection error:', err.message)
  })

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason)
  })

  return socket
}

/** Returns the socket instance (may be null if not yet connected) */
export const getSocket = () => socket

/** Returns true if socket is connected right now */
export const isSocketConnected = () => socket?.connected === true

/**
 * Register a handler to run every time the socket reconnects.
 * Returns an unsubscribe function.
 */
export const onReconnect = (fn) => {
  reconnectHandlers.push(fn)
  return () => {
    reconnectHandlers = reconnectHandlers.filter((h) => h !== fn)
  }
}

/**
 * Subscribe to a socket event.
 * Safe to call before socket exists — the dispatcher is created immediately
 * and attached to the socket on next connect.
 * Returns an unsubscribe function — always call it in useEffect cleanup.
 */
export const on = (event, handler) => {
  const id = Math.random().toString(36).slice(2, 10)
  const ref = { current: handler }

  if (!handlerRefs.has(event)) {
    handlerRefs.set(event, new Map())
  }
  handlerRefs.get(event).set(id, ref)

  // Ensure dispatcher exists and is attached to socket
  attachDispatcher(event)

  return () => {
    const refs = handlerRefs.get(event)
    if (!refs) return
    refs.delete(id)
    if (refs.size === 0) {
      // No more subscribers — detach from socket and clean up
      const dispatcher = dispatchers.get(event)
      if (socket && dispatcher) {
        socket.off(event, dispatcher)
      }
      dispatchers.delete(event)
      handlerRefs.delete(event)
    }
  }
}

/**
 * Fully disconnect and reset all state.
 * Only call this on logout.
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }
  reconnectHandlers = []
  handlerRefs.clear()
  dispatchers.clear()
}

// ─── Vite HMR Cleanup ──────────────────────────────────────────────────────
// Prevents "ghost sockets" from piling up and causing duplicate events
// (like double toasts) when saving files during local development.
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    disconnectSocket()
  })
}
