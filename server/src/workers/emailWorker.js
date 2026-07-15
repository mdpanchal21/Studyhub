import { Worker } from 'bullmq'
import nodemailer from 'nodemailer'
import { BULLMQ_CONNECTION } from '../config/redis.js'

const getTransporter = () => {
  if (process.env.RESEND_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: { user: 'resend', pass: process.env.RESEND_API_KEY },
    })
  }
  if (process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  }
  return null
}

const processEmailJob = async (job) => {
  const transporter = getTransporter()
  if (!transporter) {
    console.log('Email not configured, skipping.')
    return { skipped: true }
  }
  await transporter.sendMail({
    from: '"StudyHub" <noreply@studyhub.app>',
    to: job.data.to,
    subject: job.data.subject,
    html: job.data.html,
  })
  console.log(`Email sent to ${job.data.to}`)
  return { sent: true, to: job.data.to }
}

let emailWorker

export const startEmailWorker = () => {
  emailWorker = new Worker('email', processEmailJob, {
    connection: BULLMQ_CONNECTION,
    concurrency: 3,
  })

  emailWorker.on('completed', (job) => {
    console.log(`Email job ${job.id} completed:`, job.returnvalue)
  })

  emailWorker.on('failed', (job, err) => {
    console.error(`Email job ${job?.id} failed:`, err.message)
  })

  console.log('Email worker started (concurrency: 3)')
  return emailWorker
}
