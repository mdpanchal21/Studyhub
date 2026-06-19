import mongoose from 'mongoose'

const studySessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  sessionGroup: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomSession' },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  durationMinutes: { type: Number, default: 0 },
  focusArea: { type: String, default: '' },
}, { timestamps: true })

export default mongoose.model('StudySession', studySessionSchema)
