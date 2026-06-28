import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { checkRoomMember, checkDoubtRoomMember } from '../middleware/rbac.js'
import { createDoubt, getDoubts, resolveDoubt, retryDoubt } from '../controllers/doubtController.js'

const router = Router()

router.use(protect)
router.get('/:roomId', checkRoomMember, getDoubts)
router.post('/:roomId', checkRoomMember, createDoubt)
router.patch('/:id/resolve', checkDoubtRoomMember, resolveDoubt)
router.post('/:id/retry', checkDoubtRoomMember, retryDoubt)

export default router
