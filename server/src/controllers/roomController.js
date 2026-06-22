import { v4 as uuidv4 } from 'uuid'
import Room from '../models/Room.js'
import Notification from '../models/Notification.js'

/**
 * Persist a notification and push it to the user's socket room in real-time.
 * io is optional — if not available, silently skips the socket push.
 */
const notifyUser = async (userId, message, type, link, io = null) => {
  const notification = await Notification.create({ user: userId, message, type, link })
  if (io) {
    // Each connected user is in a personal socket room keyed by their userId
    io.to(userId.toString()).emit('new-notification', notification)
  }
  return notification
}

// ─── Room CRUD ───

export const createRoom = async (req, res) => {
  try {
    const { name, description, topic, subject, isPrivate } = req.body
    const room = await Room.create({
      name, description, topic, subject, isPrivate,
      inviteCode: uuidv4().slice(0, 8),
      createdBy: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }],
    })
    res.status(201).json({ room })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({
      'members.user': req.user._id,
      isActive: true,
    }).populate('members.user', 'name email avatar')
    res.json({ rooms })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('members.user', 'name email avatar')
      .populate('joinRequests.user', 'name email')
    if (!room) {
      return res.status(404).json({ message: 'Room not found' })
    }
    res.json({ room })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getRoomByCode = async (req, res) => {
  try {
    const room = await Room.findOne({ inviteCode: req.params.inviteCode, isActive: true })
      .select('name description topic subject members inviteCode isActive')
    if (!room) {
      return res.status(404).json({ message: 'Room not found or no longer active' })
    }
    res.json({
      room: {
        name: room.name,
        description: room.description,
        topic: room.topic,
        subject: room.subject,
        memberCount: room.members.length,
        inviteCode: room.inviteCode,
      }
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// ─── Requests ───

export const getPendingRequests = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('joinRequests.user', 'name email')
    if (!room) {
      return res.status(404).json({ message: 'Room not found' })
    }
    res.json({ requests: room.joinRequests })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const acceptJoinRequest = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
    if (!room) {
      return res.status(404).json({ message: 'Room not found' })
    }

    const requestIdx = room.joinRequests.findIndex(
      (r) => r.user.toString() === req.params.userId && r.status === 'pending'
    )
    if (requestIdx === -1) {
      return res.status(404).json({ message: 'Pending request not found' })
    }

    room.joinRequests[requestIdx].status = 'accepted'
    room.members.push({ user: req.params.userId, role: 'member' })
    room.joinRequests.splice(requestIdx, 1)
    await room.save()

    const populated = await Room.findById(room._id)
      .populate('members.user', 'name email avatar')
      .populate('joinRequests.user', 'name email')

    const newMember = populated.members.find(
      (m) => m.user._id.toString() === req.params.userId
    )

    const io = req.app.get('io')
    if (io) {
      // Notify everyone already in the room that a new member joined
      io.to(room._id.toString()).emit('member-joined', { member: newMember })

      // Notify ONLY the accepted user (via personal socket room) with roomId
      // so the Dashboard can redirect them
      io.to(req.params.userId).emit('request-accepted', {
        roomId: room._id,
        roomName: room.name,
        room: populated,
      })
    }

    await notifyUser(
      req.params.userId,
      `Your request to join "${room.name}" was accepted`,
      'join_request',
      `/room/${room._id}`,
      io
    )

    res.json({ room: populated })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const declineJoinRequest = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
    if (!room) {
      return res.status(404).json({ message: 'Room not found' })
    }

    const requestIdx = room.joinRequests.findIndex(
      (r) => r.user.toString() === req.params.userId && r.status === 'pending'
    )
    if (requestIdx === -1) {
      return res.status(404).json({ message: 'Pending request not found' })
    }

    room.joinRequests.splice(requestIdx, 1)
    await room.save()

    const io = req.app.get('io')
    if (io) {
      // Notify ONLY the declined user (via personal socket room)
      io.to(req.params.userId).emit('request-declined', {
        userId: req.params.userId,
        roomId: room._id,
        roomName: room.name,
      })
    }

    await notifyUser(
      req.params.userId,
      `Your request to join "${room.name}" was declined`,
      'info',
      null,
      io
    )

    res.json({ message: 'Request declined' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// ─── Join / Leave / Kick ───

export const joinRoom = async (req, res) => {
  try {
    const { inviteCode } = req.body
    const room = await Room.findOne({ inviteCode, isActive: true })
    if (!room) {
      return res.status(404).json({ message: 'Invalid invite code' })
    }
    const alreadyMember = room.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    )
    if (alreadyMember) {
      return res.status(400).json({ message: 'Already a member' })
    }

    const alreadyRequested = room.joinRequests.find(
      (r) => r.user.toString() === req.user._id.toString() && r.status === 'pending'
    )
    if (alreadyRequested) {
      return res.status(400).json({ message: 'Join request already pending' })
    }

    room.joinRequests.push({ user: req.user._id, status: 'pending' })
    await room.save()

    const populated = await Room.findById(room._id)
      .populate('joinRequests.user', 'name email')

    const newRequest = populated.joinRequests.find(
      (r) => r.user._id.toString() === req.user._id.toString()
    )

    const io = req.app.get('io')
    if (io) {
      // Emit join-request to room (admins in the room see it live)
      io.to(room._id.toString()).emit('join-request', { request: newRequest })
    }

    // Persist notification and push real-time to each admin's personal socket room
    const adminMembers = room.members.filter((m) => m.role === 'admin')
    for (const admin of adminMembers) {
      await notifyUser(
        admin.user,
        `${req.user.name} wants to join "${room.name}"`,
        'join_request',
        `/room/${room._id}`,
        io
      )
    }

    res.json({ message: 'Join request sent', request: newRequest })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const leaveRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
    if (!room) {
      return res.status(404).json({ message: 'Room not found' })
    }
    room.members = room.members.filter(
      (m) => m.user.toString() !== req.user._id.toString()
    )
    await room.save()

    const io = req.app.get('io')
    if (io) {
      io.to(req.params.id).emit('member-left', {
        userId: req.user._id,
      })
    }

    res.json({ message: 'Left room' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const kickMember = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
    if (!room) {
      return res.status(404).json({ message: 'Room not found' })
    }

    const targetId = req.params.userId
    if (targetId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot kick yourself' })
    }

    const targetMember = room.members.find(
      (m) => m.user.toString() === targetId
    )
    if (!targetMember) {
      return res.status(404).json({ message: 'User not a member' })
    }

    room.members = room.members.filter(
      (m) => m.user.toString() !== targetId
    )
    await room.save()

    const io = req.app.get('io')
    if (io) {
      // Tell the room the member left
      io.to(req.params.id).emit('member-left', { userId: targetId })
      // Tell the kicked user directly via their personal socket room
      io.to(targetId).emit('kicked', {
        userId: targetId,
        roomId: room._id,
        roomName: room.name,
      })
    }

    await notifyUser(
      targetId,
      `You were removed from "${room.name}" by the admin`,
      'info',
      null,
      io
    )

    res.json({ message: 'Member kicked' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
    if (!room) {
      return res.status(404).json({ message: 'Room not found' })
    }
    if (room.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only creator can delete' })
    }
    room.isActive = false
    await room.save()
    res.json({ message: 'Room deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
