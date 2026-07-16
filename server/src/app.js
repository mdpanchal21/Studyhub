import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import { errorHandler } from './middleware/errorHandler.js'
import { globalLimiter, authLimiter, aiLimiter } from './middleware/rateLimiter.js'

import authRoutes from './routes/auth.js'
import oauthRoutes from './routes/oauth.js'
import roomRoutes from './routes/rooms.js'
import messageRoutes from './routes/messages.js'
import doubtRoutes from './routes/doubts.js'
import flashcardRoutes from './routes/flashcards.js'
import studySessionRoutes from './routes/studySessions.js'
import roomSessionRoutes from './routes/roomSessions.js'
import videoRoutes from './routes/video.js'
import notificationRoutes from './routes/notifications.js'
import aiRoutes from './routes/ai.js'
import roadmapRoutes from './routes/roadmaps.js'
import quizRoutes from './routes/quiz.js'
import fileRoutes from './routes/files.js'

const app = express()

app.use(cors({ origin: process.env.CLIENT_URL.split(','), credentials: true }))
app.use(express.json())
app.use(cookieParser())
app.use(morgan('dev'))
app.use(globalLimiter)

app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/auth', authLimiter, oauthRoutes)
app.use('/api/rooms', roomRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/doubts', doubtRoutes)
app.use('/api/flashcards', flashcardRoutes)
app.use('/api/sessions', studySessionRoutes)
app.use('/api/rooms', roomSessionRoutes)
app.use('/api/rooms', videoRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/ai', aiLimiter, aiRoutes)
app.use('/api/roadmaps', roadmapRoutes)
app.use('/api/quizzes', quizRoutes)
app.use('/api/files', fileRoutes)

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

app.use(errorHandler)

export default app
