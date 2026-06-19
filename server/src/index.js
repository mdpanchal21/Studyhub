import http from 'http'
import dotenv from 'dotenv'
import app from './app.js'
import connectDB from './config/db.js'
import { initAI } from './config/ai.js'
import setupSocket from './socket/index.js'
import { startAIWorker } from './workers/aiWorker.js'
import { startEmailWorker } from './workers/emailWorker.js'

dotenv.config()

const PORT = process.env.PORT || 5000

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
