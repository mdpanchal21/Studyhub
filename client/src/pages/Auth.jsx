import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Auth() {
  const { login, register } = useAuth()
const [isLogin, setIsLogin] = useState(true)
const [form, setForm] = useState({ name: '', email: '', password: '' })

const toggleMode = () => {
  setIsLogin(!isLogin)
  setForm({ name: '', email: '', password: '' })
}
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isLogin) {
        await login(form.email, form.password)
        toast.success('Logged in!')
      } else {
        await register(form.name, form.email, form.password)
        toast.success('Account created!')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="surface w-full max-w-md rounded-2xl p-8">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-400 text-slate-950 text-xl font-bold shadow-lg shadow-teal-500/20">
            S
          </div>
          <h1 className="text-3xl font-bold text-slate-100 mb-2">StudyHub</h1>
          <p className="text-sm text-slate-400">AI-powered study rooms, roadmap, and learning flow</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input
              type="text"
              placeholder="Full Name"
              className="input-base px-4 py-2.5"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            className="input-base px-4 py-2.5"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="input-base px-4 py-2.5"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="button-primary w-full py-2.5"
          >
            {loading ? 'Please wait...' : isLogin ? 'Login' : 'Register'}
          </button>
        </form>

        <p className="text-center mt-4 text-sm text-gray-500">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={toggleMode}
            className="text-teal-300 hover:text-teal-200 hover:underline"
          >
            {isLogin ? 'Register' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  )
}
