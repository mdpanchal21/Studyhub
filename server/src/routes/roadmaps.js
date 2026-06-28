import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { createRoadmap, getLatestRoadmap } from '../controllers/roadmapController.js'

const router = Router()

router.use(protect)
router.get('/latest', getLatestRoadmap)
router.post('/', createRoadmap)

export default router