import { getAIResponse } from '../config/ai.js'
import Doubt from '../models/Doubt.js'
import Flashcard from '../models/Flashcard.js'
import { popAIJob } from '../queues/aiQueue.js'
import { getIO } from '../socket/index.js'
import redis from '../config/redis.js'

const processAIJob = async (data) => {
  if (data.type === 'flashcard') {
    const { userId, roomId, topic } = data
    const prompt = `Generate 10 flashcards about "${topic}" in JSON format [{"question": "...", "answer": "..."}]`
    const result = await getAIResponse(prompt)
    try {
      const jsonStr = result.text.replace(/```json|```/g, '').trim()
      const cards = JSON.parse(jsonStr)
      for (const card of cards) {
        await Flashcard.create({ user: userId, room: roomId, question: card.question, answer: card.answer })
      }
      console.log(`Generated ${cards.length} flashcards for: ${topic}`)
    } catch (err) {
      console.error('Flashcard parse error:', err.message)
    }
    return
  }

  const { doubtId, title, description } = data
  if (doubtId) {
    const prompt = `Answer this doubt in detail:\nTitle: ${title}\nDescription: ${description}`
    const result = await getAIResponse(prompt)
    const doubt = await Doubt.findByIdAndUpdate(
      doubtId,
      { aiAnswer: result.text, status: 'ai_answered' },
      { new: true }
    )
    console.log(`AI answered doubt: ${doubtId}`)
    const io = getIO()
    if (io && doubt) {
      io.to(doubt.room.toString()).emit('doubt-update', {
        doubtId: doubt._id,
        status: 'ai_answered',
        aiAnswer: result.text,
      })
    }
  }
}

export const startAIWorker = async () => {
  console.log('AI worker started')
  while (true) {
    try {
      const job = await popAIJob()
      if (job) {
        await processAIJob(job)
      }
    } catch (err) {
      console.error('AI worker error:', err.message)
    }
  }
}
