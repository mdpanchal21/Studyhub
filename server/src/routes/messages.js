import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { checkRoomMember } from '../middleware/rbac.js'
import { getMessages, sendMessage, deleteMessage } from '../controllers/messageController.js'

const router = Router()

router.use(protect)
router.use('/:roomId', checkRoomMember)
router.get('/:roomId', getMessages)
router.post('/:roomId', sendMessage)
router.delete('/:roomId/:id', deleteMessage)

export default router
