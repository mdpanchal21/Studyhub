import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { fileAPI } from '../../services/api'
import toast from 'react-hot-toast'

const FILE_ICONS = {
  image: '🖼️',
  pdf: '📄',
  document: '📝',
  presentation: '📊',
}

function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileMessage({ msg, isMine, onFilePreview }) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async (e) => {
    e.stopPropagation()
    setDownloading(true)
    try {
      await fileAPI.download(msg.fileRef, msg.fileName, msg.fileUrl)
    } catch {
      toast.error('Download failed')
    } finally {
      setDownloading(false)
    }
  }

  const isImage = msg.fileType === 'image'

  return (
    <div
      className="cursor-pointer"
      onClick={() => onFilePreview?.({
        _id: msg.fileRef,
        fileUrl: msg.fileUrl,
        fileName: msg.fileName,
        fileType: msg.fileType,
        fileSize: msg.fileSize,
        mimeType: msg.mimeType,
      })}
    >
      {isImage ? (
        <div className="rounded-lg overflow-hidden mb-1 max-w-[260px]">
          <img
            src={msg.fileUrl}
            alt={msg.fileName}
            className="w-full h-auto object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div className={`flex items-center gap-2.5 p-2 rounded-lg mb-1 ${
          isMine ? 'bg-white/15' : 'bg-black/5'
        }`}>
          <span className="text-2xl shrink-0">{FILE_ICONS[msg.fileType] || '📁'}</span>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium truncate ${isMine ? 'text-white' : 'text-gray-800'}`}>
              {msg.fileName}
            </p>
            <p className={`text-xs ${isMine ? 'text-white/60' : 'text-gray-400'}`}>
              {formatSize(msg.fileSize)}
            </p>
          </div>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className={`p-1.5 rounded-full shrink-0 transition ${
              isMine
                ? 'hover:bg-white/20 text-white/70 hover:text-white'
                : 'hover:bg-black/10 text-gray-400 hover:text-gray-600'
            } disabled:opacity-40`}
          >
            {downloading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

export default function MessageList({ messages, onLoadOlder, hasMore, loadingOlder, onFilePreview }) {
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
              {(msg.type === 'file' || msg.type === 'image') ? (
                <FileMessage msg={msg} isMine={isMine} onFilePreview={onFilePreview} />
              ) : msg.type === 'code' ? (
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
