import { useState } from 'react'

export default function CardGrid({ flashcards, onDelete, onStartStudy }) {
  const [flippedId, setFlippedId] = useState(null)

  if (flashcards.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">📇</div>
        <p className="text-gray-500 font-medium mb-1">No flashcards yet</p>
        <p className="text-gray-400 text-xs mb-6">Select a room, enter a topic, and click Generate</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{flashcards.length} flashcard{flashcards.length !== 1 ? 's' : ''}</p>
        <button
          onClick={onStartStudy}
          className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs hover:bg-indigo-700 transition"
        >
          Study All
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {flashcards.map((card) => {
          const isFlipped = flippedId === card._id
          return (
            <div
              key={card._id}
              className="group bg-white border rounded-xl min-h-[160px] cursor-pointer hover:shadow-md transition-all relative"
              onClick={() => setFlippedId(isFlipped ? null : card._id)}
            >
              <div className={`p-5 ${isFlipped ? 'hidden' : ''}`}>
                <p className="text-[10px] uppercase tracking-wider text-indigo-500 font-semibold mb-2">Question</p>
                <p className="text-sm font-medium">{card.question}</p>
                <p className="text-[10px] text-gray-300 mt-4">Tap to reveal answer</p>
              </div>
              <div className={`p-5 ${isFlipped ? '' : 'hidden'}`}>
                <p className="text-[10px] uppercase tracking-wider text-green-500 font-semibold mb-2">Answer</p>
                <p className="text-sm">{card.answer}</p>
                <p className="text-[10px] text-gray-300 mt-4">Tap to hide</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete?.(card._id) }}
                className="absolute top-2 right-2 text-xs text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition p-1"
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
