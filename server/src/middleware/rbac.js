import Room from '../models/Room.js'

export const checkRoomRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const roomId = req.params.roomId || req.params.id
      const room = await Room.findById(roomId)
      if (!room) {
        return res.status(404).json({ message: 'Room not found' })
      }
      const member = room.members.find(
        (m) => m.user.toString() === req.user._id.toString()
      )
      if (!member) {
        return res.status(403).json({ message: 'Not a member of this room' })
      }
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
