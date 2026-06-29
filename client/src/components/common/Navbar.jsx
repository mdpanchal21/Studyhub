import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { notificationAPI } from '../../services/api'
import { on as onSocketEvent } from '../../services/socket'

export default function Navbar() {
  const { user, logout } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationAPI.get()
      setNotifications(res.data.notifications)
    } catch {
      // silently fail — not critical
    }
  }, [])

  useEffect(() => {
    if (!user) return
    fetchNotifications()

    // Real-time: server emits 'new-notification' to the user's personal socket room
    const unsub = onSocketEvent('new-notification', (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 20))
    })

    return unsub
  }, [user, fetchNotifications])

  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      )
    } catch {}
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch {}
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/75 backdrop-blur-xl relative">
      <div className="px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-slate-100 tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-400 text-slate-950 shadow-lg shadow-teal-500/20">S</span>
          <span>StudyHub</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/flashcards" className="text-sm text-slate-300 transition hover:text-teal-300">
            Flashcards
          </Link>
          <Link to="/profile" className="text-sm text-slate-300 transition hover:text-teal-300">
            Profile
          </Link>

          {/* ── Notification Bell ─────────────────────────────────────── */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown((v) => !v)}
              className="relative rounded-full p-2 transition hover:bg-white/10 surface-soft"
              aria-label="Notifications"
            >
              {/* Bell icon */}
              <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showDropdown && (
              <>
                {/* Backdrop to close */}
                <div
                  className="fixed inset-0"
                  onClick={() => setShowDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-80 surface overflow-hidden rounded-2xl">
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                    <span className="text-sm font-semibold text-slate-100">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-teal-300 hover:text-teal-200"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-white/10">
                    {notifications.length === 0 ? (
                      <p className="py-8 text-center text-sm text-slate-400">
                        No notifications yet
                      </p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n._id}
                          onClick={() => handleMarkRead(n._id)}
                          className={`cursor-pointer px-4 py-3 transition hover:bg-white/5 ${
                            !n.isRead ? 'bg-teal-500/10' : ''
                          }`}
                        >
                          {n.link ? (
                            <Link
                              to={n.link}
                              onClick={() => setShowDropdown(false)}
                              className="block"
                            >
                              <NotificationItem n={n} />
                            </Link>
                          ) : (
                            <NotificationItem n={n} />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          {/* ────────────────────────────────────────────────────────────── */}

          <span className="text-sm text-slate-400">{user?.name}</span>
          <button
            onClick={logout}
            className="text-sm text-rose-400 hover:text-rose-300"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}

function NotificationItem({ n }) {
  const iconMap = {
    join_request: '🚪',
    doubt_resolved: '✅',
    room_invite: '📩',
    streak: '🔥',
    info: 'ℹ️',
  }
  return (
    <div className="flex gap-2 items-start">
      <span className="text-base mt-0.5">{iconMap[n.type] || 'ℹ️'}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200 leading-snug">{n.message}</p>
        <p className="mt-0.5 text-[11px] text-slate-500">
          {new Date(n.createdAt).toLocaleString()}
        </p>
      </div>
      {!n.isRead && (
        <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-teal-400 shadow-[0_0_0_4px_rgba(45,212,191,0.16)]" />
      )}
    </div>
  )
}
