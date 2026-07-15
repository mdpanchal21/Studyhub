import Flashcard from '../models/Flashcard.js'
import { addFlashcardJob } from '../queues/aiQueue.js'

export const createFlashcard = async (req, res) => {
  try {
    const { question, answer } = req.body
    const flashcard = await Flashcard.create({
      user: req.user._id,
      room: req.params.roomId,
      question,
      answer,
    })
    res.status(201).json({ flashcard })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getFlashcards = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const query = { user: req.user._id, room: req.params.roomId }

    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit)
    const total = await Flashcard.countDocuments(query)
    const flashcards = await Flashcard.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Math.max(1, parseInt(limit)))

    res.json({
      flashcards,
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

export const generateFlashcards = async (req, res) => {
  try {
    const { topic } = req.body
    await addFlashcardJob({ userId: req.user._id, roomId: req.params.roomId, topic })
    res.json({ message: 'Flashcard generation queued. Check back shortly.' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const deleteFlashcard = async (req, res) => {
  try {
    const flashcard = await Flashcard.findById(req.params.id)
    if (!flashcard) {
      return res.status(404).json({ message: 'Flashcard not found' })
    }
    if (flashcard.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' })
    }
    await flashcard.deleteOne()
    res.json({ message: 'Flashcard deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
