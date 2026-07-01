import { useState } from 'react'

export default function StudySession({ flashcards, onBack }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [ratings, setRatings] = useState({})

  const current = flashcards[currentIndex]

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setFlipped(false)
    } else {
      setCompleted(true)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setFlipped(false)
    }
  }

  const handleRate = (rating) => {
    setRatings({ ...ratings, [current._id]: rating })
    setTimeout(handleNext, 300)
  }

  if (flashcards.length === 0) return null

  if (completed) {
    const total = flashcards.length
    const mastered = Object.values(ratings).filter(r => r === 'easy').length
    const decent = Object.values(ratings).filter(r => r === 'hard').length
    const needsReview = Object.values(ratings).filter(r => r === 'again').length

    return (
      <div className="text-center py-16 max-w-md mx-auto">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-xl font-bold mb-2">Session Complete!</h2>
        <p className="text-sm text-gray-500 mb-6">You reviewed {total} flashcard{total !== 1 ? 's' : ''}</p>
        <div className="flex justify-center gap-8 mb-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">{mastered}</div>
            <div className="text-xs text-gray-400">Mastered</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-500">{decent}</div>
            <div className="text-xs text-gray-400">Decent</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">{needsReview}</div>
            <div className="text-xs text-gray-400">Needs Review</div>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { setCurrentIndex(0); setFlipped(false); setCompleted(false); setRatings({}) }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition"
          >
            Study Again
          </button>
          <button
            onClick={onBack}
            className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 transition"
          >
            Back to Cards
          </button>
        </div>
      </div>
    )
  }

  if (!current) return null

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-gray-500">Card {currentIndex + 1} of {flashcards.length}</span>
        <button onClick={onBack} className="text-xs text-gray-400 hover:text-gray-600">Exit</button>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-8">
        <div
          className="bg-indigo-500 h-1.5 rounded-full transition-all"
          style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
        />
      </div>

      <div
        className="relative cursor-pointer"
        style={{ perspective: '1000px', minHeight: '220px' }}
        onClick={() => setFlipped(!flipped)}
      >
        <div
          className="relative w-full h-full"
          style={{
            transition: 'transform 0.5s',
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            minHeight: '220px',
          }}
        >
          <div
            className="bg-white border rounded-xl p-8 flex flex-col items-center justify-center text-center"
            style={{ backfaceVisibility: 'hidden', position: 'absolute', inset: 0, minHeight: '220px' }}
          >
            <p className="text-[10px] uppercase tracking-wider text-indigo-500 font-semibold mb-4">Question</p>
            <p className="text-lg font-medium">{current.question}</p>
            <p className="text-xs text-gray-300 mt-8">Tap to reveal answer</p>
          </div>
          <div
            className="bg-white border rounded-xl p-8 flex flex-col items-center justify-center text-center"
            style={{ backfaceVisibility: 'hidden', position: 'absolute', inset: 0, transform: 'rotateY(180deg)', minHeight: '220px' }}
          >
            <p className="text-[10px] uppercase tracking-wider text-green-500 font-semibold mb-4">Answer</p>
            <p className="text-lg">{current.answer}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 transition"
        >
          {currentIndex < flashcards.length - 1 ? 'Next' : 'Finish'}
        </button>
      </div>

      {flipped && (
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400 mb-2">How well did you know this?</p>
          <div className="flex justify-center gap-2">
            <button
              onClick={() => handleRate('again')}
              className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs hover:bg-red-200 transition"
            >
              Again
            </button>
            <button
              onClick={() => handleRate('hard')}
              className="px-3 py-1.5 bg-yellow-100 text-yellow-600 rounded-lg text-xs hover:bg-yellow-200 transition"
            >
              Hard
            </button>
            <button
              onClick={() => handleRate('easy')}
              className="px-3 py-1.5 bg-green-100 text-green-600 rounded-lg text-xs hover:bg-green-200 transition"
            >
              Easy
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
