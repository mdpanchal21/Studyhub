import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { createDoubt, getDoubts, resolveDoubt, retryDoubt } from '../controllers/doubtController.js'

const router = Router()

router.use(protect)
router.get('/:roomId', getDoubts)
router.post('/:roomId', createDoubt)
router.patch('/:id/resolve', resolveDoubt)
router.post('/:id/retry', retryDoubt)

export default router
