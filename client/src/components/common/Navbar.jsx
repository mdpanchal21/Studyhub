import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-indigo-600">
          StudyHub
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/flashcards" className="text-sm text-gray-600 hover:text-indigo-600">
            Flashcards
          </Link>
          <Link to="/profile" className="text-sm text-gray-600 hover:text-indigo-600">
            Profile
          </Link>
          <span className="text-sm text-gray-500">{user?.name}</span>
          <button
            onClick={logout}
            className="text-sm text-red-500 hover:text-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}
