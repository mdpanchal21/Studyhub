import { useState } from 'react'

export default function FlashcardList({ flashcards, onDelete }) {
  const [flipId, setFlipId] = useState(null)

  if (flashcards.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400 text-sm">
        No flashcards yet. Create one or generate with AI!
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {flashcards.map((card) => (
        <div
          key={card._id}
          className="bg-white border rounded-xl p-5 cursor-pointer hover:shadow-md transition min-h-[140px] relative"
          onClick={() => setFlipId(flipId === card._id ? null : card._id)}
        >
          {flipId === card._id ? (
            <div>
              <p className="text-xs text-green-600 font-semibold mb-1">ANSWER</p>
              <p className="text-sm">{card.answer}</p>
            </div>
          ) : (
            <div>
              <p className="text-xs text-indigo-600 font-semibold mb-1">QUESTION</p>
              <p className="text-sm font-medium">{card.question}</p>
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete?.(card._id) }}
            className="absolute top-2 right-2 text-xs text-gray-300 hover:text-red-500"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
