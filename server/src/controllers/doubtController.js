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
    const { page = 1, limit = 10, search, status, userId } = req.query
    const query = { room: req.params.roomId }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ]
    }

    if (status) {
      query.status = status
    }

    if (userId) {
      query.user = userId
    }

    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit)
    const total = await Doubt.countDocuments(query)
    const doubts = await Doubt.find(query)
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Math.max(1, parseInt(limit)))

    res.json({
      doubts,
      pagination: {
        page: Math.max(1, parseInt(page)),
        limit: Math.max(1, parseInt(limit)),
        total,
        pages: Math.ceil(total / Math.max(1, parseInt(limit))),
      },
    })
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

export const retryDoubt = async (req, res) => {
  try {
    const doubt = req.doubt || await Doubt.findById(req.params.id)
    if (!doubt) {
      return res.status(404).json({ message: 'Doubt not found' })
    }
    const currentRetries = doubt.retryCount ?? 0
    if (currentRetries >= 3) {
      return res.status(400).json({ message: 'Max retries reached. Please create a new doubt.' })
    }
    doubt.status = 'open'
    doubt.aiAnswer = undefined
    doubt.retryCount = currentRetries + 1
    await doubt.save()
    await addAIJob({ doubtId: doubt._id, title: doubt.title, description: doubt.description })
    res.json({ doubt })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
