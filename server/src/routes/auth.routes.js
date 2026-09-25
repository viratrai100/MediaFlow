import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authRateLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

// POST /api/v1/auth/signup (Rate-limited)
router.post('/signup', authRateLimiter, AuthController.signup);

// POST /api/v1/auth/login (Rate-limited against brute-force)
router.post('/login', authRateLimiter, AuthController.login);

// POST /api/v1/auth/logout (Protected)
router.post('/logout', authenticate, AuthController.logout);

// GET /api/v1/auth/me (Protected)
router.get('/me', authenticate, AuthController.getCurrentUser);

export default router;

