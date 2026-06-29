import Roadmap from '../models/Roadmap.js'
import { getAIResponse, getAIResponseStream } from '../config/ai.js'

const parseList = (value) => {
  if (!value) return []
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

const extractJson = (text) => {
  const cleaned = text.replace(/```json|```/g, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('AI response was not valid JSON')
  }
  return JSON.parse(cleaned.slice(start, end + 1))
}

const countTasks = (plan = []) => plan.reduce((total, week) => total + (week.tasks?.length || 0), 0)

const tryParsePartialJson = (text) => {
  try {
    return JSON.parse(text)
  } catch {
    let cleaned = text
      .replace(/,\s*([\]}])/g, '$1')
      .replace(/([{,])\s*$/gm, '$1')
      .trim()
    const opens = (cleaned.match(/\{/g) || []).length
    const closes = (cleaned.match(/\}/g) || []).length
    const openB = (cleaned.match(/\[/g) || []).length
    const closeB = (cleaned.match(/\]/g) || []).length
    for (let i = closes; i < opens; i++) cleaned += '}'
    for (let i = closeB; i < openB; i++) cleaned += ']'
    if (opens === 0 && openB === 0) return null
    try {
      const parsed = JSON.parse(cleaned)
      return parsed && typeof parsed === 'object' ? parsed : null
    } catch {
      return null
    }
  }
}

const isAiFailureMessage = (text = '') => {
  return [
    'AI not configured',
    'AI service is unavailable',
    'invalid authentication credentials',
    'Request had invalid authentication credentials',
    'ACCESS_TOKEN_TYPE_UNSUPPORTED',
  ].some((fragment) => text.includes(fragment))
}

export const getLatestRoadmap = async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({ user: req.user._id })
      .sort({ updatedAt: -1 })

    res.json({ roadmap })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const listRoadmaps = async (req, res) => {
  try {
    const roadmaps = await Roadmap.find({ user: req.user._id })
      .select('-plan')
      .sort({ createdAt: -1 })
    res.json({ roadmaps })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getRoadmapById = async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({
      _id: req.params.id,
      user: req.user._id,
    })
    if (!roadmap) {
      return res.status(404).json({ message: 'Roadmap not found' })
    }
    res.json({ roadmap })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const generateRoadmapStream = async (req, res) => {
  try {
    const {
      targetRole,
      currentLevel,
      hoursPerDay,
      durationWeeks,
      targetDate,
      knownTopics,
      weakTopics,
    } = req.body

    if (!targetRole || !currentLevel || !hoursPerDay || !durationWeeks) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Missing required roadmap fields' })}\n\n`)
      return res.end()
    }

    const normalizedKnownTopics = Array.isArray(knownTopics) ? knownTopics : parseList(knownTopics)
    const normalizedWeakTopics = Array.isArray(weakTopics) ? weakTopics : parseList(weakTopics)

    const prompt = `You are creating a personal AI study roadmap for a fresher preparing for interviews.
Return ONLY valid JSON in this shape:
{
  "title": "string",
  "summary": "string",
  "plan": [
    {
      "weekNumber": 1,
      "theme": "string",
      "focus": "string",
      "tasks": [
        { "day": "Monday", "title": "string", "details": "string" }
      ]
    }
  ]
}

User goal: ${targetRole}
Current level: ${currentLevel}
Hours per day: ${hoursPerDay}
Duration in weeks: ${durationWeeks}
Target date: ${targetDate || 'not provided'}
Known topics: ${normalizedKnownTopics.join(', ') || 'none'}
Weak topics: ${normalizedWeakTopics.join(', ') || 'none'}

Make the roadmap practical, beginner-friendly, and interview-focused.`

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')

    let fullText = ''
    let lastWeekCount = 0

    res.write(`data: ${JSON.stringify({ type: 'started' })}\n\n`)

    await getAIResponseStream(prompt, (chunk) => {
      fullText += chunk

      const partial = tryParsePartialJson(fullText)
      if (partial && partial.plan && partial.plan.length > lastWeekCount) {
        lastWeekCount = partial.plan.length
        const plan = partial.plan.slice(0, lastWeekCount).map((w, i) => ({
          weekNumber: Number(w.weekNumber || i + 1),
          theme: w.theme || `Week ${i + 1}`,
          focus: w.focus || '',
          tasks: (w.tasks || []).map((t) => ({
            day: t.day || '',
            title: t.title || '',
            details: t.details || '',
          })),
        }))
        res.write(`data: ${JSON.stringify({
          type: 'progress',
          title: partial.title || '',
          summary: partial.summary || '',
          plan,
        })}\n\n`)
      }
    })

    if (isAiFailureMessage(fullText)) {
      res.write(`data: ${JSON.stringify({
        type: 'error',
        message: 'AI roadmap generation is unavailable right now. Please check the GEMINI_API_KEY in .env and try again.',
      })}\n\n`)
      res.end()
      return
    }

    let parsed
    try {
      parsed = extractJson(fullText)
    } catch {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Could not parse AI response. The model did not return valid JSON.' })}\n\n`)
      res.end()
      return
    }

    const plan = Array.isArray(parsed.plan) ? parsed.plan : []
    const roadmap = await Roadmap.create({
      user: req.user._id,
      title: parsed.title || `${targetRole} study roadmap`,
      targetRole,
      currentLevel,
      hoursPerDay: Number(hoursPerDay),
      durationWeeks: Number(durationWeeks),
      targetDate: targetDate ? new Date(targetDate) : null,
      knownTopics: normalizedKnownTopics,
      weakTopics: normalizedWeakTopics,
      plan: plan.map((week, index) => ({
        weekNumber: Number(week.weekNumber || index + 1),
        theme: week.theme || `Week ${index + 1}`,
        focus: week.focus || '',
        tasks: (week.tasks || []).map((task) => ({
          day: task.day || '',
          title: task.title || '',
          details: task.details || '',
          completed: false,
        })),
      })),
      summary: parsed.summary || '',
      progress: {
        completedTasks: 0,
        totalTasks: countTasks(plan),
      },
    })

    res.write(`data: ${JSON.stringify({ type: 'done', roadmap })}\n\n`)
    res.end()
  } catch (error) {
    console.error('Roadmap stream error:', error)
    res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`)
    res.end()
  }
}

export const createRoadmap = async (req, res) => {
  try {
    const {
      targetRole,
      currentLevel,
      hoursPerDay,
      durationWeeks,
      targetDate,
      knownTopics,
      weakTopics,
    } = req.body

    if (!targetRole || !currentLevel || !hoursPerDay || !durationWeeks) {
      return res.status(400).json({ message: 'Missing required roadmap fields' })
    }

    const normalizedKnownTopics = Array.isArray(knownTopics) ? knownTopics : parseList(knownTopics)
    const normalizedWeakTopics = Array.isArray(weakTopics) ? weakTopics : parseList(weakTopics)

    const prompt = `You are creating a personal AI study roadmap for a fresher preparing for interviews.
Return ONLY valid JSON in this shape:
{
  "title": "string",
  "summary": "string",
  "plan": [
    {
      "weekNumber": 1,
      "theme": "string",
      "focus": "string",
      "tasks": [
        { "day": "Monday", "title": "string", "details": "string" }
      ]
    }
  ]
}

User goal: ${targetRole}
Current level: ${currentLevel}
Hours per day: ${hoursPerDay}
Duration in weeks: ${durationWeeks}
Target date: ${targetDate || 'not provided'}
Known topics: ${normalizedKnownTopics.join(', ') || 'none'}
Weak topics: ${normalizedWeakTopics.join(', ') || 'none'}

Make the roadmap practical, beginner-friendly, and interview-focused.`

    const result = await getAIResponse(prompt)
    const aiText = result.text || ''

    if (isAiFailureMessage(aiText)) {
      return res.status(503).json({
        message: 'AI roadmap generation is unavailable right now. Please check the GEMINI_API_KEY in .env and try again.',
      })
    }

    let parsed
    try {
      parsed = extractJson(aiText)
    } catch {
      return res.status(500).json({
        message: 'Could not parse AI roadmap response. The model did not return valid JSON.',
      })
    }

    const plan = Array.isArray(parsed.plan) ? parsed.plan : []
    const roadmap = await Roadmap.create({
      user: req.user._id,
      title: parsed.title || `${targetRole} study roadmap`,
      targetRole,
      currentLevel,
      hoursPerDay: Number(hoursPerDay),
      durationWeeks: Number(durationWeeks),
      targetDate: targetDate ? new Date(targetDate) : null,
      knownTopics: normalizedKnownTopics,
      weakTopics: normalizedWeakTopics,
      plan: plan.map((week, index) => ({
        weekNumber: Number(week.weekNumber || index + 1),
        theme: week.theme || `Week ${index + 1}`,
        focus: week.focus || '',
        tasks: (week.tasks || []).map((task) => ({
          day: task.day || '',
          title: task.title || '',
          details: task.details || '',
          completed: false,
        })),
      })),
      summary: parsed.summary || '',
      progress: {
        completedTasks: 0,
        totalTasks: countTasks(plan),
      },
    })

    res.status(201).json({ roadmap })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}