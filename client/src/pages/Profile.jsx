import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { sessionAPI } from '../services/api'

export default function Profile() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    sessionAPI.getAll().then((res) => setSessions(res.data.sessions)).catch(() => {})
  }, [])

  const totalMinutes = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-2xl font-bold text-indigo-600">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold">{user?.name}</h2>
            <p className="text-gray-500">{user?.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-6 text-center">
          <div className="bg-indigo-50 rounded-lg p-3">
            <p className="text-2xl font-bold text-indigo-600">{sessions.length}</p>
            <p className="text-xs text-gray-500">Sessions</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-2xl font-bold text-green-600">{totalMinutes}</p>
            <p className="text-xs text-gray-500">Total Minutes</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <p className="text-2xl font-bold text-purple-600">{user?.studyStreak || 0}</p>
            <p className="text-xs text-gray-500">Day Streak</p>
          </div>
        </div>
      </div>

      {sessions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-bold mb-4">Recent Study Sessions</h3>
          <div className="space-y-3">
            {sessions.map((s) => (
              <div key={s._id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="text-sm font-medium">{s.room?.name || 'Unknown Room'}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(s.startTime).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-sm text-indigo-600 font-medium">
                  {s.durationMinutes || 0} min
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
