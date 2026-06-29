import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { createRoadmap, getLatestRoadmap, generateRoadmapStream, listRoadmaps, getRoadmapById } from '../controllers/roadmapController.js'

const router = Router()

router.use(protect)
router.get('/', listRoadmaps)
router.get('/latest', getLatestRoadmap)
router.get('/:id', getRoadmapById)
router.post('/generate', generateRoadmapStream)
router.post('/', createRoadmap)

export default router