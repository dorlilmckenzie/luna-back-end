import { Router } from 'express';
import * as moodController from '../controllers/mood.controller';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { idParamSchema } from '../validators/period.validators';
import {
  createMoodSchema,
  listMoodsQuerySchema,
  updateMoodSchema,
} from '../validators/mood.validators';

const router = Router();
router.use(requireAuth);

router.get('/', validate({ query: listMoodsQuerySchema }), asyncHandler(moodController.list));
router.post('/', validate({ body: createMoodSchema }), asyncHandler(moodController.create));
router.patch(
  '/:id',
  validate({ params: idParamSchema, body: updateMoodSchema }),
  asyncHandler(moodController.update),
);
router.delete('/:id', validate({ params: idParamSchema }), asyncHandler(moodController.remove));

export default router;
