import { useState, useEffect } from 'react'
import { roomAPI, flashcardAPI, aiAPI } from '../services/api'
import CardGrid from '../components/flashcards/CardGrid'
import StudySession from '../components/flashcards/StudySession'
import QuizView from '../components/flashcards/QuizView'
import toast from 'react-hot-toast'

export default function Flashcards() {
  const [rooms, setRooms] = useState([])
  const [selectedRoom, setSelectedRoom] = useState('')
  const [flashcards, setFlashcards] = useState([])
  const [topic, setTopic] = useState('')
  const [mode, setMode] = useState('cards')
  const [quizQuestions, setQuizQuestions] = useState([])
  const [loading, setLoading] = useState(false)

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
    setLoading(true)
    try {
      await flashcardAPI.generate(selectedRoom, topic.trim())
      toast.success('Generating... refresh in a moment')
      setTimeout(() => fetchFlashcards(selectedRoom), 2000)
    } catch { toast.error('Generation failed') }
    finally { setLoading(false) }
  }

  const handleQuiz = async () => {
    if (!topic.trim()) return toast.error('Enter a topic')
    setLoading(true)
    try {
      const res = await aiAPI.quiz(topic.trim(), 5)
      setQuizQuestions(res.data.questions)
      setMode('quiz')
    } catch { toast.error('Failed to generate quiz') }
    finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    try {
      await flashcardAPI.delete(id)
      setFlashcards((prev) => prev.filter((c) => c._id !== id))
    } catch { toast.error('Failed to delete') }
  }

  const tabs = [
    { key: 'cards', label: 'My Cards', count: flashcards.length },
    { key: 'study', label: 'Study', count: null },
    { key: 'quiz', label: 'Quiz', count: quizQuestions.length || null },
  ]

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Study Lab</h1>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <select
          className="px-3 py-2 border rounded-lg text-sm outline-none bg-white"
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
          className="flex-1 min-w-[200px] px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-400"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating...' : 'Generate'}
        </button>
        <button
          onClick={handleQuiz}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating...' : 'Quiz'}
        </button>
      </div>

      <div className="flex gap-1 mb-6 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setMode(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              mode === tab.key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.count != null && (
              <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
                mode === tab.key ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {mode === 'cards' && flashcards.length === 0 && !loading && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📇</div>
          <p className="text-gray-500 font-medium mb-1">No flashcards yet</p>
          <p className="text-gray-400 text-xs">Select a room, enter a topic, and click Generate</p>
        </div>
      )}

      {mode === 'cards' && loading && flashcards.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="bg-white border rounded-2xl shadow-sm px-8 py-6 text-center max-w-sm">
            <div className="flex items-center justify-center gap-1.5 mb-4">
              <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
              <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
              <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
            </div>
            <p className="text-sm font-medium text-gray-700">Crafting your flashcards</p>
            <p className="text-xs text-gray-400 mt-1">AI is generating cards on &quot;{topic}&quot;</p>
          </div>
        </div>
      )}

      {mode === 'study' && flashcards.length === 0 && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📖</div>
          <p className="text-gray-500 font-medium mb-1">Nothing to study yet</p>
          <p className="text-gray-400 text-xs">Generate flashcards first, then come here to study</p>
        </div>
      )}

      {mode === 'quiz' && quizQuestions.length === 0 && !loading && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📝</div>
          <p className="text-gray-500 font-medium mb-1">No quiz generated</p>
          <p className="text-gray-400 text-xs">Enter a topic and click the Quiz button to generate one</p>
        </div>
      )}

      {mode === 'quiz' && loading && quizQuestions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="bg-white border rounded-2xl shadow-sm px-8 py-6 text-center max-w-sm">
            <div className="flex items-center justify-center gap-1.5 mb-4">
              <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
              <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
              <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
            </div>
            <p className="text-sm font-medium text-gray-700">Crafting your quiz</p>
            <p className="text-xs text-gray-400 mt-1">AI is generating questions on &quot;{topic}&quot;</p>
          </div>
        </div>
      )}

      {mode === 'cards' && flashcards.length > 0 && (
        <CardGrid
          flashcards={flashcards}
          onDelete={handleDelete}
          onStartStudy={() => setMode('study')}
        />
      )}

      {mode === 'study' && flashcards.length > 0 && (
        <StudySession
          flashcards={flashcards}
          onBack={() => setMode('cards')}
        />
      )}

      {mode === 'quiz' && quizQuestions.length > 0 && (
        <QuizView
          questions={quizQuestions}
          topic={topic}
          onBack={() => setMode('cards')}
        />
      )}
    </div>
  )
}
