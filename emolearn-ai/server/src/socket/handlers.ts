import { Server } from 'socket.io'
import { db } from '../db/index.js'
import { emotionLogs, alerts, users } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import { sendStressAlert } from '../services/telegramService.js'

const STRESS_EMOTIONS_KZ = new Set(['АШУЛЫ', 'ҚОРЫҚҚАН', 'ЖИІРКЕНГЕН'])

// In-memory cache to avoid DB lookup on every biometric tick
const userNameCache = new Map<string, string>()

async function getStudentName(userId: string): Promise<string> {
  if (userNameCache.has(userId)) return userNameCache.get(userId)!
  try {
    const [user] = await db.select({ name: users.name }).from(users).where(eq(users.id, userId))
    const name = user?.name ?? 'Белгісіз студент'
    userNameCache.set(userId, name)
    return name
  } catch {
    return 'Белгісіз студент'
  }
}

export function setupSocket(io: Server) {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`)

    // Register user to their personal room so targeted notifications work
    socket.on('user:register', (userId: string) => {
      if (userId) socket.join(`user:${userId}`)
    })

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
          emotion: data.emotionKz || data.emotion,
          confidence: data.confidence,
          bpm: data.bpm,
          cognitive: data.cognitive,
          timestamp: new Date()
        })

        // Check stress threshold (Kazakh emotion names only, consistent with client)
        const isStress = data.bpm > 90 || STRESS_EMOTIONS_KZ.has(data.emotionKz)
        if (isStress) {
          await db.insert(alerts).values({
            student_id: data.userId,
            type: 'stress',
            message: `Пульс: ${data.bpm}, Эмоция: ${data.emotionKz || data.emotion}`,
          })

          const studentName = await getStudentName(data.userId)
          await sendStressAlert({
            studentName,
            bpm: data.bpm,
            emotion: data.emotionKz || data.emotion,
            className: '',
          })

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
      socket.to('live_room').emit('webrtc:user-joined', { userId: socket.id })
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

    // Class-based Chat System
    socket.on('class_chat:join', (data: { classId: string, userId: string, userName: string }) => {
      const room = `class_chat_${data.classId}`
      socket.join(room)
      console.log(`💬 ${data.userName} joined class chat: ${room}`)
      socket.to(room).emit('class_chat:user_joined', { userId: data.userId, userName: data.userName })
    })

    socket.on('class_chat:message', (data: {
      classId: string
      userId: string
      name: string
      text: string
      role: string
      timestamp: string
    }) => {
      const room = `class_chat_${data.classId}`
      io.to(room).emit('class_chat:message', {
        ...data,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
      })
    })

    // In-app notification system — send only to target user's personal room
    socket.on('notification:send', (data: { targetUserId: string, type: string, message: string, from: string }) => {
      if (data.targetUserId) {
        io.to(`user:${data.targetUserId}`).emit('notification:receive', data)
      }
    })

    // WebRTC Signaling Events
    socket.on('webrtc:offer', (data) => {
      socket.to('live_room').emit('webrtc:offer', { offer: data.offer, senderId: socket.id })
    })

    socket.on('webrtc:answer', (data) => {
      socket.to('live_room').emit('webrtc:answer', { answer: data.answer, senderId: socket.id })
    })

    socket.on('webrtc:ice-candidate', (data) => {
      socket.to('live_room').emit('webrtc:ice-candidate', { candidate: data.candidate, senderId: socket.id })
    })

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`)
    })
  })
}
