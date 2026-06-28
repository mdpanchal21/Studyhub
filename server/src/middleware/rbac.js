import Room from '../models/Room.js'
import Doubt from '../models/Doubt.js'

const getRoomMembership = async (req) => {
  const roomId = req.params.roomId || req.params.id
  const room = await Room.findById(roomId)

  if (!room || !room.isActive) {
    return { error: { status: 404, message: 'Room not found' } }
  }

  const member = room.members.find(
    (m) => m.user.toString() === req.user._id.toString()
  )

  if (!member) {
    return { error: { status: 403, message: 'Not a member of this room' } }
  }

  return { room, member }
}

export const checkRoomMember = async (req, res, next) => {
  try {
    const result = await getRoomMembership(req)
    if (result.error) {
      return res.status(result.error.status).json({ message: result.error.message })
    }

    req.room = result.room
    req.memberRole = result.member.role
    next()
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

export const checkRoomRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const result = await getRoomMembership(req)
      if (result.error) {
        return res.status(result.error.status).json({ message: result.error.message })
      }

      const { room, member } = result
      if (!allowedRoles.includes(member.role)) {
        return res.status(403).json({ message: 'Insufficient permissions' })
      }
      req.room = room
      req.memberRole = member.role
      next()
    } catch (error) {
      return res.status(500).json({ message: error.message })
    }
  }
}

export const checkDoubtRoomMember = async (req, res, next) => {
  try {
    const doubt = await Doubt.findById(req.params.id)
    if (!doubt) {
      return res.status(404).json({ message: 'Doubt not found' })
    }

    const room = await Room.findById(doubt.room)
    if (!room || !room.isActive) {
      return res.status(404).json({ message: 'Room not found' })
    }

    const member = room.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    )

    if (!member) {
      return res.status(403).json({ message: 'Not a member of this room' })
    }

    req.room = room
    req.memberRole = member.role
    req.doubt = doubt
    next()
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}
