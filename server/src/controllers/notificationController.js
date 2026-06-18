import Notification from '../models/Notification.js'

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
    res.json({ notifications })
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
