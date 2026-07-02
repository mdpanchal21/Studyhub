export default function QuizHistory({ quizzes, onViewQuiz }) {
  if (quizzes.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">📋</div>
        <p className="text-gray-500 font-medium mb-1">No quiz history</p>
        <p className="text-gray-400 text-xs">Complete a quiz and it will appear here</p>
      </div>
    )
  }

  const getScoreColor = (score, total) => {
    const pct = (score / total) * 100
    if (pct >= 80) return 'text-green-600 bg-green-50'
    if (pct >= 50) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  return (
    <div className="space-y-3">
      {quizzes.map((q) => (
        <button
          key={q._id}
          onClick={() => onViewQuiz(q._id)}
          className="w-full flex items-center justify-between bg-white border rounded-xl px-5 py-4 hover:shadow-md transition text-left"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{q.topic}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {q.room?.name ? `${q.room.name} · ` : ''}
              {new Date(q.createdAt).toLocaleDateString()}
            </p>
          </div>
          <span className={`ml-4 shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${getScoreColor(q.score, q.total)}`}>
            {q.score}/{q.total}
          </span>
        </button>
      ))}
    </div>
  )
}
