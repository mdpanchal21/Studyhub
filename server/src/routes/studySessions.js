import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { startSession, endSession, getSessions } from '../controllers/studySessionController.js'

const router = Router()

router.use(protect)
router.get('/', getSessions)
router.post('/:roomId/start', startSession)
router.patch('/:id/end', endSession)

export default router
