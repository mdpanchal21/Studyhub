import mongoose from 'mongoose'

const flashcardSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  topic: { type: String },
  question: { type: String, required: true },
  answer: { type: String, required: true },
  nextReview: { type: Date, default: Date.now },
}, { timestamps: true })

export default mongoose.model('Flashcard', flashcardSchema)
