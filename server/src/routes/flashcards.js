import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { checkRoomMember } from '../middleware/rbac.js'
import {
  createFlashcard, getFlashcards, generateFlashcards, deleteFlashcard,
} from '../controllers/flashcardController.js'

const router = Router()

router.use(protect)
router.get('/:roomId', checkRoomMember, getFlashcards)
router.post('/:roomId', checkRoomMember, createFlashcard)
router.post('/:roomId/generate', checkRoomMember, generateFlashcards)
router.delete('/:id', deleteFlashcard)

export default router
