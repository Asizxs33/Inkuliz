import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin
    socket = io(socketUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
    })
  }
  return socket
}

export function registerUser(userId: string) {
  getSocket().emit('user:register', userId)
}

export function emitBiometricUpdate(data: {
  userId: string
  emotion: string
  emotionKz: string
  bpm: number
  cognitive: number
  confidence: number
}) {
  getSocket().emit('biometric:update', data)
}

export function emitGestureDetected(data: {
  userId: string
  word: string
  confidence: number
}) {
  getSocket().emit('gesture:detected', data)
}

export function joinAsTeacher() {
  getSocket().emit('teacher:join')
}

export function joinLiveRoom() {
  getSocket().emit('join_live_room')
}

export function emitLiveChatMessage(data: {
  userId: string
  name: string
  text: string
  isSignLanguage: boolean
  timestamp: Date
}) {
  getSocket().emit('live_chat_message', data)
}

export function onLiveChatMessage(callback: (data: any) => void) {
  const socket = getSocket()
  socket.on('live_chat_message', callback)
  return () => {
    socket.off('live_chat_message', callback)
  }
}

// Class-based Chat
export function joinClassChat(classId: string, userId: string, userName: string) {
  getSocket().emit('class_chat:join', { classId, userId, userName })
}

export function emitClassChatMessage(data: {
  classId: string
  userId: string
  name: string
  text: string
  role: string
  timestamp: string
}) {
  getSocket().emit('class_chat:message', data)
}

export function onClassChatMessage(callback: (data: any) => void) {
  const socket = getSocket()
  socket.on('class_chat:message', callback)
  return () => { socket.off('class_chat:message', callback) }
}

export function onClassChatUserJoined(callback: (data: any) => void) {
  const socket = getSocket()
  socket.on('class_chat:user_joined', callback)
  return () => { socket.off('class_chat:user_joined', callback) }
}

// In-app Notifications
export function sendNotification(targetUserId: string, type: string, message: string, from: string) {
  getSocket().emit('notification:send', { targetUserId, type, message, from })
}

export function onNotification(callback: (data: any) => void) {
  const socket = getSocket()
  socket.on('notification:receive', callback)
  return () => { socket.off('notification:receive', callback) }
}

// Test notifications
export function onTestNotification(callback: (data: { id: string; title: string }) => void) {
  const socket = getSocket()
  socket.on('test:new', callback)
  return () => { socket.off('test:new', callback) }
}

export function onTestSubmitted(callback: (data: { studentName: string; testTitle: string; testId: string; score: number; total: number }) => void) {
  const socket = getSocket()
  socket.on('test:submitted', callback)
  return () => { socket.off('test:submitted', callback) }
}

// WebRTC Signaling
export function getSocketId(): string {
  return getSocket().id || ''
}

export function emitWebRTCOffer(targetId: string, offer: RTCSessionDescriptionInit) {
  getSocket().emit('webrtc:offer', { offer, targetId })
}

export function emitWebRTCAnswer(targetId: string, answer: RTCSessionDescriptionInit) {
  getSocket().emit('webrtc:answer', { answer, targetId })
}

export function emitIceCandidate(targetId: string, candidate: RTCIceCandidate) {
  getSocket().emit('webrtc:ice-candidate', { candidate, targetId })
}

export function onWebRTCEvent(event: string, callback: (data: any) => void) {
  const socket = getSocket()
  socket.on(`webrtc:${event}`, callback)
  return () => {
    socket.off(`webrtc:${event}`, callback)
  }
}
