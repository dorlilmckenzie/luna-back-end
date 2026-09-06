import { Router } from 'express';
import * as symptomController from '../controllers/symptom.controller';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { idParamSchema } from '../validators/period.validators';
import {
  createSymptomSchema,
  listSymptomsQuerySchema,
  updateSymptomSchema,
} from '../validators/symptom.validators';

const router = Router();
router.use(requireAuth);

router.get('/', validate({ query: listSymptomsQuerySchema }), asyncHandler(symptomController.list));
router.post('/', validate({ body: createSymptomSchema }), asyncHandler(symptomController.create));
router.patch(
  '/:id',
  validate({ params: idParamSchema, body: updateSymptomSchema }),
  asyncHandler(symptomController.update),
);
router.delete('/:id', validate({ params: idParamSchema }), asyncHandler(symptomController.remove));

export default router;
