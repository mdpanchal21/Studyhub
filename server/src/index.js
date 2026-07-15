import 'dotenv/config'
import http from 'http'
import app from './app.js'
import connectDB from './config/db.js'
import { initAI } from './config/ai.js'
import setupSocket from './socket/index.js'
import { startAIWorker } from './workers/aiWorker.js'
import { startEmailWorker } from './workers/emailWorker.js'

const PORT = process.env.PORT || 5000

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason)
})

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err)
})

const server = http.createServer(app)

setupSocket(server, app)

let aiWorkerRef
let emailWorkerRef

const start = async () => {
  await connectDB()
  initAI()

  aiWorkerRef = startAIWorker()
  emailWorkerRef = startEmailWorker()

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`)
  if (aiWorkerRef) await aiWorkerRef.close()
  if (emailWorkerRef) await emailWorkerRef.close()
  process.exit(0)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

start()
