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
    const flashcards = await Flashcard.find({
      user: req.user._id,
      room: req.params.roomId,
    }).sort({ createdAt: -1 })
    res.json({ flashcards })
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
    await Flashcard.findByIdAndDelete(req.params.id)
    res.json({ message: 'Flashcard deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
