import { createContext, useContext, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { connectSocket, disconnectSocket, getSocket } from '../services/socket'

const SocketContext = createContext()

export function SocketProvider({ children }) {
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token')
      connectSocket(token)
    }
    return () => disconnectSocket()
  }, [user])

  return (
    <SocketContext.Provider value={{ getSocket }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)
