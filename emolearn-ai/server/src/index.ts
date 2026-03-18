import './env.js'
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { authRouter } from './routes/auth.js'
import { biometricsRouter } from './routes/biometrics.js'
import { lessonsRouter } from './routes/lessons.js'
import { chatRouter } from './routes/chat.js'
import { signLanguageRouter } from './routes/signLanguage.js'
import { analyticsRouter } from './routes/analytics.js'
import { telegramRouter } from './routes/telegram.js'
import { classesRouter } from './routes/classes.js'
import { setupSocket } from './socket/handlers.js'
import { initTelegramBot } from './services/telegramService.js'

// Initialize services
initTelegramBot()

export const app = express()
const httpServer = createServer(app)
const allowedOrigins = process.env.CLIENT_URL 
  ? [process.env.CLIENT_URL, 'https://inkuliz.vercel.app', 'http://localhost:5173'] 
  : ['https://inkuliz.vercel.app', 'http://localhost:5173'];

const io = new Server(httpServer, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'] }
})

app.use(cors({ origin: allowedOrigins }))
app.use(express.json())

// Routes
app.use('/api/auth', authRouter)
app.use('/api/biometrics', biometricsRouter)
app.use('/api/lessons', lessonsRouter)
app.use('/api/chat', chatRouter)
app.use('/api/sign-language', signLanguageRouter)
app.use('/api/analytics', analyticsRouter)
app.use('/api/telegram', telegramRouter)
app.use('/api/classes', classesRouter)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Socket.IO
setupSocket(io)

// Start server on all environments since Render needs it
const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`🚀 EmoLearn AI Server running on port ${PORT}`)
})

export default app
