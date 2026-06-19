import nodemailer from 'nodemailer'
import { popEmailJob } from '../queues/emailQueue.js'

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

const processEmailJob = async (data) => {
  const transporter = getTransporter()
  if (!transporter) {
    console.log('Email not configured, skipping.')
    return
  }
  await transporter.sendMail({
    from: '"StudyHub" <noreply@studyhub.app>',
    to: data.to,
    subject: data.subject,
    html: data.html,
  })
  console.log(`Email sent to ${data.to}`)
}

export const startEmailWorker = async () => {
  console.log('Email worker started')
  while (true) {
    try {
      const job = await popEmailJob()
      if (job) {
        await processEmailJob(job)
      }
    } catch (err) {
      console.error('Email worker error:', err.message)
    }
  }
}
