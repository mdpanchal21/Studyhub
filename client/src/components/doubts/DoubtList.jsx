import DoubtCard from './DoubtCard'

export default function DoubtList({ doubts, onResolve }) {
  if (doubts.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400 text-sm">
        No doubts yet. Ask something!
      </div>
    )
  }
  return (
    <div className="space-y-3">
      {doubts.map((d) => (
        <DoubtCard key={d._id} doubt={d} onResolve={onResolve} />
      ))}
    </div>
  )
}
