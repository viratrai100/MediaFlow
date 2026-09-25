import { Router } from 'express';
import healthRoutes from './health.routes.js';
import mediaRoutes from './media.routes.js';
import authRoutes from './auth.routes.js';
import jobRoutes from './job.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

// Sub-route bindings
router.use('/health', healthRoutes);
router.use('/media', mediaRoutes);
router.use('/auth', authRoutes);
router.use('/jobs', jobRoutes);
router.use('/admin', adminRoutes);

export default router;

