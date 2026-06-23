import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { roomAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import Skeleton from 'react-loading-skeleton'
import { on as onSocketEvent } from '../services/socket'
import toast from 'react-hot-toast'

export default function JoinByLink() {
  const { inviteCode } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)
    roomAPI.getByCode(inviteCode)
      .then((res) => setRoom(res.data.room))
      .catch((err) => setError(err.response?.data?.message || 'Room not found'))
      .finally(() => setLoading(false))
  }, [inviteCode])

  useEffect(() => {
    const unsub = onSocketEvent('request-accepted', ({ roomId }) => {
      toast.success('Your join request was accepted! Redirecting...')
      navigate(`/room/${roomId}`)
    })
    return unsub
  }, [navigate])

  const handleJoin = async () => {
    setJoining(true)
    try {
      const res = await roomAPI.join(inviteCode)
      toast.success(res.data.message || 'Join request sent!')
      setJoined(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join')
    } finally {
      setJoining(false)
    }
  }

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg border p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <Skeleton height={48} width={48} circle className="mx-auto mb-3" />
          <Skeleton height={28} width="60%" className="mx-auto mb-2" />
          <Skeleton height={14} width="40%" className="mx-auto" />
        </div>
        <Skeleton height={40} className="mb-4" />
        <Skeleton height={40} />
      </div>
    </div>
  )

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">🔗</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Invalid or Expired Link</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link
            to="/"
            className="inline-block px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg border p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">📚</div>
          <h1 className="text-2xl font-bold text-gray-800">{room.name}</h1>
          {room.description && (
            <p className="text-gray-500 mt-1">{room.description}</p>
          )}
          {room.topic && (
            <span className="inline-block mt-2 bg-indigo-100 text-indigo-700 text-xs px-3 py-1 rounded-full">
              {room.topic}
            </span>
          )}
        </div>

        <div className="flex items-center justify-center gap-6 text-sm text-gray-500 mb-6">
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-800">{room.memberCount}</p>
            <p>Members</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-800 font-mono">#{room.inviteCode}</p>
            <p>Invite Code</p>
          </div>
        </div>

        {joined ? (
          <div className="text-center">
            <div className="bg-green-50 text-green-700 rounded-lg p-4 mb-4">
              Join request sent! The room admin will review your request.
            </div>
            <Link
              to="/"
              className="inline-block px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Back to Dashboard
            </Link>
          </div>
        ) : user ? (
          <button
            onClick={handleJoin}
            disabled={joining}
            className="w-full px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {joining ? 'Sending request...' : 'Request to Join'}
          </button>
        ) : (
          <div className="text-center">
            <p className="text-gray-500 mb-4">You need to log in to join this room.</p>
            <Link
              to="/auth"
              className="inline-block px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Log in to Join
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
