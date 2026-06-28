import { useState } from 'react'
import { roomAPI } from '../../services/api'
import toast from 'react-hot-toast'

export default function CreateRoomModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', topic: '', subject: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Room name is required')
    setLoading(true)
    try {
      await roomAPI.create(form)
      toast.success('Room created!')
      onCreated()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm" onClick={onClose}>
      <div className="surface w-full max-w-md rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-2 text-lg font-semibold text-slate-100">Create Study Room</h2>
        <p className="mb-4 text-sm text-slate-400">Give the room a name, topic, and subject so it feels clear and intentional.</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Room Name *"
            className="input-base text-sm"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Topic (e.g. DSA, React)"
            className="input-base text-sm"
            value={form.topic}
            onChange={(e) => setForm({ ...form, topic: e.target.value })}
          />
          <input
            type="text"
            placeholder="Subject"
            className="input-base text-sm"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          />
          <textarea
            placeholder="Description (optional)"
            className="input-base resize-none text-sm"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="button-secondary flex-1 py-2.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="button-primary flex-1 py-2.5"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
