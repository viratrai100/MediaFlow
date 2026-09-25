import { Router } from 'express';
import { JobController } from '../controllers/jobController.js';
import { validateUrl } from '../middlewares/validateUrl.js';
import { optionalAuthenticate } from '../middlewares/authMiddleware.js';

const router = Router();

// Apply optional auth across all job routes so logged-in users get scoped by user ID, guests by IP
router.use(optionalAuthenticate);

// POST /api/v1/jobs - Enqueue download job
router.post('/', validateUrl, JobController.createJob);

// GET /api/v1/jobs - List user jobs with pagination & filters
router.get('/', JobController.listJobs);

// DELETE /api/v1/jobs - Clear user job history
router.delete('/', JobController.clearUserJobs);

// GET /api/v1/jobs/:id - Inspect specific job progress
router.get('/:id', JobController.getJobById);

// POST /api/v1/jobs/:id/cancel - Cancel active or queued job
router.post('/:id/cancel', JobController.cancelJob);

// DELETE /api/v1/jobs/:id - Delete individual job record
router.delete('/:id', JobController.deleteJob);

// GET /api/v1/jobs/:id/download - Stream download media file
router.get('/:id/download', JobController.downloadJobMedia);

export default router;
