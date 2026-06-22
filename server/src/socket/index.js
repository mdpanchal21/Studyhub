import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Message from '../models/Message.js'

const setupSocket = (server, app) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL.split(','),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Allow polling fallback — matches client transport config
    transports: ['polling', 'websocket'],
  })

  app.set('io', io)

  // Map<userId, socketId>  — for direct user targeting (notifications, kick, etc.)
  const onlineUsers = new Map()
  io.onlineUsers = onlineUsers

  // ─── Auth middleware ─────────────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token
      if (!token) return next(new Error('No token provided'))
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.id).select('name email avatar')
      if (!user) return next(new Error('User not found'))
      socket.user = user
      next()
    } catch (err) {
      next(new Error('Authentication failed'))
    }
  })

  // ─── Connection ──────────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const userId = socket.user._id.toString()
    console.log(`[Socket] Connected: ${socket.user.name} (${socket.id})`)

    onlineUsers.set(userId, socket.id)

    // Each user joins their personal room (userId) for direct notifications
    socket.join(userId)

    // Track all rooms this socket has joined (for multi-room leave on disconnect)
    const joinedRooms = new Set()

    // ─── Room events ───────────────────────────────────────────────────────

    socket.on('join-room', (roomId) => {
      if (!roomId) return
      socket.join(roomId)
      joinedRooms.add(roomId)
      console.log(`[Socket] ${socket.user.name} joined room ${roomId}`)

      // Notify all others in the room that this user is online
      socket.to(roomId).emit('user-online', {
        userId: socket.user._id,
        name: socket.user.name,
      })
    })

    socket.on('leave-room', (roomId) => {
      if (!roomId) return
      socket.leave(roomId)
      joinedRooms.delete(roomId)
      console.log(`[Socket] ${socket.user.name} left room ${roomId}`)

      socket.to(roomId).emit('user-offline', {
        userId: socket.user._id,
        name: socket.user.name,
      })
    })

    // ─── Chat ──────────────────────────────────────────────────────────────

    socket.on('broadcast-message', (data) => {
      const { roomId, message } = data
      if (!roomId || !message) return
      // Broadcast to everyone in room EXCEPT sender (sender already has it from HTTP response)
      socket.to(roomId).emit('new-message', message)
    })

    socket.on('typing', (data) => {
      if (!data?.roomId) return
      socket.to(data.roomId).emit('user-typing', {
        userId: socket.user._id,
        name: socket.user.name,
      })
    })

    socket.on('stop-typing', (data) => {
      if (!data?.roomId) return
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

    // ─── Session relay ─────────────────────────────────────────────────────
    // These are relay-only events: the HTTP controller is the source of truth.
    // The client emits these after a successful API call to propagate to peers.

    socket.on('session-started', (data) => {
      if (!data?.roomId || !data?.session) return
      io.to(data.roomId).emit('session-update', {
        action: 'started',
        session: data.session,
      })
    })

    socket.on('session-joined', (data) => {
      if (!data?.roomId || !data?.session) return
      io.to(data.roomId).emit('session-update', {
        action: 'joined',
        session: data.session,
      })
    })

    socket.on('session-left', (data) => {
      if (!data?.roomId || !data?.session) return
      io.to(data.roomId).emit('session-update', {
        action: 'left',
        session: data.session,
      })
    })

    socket.on('session-ended', (data) => {
      if (!data?.roomId) return
      io.to(data.roomId).emit('session-update', { action: 'ended' })
    })

    // ─── Disconnect ────────────────────────────────────────────────────────

    socket.on('disconnect', (reason) => {
      onlineUsers.delete(userId)

      // Emit user-offline to ALL rooms this socket was in (not just the last one)
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
