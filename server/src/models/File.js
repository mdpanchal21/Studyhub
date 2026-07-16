import mongoose from 'mongoose'

const fileSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileType: { type: String, enum: ['image', 'pdf', 'document', 'presentation'], required: true },
  fileSize: { type: Number, required: true },
  mimeType: { type: String, required: true },
}, { timestamps: true })

fileSchema.index({ room: 1, createdAt: -1 })

export default mongoose.model('File', fileSchema)
