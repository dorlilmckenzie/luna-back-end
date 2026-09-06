import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  changePasswordSchema,
  deleteAccountSchema,
  updateProfileSchema,
} from '../validators/user.validators';

const router = Router();
router.use(requireAuth);

router.get('/me', asyncHandler(userController.getMe));
router.patch('/me', validate({ body: updateProfileSchema }), asyncHandler(userController.updateMe));
router.patch(
  '/me/password',
  validate({ body: changePasswordSchema }),
  asyncHandler(userController.changePassword),
);
router.delete(
  '/me',
  validate({ body: deleteAccountSchema }),
  asyncHandler(userController.deleteMe),
);

export default router;
