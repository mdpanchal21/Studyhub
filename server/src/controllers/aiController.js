import { getAIResponse } from '../config/ai.js'
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
    const prompt = `Generate ${count} quiz questions about "${topic}" in JSON format like [{"question": "...", "options": ["a", "b", "c", "d"], "correctAnswer": "a", "explanation": "..."}]`
    const result = await getAIResponse(prompt)
    let questions
    try {
      const jsonStr = result.text.replace(/```json|```/g, '').trim()
      questions = JSON.parse(jsonStr)
    } catch {
      questions = [{ question: 'Could not parse AI response', options: [], correctAnswer: '', explanation: result.text }]
    }
    res.json({ questions })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
