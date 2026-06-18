import { io } from 'socket.io-client'

let socket = null
let reconnectHandlers = []

export const connectSocket = (token) => {
  if (socket?.connected) return socket

  socket = io('http://172.16.16.108:5000', {
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
    socket.disconnect()
    socket = null
  }
  reconnectHandlers = []
}
