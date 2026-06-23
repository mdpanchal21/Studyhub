import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { checkRoomRole } from '../middleware/rbac.js'
import {
  createRoom, getRooms, getRoom, getRoomByCode, joinRoom, leaveRoom, deleteRoom, kickMember,
  getPendingRequests, acceptJoinRequest, declineJoinRequest, deactivateRoom, getRoomHistory,
} from '../controllers/roomController.js'

const router = Router()

router.get('/by-code/:inviteCode', getRoomByCode)
router.use(protect)
router.post('/', createRoom)
router.get('/', getRooms)
router.get('/history', getRoomHistory)
router.get('/:id', getRoom)
router.post('/join', joinRoom)
router.post('/:id/leave', leaveRoom)
router.delete('/:id', deleteRoom)

router.get('/:id/requests', checkRoomRole('admin'), getPendingRequests)
router.post('/:id/requests/:userId/accept', checkRoomRole('admin'), acceptJoinRequest)
router.post('/:id/requests/:userId/decline', checkRoomRole('admin'), declineJoinRequest)
router.post('/:id/members/:userId/kick', checkRoomRole('admin'), kickMember)
router.post('/:id/deactivate', checkRoomRole('admin'), deactivateRoom)

export default router
