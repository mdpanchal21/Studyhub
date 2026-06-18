import { useState } from 'react'

export default function MessageInput({ onSend, onTyping }) {
  const [text, setText] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    onSend(text.trim())
    setText('')
  }

  return (
    <form onSubmit={handleSubmit} className="border-t p-3 flex gap-2">
      <input
        type="text"
        placeholder="Type a message..."
        className="flex-1 px-4 py-2 border rounded-full text-sm outline-none focus:ring-2 focus:ring-indigo-400"
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          onTyping?.()
        }}
      />
      <button
        type="submit"
        disabled={!text.trim()}
        className="px-5 py-2 bg-indigo-600 text-white rounded-full text-sm hover:bg-indigo-700 disabled:opacity-40"
      >
        Send
      </button>
    </form>
  )
}
