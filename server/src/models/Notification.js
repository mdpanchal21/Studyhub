import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'doubt_resolved', 'room_invite', 'streak', 'join_request'], default: 'info' },
  isRead: { type: Boolean, default: false },
  link: { type: String },
}, { timestamps: true })

export default mongoose.model('Notification', notificationSchema)
