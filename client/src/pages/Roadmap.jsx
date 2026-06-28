import { useEffect, useState } from 'react'
import { roadmapAPI } from '../services/api'
import Skeleton from 'react-loading-skeleton'
import toast from 'react-hot-toast'

export default function Roadmap() {
  const [roadmap, setRoadmap] = useState(null)
  const [loadingRoadmap, setLoadingRoadmap] = useState(true)
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

  useEffect(() => {
    fetchRoadmap()
  }, [])

  const handleCreateRoadmap = async (e) => {
    e.preventDefault()
    try {
      const res = await roadmapAPI.create({
        ...roadmapForm,
        hoursPerDay: Number(roadmapForm.hoursPerDay),
        durationWeeks: Number(roadmapForm.durationWeeks),
      })
      setRoadmap(res.data.roadmap)
      toast.success('Roadmap generated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate roadmap')
    }
  }

  const roadmapTasks = roadmap?.plan?.flatMap((week) => week.tasks || []) || []
  const completedRoadmapTasks = roadmap?.progress?.completedTasks || 0
  const totalRoadmapTasks = roadmap?.progress?.totalTasks || roadmapTasks.length
  const roadmapProgress = totalRoadmapTasks > 0 ? Math.round((completedRoadmapTasks / totalRoadmapTasks) * 100) : 0

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
        <div className="flex items-start justify-between gap-6 flex-col lg:flex-row">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Personal AI Study Roadmap</p>
            <h1 className="text-2xl font-bold mt-1">Build a study plan that fits your goal</h1>
            <p className="text-sm text-gray-500 mt-2">
              Tell us what role you want, how much time you can study, and which topics you already know.
              The AI will turn it into a clear week-by-week roadmap.
            </p>
          </div>
          <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 text-sm text-indigo-900 w-full lg:max-w-sm">
            <p className="font-semibold">How to fill it</p>
            <p className="mt-1 text-indigo-900/80">
              Example: target role = <span className="font-medium">Frontend Developer</span>, level = <span className="font-medium">Beginner</span>,
              hours/day = <span className="font-medium">2</span>, duration = <span className="font-medium">4 weeks</span>.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateRoadmap} className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">Target role</span>
              <input
                type="text"
                placeholder="e.g. Frontend Developer, Backend Developer, AI Beginner"
                value={roadmapForm.targetRole}
                onChange={(e) => setRoadmapForm((prev) => ({ ...prev, targetRole: e.target.value }))}
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                required
              />
              <span className="block text-xs text-gray-400 mt-1">Choose the job or learning direction you want to prepare for.</span>
            </label>

            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">Your current level</span>
              <select
                value={roadmapForm.currentLevel}
                onChange={(e) => setRoadmapForm((prev) => ({ ...prev, currentLevel: e.target.value }))}
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 outline-none bg-white"
              >
                <option value="beginner">Beginner - starting from basics</option>
                <option value="intermediate">Intermediate - already know the fundamentals</option>
                <option value="revision">Revision - want to review before interview</option>
              </select>
              <span className="block text-xs text-gray-400 mt-1">This helps the AI set the right difficulty level.</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">Study time per day</span>
              <input
                type="number"
                min="1"
                placeholder="e.g. 2"
                value={roadmapForm.hoursPerDay}
                onChange={(e) => setRoadmapForm((prev) => ({ ...prev, hoursPerDay: e.target.value }))}
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                required
              />
              <span className="block text-xs text-gray-400 mt-1">How many hours can you study daily?</span>
            </label>

            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">Roadmap length in weeks</span>
              <input
                type="number"
                min="1"
                placeholder="e.g. 4"
                value={roadmapForm.durationWeeks}
                onChange={(e) => setRoadmapForm((prev) => ({ ...prev, durationWeeks: e.target.value }))}
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                required
              />
              <span className="block text-xs text-gray-400 mt-1">Use 2, 4, 6, or 8 weeks depending on your target date.</span>
            </label>

            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">Target interview date</span>
              <input
                type="date"
                value={roadmapForm.targetDate}
                onChange={(e) => setRoadmapForm((prev) => ({ ...prev, targetDate: e.target.value }))}
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
              />
              <span className="block text-xs text-gray-400 mt-1">Optional, but useful for a more realistic plan.</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">Topics you already know</span>
              <textarea
                rows="4"
                placeholder="e.g. HTML, CSS, JavaScript basics"
                value={roadmapForm.knownTopics}
                onChange={(e) => setRoadmapForm((prev) => ({ ...prev, knownTopics: e.target.value }))}
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 outline-none resize-none"
              />
              <span className="block text-xs text-gray-400 mt-1">Write topics separated by commas so the AI can avoid repeating basics.</span>
            </label>

            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">Topics you want to improve</span>
              <textarea
                rows="4"
                placeholder="e.g. React hooks, async/await, Node.js APIs"
                value={roadmapForm.weakTopics}
                onChange={(e) => setRoadmapForm((prev) => ({ ...prev, weakTopics: e.target.value }))}
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 outline-none resize-none"
              />
              <span className="block text-xs text-gray-400 mt-1">These topics will get extra focus in the roadmap.</span>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
            <p className="text-xs text-gray-400">
              You can regenerate the roadmap anytime if your goal or schedule changes.
            </p>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
            >
              Generate roadmap
            </button>
          </div>
        </form>

        <div className="mt-6">
          {loadingRoadmap ? (
            <div className="space-y-3">
              <Skeleton height={24} width="35%" />
              <Skeleton height={14} width="60%" />
              <Skeleton height={18} width="100%" />
            </div>
          ) : roadmap ? (
            <div>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="text-lg font-bold">{roadmap.title}</h3>
                  <p className="text-sm text-gray-500">{roadmap.summary || 'Your personalized roadmap is ready.'}</p>
                </div>
                <div className="text-sm text-gray-500">
                  <span className="font-semibold text-gray-700">{roadmapProgress}%</span> complete
                </div>
              </div>
              <div className="mt-3 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all"
                  style={{ width: `${roadmapProgress}%` }}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-5">
                {roadmap.plan.map((week) => (
                  <div key={week.weekNumber} className="border rounded-xl p-4 bg-gray-50">
                    <p className="text-xs font-semibold text-indigo-600 uppercase">Week {week.weekNumber}</p>
                    <h4 className="font-bold mt-1">{week.theme}</h4>
                    {week.focus && <p className="text-sm text-gray-500 mt-1">{week.focus}</p>}
                    <ul className="mt-3 space-y-2">
                      {week.tasks.map((task, index) => (
                        <li key={`${week.weekNumber}-${index}`} className="text-sm bg-white border rounded-lg p-3">
                          <p className="font-medium text-gray-800">{task.day}: {task.title}</p>
                          {task.details && <p className="text-gray-500 text-xs mt-1">{task.details}</p>}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500 border border-dashed rounded-xl p-4 bg-gray-50">
              No roadmap generated yet. Fill the form above to create your personal learning roadmap.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}