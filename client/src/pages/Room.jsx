import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { roomAPI, messageAPI, doubtAPI, flashcardAPI, sessionAPI } from '../services/api'
import { getSocket, onReconnect } from '../services/socket'
import { useAuth } from '../context/AuthContext'
import MessageList from '../components/chat/MessageList'
import MessageInput from '../components/chat/MessageInput'
import TypingIndicator from '../components/chat/TypingIndicator'
import MemberList from '../components/rooms/MemberList'
import DoubtList from '../components/doubts/DoubtList'
import DoubtForm from '../components/doubts/DoubtForm'
import FlashcardList from '../components/flashcards/FlashcardList'
import VideoCall from '../components/video/VideoCall'
import toast from 'react-hot-toast'

export default function Room() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const typingTimeoutRef = useRef(null)
  const prevRoomIdRef = useRef(null)

  const [room, setRoom] = useState(null)
  const [activeTab, setActiveTab] = useState('chat')
  const [messages, setMessages] = useState([])
  const [doubts, setDoubts] = useState([])
  const [flashcards, setFlashcards] = useState([])
  const [typingUsers, setTypingUsers] = useState([])
  const [sessionId, setSessionId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    roomAPI.getOne(id)
      .then((res) => setRoom(res.data.room))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [id])

  const fetchData = useCallback(() => {
    messageAPI.get(id).then((res) => setMessages(res.data.messages)).catch(() => {})
    doubtAPI.get(id).then((res) => setDoubts(res.data.doubts)).catch(() => {})
    flashcardAPI.get(id).then((res) => setFlashcards(res.data.flashcards)).catch(() => {})
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const onFocus = () => { if (document.visibilityState === 'visible') fetchData() }
    document.addEventListener('visibilitychange', onFocus)
    return () => document.removeEventListener('visibilitychange', onFocus)
  }, [fetchData])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    if (prevRoomIdRef.current && prevRoomIdRef.current !== id) {
      socket.emit('leave-room', prevRoomIdRef.current)
    }
    prevRoomIdRef.current = id

    const joinRoom = () => {
      if (socket.connected) {
        socket.emit('join-room', id)
        fetchData()
      }
    }

    joinRoom()
    const unsubReconnect = onReconnect(joinRoom)

    socket.on('new-message', (msg) => {
      setMessages((prev) => [...prev, msg])
    })

    socket.on('user-typing', ({ userId, name }) => {
      if (userId !== user?._id) {
        setTypingUsers((prev) => {
          const exists = prev.find((u) => u.userId === userId)
          return exists ? prev : [...prev, { userId, name }]
        })
      }
    })

    socket.on('user-stop-typing', ({ userId }) => {
      setTypingUsers((prev) => prev.filter((u) => u.userId !== userId))
    })

    socket.on('doubt-update', ({ doubtId, status }) => {
      setDoubts((prev) => prev.map((d) =>
        d._id === doubtId ? { ...d, status } : d
      ))
    })

    return () => {
      unsubReconnect()
      socket.off('new-message')
      socket.off('user-typing')
      socket.off('user-stop-typing')
      socket.off('doubt-update')
    }
  }, [id])

  const handleSendMessage = useCallback(async (content) => {
    const socket = getSocket()
    try {
      const res = await messageAPI.send(id, { content, type: 'text' })
      setMessages((prev) => [...prev, res.data.message])
      socket?.emit('broadcast-message', { roomId: id, message: res.data.message })
    } catch {
      toast.error('Failed to send')
    }
  }, [id])

  const handleTyping = useCallback(() => {
    const socket = getSocket()
    if (socket) {
      socket.emit('typing', { roomId: id })
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop-typing', { roomId: id })
      }, 1500)
    }
  }, [id])

  const handleDoubtSubmit = async (data) => {
    try {
      const res = await doubtAPI.create(id, data)
      setDoubts((prev) => [res.data.doubt, ...prev])
      toast.success('Doubt asked! AI is thinking...')
    } catch {
      toast.error('Failed to submit doubt')
    }
  }

  const handleResolveDoubt = async (doubtId) => {
    try {
      await doubtAPI.resolve(doubtId)
      setDoubts((prev) => prev.map((d) =>
        d._id === doubtId ? { ...d, status: 'resolved' } : d
      ))
      const socket = getSocket()
      socket?.emit('doubt-resolved', { roomId: id, doubtId })
      toast.success('Doubt resolved')
    } catch {
      toast.error('Failed to resolve')
    }
  }

  const handleStartSession = async () => {
    try {
      const res = await sessionAPI.start(id)
      setSessionId(res.data.session._id)
      toast.success('Study session started!')
    } catch {
      toast.error('Failed to start session')
    }
  }

  const handleEndSession = async () => {
    if (!sessionId) return
    try {
      await sessionAPI.end(sessionId)
      setSessionId(null)
      toast.success('Session ended!')
    } catch {
      toast.error('Failed to end session')
    }
  }

  const handleDeleteFlashcard = async (cardId) => {
    try {
      await flashcardAPI.delete(cardId)
      setFlashcards((prev) => prev.filter((c) => c._id !== cardId))
    } catch {
      toast.error('Failed to delete')
    }
  }

  if (loading) return <div className="text-center py-20">Loading...</div>
  if (!room) return null

  const tabs = [
    { key: 'chat', label: 'Chat' },
    { key: 'doubts', label: 'Doubts' },
    { key: 'flashcards', label: 'Flashcards' },
    { key: 'members', label: 'Members' },
  ]

  return (
    <div className="flex gap-6 h-[calc(100vh-6rem)]">
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border">
        <div className="border-b px-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-6">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-3 text-sm font-medium border-b-2 transition ${
                    activeTab === tab.key
                      ? 'text-indigo-600 border-indigo-600'
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              {!sessionId ? (
                <button
                  onClick={handleStartSession}
                  className="text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                >
                  Start Study Session
                </button>
              ) : (
                <button
                  onClick={handleEndSession}
                  className="text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                >
                  End Session
                </button>
              )}
              <span className="text-xs text-gray-400">#{room.inviteCode}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {activeTab === 'chat' && (
            <>
              <MessageList messages={messages} />
              <TypingIndicator users={typingUsers} />
              <MessageInput onSend={handleSendMessage} onTyping={handleTyping} />
            </>
          )}
          {activeTab === 'doubts' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <DoubtForm onSubmit={handleDoubtSubmit} />
              <DoubtList doubts={doubts} onResolve={handleResolveDoubt} />
            </div>
          )}
          {activeTab === 'flashcards' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Generate flashcards for a topic..."
                  className="flex-1 px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                  id="flashcardTopic"
                />
                <button
                  onClick={async () => {
                    const input = document.getElementById('flashcardTopic')
                    if (!input.value.trim()) return toast.error('Enter a topic')
                    try {
                      await flashcardAPI.generate(id, input.value.trim())
                      toast.success('Generating flashcards... check back soon')
                      input.value = ''
                    } catch { toast.error('Generation failed') }
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
                >
                  AI Generate
                </button>
              </div>
              <FlashcardList flashcards={flashcards} onDelete={handleDeleteFlashcard} />
            </div>
          )}
          {activeTab === 'members' && (
            <div className="flex-1 overflow-y-auto p-4">
              <MemberList members={room.members} />
            </div>
          )}
        </div>
      </div>

      <div className="w-80 space-y-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h2 className="font-bold text-lg mb-1">{room.name}</h2>
          {room.topic && (
            <span className="inline-block bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded">
              {room.topic}
            </span>
          )}
          {room.description && (
            <p className="text-sm text-gray-500 mt-2">{room.description}</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4">
          <VideoCall roomId={id} roomName={room.name} />
        </div>
      </div>
    </div>
  )
}
