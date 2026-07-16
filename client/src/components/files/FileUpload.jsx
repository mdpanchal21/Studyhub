import { useState, useRef } from 'react'
import { fileAPI } from '../../services/api'
import toast from 'react-hot-toast'

export default function FileUpload({ roomId, onUploadComplete }) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const handleFile = async (file) => {
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      return toast.error('File must be under 10MB')
    }

    const formData = new FormData()
    formData.append('file', file)

    setUploading(true)
    setProgress(0)

    try {
      await fileAPI.upload(roomId, formData)
      setProgress(100)
      toast.success('File uploaded')
      onUploadComplete?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
      setTimeout(() => setProgress(0), 1000)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleChange = (e) => {
    handleFile(e.target.files?.[0])
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files?.[0])
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
          dragOver
            ? 'border-amber-400 bg-amber-400/10'
            : 'border-white/10 hover:border-amber-400/40 hover:bg-white/5'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          onChange={handleChange}
          className="hidden"
          accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.ppt,.pptx"
        />
        {uploading ? (
          <div className="space-y-2">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-stone-400">Uploading... {progress}%</p>
            <div className="w-full max-w-xs mx-auto h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="text-2xl">📎</div>
            <p className="text-sm text-stone-300">
              Click or drag a file here
            </p>
            <p className="text-xs text-stone-500">
              Images, PDF, DOC, DOCX, PPT, PPTX — max 10MB
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
