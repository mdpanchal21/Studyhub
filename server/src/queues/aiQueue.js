import redis from '../config/redis.js'

const QUEUE_KEY = 'queue:ai'

export const addAIJob = async (data) => {
  await redis.lpush(QUEUE_KEY, JSON.stringify(data))
}

export const addFlashcardJob = async (data) => {
  await redis.lpush(QUEUE_KEY, JSON.stringify({ ...data, type: 'flashcard' }))
}

export const popAIJob = async () => {
  const result = await redis.brpop(QUEUE_KEY, 1)
  if (!result) return null
  return JSON.parse(result[1])
}
