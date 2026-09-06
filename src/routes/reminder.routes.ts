import { Router } from 'express';
import * as reminderController from '../controllers/reminder.controller';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { updateReminderSchema } from '../validators/reminder.validators';

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(reminderController.get));
router.patch('/', validate({ body: updateReminderSchema }), asyncHandler(reminderController.update));

export default router;
