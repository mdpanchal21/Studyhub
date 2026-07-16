import multer from 'multer'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import cloudinary from '../config/cloudinary.js'
import File from '../models/File.js'

const ALLOWED_TYPES = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'application/pdf': 'pdf',
  'application/msword': 'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
  'application/vnd.ms-powerpoint': 'presentation',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'presentation',
}

const MAX_SIZE = 10 * 1024 * 1024

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req) => ({
    folder: `studyhub/${req.params.roomId}`,
    resource_type: 'auto',
  }),
})

export const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES[file.mimetype]) {
      cb(null, true)
    } else {
      cb(new Error('File type not allowed'))
    }
  },
})

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    const file = await File.create({
      room: req.params.roomId,
      uploader: req.user._id,
      fileName: req.file.originalname,
      fileUrl: req.file.path,
      fileType: ALLOWED_TYPES[req.file.mimetype],
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    })

    const populated = await file.populate('uploader', 'name avatar')

    const io = req.app.get('io')
    if (io) {
      io.to(req.params.roomId).emit('new-file', { file: populated })
    }

    res.status(201).json({ file: populated })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ message: error.message || 'Upload failed' })
  }
}

export const getFiles = async (req, res) => {
  try {
    const { roomId } = req.params
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit

    const [files, total] = await Promise.all([
      File.find({ room: roomId })
        .populate('uploader', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      File.countDocuments({ room: roomId }),
    ])

    res.json({
      files,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id)

    if (!file) {
      return res.status(404).json({ message: 'File not found' })
    }

    if (file.uploader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the uploader can delete this file' })
    }

    const publicId = file.fileUrl.split('/').slice(-1)[0].split('.')[0]
    await cloudinary.uploader.destroy(`studyhub/${file.room}/${publicId}`).catch(() => {})

    await file.deleteOne()

    const io = req.app.get('io')
    if (io) {
      io.to(file.room.toString()).emit('file-deleted', { fileId: file._id })
    }

    res.json({ message: 'File deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
