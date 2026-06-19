import redis from '../config/redis.js'

const QUEUE_KEY = 'queue:email'

export const addEmailJob = async (data) => {
  await redis.lpush(QUEUE_KEY, JSON.stringify(data))
}

export const popEmailJob = async () => {
  const result = await redis.brpop(QUEUE_KEY, 1)
  if (!result) return null
  return JSON.parse(result[1])
}
