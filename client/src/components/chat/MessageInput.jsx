import { useState, useRef } from 'react'
import { fileAPI } from '../../services/api'
import toast from 'react-hot-toast'

export default function MessageInput({ onSend, onTyping, roomId, onSendFile }) {
  const [text, setText] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    onSend(text.trim())
    setText('')
  }

  const handleFileAttach = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      return toast.error('File must be under 10MB')
    }

    const formData = new FormData()
    formData.append('file', file)

    setUploading(true)
    try {
      const res = await fileAPI.upload(roomId, formData)
      const uploaded = res.data.file
      onSendFile?.({
        fileRef: uploaded._id,
        fileUrl: uploaded.fileUrl,
        fileName: uploaded.fileName,
        fileSize: uploaded.fileSize,
        fileType: uploaded.fileType,
        mimeType: uploaded.mimeType,
      })
      toast.success('File shared')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t p-3 flex gap-2 items-center">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileAttach}
        className="hidden"
        accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.ppt,.pptx"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="p-2 rounded-full text-stone-400 hover:text-amber-400 hover:bg-white/10 transition disabled:opacity-40"
        title="Attach file"
      >
        {uploading ? (
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        )}
      </button>
      <input
        type="text"
        placeholder="Type a message..."
        className="flex-1 px-4 py-2 border rounded-full text-sm outline-none focus:ring-2 focus:ring-indigo-400"
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          onTyping?.()
        }}
      />
      <button
        type="submit"
        disabled={!text.trim()}
        className="px-5 py-2 bg-indigo-600 text-white rounded-full text-sm hover:bg-indigo-700 disabled:opacity-40"
      >
        Send
      </button>
    </form>
  )
}
