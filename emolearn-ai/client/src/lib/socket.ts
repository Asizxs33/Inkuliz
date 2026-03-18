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

// WebRTC Signaling
export function emitWebRTCOffer(offer: RTCSessionDescriptionInit) {
  getSocket().emit('webrtc:offer', { offer })
}

export function emitWebRTCAnswer(answer: RTCSessionDescriptionInit) {
  getSocket().emit('webrtc:answer', { answer })
}

export function emitIceCandidate(candidate: RTCIceCandidate) {
  getSocket().emit('webrtc:ice-candidate', { candidate })
}

export function onWebRTCEvent(event: string, callback: (data: any) => void) {
  const socket = getSocket()
  socket.on(`webrtc:${event}`, callback)
  return () => {
    socket.off(`webrtc:${event}`, callback)
  }
}
