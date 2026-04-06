import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000'

export function useSocket(userId, onNotification) {
  const socketRef = useRef(null)

  useEffect(() => {
    if (!userId) return
    socketRef.current = io(SOCKET_URL, { transports: ['websocket'] })
    socketRef.current.emit('join', userId)
    socketRef.current.on('notification', (data) => {
      if (onNotification) onNotification(data)
    })
    return () => { socketRef.current?.disconnect() }
  }, [userId])

  return socketRef
}
