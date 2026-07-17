import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { checkRoomMember } from '../middleware/rbac.js'
import { upload, uploadFile, getFiles, deleteFile, downloadFile } from '../controllers/fileController.js'

const router = Router()

router.use(protect)
router.get('/download', downloadFile)
router.post('/:roomId/upload', checkRoomMember, upload.single('file'), uploadFile)
router.get('/:roomId', checkRoomMember, getFiles)
router.delete('/:id', deleteFile)

export default router
