import { Router } from 'express';
import * as periodController from '../controllers/period.controller';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createPeriodSchema,
  idParamSchema,
  listPeriodsQuerySchema,
  updatePeriodSchema,
} from '../validators/period.validators';

const router = Router();
router.use(requireAuth);

router.get('/', validate({ query: listPeriodsQuerySchema }), asyncHandler(periodController.list));
router.get('/:id', validate({ params: idParamSchema }), asyncHandler(periodController.getById));
router.post('/', validate({ body: createPeriodSchema }), asyncHandler(periodController.create));
router.patch(
  '/:id',
  validate({ params: idParamSchema, body: updatePeriodSchema }),
  asyncHandler(periodController.update),
);
router.delete('/:id', validate({ params: idParamSchema }), asyncHandler(periodController.remove));

export default router;
