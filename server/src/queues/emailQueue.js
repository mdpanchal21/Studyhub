import { Queue } from 'bullmq'
import { BULLMQ_CONNECTION } from '../config/redis.js'

export const emailQueue = new Queue('email', {
  connection: BULLMQ_CONNECTION,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { age: 3600 },
    removeOnFail: { age: 86400 },
  },
})

export const addEmailJob = async (data) => {
  return emailQueue.add('send', data)
}
