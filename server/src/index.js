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

const start = async () => {
  await connectDB()
  initAI()

  startAIWorker()
  startEmailWorker()

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

start()
