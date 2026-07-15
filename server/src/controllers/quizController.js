import Quiz from '../models/Quiz.js'

export const saveQuiz = async (req, res) => {
  try {
    const { room, topic, questions, results, score, total } = req.body
    const quiz = await Quiz.create({
      user: req.user._id,
      room: room || undefined,
      topic,
      questions,
      results,
      score,
      total,
    })
    res.status(201).json({ quiz })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getQuizzes = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const query = { user: req.user._id }

    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit)
    const total = await Quiz.countDocuments(query)
    const quizzes = await Quiz.find(query)
      .select('topic score total createdAt room')
      .populate('room', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Math.max(1, parseInt(limit)))

    res.json({
      quizzes,
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

export const getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, user: req.user._id })
      .populate('room', 'name')
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' })
    }
    res.json({ quiz })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
