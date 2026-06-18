import Message from '../models/Message.js'

export const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.roomId })
      .populate('sender', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(100)
    res.json({ messages: messages.reverse() })
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
