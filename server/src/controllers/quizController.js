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
    const quizzes = await Quiz.find({ user: req.user._id })
      .select('topic score total createdAt room')
      .populate('room', 'name')
      .sort('-createdAt')
    res.json({ quizzes })
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
