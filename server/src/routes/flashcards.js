import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import {
  createFlashcard, getFlashcards, generateFlashcards, deleteFlashcard,
} from '../controllers/flashcardController.js'

const router = Router()

router.use(protect)
router.get('/:roomId', getFlashcards)
router.post('/:roomId', createFlashcard)
router.post('/:roomId/generate', generateFlashcards)
router.delete('/:id', deleteFlashcard)

export default router
