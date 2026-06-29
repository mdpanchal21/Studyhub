import { useEffect, useState } from 'react'
import { roadmapAPI } from '../services/api'
import Skeleton from 'react-loading-skeleton'
import toast from 'react-hot-toast'

function RoadmapSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton height={24} width="35%" />
      <Skeleton height={14} width="60%" />
      <Skeleton height={18} width="100%" />
    </div>
  )
}

function RoadmapView({ roadmap }) {
  const tasks = roadmap?.plan?.flatMap((w) => w.tasks || []) || []
  const total = roadmap?.progress?.totalTasks || tasks.length
  const completed = roadmap?.progress?.completedTasks || 0
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div>
      {/* Title + progress */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-100">{roadmap?.title || 'Study Roadmap'}</h3>
          {roadmap?.summary && <p className="text-sm text-slate-400 mt-0.5">{roadmap.summary}</p>}
        </div>
        {pct > 0 && (
          <span className="text-xs font-semibold text-teal-400 whitespace-nowrap">{pct}% done</span>
        )}
      </div>
      {pct > 0 && (
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-5">
          <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}

      {/* Timeline weeks */}
      <div className="space-y-0">
        {(roadmap?.plan || []).map((week, idx) => (
          <div key={week.weekNumber} className="relative flex gap-4 pb-6 last:pb-0">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-500/20 border-2 border-teal-500/40 text-xs font-bold text-teal-400 z-10">
                {week.weekNumber}
              </div>
              {idx < (roadmap?.plan?.length || 0) - 1 && (
                <div className="w-px flex-1 bg-white/10 mt-1" />
              )}
            </div>
            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-400">Week {week.weekNumber}</p>
              <h4 className="font-bold text-slate-100 mt-0.5">{week.theme}</h4>
              {week.focus && <p className="text-sm text-slate-400 mt-0.5">{week.focus}</p>}
              <ul className="mt-2 space-y-1">
                {(week.tasks || []).map((task, i) => (
                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-teal-400 mt-1 flex-shrink-0">&#8226;</span>
                    <span>
                      <span className="font-medium text-slate-200">{task.day}:</span>{' '}
                      {task.title}
                      {task.details && <span className="text-slate-500"> &mdash; {task.details}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Roadmap() {
  const [roadmap, setRoadmap] = useState(null)
  const [roadmaps, setRoadmaps] = useState([])
  const [loadingRoadmap, setLoadingRoadmap] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [partialRoadmap, setPartialRoadmap] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)

  const [roadmapForm, setRoadmapForm] = useState({
    targetRole: '',
    currentLevel: 'beginner',
    hoursPerDay: '2',
    durationWeeks: '4',
    targetDate: '',
    knownTopics: '',
    weakTopics: '',
  })

  const fetchRoadmap = async () => {
    setLoadingRoadmap(true)
    try {
      const res = await roadmapAPI.getLatest()
      setRoadmap(res.data.roadmap)
    } catch {
      toast.error('Failed to load roadmap')
    } finally {
      setLoadingRoadmap(false)
    }
  }

  const fetchRoadmaps = async () => {
    setLoadingHistory(true)
    try {
      const res = await roadmapAPI.list()
      setRoadmaps(res.data.roadmaps || [])
    } catch {
      // silent
    } finally {
      setLoadingHistory(false)
    }
  }

  const loadRoadmap = async (id) => {
    try {
      const res = await roadmapAPI.getOne(id)
      setRoadmap(res.data.roadmap)
      setPartialRoadmap(null)
      setShowHistory(false)
    } catch {
      toast.error('Failed to load roadmap')
    }
  }

  useEffect(() => {
    fetchRoadmap()
    fetchRoadmaps()
  }, [])

  const handleCreateRoadmap = async (e) => {
    e.preventDefault()
    setGenerating(true)
    setPartialRoadmap(null)
    setRoadmap(null)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/roadmaps/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...roadmapForm,
          hoursPerDay: Number(roadmapForm.hoursPerDay),
          durationWeeks: Number(roadmapForm.durationWeeks),
        }),
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let chunkBuf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        chunkBuf += decoder.decode(value, { stream: true })
        const lines = chunkBuf.split('\n')
        chunkBuf = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.type === 'progress') {
              setPartialRoadmap({
                title: data.title || 'Study Roadmap',
                summary: data.summary || '',
                plan: (data.plan || []).map((w) => ({
                  weekNumber: w.weekNumber,
                  theme: w.theme,
                  focus: w.focus,
                  tasks: (w.tasks || []).map((t) => ({
                    day: t.day,
                    title: t.title,
                    details: t.details,
                  })),
                })),
              })
            } else if (data.type === 'done') {
              setRoadmap(data.roadmap)
              setPartialRoadmap(null)
              setGenerating(false)
              toast.success('Roadmap generated')
              fetchRoadmaps()
            } else if (data.type === 'error') {
              toast.error(data.message)
              setGenerating(false)
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
    } catch (err) {
      toast.error('Failed to generate roadmap')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-teal-400">Personal AI Study Roadmap</p>
        <h1 className="text-2xl font-bold text-slate-100 mt-1">Build a study plan</h1>
        <p className="text-sm text-slate-400 mt-1 max-w-lg">
          Tell us your goal, schedule, and background. The AI creates a week-by-week roadmap.
        </p>
      </div>

      <form onSubmit={handleCreateRoadmap} className="space-y-4">
        {/* Goal */}
        <div className="surface rounded-xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-400 mb-3">Goal</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs font-medium text-slate-400 mb-1">Target role</span>
              <input
                type="text"
                placeholder="e.g. Frontend Developer"
                value={roadmapForm.targetRole}
                onChange={(e) => setRoadmapForm((prev) => ({ ...prev, targetRole: e.target.value }))}
                className="input-base"
                required
                disabled={generating}
              />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-400 mb-1">Current level</span>
              <select
                value={roadmapForm.currentLevel}
                onChange={(e) => setRoadmapForm((prev) => ({ ...prev, currentLevel: e.target.value }))}
                className="input-base"
                disabled={generating}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="revision">Revision</option>
              </select>
            </label>
          </div>
        </div>

        {/* Schedule */}
        <div className="surface rounded-xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-400 mb-3">Schedule</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="block">
              <span className="block text-xs font-medium text-slate-400 mb-1">Hours / day</span>
              <input
                type="number"
                min="1"
                placeholder="2"
                value={roadmapForm.hoursPerDay}
                onChange={(e) => setRoadmapForm((prev) => ({ ...prev, hoursPerDay: e.target.value }))}
                className="input-base"
                required
                disabled={generating}
              />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-400 mb-1">Duration (weeks)</span>
              <input
                type="number"
                min="1"
                placeholder="4"
                value={roadmapForm.durationWeeks}
                onChange={(e) => setRoadmapForm((prev) => ({ ...prev, durationWeeks: e.target.value }))}
                className="input-base"
                required
                disabled={generating}
              />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-400 mb-1">Target date</span>
              <input
                type="date"
                value={roadmapForm.targetDate}
                onChange={(e) => setRoadmapForm((prev) => ({ ...prev, targetDate: e.target.value }))}
                className="input-base"
                disabled={generating}
              />
            </label>
          </div>
        </div>

        {/* Topics */}
        <div className="surface rounded-xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-400 mb-3">Topics</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs font-medium text-slate-400 mb-1">Already known</span>
              <textarea
                rows="3"
                placeholder="HTML, CSS, JavaScript basics"
                value={roadmapForm.knownTopics}
                onChange={(e) => setRoadmapForm((prev) => ({ ...prev, knownTopics: e.target.value }))}
                className="input-base resize-none"
                disabled={generating}
              />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-400 mb-1">Need to improve</span>
              <textarea
                rows="3"
                placeholder="React hooks, async/await, Node.js APIs"
                value={roadmapForm.weakTopics}
                onChange={(e) => setRoadmapForm((prev) => ({ ...prev, weakTopics: e.target.value }))}
                className="input-base resize-none"
                disabled={generating}
              />
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="submit"
            disabled={generating}
            className="button-primary"
          >
            {generating ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating...
              </>
            ) : (
              'Generate roadmap'
            )}
          </button>
        </div>
      </form>

      {/* Output */}
      <div className="mt-6">
        {loadingRoadmap ? (
          <RoadmapSkeleton />
        ) : generating ? (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <p className="text-sm font-medium text-slate-300">AI is building your roadmap...</p>
            </div>
            {partialRoadmap ? (
              <RoadmapView roadmap={partialRoadmap} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="surface rounded-xl p-5">
                    <Skeleton height={14} width="40%" className="mb-2" containerClassName="block" />
                    <Skeleton height={20} width="70%" className="mb-3" containerClassName="block" />
                    <div className="space-y-2">
                      <Skeleton height={48} containerClassName="block" />
                      <Skeleton height={48} containerClassName="block" />
                      <Skeleton height={48} containerClassName="block" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : roadmap ? (
          <RoadmapView roadmap={roadmap} />
        ) : (
          <div className="text-sm text-slate-500 border border-dashed border-white/10 rounded-xl p-6 bg-white/5 text-center">
            No roadmap generated yet. Fill the form above to create your personal learning roadmap.
          </div>
        )}
      </div>

      {/* Past roadmaps */}
      {roadmaps.length > 1 && (
        <div className="mt-6">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showHistory ? 'rotate-90' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            Past roadmaps ({roadmaps.length - 1})
          </button>

          {showHistory && (
            <div className="mt-3 space-y-2">
              {loadingHistory ? (
                <p className="text-sm text-slate-500">Loading...</p>
              ) : (
                roadmaps
                  .filter((r) => r._id !== roadmap?._id)
                  .map((r) => (
                    <button
                      key={r._id}
                      onClick={() => loadRoadmap(r._id)}
                      className="w-full text-left surface rounded-xl p-4 transition hover:bg-white/[0.07]"
                    >
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-200 truncate">
                            {r.title || `${r.targetRole} study roadmap`}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {r.targetRole} &middot; {r.durationWeeks} weeks &middot;{' '}
                            {new Date(r.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-xs text-teal-400 whitespace-nowrap">Load &rarr;</span>
                      </div>
                    </button>
                  ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
