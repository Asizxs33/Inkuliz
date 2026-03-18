import { Server } from 'socket.io'
import { db } from '../db/index.js'
import { emotionLogs, alerts } from '../db/schema.js'
import { sendStressAlert } from '../services/telegramService.js'

export function setupSocket(io: Server) {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`)

    // Student sends real biometric data
    socket.on('biometric:update', async (data: {
      userId: string
      emotion: string
      emotionKz: string
      bpm: number
      cognitive: number
      confidence: number
    }) => {
      try {
        // Save to Neon DB via Drizzle
        await db.insert(emotionLogs).values({
          user_id: data.userId,
          emotion: data.emotion,
          confidence: data.confidence,
          bpm: data.bpm,
          cognitive: data.cognitive,
          timestamp: new Date()
        })

        // Check stress threshold
        if (data.bpm > 90 ||
            data.emotion === 'ҚОРЫҚҚАН' ||
            data.emotion === 'АШУЛЫ' ||
            data.emotion === 'fearful' ||
            data.emotion === 'angry') {

          // Save alert to DB
          await db.insert(alerts).values({
            student_id: data.userId,
            type: 'stress',
            message: `Пульс: ${data.bpm}, Эмоция: ${data.emotionKz || data.emotion}`,
          })

          // Send Telegram alert
          await sendStressAlert({
            studentName: 'Асрор Р.',
            bpm: data.bpm,
            emotion: data.emotionKz || data.emotion,
            className: '10-А',
          })

          // Notify teacher UI
          io.to('teachers').emit('alert:critical', data)
        }

        // Update teacher dashboard live
        io.to('teachers').emit('student:biometric', data)
      } catch (error) {
        console.error('Error processing biometric update:', error)
      }
    })

    socket.on('teacher:join', () => {
      socket.join('teachers')
      console.log(`👨‍🏫 Teacher joined: ${socket.id}`)
    })

    // Sign language gesture detected
    socket.on('gesture:detected', (data: {
      userId: string
      word: string
      confidence: number
    }) => {
      io.emit('gesture:broadcast', data)
    })

    // Live Chat Room for Sign Language <-> Text matching
    socket.on('join_live_room', () => {
      socket.join('live_room')
      console.log(`💬 User joined Live Chat Room: ${socket.id}`)
    })

    socket.on('live_chat_message', (data: {
      userId: string
      name: string
      text: string
      isSignLanguage: boolean
      timestamp: Date
    }) => {
      io.to('live_room').emit('live_chat_message', data)
    })

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`)
    })
  })
}
