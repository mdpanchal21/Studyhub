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
    const sessions = await StudySession.find({ user: req.user._id })
      .populate('room', 'name')
      .populate({
        path: 'sessionGroup',
        populate: { path: 'members.user', select: 'name' },
      })
      .sort({ createdAt: -1 })
      .limit(20)
    res.json({ sessions })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
