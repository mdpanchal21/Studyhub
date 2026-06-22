import { io } from 'socket.io-client'

let socket = null
let reconnectHandlers = []
const handlerRefs = {}
const dispatchers = {}

export const connectSocket = (token) => {
  if (socket?.connected) return socket

  socket = io({
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  })

  socket.on('connect', () => {
    console.log('Socket connected')
    reconnectHandlers.forEach((fn) => fn())
  })

  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message)
  })

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason)
  })

  Object.keys(dispatchers).forEach((event) => {
    socket.on(event, dispatchers[event])
  })

  return socket
}

export const getSocket = () => socket

export const onReconnect = (fn) => {
  reconnectHandlers.push(fn)
  return () => {
    reconnectHandlers = reconnectHandlers.filter((h) => h !== fn)
  }
}

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }
  reconnectHandlers = []
  Object.keys(handlerRefs).forEach((event) => delete handlerRefs[event])
  Object.keys(dispatchers).forEach((event) => delete dispatchers[event])
}

export const on = (event, handler) => {
  const id = Math.random().toString(36).slice(2, 10)
  const ref = { current: handler }

  if (!handlerRefs[event]) {
    handlerRefs[event] = {}
    dispatchers[event] = (data) => {
      Object.values(handlerRefs[event]).forEach((r) => r.current(data))
    }
    if (socket) {
      socket.on(event, dispatchers[event])
    }
  }

  handlerRefs[event][id] = ref

  return () => {
    if (!handlerRefs[event]) return
    delete handlerRefs[event][id]
    if (Object.keys(handlerRefs[event]).length === 0) {
      if (socket) socket.off(event, dispatchers[event])
      delete handlerRefs[event]
      delete dispatchers[event]
    }
  }
}
