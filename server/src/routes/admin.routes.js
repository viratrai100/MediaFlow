import { Router } from 'express';
import { AdminController } from '../controllers/adminController.js';
import { authenticate, requireRole } from '../middlewares/authMiddleware.js';

const router = Router();

// Protect all admin routes with authentication and 'admin' role check
router.use(authenticate, requireRole('admin'));

// System statistics
router.get('/stats', AdminController.getSystemStats);

// User management
router.get('/users', AdminController.listUsers);
router.patch('/users/:id', AdminController.updateUser);

// System-wide job monitor & force cancellation
router.get('/jobs', AdminController.listAllJobs);
router.post('/jobs/:id/cancel', AdminController.forceCancelJob);

// Platform configuration management
router.get('/platforms', AdminController.listPlatforms);
router.patch('/platforms/:platform', AdminController.updatePlatform);

// Audit logs
router.get('/audit-logs', AdminController.listAuditLogs);

// Global settings
router.get('/settings', AdminController.getSettings);
router.put('/settings', AdminController.updateSettings);

// Maintenance
router.post('/maintenance/gc', AdminController.triggerGarbageCollection);

export default router;
