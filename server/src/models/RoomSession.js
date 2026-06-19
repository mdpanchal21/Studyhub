import mongoose from 'mongoose'

const roomSessionSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  active: { type: Boolean, default: true },
  startedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
  topic: { type: String, default: '' },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true })

export default mongoose.model('RoomSession', roomSessionSchema)
