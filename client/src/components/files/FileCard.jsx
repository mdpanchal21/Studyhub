import { useState } from 'react'
import { fileAPI } from '../../services/api'
import toast from 'react-hot-toast'

const FILE_ICONS = {
  image: '🖼️',
  pdf: '📄',
  document: '📝',
  presentation: '📊',
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function FileCard({ file, currentUserId, onDelete, onPreview }) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!window.confirm('Delete this file?')) return
    setDeleting(true)
    try {
      await fileAPI.delete(file._id)
      onDelete?.(file._id)
      toast.success('File deleted')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  const isImage = file.fileType === 'image'
  const canDelete = file.uploader?._id === currentUserId

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2 hover:border-amber-400/20 transition">
      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl shrink-0 cursor-pointer overflow-hidden"
          onClick={() => onPreview?.(file)}
        >
          {isImage ? (
            <img
              src={file.fileUrl}
              alt={file.fileName}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <span>{FILE_ICONS[file.fileType] || '📁'}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <button
            onClick={() => onPreview?.(file)}
            className="text-sm font-medium text-stone-200 truncate block text-left hover:text-amber-400 transition w-full"
          >
            {file.fileName}
          </button>
          <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
            <span>{formatSize(file.fileSize)}</span>
            <span>·</span>
            <span>{file.uploader?.name || 'Unknown'}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <a
            href={file.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg hover:bg-white/10 transition text-stone-400 hover:text-amber-400"
            title="Download"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </a>
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1.5 rounded-lg hover:bg-red-500/20 transition text-stone-400 hover:text-red-400 disabled:opacity-50"
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
