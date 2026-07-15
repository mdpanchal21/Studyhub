import { Queue } from 'bullmq'
import { BULLMQ_CONNECTION } from '../config/redis.js'

export const aiQueue = new Queue('ai', {
  connection: BULLMQ_CONNECTION,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { age: 3600 },
    removeOnFail: { age: 86400 },
  },
})

export const addAIJob = async (data) => {
  return aiQueue.add('doubt', data)
}

export const addFlashcardJob = async (data) => {
  return aiQueue.add('flashcard', { ...data, type: 'flashcard' })
}
