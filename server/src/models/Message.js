import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['text', 'code', 'image'], default: 'text' },
}, { timestamps: true })

export default mongoose.model('Message', messageSchema)
