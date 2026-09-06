import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import periodRoutes from './period.routes';
import symptomRoutes from './symptom.routes';
import moodRoutes from './mood.routes';
import cycleRoutes from './cycle.routes';
import predictionRoutes from './prediction.routes';
import reminderRoutes from './reminder.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', time: new Date().toISOString() } });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/periods', periodRoutes);
router.use('/symptoms', symptomRoutes);
router.use('/moods', moodRoutes);
router.use('/cycles', cycleRoutes);
router.use('/predictions', predictionRoutes);
router.use('/reminders', reminderRoutes);

export default router;
