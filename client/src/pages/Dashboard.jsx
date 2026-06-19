import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { roomAPI } from '../services/api'
import { on as onSocketEvent } from '../services/socket'
import RoomCard from '../components/rooms/RoomCard'
import CreateRoomModal from '../components/rooms/CreateRoomModal'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const [rooms, setRooms] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const navigate = useNavigate()

  const fetchRooms = async () => {
    try {
      const res = await roomAPI.getAll()
      setRooms(res.data.rooms)
    } catch {
      toast.error('Failed to load rooms')
    }
  }

  useEffect(() => { fetchRooms() }, [])

  useEffect(() => {
    const unsubs = [
      onSocketEvent('request-accepted', ({ roomId: acceptedRoomId }) => {
        toast.success('Your join request was accepted! Redirecting...')
        navigate(`/room/${acceptedRoomId}`)
      }),
      onSocketEvent('request-declined', ({ roomName }) => {
        toast(`${roomName || 'Room'} request was declined`, { icon: '❌' })
      }),
      onSocketEvent('kicked', ({ roomName, roomId }) => {
        toast(`${roomName || 'Room'}: You were removed by the admin`, { icon: '🚫' })
        setRooms((prev) => prev.filter((r) => r._id !== roomId))
        fetchRooms()
      }),
    ]

    return () => unsubs.forEach((fn) => fn())
  }, [])

  const handleJoin = async () => {
    if (!joinCode.trim()) return
    try {
      const res = await roomAPI.join(joinCode.trim())
      toast.success(res.data.message || 'Join request sent!')
      setJoinCode('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid code')
    }
  }

  const handleLeave = async (id) => {
    try {
      await roomAPI.leave(id)
      toast.success('Left room')
      fetchRooms()
    } catch {
      toast.error('Failed to leave')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Your Study Rooms</h1>
        <div className="flex gap-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter invite code"
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
            />
            <button
              onClick={handleJoin}
              className="px-4 py-2 bg-gray-200 rounded-lg text-sm hover:bg-gray-300"
            >
              Join
            </button>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
          >
            + Create Room
          </button>
        </div>
      </div>

      {rooms.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">No study rooms yet</p>
          <p className="text-sm">Create one or join with an invite code</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <RoomCard
              key={room._id}
              room={room}
              onClick={() => navigate(`/room/${room._id}`)}
              onLeave={() => handleLeave(room._id)}
            />
          ))}
        </div>
      )}

      {showModal && (
        <CreateRoomModal
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); fetchRooms() }}
        />
      )}
    </div>
  )
}
