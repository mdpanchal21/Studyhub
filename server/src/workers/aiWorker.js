import { getAIResponse, getAIResponseStream } from '../config/ai.js'
import Doubt from '../models/Doubt.js'
import Flashcard from '../models/Flashcard.js'
import { popAIJob } from '../queues/aiQueue.js'
import { getIO } from '../socket/index.js'
import redis from '../config/redis.js'

const processAIJob = async (data) => {
  if (data.type === 'flashcard') {
    const { userId, roomId, topic } = data
    const prompt = `Generate 10 flashcards about "${topic}" in JSON format [{"question": "...", "answer": "..."}]`
    const io = getIO()

    try {
      const result = await getAIResponseStream(prompt, (chunk) => {
        if (io && userId) {
          io.to(userId.toString()).emit('flashcard-ai-chunk', { chunk, topic })
        }
      })

      const jsonStr = result.text.replace(/```json|```/g, '').trim()
      const cards = JSON.parse(jsonStr)
      const created = []
      for (const card of cards) {
        const doc = await Flashcard.create({ user: userId, room: roomId, question: card.question, answer: card.answer })
        created.push(doc)
      }
      console.log(`Generated ${cards.length} flashcards for: ${topic}`)
      if (io && userId) {
        io.to(userId.toString()).emit('flashcard-ai-complete', { flashcards: created, topic })
      }
    } catch (err) {
      console.error('Flashcard generation error:', err.message)
      if (io && userId) {
        io.to(userId.toString()).emit('flashcard-ai-error', { error: 'Failed to generate flashcards. Try again.' })
      }
    }
    return
  }

  const { doubtId, title, description } = data
  if (doubtId) {
    const io = getIO()
    const doubt = await Doubt.findById(doubtId)
    if (!doubt) return

    const roomId = doubt.room.toString()
    const prompt = `Answer this doubt in detail:\nTitle: ${title}\nDescription: ${description}`

    try {
      const result = await getAIResponseStream(prompt, (chunk) => {
        if (io) {
          io.to(roomId).emit('doubt-ai-chunk', { doubtId, chunk })
        }
      })

      await Doubt.findByIdAndUpdate(
        doubtId,
        { aiAnswer: result.text, status: 'ai_answered' },
        { new: true }
      )
      console.log(`AI answered doubt: ${doubtId}`)

      if (io) {
        io.to(roomId).emit('doubt-ai-complete', {
          doubtId,
          status: 'ai_answered',
          aiAnswer: result.text,
        })
      }
    } catch (err) {
      console.error('AI answer error for doubt', doubtId, ':', err.message)
      if (io) {
        io.to(roomId).emit('doubt-ai-error', { doubtId })
      }
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
