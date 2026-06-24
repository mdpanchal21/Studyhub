import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { roomAPI, messageAPI, doubtAPI, flashcardAPI, roomSessionAPI } from '../services/api'
import { getSocket, onReconnect, on as onSocketEvent } from '../services/socket'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import MessageList from '../components/chat/MessageList'
import MessageInput from '../components/chat/MessageInput'
import TypingIndicator from '../components/chat/TypingIndicator'
import MemberList from '../components/rooms/MemberList'
import DoubtList from '../components/doubts/DoubtList'
import DoubtForm from '../components/doubts/DoubtForm'
import FlashcardList from '../components/flashcards/FlashcardList'
import Skeleton from 'react-loading-skeleton'
import VideoCall from '../components/video/VideoCall'
import toast from 'react-hot-toast'

export default function Room() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { socketReady } = useSocket()  // true once socket is fully connected
  const typingTimeoutRef = useRef(null)
  const prevRoomIdRef = useRef(null)
  const userRef = useRef(user)
  userRef.current = user

  const [room, setRoom] = useState(null)
  const roomRef = useRef(room)
  useEffect(() => { roomRef.current = room }, [room])
  const [activeTab, setActiveTab] = useState('chat')
  const [messages, setMessages] = useState([])
  const [doubts, setDoubts] = useState([])
  const [flashcards, setFlashcards] = useState([])
  const [typingUsers, setTypingUsers] = useState([])
  const [roomSession, setRoomSession] = useState(null)
  const [sessionTimer, setSessionTimer] = useState(0)
  const [pendingRequests, setPendingRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [videoActive, setVideoActive] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false)
  const [flashcardStream, setFlashcardStream] = useState('')

  useEffect(() => {
    roomAPI.getOne(id)
      .then((res) => {
        setRoom(res.data.room)
        setPendingRequests(res.data.room.joinRequests?.filter((r) => r.status === 'pending') || [])
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [id])

  const fetchData = useCallback(() => {
    messageAPI.get(id).then((res) => {
      setMessages(res.data.messages)
      setHasMoreMessages(res.data.hasMore)
    }).catch(() => {})
    doubtAPI.get(id).then((res) => setDoubts(res.data.doubts)).catch(() => {})
    flashcardAPI.get(id).then((res) => setFlashcards(res.data.flashcards)).catch(() => {})
    roomSessionAPI.getActive(id).then((res) => setRoomSession(res.data.session)).catch(() => {})
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const onFocus = () => { if (document.visibilityState === 'visible') fetchData() }
    document.addEventListener('visibilitychange', onFocus)
    return () => document.removeEventListener('visibilitychange', onFocus)
  }, [fetchData])

  useEffect(() => {
    const refreshRoom = () => {
      if (document.visibilityState === 'visible') {
        roomAPI.getOne(id).then((res) => {
          setRoom(res.data.room)
          setPendingRequests(res.data.room.joinRequests?.filter((r) => r.status === 'pending') || [])
        }).catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', refreshRoom)
    return () => document.removeEventListener('visibilitychange', refreshRoom)
  }, [id])

  useEffect(() => {
    const refreshRoom = () => {
      roomAPI.getOne(id).then((res) => {
        setRoom(res.data.room)
        setPendingRequests(res.data.room.joinRequests?.filter((r) => r.status === 'pending') || [])
      }).catch(() => {})
    }
    const unsub = onReconnect(refreshRoom)
    return unsub
  }, [id])

  useEffect(() => {
    if (!roomSession?.active) return
    const start = new Date(roomSession.createdAt || roomSession.startedAt).getTime()
    const interval = setInterval(() => {
      setSessionTimer(Math.floor((Date.now() - start) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [roomSession?._id, roomSession?.active])

  // ─── Socket: join room ────────────────────────────────────────────────────
  // Depends on `socketReady` so this effect re-runs the moment the socket
  // becomes connected (avoiding the race condition where getSocket() was null).
  useEffect(() => {
    if (!socketReady) return  // wait for socket to be connected

    const socket = getSocket()
    if (!socket) return

    // Leave previous room if navigating between rooms
    if (prevRoomIdRef.current && prevRoomIdRef.current !== id) {
      socket.emit('leave-room', prevRoomIdRef.current)
    }
    prevRoomIdRef.current = id

    // Join current room and fetch latest data
    socket.emit('join-room', id)
    fetchData()

    // Re-join room on reconnect and refresh data to catch missed events
    const unsubReconnect = onReconnect(() => {
      socket.emit('join-room', id)
      fetchData()
    })

    return () => {
      unsubReconnect()
      socket.emit('leave-room', id)
    }
  }, [id, socketReady, fetchData])

  useEffect(() => {
    const unsubs = [
      onSocketEvent('new-message', (msg) => {
        setMessages((prev) => [...prev, msg])
      }),
      onSocketEvent('user-typing', ({ userId, name }) => {
        if (userId !== userRef.current?._id) {
          setTypingUsers((prev) => {
            const exists = prev.find((u) => u.userId === userId)
            return exists ? prev : [...prev, { userId, name }]
          })
        }
      }),
      onSocketEvent('user-stop-typing', ({ userId }) => {
        setTypingUsers((prev) => prev.filter((u) => u.userId !== userId))
      }),
      onSocketEvent('member-joined', ({ member }) => {
        setRoom((prev) => prev ? {
          ...prev,
          members: prev.members.some((m) => m.user?._id === member.user?._id)
            ? prev.members
            : [...prev.members, member],
        } : prev)
        toast(`${member.user?.name} joined the room`, { icon: '👋' })
      }),
      onSocketEvent('member-left', ({ userId }) => {
        const leftMember = roomRef.current?.members?.find((m) => m.user?._id === userId)
        if (leftMember) toast(`${leftMember.user?.name || 'A user'} left the room`, { icon: '🚪' })

        setRoom((prev) => {
          if (!prev) return prev
          return { ...prev, members: prev.members.filter((m) => m.user?._id !== userId) }
        })
      }),
      onSocketEvent('join-request', ({ request }) => {
        setPendingRequests((prev) => {
          const exists = prev.some((r) => r.user?._id === request.user?._id)
          return exists ? prev : [...prev, request]
        })
        toast(`${request.user?.name} wants to join`, { icon: '🚪' })
      }),
      onSocketEvent('request-accepted', ({ userId: acceptedUserId }) => {
        setPendingRequests((prev) => prev.filter((r) => r.user?._id !== acceptedUserId))
      }),
      onSocketEvent('request-declined', ({ userId: declinedUserId }) => {
        setPendingRequests((prev) => prev.filter((r) => r.user?._id !== declinedUserId))
      }),
      onSocketEvent('kicked', ({ userId: kickedUserId, roomName }) => {
        if (kickedUserId !== userRef.current?._id) return
        toast(`${roomName || 'Room'}: You were removed by the admin`, { icon: '🚫' })
        navigate('/')
      }),
      onSocketEvent('session-update', (data) => {
        if (data.action === 'ended') {
          setRoomSession(null)
          setSessionTimer(0)
        } else if (data.session) {
          setRoomSession(data.session)
        }
      }),
      onSocketEvent('session-toast', (data) => {
        if (data?.userName && data.userName !== userRef.current?.name) {
          const msgs = {
            started: `${data.userName} started a study session`,
            ended: `${data.userName} ended the session`,
            joined: `${data.userName} joined the session`,
            left: `${data.userName} left the session`,
          }
          const msg = msgs[data.type]
          if (msg) toast.success(msg)
        }
      }),
      onSocketEvent('doubt-update', ({ doubtId, status, aiAnswer }) => {
        console.log('[Socket] doubt-update received:', doubtId, status)
        setDoubts((prev) => prev.map((d) =>
          d._id === doubtId ? { ...d, status, ...(aiAnswer ? { aiAnswer } : {}) } : d
        ))
      }),
      onSocketEvent('doubt-ai-chunk', ({ doubtId, chunk }) => {
        setDoubts((prev) => prev.map((d) =>
          d._id === doubtId ? { ...d, aiAnswer: (d.aiAnswer || '') + chunk } : d
        ))
      }),
      onSocketEvent('doubt-ai-complete', ({ doubtId, status, aiAnswer }) => {
        console.log('[Socket] doubt-ai-complete received:', doubtId)
        setDoubts((prev) => prev.map((d) =>
          d._id === doubtId ? { ...d, status, aiAnswer } : d
        ))
      }),
      onSocketEvent('doubt-ai-error', ({ doubtId }) => {
        console.log('[Socket] doubt-ai-error received:', doubtId)
        toast.error('AI service is unavailable. Please try again.')
      }),
      onSocketEvent('flashcard-ai-chunk', ({ chunk, topic }) => {
        setFlashcardStream((prev) => prev + chunk)
      }),
      onSocketEvent('flashcard-ai-complete', ({ flashcards: newCards, topic }) => {
        setFlashcards((prev) => {
          const existingIds = new Set(prev.map((c) => c._id))
          const unique = newCards.filter((c) => !existingIds.has(c._id))
          return [...unique, ...prev]
        })
        setGeneratingFlashcards(false)
        setFlashcardStream('')
        toast.success(`Generated ${newCards.length} flashcards about ${topic}`)
      }),
      onSocketEvent('flashcard-ai-error', ({ error }) => {
        setGeneratingFlashcards(false)
        setFlashcardStream('')
        toast.error(error)
      }),
      onSocketEvent('room-deactivated', ({ roomName }) => {
        toast(`${roomName || 'Room'} was deactivated by the admin`, { icon: '🚫' })
        navigate('/')
      }),
    ]

    return () => {
      unsubs.forEach((fn) => fn())
    }
  }, [id, navigate])

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

  const loadOlderMessages = async () => {
    if (loadingOlder || !messages.length) return
    setLoadingOlder(true)
    try {
      const res = await messageAPI.get(id, { before: messages[0]._id })
      setMessages((prev) => [...res.data.messages, ...prev])
      setHasMoreMessages(res.data.hasMore)
    } catch {
      toast.error('Failed to load older messages')
    } finally {
      setLoadingOlder(false)
    }
  }

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

  const handleAcceptRequest = async (userId) => {
    try {
      const res = await roomAPI.acceptRequest(id, userId)
      setRoom(res.data.room)
      setPendingRequests(res.data.room.joinRequests?.filter((r) => r.status === 'pending') || [])
      toast.success('Request accepted')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept')
    }
  }

  const handleKickMember = async (userId, userName) => {
    if (!window.confirm(`Remove ${userName || 'this member'}?`)) return
    try {
      await roomAPI.kickMember(id, userId)
      setRoom((prev) => prev ? { ...prev, members: prev.members.filter((m) => m.user?._id !== userId) } : prev)
      toast.success(`${userName || 'Member'} removed`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to kick')
    }
  }

  const handleLeaveRoom = async () => {
    try {
      await roomAPI.leave(id)
      toast.success('Left room')
      navigate('/')
    } catch {
      toast.error('Failed to leave room')
    }
  }

  const handleDeactivateRoom = async () => {
    try {
      await roomAPI.deactivate(id)
      toast.success('Room deactivated')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deactivate')
    }
  }

  const handleDeclineRequest = async (userId) => {
    try {
      await roomAPI.declineRequest(id, userId)
      setPendingRequests((prev) => prev.filter((r) => r.user?._id !== userId))
      toast.success('Request declined')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to decline')
    }
  }

  const formatTime = (sec) => {
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = sec % 60
    if (h > 0) return `${h}h ${m}m ${s}s`
    return `${m}m ${s}s`
  }

  const handleStartRoomSession = async () => {
    const socket = getSocket()
    try {
      const res = await roomSessionAPI.start(id, room?.topic || '')
      setRoomSession(res.data.session)
      socket?.emit('session-started', { roomId: id, session: res.data.session })
      toast.success('Study session started!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start')
    }
  }

  const handleJoinSession = async () => {
    const socket = getSocket()
    try {
      const res = await roomSessionAPI.join(id)
      setRoomSession(res.data.session)
      socket?.emit('session-joined', { roomId: id, session: res.data.session })
      toast.success('Joined session!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join')
    }
  }

  const handleLeaveSession = async () => {
    const socket = getSocket()
    try {
      const res = await roomSessionAPI.leave(id)
      if (res.data.lastMember) {
        setRoomSession(null)
        socket?.emit('session-ended', { roomId: id })
      } else {
        setRoomSession(res.data.session)
        socket?.emit('session-left', { roomId: id, session: res.data.session })
      }
      toast.success('Left session')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to leave')
    }
  }

  const handleEndRoomSession = async () => {
    const socket = getSocket()
    try {
      await roomSessionAPI.end(id)
      setRoomSession(null)
      socket?.emit('session-ended', { roomId: id })
      toast.success('Session ended!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to end')
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

  if (loading) return (
    <div className="flex gap-6 h-[calc(100vh-6rem)]">
      <div className="flex-1 min-w-0 flex flex-col bg-white rounded-xl shadow-sm border">
        <div className="border-b px-4 py-3">
          <div className="flex gap-6">
            <Skeleton height={32} width={80} />
            <Skeleton height={32} width={80} />
            <Skeleton height={32} width={80} />
            <Skeleton height={32} width={120} />
          </div>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <Skeleton height={60} />
          <Skeleton height={60} />
          <Skeleton height={60} />
          <Skeleton height={60} />
        </div>
      </div>
      <div className="w-80 space-y-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <Skeleton height={24} width="60%" className="mb-2" />
          <Skeleton height={14} width={80} />
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4 space-y-3">
          <Skeleton height={16} width={100} />
          <Skeleton height={32} />
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <Skeleton height={32} />
        </div>
      </div>
    </div>
  )
  if (!room) return null

  const isAdmin = room.members?.find((m) => m.user?._id === user?._id)?.role === 'admin'
  const isInSession = roomSession?.members?.some((m) => m.user?._id === user?._id)
  const sessionHost = roomSession?.startedBy?._id === user?._id

  const tabs = [
    { key: 'chat', label: 'Chat' },
    { key: 'doubts', label: 'Doubts' },
    { key: 'flashcards', label: 'Flashcards' },
    { key: 'members', label: `Members (${room.members?.length || 0})` },
  ]

  const pendingCount = pendingRequests.length

  return (
    <div className="flex gap-6 h-[calc(100vh-6rem)]">
      <div className="flex-1 min-w-0 flex flex-col bg-white rounded-xl shadow-sm border">
        <div className="border-b px-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-6">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-3 text-sm font-medium border-b-2 transition relative ${
                    activeTab === tab.key
                      ? 'text-indigo-600 border-indigo-600'
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                  {tab.key === 'members' && pendingCount > 0 && (
                    <span className="absolute -top-1 -right-4 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                      {pendingCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              {roomSession?.active && (
                <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  {formatTime(sessionTimer)}
                </span>
              )}
              {isAdmin && (
                <button
                  onClick={() => setShowDeactivateConfirm(true)}
                  className="text-xs px-2.5 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 font-medium"
                >
                  Deactivate
                </button>
              )}
              <span className="relative group">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/join/${room.inviteCode}`)
                    toast.success('Invite link copied!')
                  }}
                  className="text-xs text-gray-400 hover:text-indigo-600"
                >
                  #{room.inviteCode}
                </button>
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none">
                  Copy invite link
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {activeTab === 'chat' && (
            <>
          <MessageList
            messages={messages}
            onLoadOlder={loadOlderMessages}
            hasMore={hasMoreMessages}
            loadingOlder={loadingOlder}
          />
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
                  disabled={generatingFlashcards}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !generatingFlashcards) {
                      document.getElementById('flashcardGenerateBtn')?.click()
                    }
                  }}
                />
                <button
                  id="flashcardGenerateBtn"
                  disabled={generatingFlashcards}
                  onClick={async () => {
                    const input = document.getElementById('flashcardTopic')
                    if (!input.value.trim()) return toast.error('Enter a topic')
                    setGeneratingFlashcards(true)
                    setFlashcardStream('')
                    try {
                      await flashcardAPI.generate(id, input.value.trim())
                      input.value = ''
                    } catch {
                      setGeneratingFlashcards(false)
                      setFlashcardStream('')
                      toast.error('Generation failed')
                    }
                  }}
                  className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${
                    generatingFlashcards
                      ? 'bg-indigo-400 text-white cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {generatingFlashcards && (
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {generatingFlashcards ? 'Generating...' : 'AI Generate'}
                </button>
              </div>
              {generatingFlashcards && flashcardStream && (
                <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
                    <p className="text-xs text-indigo-500 font-medium">AI is generating flashcards...</p>
                  </div>
                  <pre className="text-xs text-gray-500 whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {flashcardStream}
                  </pre>
                </div>
              )}
              <FlashcardList flashcards={flashcards} onDelete={handleDeleteFlashcard} />
            </div>
          )}
          {activeTab === 'members' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {pendingRequests.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <h5 className="text-xs font-semibold text-yellow-700 mb-2">
                    Pending Requests ({pendingRequests.length})
                  </h5>
                  <div className="space-y-2">
                    {pendingRequests.map((req) => (
                      <div key={req.user?._id} className="flex items-center justify-between bg-white rounded p-2 shadow-sm">
                        <span className="text-sm font-medium">{req.user?.name}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleAcceptRequest(req.user?._id)}
                            className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleDeclineRequest(req.user?._id)}
                            className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <MemberList
                members={room.members}
                currentUserId={user?._id}
                onKick={isAdmin ? handleKickMember : null}
              />
            </div>
          )}
        </div>
      </div>

      <div className={`${videoActive ? 'w-[480px]' : 'w-80'} space-y-4`}>
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

        {roomSession?.active ? (
          <div className="bg-white rounded-xl shadow-sm border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-green-700">Studying Now</h3>
              <span className="text-xs text-green-600 font-mono">{formatTime(sessionTimer)}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {roomSession.members?.map((m) => (
                <span key={m.user?._id} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">
                  {m.user?.name}
                </span>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              {!isInSession ? (
                <button
                  onClick={handleJoinSession}
                  className="flex-1 text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Join Session
                </button>
              ) : (
                <button
                  onClick={handleLeaveSession}
                  className="flex-1 text-xs px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200"
                >
                  Leave Session
                </button>
              )}
              {sessionHost && (
                <button
                  onClick={handleEndRoomSession}
                  className="text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                >
                  End
                </button>
              )}
            </div>
          </div>
        ) : (
          isAdmin && (
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <button
                onClick={handleStartRoomSession}
                className="w-full text-xs px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium"
              >
                Start Study Session
              </button>
            </div>
          )
        )}

        <div className="bg-white rounded-xl shadow-sm border p-4">
          <VideoCall roomId={id} roomName={room.name} isAdmin={isAdmin} onActiveChange={setVideoActive} />
        </div>

        {!isAdmin && (
          <button
            onClick={() => setShowLeaveConfirm(true)}
            className="w-full text-xs px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium"
          >
            Leave Room
          </button>
        )}
      </div>

      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Leave Room?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to leave <span className="font-medium text-gray-700">{room.name}</span>?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleLeaveRoom}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeactivateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Deactivate Room?</h3>
            <p className="text-sm text-gray-500 mb-6">
              This will delete all messages, doubts, flashcards, and session data for <span className="font-medium text-gray-700">{room.name}</span>. This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeactivateConfirm(false)}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivateRoom}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
