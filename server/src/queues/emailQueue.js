import { Queue } from 'bullmq'
import redis from '../config/redis.js'

const emailQueue = new Queue('email-processing', { connection: redis })

export const addEmailJob = async ({ to, subject, html }) => {
  return emailQueue.add('send-email', { to, subject, html })
}

export default emailQueue
