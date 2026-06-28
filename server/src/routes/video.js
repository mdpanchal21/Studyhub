import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { checkRoomMember } from '../middleware/rbac.js'
import { startVideoCall, endVideoCall, getActiveVideoCall } from '../controllers/videoController.js'

const router = Router()

router.use(protect)
router.use('/:roomId', checkRoomMember)

router.get('/:roomId/video/active', getActiveVideoCall)
router.post('/:roomId/video/start', startVideoCall)
router.post('/:roomId/video/end', endVideoCall)

export default router
