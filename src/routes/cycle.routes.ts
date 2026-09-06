import { Router } from 'express';
import * as cycleController from '../controllers/cycle.controller';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(cycleController.list));
router.get('/statistics', asyncHandler(cycleController.statistics));
router.get('/summary', asyncHandler(cycleController.summary));

export default router;
