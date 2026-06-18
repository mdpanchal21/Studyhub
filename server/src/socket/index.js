import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Message from '../models/Message.js'

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  })

  const onlineUsers = new Map()

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token
      if (!token) return next(new Error('No token'))
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.id)
      if (!user) return next(new Error('User not found'))
      socket.user = user
      next()
    } catch (err) {
      next(new Error('Authentication error'))
    }
  })

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.name}`)
    onlineUsers.set(socket.user._id.toString(), socket.id)

    socket.on('join-room', (roomId) => {
      socket.join(roomId)
      socket.data.roomId = roomId
      console.log(`${socket.user.name} joined room ${roomId}`)
      io.to(roomId).emit('user-online', {
        userId: socket.user._id,
        name: socket.user.name,
      })
    })

    socket.on('leave-room', (roomId) => {
      socket.leave(roomId)
      console.log(`${socket.user.name} left room ${roomId}`)
      io.to(roomId).emit('user-offline', {
        userId: socket.user._id,
        name: socket.user.name,
      })
    })

    socket.on('broadcast-message', (data) => {
      const { roomId, message } = data
      if (message) {
        console.log(`${socket.user.name} broadcasting to room ${roomId}`)
        socket.to(roomId).emit('new-message', message)
      }
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

    socket.on('doubt-resolved', (data) => {
      io.to(data.roomId).emit('doubt-update', {
        doubtId: data.doubtId,
        status: 'resolved',
      })
    })

    socket.on('disconnect', () => {
      onlineUsers.delete(socket.user._id.toString())
      if (socket.data.roomId) {
        io.to(socket.data.roomId).emit('user-offline', {
          userId: socket.user._id,
          name: socket.user.name,
        })
      }
      console.log(`User disconnected: ${socket.user.name}`)
    })
  })

  return io
}

export default setupSocket
