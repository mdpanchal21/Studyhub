import Notification from '../models/Notification.js'

export const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const query = { user: req.user._id }

    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit)
    const total = await Notification.countDocuments(query)
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Math.max(1, parseInt(limit)))

    res.json({
      notifications,
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

export const markRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true })
    res.json({ message: 'Marked as read' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true }
    )
    res.json({ message: 'All marked as read' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
