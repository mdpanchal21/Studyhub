import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { createDoubt, getDoubts, resolveDoubt } from '../controllers/doubtController.js'

const router = Router()

router.use(protect)
router.get('/:roomId', getDoubts)
router.post('/:roomId', createDoubt)
router.patch('/:id/resolve', resolveDoubt)

export default router
