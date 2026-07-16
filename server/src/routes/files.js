import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { checkRoomMember } from '../middleware/rbac.js'
import { upload, uploadFile, getFiles, deleteFile } from '../controllers/fileController.js'

const router = Router()

router.use(protect)
router.post('/:roomId/upload', checkRoomMember, upload.single('file'), uploadFile)
router.get('/:roomId', checkRoomMember, getFiles)
router.delete('/:id', deleteFile)

export default router
