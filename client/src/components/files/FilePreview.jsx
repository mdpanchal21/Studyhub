import { useEffect, useState } from 'react'
import { fileAPI } from '../../services/api'
import toast from 'react-hot-toast'

export default function FilePreview({ file, onClose }) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    if (!file) return
    setDownloading(true)
    try {
      await fileAPI.download(file._id, file.fileName, file.fileUrl)
    } catch {
      toast.error('Download failed')
    } finally {
      setDownloading(false)
    }
  }

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  if (!file) return null

  const isImage = file.fileType === 'image'
  const isPdf = file.fileType === 'pdf'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-stone-200 truncate max-w-md">
            {file.fileName}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="text-xs px-3 py-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition text-stone-200 disabled:opacity-40"
            >
              {downloading ? 'Downloading...' : 'Download'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 transition text-stone-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 bg-stone-900 rounded-xl overflow-hidden flex items-center justify-center">
          {isImage ? (
            <img
              src={file.fileUrl}
              alt={file.fileName}
              className="max-w-full max-h-[80vh] object-contain"
            />
          ) : isPdf ? (
            <iframe
              src={file.fileUrl}
              className="w-full h-[80vh]"
              title={file.fileName}
            />
          ) : (
            <div className="text-center p-8">
              <div className="text-5xl mb-4">📁</div>
              <p className="text-stone-400 text-sm mb-4">Preview not available for this file type</p>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="px-4 py-2 bg-amber-400 text-stone-900 rounded-lg text-sm font-medium hover:bg-amber-300 transition disabled:opacity-40"
              >
                {downloading ? 'Downloading...' : 'Download to view'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
