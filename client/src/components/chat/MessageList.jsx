import { useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function MessageList({ messages, onLoadOlder, hasMore, loadingOlder }) {
  const { user } = useAuth()
  const containerRef = useRef(null)
  const prevScrollHeightRef = useRef(0)
  const prevLenRef = useRef(0)
  const isNearBottomRef = useRef(true)
  const onLoadOlderRef = useRef(onLoadOlder)
  const hasMoreRef = useRef(hasMore)
  const loadingOlderRef = useRef(loadingOlder)
  const lastLoadTimeRef = useRef(0)

  onLoadOlderRef.current = onLoadOlder
  hasMoreRef.current = hasMore
  loadingOlderRef.current = loadingOlder

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onScroll = () => {
      isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 150
      const now = Date.now()
      if (el.scrollTop < 80 && hasMoreRef.current && !loadingOlderRef.current && now - lastLoadTimeRef.current > 600) {
        lastLoadTimeRef.current = now
        loadingOlderRef.current = true
        prevScrollHeightRef.current = el.scrollHeight
        onLoadOlderRef.current?.()
      }
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const prevLen = prevLenRef.current
    prevLenRef.current = messages.length
    if (messages.length > prevLen && prevScrollHeightRef.current > 0) {
      el.scrollTop = el.scrollHeight - prevScrollHeightRef.current
      prevScrollHeightRef.current = 0
      return
    }
    if (isNearBottomRef.current && messages.length > prevLen) {
      el.scrollTop = el.scrollHeight
      return
    }
    if (prevLen === 0 && messages.length > 0) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        No messages yet. Start the conversation!
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
      {loadingOlder && (
        <div className="text-center py-2 text-xs text-gray-400">Loading older messages...</div>
      )}
      {messages.map((msg) => {
        const isMine = msg.sender?._id === user?._id
        return (
          <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                isMine
                  ? 'bg-indigo-600 text-white rounded-br-md'
                  : 'bg-gray-100 text-gray-900 rounded-bl-md'
              }`}
            >
              {!isMine && (
                <p className="text-xs font-medium text-indigo-600 mb-0.5">{msg.sender?.name}</p>
              )}
              {msg.type === 'code' ? (
                <pre className="text-sm bg-black/10 rounded p-2 overflow-x-auto">{msg.content}</pre>
              ) : (
                <p className="text-sm">{msg.content}</p>
              )}
              <p className={`text-xs mt-1 ${isMine ? 'text-white/60' : 'text-gray-400'}`}>
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
