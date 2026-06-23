import Message from '../models/Message.js'

export const getMessages = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100)
    const filter = { room: req.params.roomId }

    if (req.query.before) {
      filter._id = { $lt: req.query.before }
    }

    const raw = await Message.find(filter)
      .populate('sender', 'name email avatar')
      .sort({ _id: -1 })
      .limit(limit + 1)

    const hasMore = raw.length > limit
    if (hasMore) raw.pop()

    const messages = raw.reverse()

    res.json({ messages, hasMore })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const sendMessage = async (req, res) => {
  try {
    const { content, type } = req.body
    const message = await Message.create({
      room: req.params.roomId,
      sender: req.user._id,
      content,
      type: type || 'text',
    })
    const populated = await message.populate('sender', 'name email avatar')
    res.status(201).json({ message: populated })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id)
    if (!message) {
      return res.status(404).json({ message: 'Message not found' })
    }
    if (message.sender.toString() !== req.user._id.toString() && req.memberRole !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' })
    }
    await message.deleteOne()
    res.json({ message: 'Message deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
