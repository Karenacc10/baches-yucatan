import { Router } from 'express';
import { register, login, getProfile } from '../controllers/authController';
import { validateBody } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { createWorkerSchema, loginSchema } from '../utils/validations';

const router = Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new worker
 * @access Admin only (will be handled by middleware later)
 */
router.post('/register', validateBody(createWorkerSchema), register);

/**
 * @route POST /api/auth/login
 * @desc Login worker
 * @access Public
 */
router.post('/login', validateBody(loginSchema), login);

/**
 * @route GET /api/auth/profile
 * @desc Get current user profile
 * @access Private
 */
router.get('/profile', authenticateToken, getProfile);

export default router;