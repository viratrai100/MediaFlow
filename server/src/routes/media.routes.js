import { Router } from 'express';
import { getMediaInfo, streamMedia, listPlatforms } from '../controllers/mediaController.js';
import { validateUrl } from '../middlewares/validateUrl.js';
import { optionalAuthenticate } from '../middlewares/authMiddleware.js';
import { mediaRateLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

// GET /api/v1/media/platforms
router.get('/platforms', listPlatforms);

// POST /api/v1/media/info
router.post('/info', mediaRateLimiter, optionalAuthenticate, validateUrl, getMediaInfo);

// GET /api/v1/media/download
router.get('/download', mediaRateLimiter, optionalAuthenticate, validateUrl, streamMedia);

export default router;

