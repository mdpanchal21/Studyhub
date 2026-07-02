import mongoose from 'mongoose'

const questionSchema = new mongoose.Schema({
  question: String,
  options: [String],
  correctAnswer: String,
  explanation: String,
}, { _id: false })

const resultSchema = new mongoose.Schema({
  questionIndex: Number,
  selected: String,
  correct: Boolean,
}, { _id: false })

const quizSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  topic: { type: String, required: true },
  questions: [questionSchema],
  results: [resultSchema],
  score: Number,
  total: Number,
}, { timestamps: true })

export default mongoose.model('Quiz', quizSchema)
