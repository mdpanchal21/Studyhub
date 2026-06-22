import { useState, useEffect, useRef } from 'react'
import DigitalSambaEmbedded from '@digitalsamba/embedded-sdk'
import { videoAPI } from '../../services/video'
import { on as onSocketEvent } from '../../services/socket'
import toast from 'react-hot-toast'

export default function VideoCall({ roomId, roomName, isAdmin, onActiveChange }) {
  const [dailyRoomUrl, setDailyRoomUrl] = useState(null)
  const [activeRoomUrl, setActiveRoomUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    videoAPI.getActive(roomId)
      .then((res) => {
        if (res.data.dailyRoomUrl) {
          setActiveRoomUrl(res.data.dailyRoomUrl)
        }
      })
      .catch(() => {})
  }, [roomId])

  useEffect(() => {
    onActiveChange?.(!!dailyRoomUrl)
  }, [dailyRoomUrl])

  useEffect(() => {
    const unsubs = [
      onSocketEvent('video-call-started', ({ dailyRoomUrl: url }) => {
        setActiveRoomUrl(url)
        toast.success('Video call started!')
      }),
      onSocketEvent('video-call-ended', () => {
        setDailyRoomUrl(null)
        setActiveRoomUrl(null)
        toast('Video call ended', { icon: '📹' })
      }),
    ]
    return () => unsubs.forEach((fn) => fn())
  }, [])

  useEffect(() => {
    if (!dailyRoomUrl || !containerRef.current) return

    let sambaFrame = null
    const onUserLeft = (event) => {
      if (event.data?.type !== 'local') return
      setDailyRoomUrl(null)
      if (event.data?.reason === 'sessionEnded' && isAdmin) {
        videoAPI.end(roomId).catch(() => {})
      }
    }
    try {
      sambaFrame = DigitalSambaEmbedded.createControl({
        root: containerRef.current,
        url: dailyRoomUrl,
      })
      sambaFrame.load({
        frameAttributes: {
          style: 'width:100%;height:100%;border:0;',
        },
      })
      sambaFrame.on('userLeft', onUserLeft)
    } catch (e) {
      toast.error('Failed to load video call')
    }

    return () => {
      if (sambaFrame) sambaFrame.off('userLeft', onUserLeft)
    }
  }, [dailyRoomUrl])

  const handleStart = async () => {
    setLoading(true)
    try {
      const res = await videoAPI.start(roomId)
      setDailyRoomUrl(res.data.dailyRoomUrl)
      setActiveRoomUrl(res.data.dailyRoomUrl)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start video call')
    } finally {
      setLoading(false)
    }
  }

  const handleEnd = async () => {
    setLoading(true)
    try {
      await videoAPI.end(roomId)
      setDailyRoomUrl(null)
      setActiveRoomUrl(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to end video call')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    setLoading(true)
    try {
      const res = await videoAPI.getActive(roomId)
      if (res.data.dailyRoomUrl) {
        setDailyRoomUrl(res.data.dailyRoomUrl)
      }
    } catch (err) {
      toast.error('Failed to join video call')
    } finally {
      setLoading(false)
    }
  }

  if (dailyRoomUrl) {
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-green-600">Video Call Active</p>
          {isAdmin && (
            <button
              onClick={handleEnd}
              disabled={loading}
              className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
            >
              {loading ? 'Ending...' : 'End Call'}
            </button>
          )}
        </div>
        <div
          ref={containerRef}
          className="w-full h-[400px] rounded-xl border overflow-hidden relative"
        />
      </div>
    )
  }

  if (activeRoomUrl) {
    return (
      <div className="border border-green-200 bg-green-50 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-sm font-medium text-green-700">Video call in progress</p>
          </div>
          <button
            onClick={handleJoin}
            disabled={loading}
            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Joining...' : 'Join'}
          </button>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <p className="text-xs text-gray-400 text-center py-4">
        No active video call
      </p>
    )
  }

  return (
    <button
      onClick={handleStart}
      disabled={loading}
      className="w-full py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
    >
      {loading ? 'Starting...' : 'Start Video Call'}
    </button>
  )
}
