import { useState, useMemo, useEffect, useRef } from 'react'

const OPTION_LABELS = ['A', 'B', 'C', 'D']

const cleanOption = (opt) => {
  if (/^[A-Da-d][\)\]\.\-\s]/.test(opt)) {
    return opt.replace(/^[A-Da-d][\)\]\.\-\s]+/, '').trim()
  }
  return opt
}

export default function QuizView({ questions, topic, onBack, onSave, savedQuiz }) {
  const cleaned = useMemo(() =>
    questions.map((q) => ({
      ...q,
      options: q.options?.map(cleanOption),
      correctAnswer: cleanOption(q.correctAnswer),
    })),
    [questions]
  )
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState(savedQuiz
    ? Object.fromEntries(savedQuiz.results.map((r) => [r.questionIndex, r.selected]))
    : {}
  )
  const [submitted, setSubmitted] = useState(!!savedQuiz)
  const savedRef = useRef(false)

  useEffect(() => {
    if (submitted && onSave && !savedQuiz && !savedRef.current) {
      const correctCount = cleaned.filter((q, i) => answers[i] === q.correctAnswer).length
      savedRef.current = true
      onSave({
        topic,
        questions: cleaned,
        results: cleaned.map((q, i) => ({
          questionIndex: i,
          selected: answers[i],
          correct: answers[i] === q.correctAnswer,
        })),
        score: correctCount,
        total: cleaned.length,
      })
    }
  }, [submitted])

  if (cleaned.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">No quiz questions. Generate a quiz first.</p>
      </div>
    )
  }

  const current = cleaned[currentIndex]
  const selected = answers[currentIndex]

  const handleSelect = (opt) => {
    if (submitted) return
    if (selected === opt) {
      const { [currentIndex]: _, ...rest } = answers
      setAnswers(rest)
    } else {
      setAnswers({ ...answers, [currentIndex]: opt })
    }
  }

  const handleNext = () => {
    if (currentIndex < cleaned.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const answeredCount = Object.keys(answers).length

  const findLabel = (q, opt) => {
    const idx = q.options?.indexOf(opt)
    return idx !== -1 ? OPTION_LABELS[idx] : ''
  }

  if (submitted) {
    const correctCount = cleaned.filter((q, i) => answers[i] === q.correctAnswer).length
    const total = cleaned.length
    const percentage = Math.round((correctCount / total) * 100)
    const grade = percentage >= 80 ? 'Excellent!' : percentage >= 60 ? 'Good Job!' : 'Keep Practicing!'

    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">{percentage >= 60 ? '🎉' : '📚'}</div>
          <h2 className="text-xl font-bold mb-1">{grade}</h2>
          <p className="text-sm text-gray-500">Quiz: {topic}</p>
          {savedQuiz && (
            <p className="text-xs text-gray-400 mt-1">
              {new Date(savedQuiz.createdAt).toLocaleDateString()}
            </p>
          )}
          <div className="mt-4">
            <span className="text-4xl font-bold">{correctCount}</span>
            <span className="text-gray-400 text-lg">/{total}</span>
            <span className="ml-2 text-lg text-gray-500">({percentage}%)</span>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {cleaned.map((q, i) => {
            const userAns = answers[i]
            const correct = userAns === q.correctAnswer
            return (
              <div key={i} className={`p-4 rounded-xl border ${correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-start gap-2">
                  <span className="text-sm mt-0.5">{correct ? '✅' : '❌'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium mb-1">Q{i + 1}. {q.question}</p>
                    <p className="text-xs text-gray-500">
                      Your answer: <span className={`font-medium ${correct ? 'text-green-600' : 'text-red-600'}`}>{findLabel(q, userAns) || '-'}</span>
                      {userAns && <span className="text-gray-400"> ({userAns})</span>}
                    </p>
                    {!correct && (
                      <p className="text-xs text-gray-500">
                        Correct: <span className="text-green-600 font-medium">{findLabel(q, q.correctAnswer)}</span>
                        <span className="text-gray-400"> ({q.correctAnswer})</span>
                      </p>
                    )}
                    {q.explanation && (
                      <p className="text-xs text-gray-400 mt-1">{q.explanation}</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex gap-3 justify-center">
          {!savedQuiz && (
            <button
              onClick={() => { setCurrentIndex(0); setAnswers({}); setSubmitted(false); savedRef.current = false }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition"
            >
              Retry
            </button>
          )}
          <button
            onClick={onBack}
            className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 transition"
          >
            Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">Quiz: {topic}</span>
        <button onClick={onBack} className="text-xs text-gray-400 hover:text-gray-600">Exit</button>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
        <div
          className="bg-purple-500 h-1.5 rounded-full transition-all"
          style={{ width: `${(answeredCount / cleaned.length) * 100}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 mb-6">Question {currentIndex + 1} of {cleaned.length}</p>

      <div className="bg-white border rounded-xl p-6 mb-4">
        <p className="text-xs text-purple-500 font-semibold mb-4">Question {currentIndex + 1}</p>
        <p className="text-base font-medium mb-5">{current.question}</p>

        <div className="space-y-2">
          {current.options?.map((opt, j) => {
            const isSelected = selected === opt
            return (
              <button
                key={j}
                onClick={() => handleSelect(opt)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm transition ${
                  isSelected
                    ? 'border-2 border-indigo-600 bg-indigo-50'
                    : 'border border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <span className={`font-medium mr-2 ${isSelected ? 'text-indigo-600' : 'text-gray-400'}`}>{OPTION_LABELS[j]}.</span>
                {opt}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        {currentIndex < cleaned.length - 1 ? (
          <button
            onClick={handleNext}
            className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 transition"
          >
            Next
          </button>
        ) : (
          <button
            onClick={() => setSubmitted(true)}
            disabled={answeredCount < cleaned.length}
            className="px-5 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            View Results
          </button>
        )}
      </div>
    </div>
  )
}
