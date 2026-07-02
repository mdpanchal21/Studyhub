import { getAIResponse, getAIResponseStructured } from '../config/ai.js'
import Doubt from '../models/Doubt.js'
import Flashcard from '../models/Flashcard.js'

export const askAI = async (req, res) => {
  try {
    const { question } = req.body
    const result = await getAIResponse(question)
    res.json({ answer: result.text })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const explainDoubt = async (req, res) => {
  try {
    const doubt = await Doubt.findById(req.params.id)
    if (!doubt) {
      return res.status(404).json({ message: 'Doubt not found' })
    }
    const prompt = `Explain this doubt in simple terms: ${doubt.title}\n\n${doubt.description}`
    const result = await getAIResponse(prompt)
    doubt.aiAnswer = result.text
    doubt.status = 'ai_answered'
    await doubt.save()
    res.json({ doubt })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const generateQuiz = async (req, res) => {
  try {
    const { topic, roomId, count = 5, topics } = req.body
    let context = ''
    if (roomId) {
      const filter = { room: roomId }
      if (topics && topics.length > 0) filter.topic = { $in: topics }
      const flashcards = await Flashcard.find(filter)
      if (flashcards.length > 0) {
        context = '\n\nBase the questions on these flashcards:\n' +
          flashcards.map((f, i) => `${i + 1}. Q: ${f.question}\n   A: ${f.answer}`).join('\n')
      }
    }
    const label = topics && topics.length > 0 ? topics.join(', ') : topic
    const prompt = `Generate ${count} multiple-choice quiz questions about "${label}". Each question must have exactly 4 options. The correctAnswer must exactly match one of the option values.${context}`
    const questions = await getAIResponseStructured(prompt, {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          options: { type: 'array', items: { type: 'string' } },
          correctAnswer: { type: 'string' },
          explanation: { type: 'string' },
        },
        required: ['question', 'options', 'correctAnswer', 'explanation'],
      },
    })
    res.json({ questions })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
