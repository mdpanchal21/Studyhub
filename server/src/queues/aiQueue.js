import { Queue } from 'bullmq'
import redis from '../config/redis.js'

const aiQueue = new Queue('ai-processing', { connection: redis })

export const addAIJob = async ({ doubtId, title, description }) => {
  return aiQueue.add('answer-doubt', { doubtId, title, description })
}

export const addFlashcardJob = async ({ userId, roomId, topic }) => {
  return aiQueue.add('generate-flashcards', { userId, roomId, topic })
}

export default aiQueue
