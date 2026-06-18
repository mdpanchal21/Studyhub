import { Worker } from 'bullmq'
import nodemailer from 'nodemailer'
import redis from '../config/redis.js'

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

const emailWorker = new Worker('email-processing', async (job) => {
  const transporter = getTransporter()
  if (!transporter) {
    console.log('Email not configured. Skipping email send.')
    return
  }
  const { to, subject, html } = job.data
  await transporter.sendMail({
    from: '"StudyHub" <noreply@studyhub.app>',
    to,
    subject,
    html,
  })
  console.log(`Email sent to ${to}`)
}, { connection: redis })

emailWorker.on('completed', (job) => console.log(`Email job ${job.id} completed`))
emailWorker.on('failed', (job, err) => console.error(`Email job ${job.id} failed:`, err))

export default emailWorker
