import Room from '../models/Room.js'
import RoomSession from '../models/RoomSession.js'
import StudySession from '../models/StudySession.js'
import User from '../models/User.js'

export const getActiveSession = async (req, res) => {
  try {
    const session = await RoomSession.findOne({
      room: req.params.roomId,
      active: true,
    }).populate('startedBy', 'name email avatar')
      .populate('members.user', 'name email avatar')
    res.json({ session })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const startSession = async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId)
    if (!room) {
      return res.status(404).json({ message: 'Room not found' })
    }
    const member = room.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    )
    if (!member || member.role !== 'admin') {
      return res.status(403).json({ message: 'Only room admin can start a session' })
    }

    const existing = await RoomSession.findOne({
      room: req.params.roomId,
      active: true,
    })
    if (existing) {
      return res.status(400).json({ message: 'A session is already active' })
    }

    const roomSession = await RoomSession.create({
      room: req.params.roomId,
      startedBy: req.user._id,
      topic: req.body.topic || '',
      members: [{ user: req.user._id }],
    })

    await StudySession.create({
      user: req.user._id,
      room: req.params.roomId,
      sessionGroup: roomSession._id,
      startTime: new Date(),
      focusArea: req.body.topic || '',
    })

    await User.findByIdAndUpdate(req.user._id, { lastStudyDate: new Date() })

    const populated = await RoomSession.findById(roomSession._id)
      .populate('startedBy', 'name email avatar')
      .populate('members.user', 'name email avatar')

    const io = req.app.get('io')
    if (io) {
      io.to(req.params.roomId).emit('session-toast', {
        type: 'started', userName: req.user.name,
      })
    }

    res.status(201).json({ session: populated })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const joinSession = async (req, res) => {
  try {
    const roomSession = await RoomSession.findOne({
      room: req.params.roomId,
      active: true,
    })
    if (!roomSession) {
      return res.status(404).json({ message: 'No active session' })
    }

    const alreadyJoined = roomSession.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    )
    if (alreadyJoined) {
      return res.status(400).json({ message: 'Already in session' })
    }

    roomSession.members.push({ user: req.user._id })
    await roomSession.save()

    await StudySession.create({
      user: req.user._id,
      room: req.params.roomId,
      sessionGroup: roomSession._id,
      startTime: new Date(),
    })

    await User.findByIdAndUpdate(req.user._id, { lastStudyDate: new Date() })

    const populated = await RoomSession.findById(roomSession._id)
      .populate('startedBy', 'name email avatar')
      .populate('members.user', 'name email avatar')

    const io = req.app.get('io')
    if (io) {
      // Only notify admins when a member joins a session
      const room = await Room.findById(req.params.roomId)
      const adminMembers = room.members.filter((m) => m.role === 'admin')
      for (const admin of adminMembers) {
        io.to(admin.user.toString()).emit('session-toast', {
          type: 'joined', userName: req.user.name,
        })
      }
    }

    res.json({ session: populated })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const leaveSession = async (req, res) => {
  try {
    const roomSession = await RoomSession.findOne({
      room: req.params.roomId,
      active: true,
    })
    if (!roomSession) {
      return res.status(404).json({ message: 'No active session' })
    }

    await StudySession.findOneAndUpdate(
      { user: req.user._id, sessionGroup: roomSession._id, endTime: null },
      { endTime: new Date(), durationMinutes: 0 }
    )

    roomSession.members = roomSession.members.filter(
      (m) => m.user.toString() !== req.user._id.toString()
    )

    if (roomSession.members.length === 0) {
      roomSession.active = false
      roomSession.endedAt = new Date()
    }
    await roomSession.save()

    const lastMember = roomSession.members.length === 0
    const populated = await RoomSession.findById(roomSession._id)
      .populate('startedBy', 'name email avatar')
      .populate('members.user', 'name email avatar')

    const io = req.app.get('io')
    if (io && !lastMember) {
      // Only notify admins when a member leaves a session
      const room = await Room.findById(req.params.roomId)
      const adminMembers = room.members.filter((m) => m.role === 'admin')
      for (const admin of adminMembers) {
        io.to(admin.user.toString()).emit('session-toast', {
          type: 'left', userName: req.user.name,
        })
      }
    }

    res.json({ session: populated, lastMember })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const endSession = async (req, res) => {
  try {
    const roomSession = await RoomSession.findOne({
      room: req.params.roomId,
      active: true,
    })
    if (!roomSession) {
      return res.status(404).json({ message: 'No active session' })
    }

    if (roomSession.startedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the session host can end it' })
    }

    await StudySession.updateMany(
      { sessionGroup: roomSession._id, endTime: null },
      { endTime: new Date(), durationMinutes: 0 }
    )

    roomSession.active = false
    roomSession.endedAt = new Date()
    await roomSession.save()

    const io = req.app.get('io')
    if (io) {
      io.to(req.params.roomId).emit('session-toast', {
        type: 'ended', userName: req.user.name,
      })
    }

    res.json({ message: 'Session ended' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
