import { Worker } from 'bullmq'
import { getAIResponseStream } from '../config/ai.js'
import Doubt from '../models/Doubt.js'
import Flashcard from '../models/Flashcard.js'
import { getIO } from '../socket/index.js'
import { BULLMQ_CONNECTION } from '../config/redis.js'

const processAIJob = async (job) => {
  const { type } = job.data

  if (type === 'flashcard') {
    const { userId, roomId, topic } = job.data
    const prompt = `Generate 10 flashcards about "${topic}" in JSON format [{"question": "...", "answer": "..."}]`
    const io = getIO()

    try {
      const result = await getAIResponseStream(prompt, (chunk) => {
        job.updateProgress({ stage: 'streaming', chunk })
        if (io && userId) {
          io.to(userId.toString()).emit('flashcard-ai-chunk', { chunk, topic })
        }
      })

      const jsonStr = result.text.replace(/```json|```/g, '').trim()
      const cards = JSON.parse(jsonStr)
      const created = []
      for (const card of cards) {
        const doc = await Flashcard.create({ user: userId, room: roomId, topic, question: card.question, answer: card.answer })
        created.push(doc)
      }
      console.log(`Generated ${cards.length} flashcards for: ${topic}`)
      if (io && userId) {
        io.to(userId.toString()).emit('flashcard-ai-complete', { flashcards: created, topic })
      }
      return { flashcards: created.length, topic }
    } catch (err) {
      console.error('Flashcard generation error:', err.message)
      if (io && userId) {
        io.to(userId.toString()).emit('flashcard-ai-error', { error: 'Failed to generate flashcards. Try again.' })
      }
      throw err
    }
  }

  const { doubtId, title, description } = job.data
  if (doubtId) {
    const io = getIO()
    const doubt = await Doubt.findById(doubtId)
    if (!doubt) return { skipped: true }

    const roomId = doubt.room.toString()
    const prompt = `Answer this doubt in detail:\nTitle: ${title}\nDescription: ${description}`

    try {
      const result = await getAIResponseStream(prompt, (chunk) => {
        job.updateProgress({ stage: 'streaming', chunk })
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
      return { doubtId, status: 'ai_answered' }
    } catch (err) {
      console.error('AI answer error for doubt', doubtId, ':', err.message)

      await Doubt.findByIdAndUpdate(
        doubtId,
        {
          aiAnswer: 'Sorry, AI service is unavailable right now. Please try again.',
          status: 'failed',
        }
      )

      if (io) {
        io.to(roomId).emit('doubt-ai-error', {
          doubtId,
          message: 'Sorry, AI service is unavailable right now. Please try again.',
        })
      }
      throw err
    }
  }
}

let aiWorker

export const startAIWorker = () => {
  aiWorker = new Worker('ai', processAIJob, {
    connection: BULLMQ_CONNECTION,
    concurrency: 5,
  })

  aiWorker.on('completed', (job) => {
    console.log(`AI job ${job.id} completed:`, job.returnvalue)
  })

  aiWorker.on('failed', (job, err) => {
    console.error(`AI job ${job?.id} failed:`, err.message)
  })

  console.log('AI worker started (concurrency: 5)')
  return aiWorker
}
