export default function TypingIndicator({ users }) {
  if (!users?.length) return null
  const names = users.map((u) => u.name)
  const text = names.length === 1
    ? `${names[0]} is typing...`
    : `${names.length} people are typing...`
  return (
    <div className="px-4 py-1 text-xs text-gray-400 italic">
      {text}
    </div>
  )
}
