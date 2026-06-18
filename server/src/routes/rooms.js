import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { checkRoomRole } from '../middleware/rbac.js'
import {
  createRoom, getRooms, getRoom, joinRoom, leaveRoom, deleteRoom,
} from '../controllers/roomController.js'

const router = Router()

router.use(protect)
router.post('/', createRoom)
router.get('/', getRooms)
router.get('/:id', getRoom)
router.post('/join', joinRoom)
router.post('/:id/leave', leaveRoom)
router.delete('/:id', deleteRoom)

export default router
