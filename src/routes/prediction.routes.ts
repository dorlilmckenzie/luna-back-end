import { Router } from 'express';
import * as predictionController from '../controllers/prediction.controller';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(predictionController.get));
router.get('/next-period', asyncHandler(predictionController.nextPeriod));
router.get('/fertile-window', asyncHandler(predictionController.fertileWindow));
router.get('/calendar', asyncHandler(predictionController.calendarOverlay));

export default router;
