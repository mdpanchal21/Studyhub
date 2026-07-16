import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Message from '../models/Message.js'

let io

export const getIO = () => io

const setupSocket = (server, app) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL.split(','),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['polling', 'websocket'],
  })

  app.set('io', io)

  const onlineUsers = new Map()

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token
      if (!token) return next(new Error('No token'))
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.id).select('-password')
      if (!user) return next(new Error('User not found'))
      socket.user = user
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString()
    console.log(`[Socket] Connected: ${socket.user.name} (${socket.id})`)

    onlineUsers.set(userId, socket.id)

    socket.join(userId)

    const joinedRooms = new Set()

    socket.on('join-room', (roomId) => {
      socket.join(roomId)
      joinedRooms.add(roomId)
      console.log(`[Socket] ${socket.user.name} joined room ${roomId}`)
      socket.to(roomId).emit('user-online', {
        userId: socket.user._id,
        name: socket.user.name,
      })
    })

    socket.on('leave-room', (roomId) => {
      socket.leave(roomId)
      joinedRooms.delete(roomId)
      console.log(`[Socket] ${socket.user.name} left room ${roomId}`)
      socket.to(roomId).emit('user-offline', {
        userId: socket.user._id,
        name: socket.user.name,
      })
    })

    socket.on('broadcast-message', (data) => {
      const { roomId, message } = data
      socket.to(roomId).emit('new-message', message)
    })

    socket.on('typing', (data) => {
      socket.to(data.roomId).emit('user-typing', {
        userId: socket.user._id,
        name: socket.user.name,
      })
    })

    socket.on('stop-typing', (data) => {
      socket.to(data.roomId).emit('user-stop-typing', {
        userId: socket.user._id,
      })
    })

    // ─── Doubts ────────────────────────────────────────────────────────────

    socket.on('doubt-resolved', (data) => {
      if (!data?.roomId || !data?.doubtId) return
      io.to(data.roomId).emit('doubt-update', {
        doubtId: data.doubtId,
        status: 'resolved',
      })
    })

    // ─── Study Sessions ────────────────────────────────────────────────────

    socket.on('session-started', (data) => {
      socket.to(data.roomId).emit('session-update', data)
    })

    socket.on('session-joined', (data) => {
      socket.to(data.roomId).emit('session-update', data)
    })

    socket.on('session-left', (data) => {
      socket.to(data.roomId).emit('session-update', data)
    })

    socket.on('session-ended', (data) => {
      socket.to(data.roomId).emit('session-update', data)
    })

    // ─── Files ───────────────────────────────────────────────────────────────

    socket.on('new-file', (data) => {
      if (!data?.roomId || !data?.file) return
      socket.to(data.roomId).emit('new-file', data)
    })

    socket.on('file-deleted', (data) => {
      if (!data?.roomId || !data?.fileId) return
      socket.to(data.roomId).emit('file-deleted', data)
    })

    // ─── Disconnect ────────────────────────────────────────────────────────

    socket.on('disconnect', (reason) => {
      onlineUsers.delete(userId)

      joinedRooms.forEach((roomId) => {
        io.to(roomId).emit('user-offline', {
          userId: socket.user._id,
          name: socket.user.name,
        })
      })

      console.log(`[Socket] Disconnected: ${socket.user.name} (reason: ${reason})`)
    })
  })

  return io
}

export default setupSocket
