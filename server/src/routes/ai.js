import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { askAI, explainDoubt, generateQuiz } from '../controllers/aiController.js'

const router = Router()

router.use(protect)
router.post('/ask', askAI)
router.post('/explain/:id', explainDoubt)
router.post('/quiz', generateQuiz)

export default router
