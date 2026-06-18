import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { roomAPI, flashcardAPI, aiAPI } from '../services/api'
import FlashcardList from '../components/flashcards/FlashcardList'
import toast from 'react-hot-toast'

export default function Flashcards() {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [selectedRoom, setSelectedRoom] = useState('')
  const [flashcards, setFlashcards] = useState([])
  const [topic, setTopic] = useState('')
  const [showQuiz, setShowQuiz] = useState(false)
  const [quizQuestions, setQuizQuestions] = useState([])
  const [quizAnswers, setQuizAnswers] = useState({})

  useEffect(() => {
    roomAPI.getAll().then((res) => setRooms(res.data.rooms)).catch(() => {})
  }, [])

  const fetchFlashcards = async (roomId) => {
    if (!roomId) return setFlashcards([])
    try {
      const res = await flashcardAPI.get(roomId)
      setFlashcards(res.data.flashcards)
    } catch { setFlashcards([]) }
  }

  useEffect(() => {
    if (selectedRoom) fetchFlashcards(selectedRoom)
  }, [selectedRoom])

  const handleGenerate = async () => {
    if (!selectedRoom) return toast.error('Select a room first')
    if (!topic.trim()) return toast.error('Enter a topic')
    try {
      await flashcardAPI.generate(selectedRoom, topic.trim())
      toast.success('Generating... refresh in a moment')
    } catch { toast.error('Generation failed') }
  }

  const handleQuiz = async () => {
    if (!topic.trim()) return toast.error('Enter a topic')
    try {
      const res = await aiAPI.quiz(topic.trim(), 5)
      setQuizQuestions(res.data.questions)
      setQuizAnswers({})
      setShowQuiz(true)
    } catch { toast.error('Failed to generate quiz') }
  }

  const handleDelete = async (id) => {
    try {
      await flashcardAPI.delete(id)
      setFlashcards((prev) => prev.filter((c) => c._id !== id))
    } catch { toast.error('Failed to delete') }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Flashcards & Quiz</h1>

      <div className="flex gap-3 mb-6">
        <select
          className="px-3 py-2 border rounded-lg text-sm outline-none"
          value={selectedRoom}
          onChange={(e) => setSelectedRoom(e.target.value)}
        >
          <option value="">Select a room...</option>
          {rooms.map((r) => (
            <option key={r._id} value={r._id}>{r.name}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Topic for AI generation"
          className="flex-1 px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-400"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <button
          onClick={handleGenerate}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
        >
          Generate
        </button>
        <button
          onClick={handleQuiz}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
        >
          Quiz
        </button>
      </div>

      <FlashcardList flashcards={flashcards} onDelete={handleDelete} />

      {showQuiz && quizQuestions.length > 0 && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border p-6">
          <h2 className="font-bold text-lg mb-4">Quiz: {topic}</h2>
          <div className="space-y-6">
            {quizQuestions.map((q, i) => (
              <div key={i} className="border-b pb-4">
                <p className="font-medium text-sm mb-2">{i + 1}. {q.question}</p>
                {q.options?.map((opt, j) => (
                  <label key={j} className="flex items-center gap-2 text-sm py-1">
                    <input
                      type="radio"
                      name={`q${i}`}
                      value={opt}
                      onChange={() => setQuizAnswers({ ...quizAnswers, [i]: opt })}
                    />
                    {opt}
                  </label>
                ))}
                {quizAnswers[i] && (
                  <p className={`text-xs mt-1 ${quizAnswers[i] === q.correctAnswer ? 'text-green-600' : 'text-red-600'}`}>
                    {quizAnswers[i] === q.correctAnswer ? 'Correct!' : `Wrong. Answer: ${q.correctAnswer}`}
                    <br />
                    <span className="text-gray-500">{q.explanation}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
