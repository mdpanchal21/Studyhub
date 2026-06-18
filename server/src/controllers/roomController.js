import { v4 as uuidv4 } from 'uuid'
import Room from '../models/Room.js'

export const createRoom = async (req, res) => {
  try {
    const { name, description, topic, subject, isPrivate } = req.body
    const room = await Room.create({
      name,
      description,
      topic,
      subject,
      isPrivate,
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
    if (!room) {
      return res.status(404).json({ message: 'Room not found' })
    }
    res.json({ room })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

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
    room.members.push({ user: req.user._id, role: 'member' })
    await room.save()
    res.json({ room })
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
    res.json({ message: 'Left room' })
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
