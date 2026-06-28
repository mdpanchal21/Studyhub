import Roadmap from '../models/Roadmap.js'
import { getAIResponse } from '../config/ai.js'

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