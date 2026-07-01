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
    const { topic, count = 5 } = req.body
    const prompt = `Generate ${count} quiz questions about "${topic}". Each question must have exactly 4 options. The correctAnswer must exactly match one of the option values.`
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
