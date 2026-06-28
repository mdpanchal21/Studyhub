import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { roomAPI } from '../services/api'
import { on as onSocketEvent } from '../services/socket'
import Skeleton from 'react-loading-skeleton'
import RoomCard from '../components/rooms/RoomCard'
import CreateRoomModal from '../components/rooms/CreateRoomModal'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const [rooms, setRooms] = useState([])
  const [historyRooms, setHistoryRooms] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [leaveTarget, setLeaveTarget] = useState(null)
  const [loadingRooms, setLoadingRooms] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [search, setSearch] = useState('')
  const [roomPage, setRoomPage] = useState(1)
  const [roomTotalPages, setRoomTotalPages] = useState(1)
  const [historyPage, setHistoryPage] = useState(1)
  const [historyTotalPages, setHistoryTotalPages] = useState(1)
  const searchTimeout = useRef(null)
  const navigate = useNavigate()

  const fetchRooms = async (page = 1, searchTerm = '') => {
    setLoadingRooms(true)
    try {
      const res = await roomAPI.getAll({ page, limit: 20, search: searchTerm })
      setRooms(res.data.rooms)
      setRoomPage(res.data.page)
      setRoomTotalPages(res.data.totalPages)
    } catch {
      toast.error('Failed to load rooms')
    } finally {
      setLoadingRooms(false)
    }
  }

  const fetchHistory = async (page = 1, searchTerm = '') => {
    setLoadingHistory(true)
    try {
      const res = await roomAPI.getHistory({ page, limit: 20, search: searchTerm })
      setHistoryRooms(res.data.rooms)
      setHistoryPage(res.data.page)
      setHistoryTotalPages(res.data.totalPages)
    } catch {
      toast.error('Failed to load room history')
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => { fetchRooms(1, '') }, [])
  useEffect(() => {
    const unsubs = [
      onSocketEvent('request-accepted', () => {
        fetchRooms(roomPage, search)
      }),
      onSocketEvent('request-declined', ({ roomName }) => {
        toast(`${roomName || 'Room'} request was declined`, { icon: '❌' })
      }),
      onSocketEvent('kicked', ({ roomName, roomId }) => {
        toast(`${roomName || 'Room'}: You were removed by the admin`, { icon: '🚫' })
        setRooms((prev) => prev.filter((r) => r._id !== roomId))
        fetchRooms(roomPage, search)
      }),
    ]

    return () => unsubs.forEach((fn) => fn())
  }, [roomPage, search])

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

  const handleLeave = (id, roomName) => {
    setLeaveTarget({ id, name: roomName })
  }

  const handleConfirmLeave = async () => {
    if (!leaveTarget) return
    try {
      await roomAPI.leave(leaveTarget.id)
      toast.success('Left room')
      fetchRooms(roomPage, search)
    } catch {
      toast.error('Failed to leave')
    } finally {
      setLeaveTarget(null)
    }
  }

  return (
    <div>
      <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6 flex items-center justify-between gap-4 flex-col sm:flex-row">
        <div>
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Personal AI Study Roadmap</p>
          <h2 className="text-xl font-bold mt-1">Open your personal roadmap page</h2>
          <p className="text-sm text-gray-500 mt-2">
            Generate and manage your roadmap in a separate page.
          </p>
        </div>
        <button
          onClick={() => navigate('/roadmap')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
        >
          Go to Roadmap
        </button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">
            {showHistory ? 'Room History' : 'Your Study Rooms'}
          </h1>
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => { setShowHistory(false); setSearch(''); fetchRooms(1, '') }}
              className={`px-3 py-1.5 text-sm rounded-md transition ${!showHistory ? 'bg-white shadow-sm font-medium text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Active
            </button>
            <button
              onClick={() => { setShowHistory(true); setSearch(''); fetchHistory(1, '') }}
              className={`px-3 py-1.5 text-sm rounded-md transition ${showHistory ? 'bg-white shadow-sm font-medium text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
            >
              History
            </button>
          </div>
        </div>
        {!showHistory && (
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
        )}
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder={showHistory ? 'Search history...' : 'Search rooms...'}
          value={search}
          onChange={(e) => {
            const val = e.target.value
            setSearch(val)
            if (searchTimeout.current) clearTimeout(searchTimeout.current)
            searchTimeout.current = setTimeout(() => {
              if (showHistory) {
                fetchHistory(1, val)
              } else {
                fetchRooms(1, val)
              }
            }, 300)
          }}
          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
        />
      </div>

      {showHistory ? (
        loadingHistory ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border p-5">
                <Skeleton height={24} width="60%" className="mb-2" />
                <Skeleton height={14} width="40%" className="mb-3" />
                <div className="flex gap-4">
                  <Skeleton height={14} width={120} />
                  <Skeleton height={14} width={120} />
                  <Skeleton height={14} width={80} />
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                  <Skeleton height={24} width={80} borderRadius={999} />
                  <Skeleton height={24} width={80} borderRadius={999} />
                  <Skeleton height={24} width={80} borderRadius={999} />
                </div>
              </div>
            ))}
          </div>
        ) : historyRooms.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">No deactivated rooms</p>
            <p className="text-sm">Rooms that are deactivated will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {historyRooms.map((room) => (
              <div key={room._id} className="bg-white rounded-xl shadow-sm border p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{room.name}</h3>
                    {room.topic && (
                      <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded mt-1">
                        {room.topic}
                      </span>
                    )}
                    {room.description && (
                      <p className="text-sm text-gray-500 mt-2">{room.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <span>📅</span> Created {new Date(room.createdAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <span>🚫</span> Deactivated {new Date(room.updatedAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <span>👥</span> {room.members?.length || 0} members
                  </span>
                </div>
                {room.members?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100">
                    {room.members.map((m) => (
                      <span key={m.user?._id} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                        {m.user?.name || 'Unknown'}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {historyTotalPages > 1 && (
              <div className="flex justify-center gap-2 pt-2">
                <button
                  onClick={() => fetchHistory(historyPage - 1, search)}
                  disabled={historyPage <= 1}
                  className="px-3 py-1.5 text-sm bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="px-3 py-1.5 text-sm text-gray-500">
                  Page {historyPage} of {historyTotalPages}
                </span>
                <button
                  onClick={() => fetchHistory(historyPage + 1, search)}
                  disabled={historyPage >= historyTotalPages}
                  className="px-3 py-1.5 text-sm bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )
      ) : loadingRooms ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border p-5">
              <Skeleton height={24} width="70%" className="mb-2" />
              <Skeleton height={14} width={60} className="mb-2" />
              <Skeleton height={14} width="90%" className="mb-4" />
              <div className="flex items-center justify-between">
                <Skeleton height={14} width={60} />
                <Skeleton height={14} width={60} />
              </div>
            </div>
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">No study rooms yet</p>
          <p className="text-sm">Create one or join with an invite code</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <RoomCard
                key={room._id}
                room={room}
                onClick={() => navigate(`/room/${room._id}`)}
                onLeave={() => handleLeave(room._id, room.name)}
              />
            ))}
          </div>
          {roomTotalPages > 1 && (
            <div className="flex justify-center gap-2 pt-6">
              <button
                onClick={() => fetchRooms(roomPage - 1, search)}
                disabled={roomPage <= 1}
                className="px-3 py-1.5 text-sm bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-500">
                Page {roomPage} of {roomTotalPages}
              </span>
              <button
                onClick={() => fetchRooms(roomPage + 1, search)}
                disabled={roomPage >= roomTotalPages}
                className="px-3 py-1.5 text-sm bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {showModal && (
        <CreateRoomModal
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); fetchRooms(1, search) }}
        />
      )}

      {leaveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Leave Room?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to leave <span className="font-medium text-gray-700">{leaveTarget.name}</span>?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setLeaveTarget(null)}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLeave}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
