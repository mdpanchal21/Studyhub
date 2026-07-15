import StudySession from '../models/StudySession.js'

export const startSession = async (req, res) => {
  try {
    const session = await StudySession.create({
      user: req.user._id,
      room: req.params.roomId,
      startTime: new Date(),
    })
    res.status(201).json({ session })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const endSession = async (req, res) => {
  try {
    const session = await StudySession.findById(req.params.id)
    if (!session) {
      return res.status(404).json({ message: 'Session not found' })
    }
    if (session.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not your session' })
    }
    session.endTime = new Date()
    session.durationMinutes = Math.round(
      (session.endTime - session.startTime) / 60000
    )
    await session.save()
    res.json({ session })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getSessions = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const query = { user: req.user._id }

    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit)
    const total = await StudySession.countDocuments(query)
    const sessions = await StudySession.find(query)
      .populate('room', 'name')
      .populate({
        path: 'sessionGroup',
        populate: { path: 'members.user', select: 'name' },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Math.max(1, parseInt(limit)))

    res.json({
      sessions,
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
