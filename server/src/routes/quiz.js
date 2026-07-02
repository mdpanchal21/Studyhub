import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { saveQuiz, getQuizzes, getQuiz } from '../controllers/quizController.js'

const router = Router()

router.use(protect)
router.post('/', saveQuiz)
router.get('/', getQuizzes)
router.get('/:id', getQuiz)

export default router
