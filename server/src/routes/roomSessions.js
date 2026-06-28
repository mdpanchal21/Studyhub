import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { checkRoomMember } from '../middleware/rbac.js'
import {
  getActiveSession, startSession, joinSession, leaveSession, endSession,
} from '../controllers/roomSessionController.js'

const router = Router()

router.use(protect)
router.use('/:roomId', checkRoomMember)
router.get('/:roomId/active-session', getActiveSession)
router.post('/:roomId/sessions/start', startSession)
router.post('/:roomId/sessions/join', joinSession)
router.post('/:roomId/sessions/leave', leaveSession)
router.post('/:roomId/sessions/end', endSession)

export default router
