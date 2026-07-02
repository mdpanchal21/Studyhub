import { useState, useRef, useEffect } from 'react'

export default function TopicSelect({ topics, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = search
    ? topics.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
    : topics

  const toggle = (name) => {
    const next = value.includes(name)
      ? value.filter((v) => v !== name)
      : [...value, name]
    onChange(next)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-purple-400 min-h-[42px]"
      >
        <div className="flex-1 flex flex-wrap gap-1.5">
          {value.length === 0 && (
            <span className="text-gray-400">{placeholder || 'Select topics...'}</span>
          )}
          {value.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
            >
              {name}
              <button
                onClick={(e) => { e.stopPropagation(); toggle(name) }}
                className="hover:text-purple-900"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
        <svg className={`w-4 h-4 text-gray-400 transition ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b">
            <input
              type="text"
              placeholder="Search topics..."
              className="w-full px-3 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-300"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">No matching topics</p>
            )}
            {filtered.map((t) => {
              const checked = value.includes(t.name)
              return (
                <label
                  key={t.name}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-purple-50 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(t.name)}
                    className="accent-purple-600 rounded"
                  />
                  <span className="flex-1 font-medium text-gray-700">{t.name}</span>
                  <span className="text-xs text-gray-400">{t.count}</span>
                </label>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
