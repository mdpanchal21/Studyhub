import { Worker } from 'bullmq'
import redis from '../config/redis.js'
import { getAIResponse } from '../config/ai.js'
import Doubt from '../models/Doubt.js'
import Flashcard from '../models/Flashcard.js'

const aiWorker = new Worker('ai-processing', async (job) => {
  if (job.name === 'answer-doubt') {
    const { doubtId, title, description } = job.data
    const prompt = `Answer this doubt in detail:\nTitle: ${title}\nDescription: ${description}`
    const result = await getAIResponse(prompt)
    await Doubt.findByIdAndUpdate(doubtId, {
      aiAnswer: result.text,
      status: 'ai_answered',
    })
    console.log(`AI answered doubt: ${doubtId}`)
  }

  if (job.name === 'generate-flashcards') {
    const { userId, roomId, topic } = job.data
    const prompt = `Generate 10 flashcards about "${topic}" in JSON format [{"question": "...", "answer": "..."}]`
    const result = await getAIResponse(prompt)
    try {
      const jsonStr = result.text.replace(/```json|```/g, '').trim()
      const cards = JSON.parse(jsonStr)
      for (const card of cards) {
        await Flashcard.create({
          user: userId,
          room: roomId,
          question: card.question,
          answer: card.answer,
        })
      }
      console.log(`Generated ${cards.length} flashcards for topic: ${topic}`)
    } catch (err) {
      console.error('Failed to parse flashcards:', err.message)
    }
  }
}, { connection: redis })

aiWorker.on('completed', (job) => console.log(`AI job ${job.id} completed`))
aiWorker.on('failed', (job, err) => console.error(`AI job ${job.id} failed:`, err))

export default aiWorker
