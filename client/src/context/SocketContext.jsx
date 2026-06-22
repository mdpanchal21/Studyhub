import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { connectSocket, disconnectSocket } from '../services/socket'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const { user } = useAuth()
  // Expose a boolean so components can react to socket being ready
  const [socketReady, setSocketReady] = useState(false)
  // Guard against React StrictMode double-invoke
  const didConnectRef = useRef(false)

  useEffect(() => {
    if (!user) {
      // User logged out — clean up
      setSocketReady(false)
      didConnectRef.current = false
      disconnectSocket()
      return
    }

    if (didConnectRef.current) return
    didConnectRef.current = true

    const token = localStorage.getItem('token')
    const socket = connectSocket(token)

    const onConnect = () => setSocketReady(true)
    const onDisconnect = () => setSocketReady(false)

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)

    // If socket already connected by the time we attach (e.g. StrictMode remount)
    if (socket.connected) setSocketReady(true)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      // Do NOT call disconnectSocket() here — that would fire on every
      // StrictMode remount and on every user object re-reference.
      // Only disconnect on actual logout (handled above).
      didConnectRef.current = false
    }
  }, [user])

  return (
    <SocketContext.Provider value={{ socketReady }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)
