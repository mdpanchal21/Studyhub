import Doubt from '../models/Doubt.js'
import { getAIResponse } from '../config/ai.js'
import { addAIJob } from '../queues/aiQueue.js'

export const createDoubt = async (req, res) => {
  try {
    const { title, description } = req.body
    const doubt = await Doubt.create({
      room: req.params.roomId,
      user: req.user._id,
      title,
      description,
    })
    const populated = await doubt.populate('user', 'name email avatar')
    await addAIJob({ doubtId: doubt._id, title, description })
    res.status(201).json({ doubt: populated })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getDoubts = async (req, res) => {
  try {
    const doubts = await Doubt.find({ room: req.params.roomId })
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(50)
    res.json({ doubts })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const resolveDoubt = async (req, res) => {
  try {
    const doubt = await Doubt.findByIdAndUpdate(
      req.params.id,
      { status: 'resolved', resolvedBy: req.user._id },
      { new: true }
    )
    if (!doubt) {
      return res.status(404).json({ message: 'Doubt not found' })
    }
    res.json({ doubt })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
