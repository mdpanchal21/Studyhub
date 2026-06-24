import { GoogleGenerativeAI } from '@google/generative-ai'

let genAI = null

export const initAI = () => {
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  }
}

export const getAIResponse = async (prompt) => {
  if (!genAI) {
    return { text: 'AI not configured. Set GEMINI_API_KEY in .env' }
  }
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent(prompt)
    return { text: result.response.text() }
  } catch (error) {
    console.error('AI error:', error.message)
    return { text: 'Sorry, AI service is unavailable right now.' }
  }
}

export const getAIResponseStream = async (prompt, onChunk) => {
  if (!genAI) {
    throw new Error('AI not configured. Set GEMINI_API_KEY in .env')
  }
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContentStream(prompt)
    let fullText = ''
    for await (const chunk of result.stream) {
      const text = chunk.text()
      fullText += text
      onChunk?.(text)
    }
    return { text: fullText }
  } catch (error) {
    console.error('AI stream error:', error.message)
    throw error
  }
}
