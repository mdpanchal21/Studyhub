import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { roomAPI, flashcardAPI, aiAPI, quizAPI } from '../services/api'
import StudySession from '../components/flashcards/StudySession'
import QuizView from '../components/flashcards/QuizView'
import QuizHistory from '../components/flashcards/QuizHistory'
import TopicSelect from '../components/flashcards/TopicSelect'
import Pagination from '../components/common/Pagination'
import { on } from '../services/socket'
import toast from 'react-hot-toast'

export default function Flashcards() {
  const [rooms, setRooms] = useState([])
  const [selectedRoom, setSelectedRoom] = useState('')
  const [flashcards, setFlashcards] = useState([])
  const [topic, setTopic] = useState('')
  const [mode, setMode] = useState('cards')
  const [quizQuestions, setQuizQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [savedQuizzes, setSavedQuizzes] = useState([])
  const [quizPagination, setQuizPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [savedQuiz, setSavedQuiz] = useState(null)
  const [selectedTopic, setSelectedTopic] = useState('')
  const [selectedTopics, setSelectedTopics] = useState([])
  const fallbackRef = useRef(null)

  const topics = useMemo(() => {
    const map = {}
    flashcards.forEach(f => {
      const t = f.topic || 'Untitled'
      map[t] = (map[t] || 0) + 1
    })
    return Object.entries(map).map(([name, count]) => ({ name, count }))
  }, [flashcards])

  const filteredFlashcards = selectedTopic
    ? flashcards.filter(f => (f.topic || 'Untitled') === selectedTopic)
    : flashcards

  const loadQuizzes = useCallback(async (page = 1) => {
    try {
      const res = await quizAPI.list({ page, limit: 10 })
      setSavedQuizzes(res.data.quizzes)
      setQuizPagination(res.data.pagination)
    } catch {}
  }, [])

  useEffect(() => {
    roomAPI.getAll().then((res) => setRooms(res.data.rooms)).catch(() => {})
    loadQuizzes(1)
  }, [loadQuizzes])

  const fetchFlashcards = async (roomId) => {
    if (!roomId) return setFlashcards([])
    try {
      const res = await flashcardAPI.get(roomId)
      setFlashcards(res.data.flashcards)
    } catch { setFlashcards([]) }
  }

  useEffect(() => {
    setSelectedTopic('')
    setSelectedTopics([])
    if (selectedRoom) fetchFlashcards(selectedRoom)
  }, [selectedRoom])

  useEffect(() => {
    if (!selectedRoom) return

    const unsubComplete = on('flashcard-ai-complete', (data) => {
      clearTimeout(fallbackRef.current)
      if (data.flashcards) {
        setFlashcards(prev => [...data.flashcards, ...prev.filter(f => data.flashcards.every(n => n._id !== f._id))])
      }
      setLoading(false)
      toast.success(`Flashcards generated for "${data.topic || topic}"`)
    })

    const unsubError = on('flashcard-ai-error', (data) => {
      clearTimeout(fallbackRef.current)
      setLoading(false)
      toast.error(data.error || 'Flashcard generation failed')
    })

    return () => {
      unsubComplete()
      unsubError()
      clearTimeout(fallbackRef.current)
    }
  }, [selectedRoom])

  const handleGenerate = async () => {
    if (!selectedRoom) return toast.error('Select a room first')
    if (!topic.trim()) return toast.error('Enter a topic')
    setLoading(true)
    try {
      await flashcardAPI.generate(selectedRoom, topic.trim())
      toast.success('Generating...')
      fallbackRef.current = setTimeout(() => fetchFlashcards(selectedRoom), 30000)
    } catch { toast.error('Generation failed') }
    finally { setLoading(false) }
  }

  const handleQuiz = async () => {
    if (!selectedRoom) return toast.error('Select a room first')
    if (flashcards.length === 0) return toast.error('Generate flashcards first')
    if (selectedTopics.length === 0) return toast.error('Select at least one topic')
    setLoading(true)
    try {
      const res = await aiAPI.quiz(selectedTopics.join(', '), 5, selectedRoom, selectedTopics)
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

  const handleSaveQuiz = async (data) => {
    try {
      await quizAPI.save({ ...data, room: selectedRoom || undefined })
      toast.success('Quiz saved!')
      loadQuizzes()
    } catch {}
  }

  const handleViewQuiz = async (id) => {
    try {
      const res = await quizAPI.getOne(id)
      setSavedQuiz(res.data.quiz)
      setMode('quiz')
    } catch { toast.error('Failed to load quiz') }
  }

  const tabs = [
    { key: 'cards', label: 'My Cards', count: flashcards.length },
    { key: 'study', label: 'Study', count: null },
    { key: 'quiz', label: 'Quiz', count: quizQuestions.length || savedQuiz ? 'Live' : null },
    { key: 'history', label: 'History', count: quizPagination.total || null },
  ]

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Study Lab</h1>
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

      {mode === 'cards' && (
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
        </div>
      )}

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

      {mode === 'cards' && flashcards.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wider">Topics</p>
          <div className="space-y-2">
            {topics.map((t, i) => (
              <button
                key={t.name}
                onClick={() => { setSelectedTopic(t.name); setMode('study') }}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm transition group text-left"
              >
                <div
                  className="w-1.5 h-10 rounded-full shrink-0"
                  style={{ backgroundColor: ['#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f'][i % 5] }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-indigo-600 transition">{t.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t.count} card{t.count !== 1 ? 's' : ''}</p>
                </div>
                <svg className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === 'study' && !selectedTopic && flashcards.length === 0 && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📖</div>
          <p className="text-gray-500 font-medium mb-1">Nothing to study yet</p>
          <p className="text-gray-400 text-xs">Generate flashcards first, then come here to study</p>
        </div>
      )}

      {mode === 'study' && !selectedTopic && flashcards.length > 0 && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📖</div>
          <p className="text-gray-500 font-medium mb-1">Select a topic</p>
          <p className="text-gray-400 text-xs">Go to My Cards and click a topic to start studying</p>
        </div>
      )}

      {mode === 'study' && selectedTopic && filteredFlashcards.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-500">No cards for this topic</p>
        </div>
      )}

      {mode === 'study' && selectedTopic && filteredFlashcards.length > 0 && (
        <StudySession
          flashcards={filteredFlashcards}
          onBack={() => { setSelectedTopic(''); setMode('cards') }}
        />
      )}

      {mode === 'quiz' && !savedQuiz && quizQuestions.length === 0 && !loading && !selectedRoom && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📝</div>
          <p className="text-gray-500 font-medium mb-1">Select a room first</p>
          <p className="text-gray-400 text-xs">Go to My Cards tab and select a room with flashcards</p>
        </div>
      )}

      {mode === 'quiz' && !savedQuiz && quizQuestions.length === 0 && !loading && selectedRoom && flashcards.length === 0 && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📝</div>
          <p className="text-gray-500 font-medium mb-1">No flashcards in this room</p>
          <p className="text-gray-400 text-xs">Generate flashcards first, then come here to take a quiz</p>
        </div>
      )}

      {mode === 'quiz' && !savedQuiz && quizQuestions.length === 0 && !loading && selectedRoom && flashcards.length > 0 && (
        <>
          <div className="max-w-md mx-auto space-y-4 pt-8">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">📝</div>
              <h2 className="text-lg font-semibold">Create a Quiz</h2>
              <p className="text-sm text-gray-400 mt-1">Select topics and generate questions</p>
            </div>
            <TopicSelect
              topics={topics}
              value={selectedTopics}
              onChange={setSelectedTopics}
              placeholder="Choose topics..."
            />
            <button
              onClick={handleQuiz}
              disabled={loading || selectedTopics.length === 0}
              className="w-full px-5 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading
                ? 'Generating...'
                : `Generate Quiz${selectedTopics.length > 0 ? ` (${selectedTopics.length} topic${selectedTopics.length !== 1 ? 's' : ''})` : ''}`
              }
            </button>
          </div>
        </>
      )}

      {mode === 'quiz' && !savedQuiz && loading && quizQuestions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="bg-white border rounded-2xl shadow-sm px-8 py-6 text-center max-w-sm">
            <div className="flex items-center justify-center gap-1.5 mb-4">
              <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
              <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
              <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
            </div>
            <p className="text-sm font-medium text-gray-700">Crafting your quiz</p>
            <p className="text-xs text-gray-400 mt-1">AI is generating questions from your flashcards</p>
          </div>
        </div>
      )}

      {mode === 'quiz' && !savedQuiz && quizQuestions.length > 0 && (
        <QuizView
          questions={quizQuestions}
          topic={flashcards[0]?.topic || `Quiz`}
          onBack={() => { setMode('cards'); setQuizQuestions([]) }}
          onSave={handleSaveQuiz}
        />
      )}

      {mode === 'quiz' && savedQuiz && (
        <QuizView
          questions={savedQuiz.questions}
          topic={savedQuiz.topic}
          savedQuiz={savedQuiz}
          onBack={() => { setMode('history'); setSavedQuiz(null) }}
        />
      )}

      {mode === 'history' && (
        <div>
          <QuizHistory quizzes={savedQuizzes} onViewQuiz={handleViewQuiz} />
          <Pagination
            page={quizPagination.page}
            totalPages={quizPagination.pages}
            onPageChange={(p) => loadQuizzes(p)}
          />
        </div>
      )}
    </div>
  )
}
