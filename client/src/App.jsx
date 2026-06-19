import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/common/Navbar'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Room from './pages/Room'
import Flashcards from './pages/Flashcards'
import Profile from './pages/Profile'
import JoinByLink from './pages/JoinByLink'
import Loading from './components/common/Loading'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loading />
  if (!user) return <Navigate to="/auth" />
  return children
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) return <Loading />

  return (
    <div className="min-h-screen bg-gray-50">
      {user && <Navbar />}
      <main className={user ? 'max-w-7xl mx-auto px-4 py-6' : ''}>
        <Routes>
          <Route path="/auth" element={user ? <Navigate to="/" /> : <Auth />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/room/:id" element={<ProtectedRoute><Room /></ProtectedRoute>} />
          <Route path="/join/:inviteCode" element={<JoinByLink />} />
          <Route path="/flashcards" element={<ProtectedRoute><Flashcards /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  )
}
