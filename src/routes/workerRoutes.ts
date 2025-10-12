import { Router } from 'express';
import {
  createWorker,
  getWorkers,
  getWorkerById,
  updateWorker,
  deleteWorker,
  getAvailableWorkers
} from '../controllers/workerController';
import { validateBody } from '../middleware/validation';
import { authenticateToken, requireRole } from '../middleware/auth';
import { createWorkerSchema, updateWorkerSchema } from '../utils/validations';

const router = Router();

/**
 * @route GET /api/workers
 * @desc Get all workers with pagination and filters
 * @access Admin and Supervisor only
 */
router.get('/', authenticateToken, requireRole(['admin', 'supervisor']), getWorkers);

/**
 * @route GET /api/workers/available
 * @desc Get available workers (active status)
 * @access Private
 */
router.get('/available', authenticateToken, getAvailableWorkers);

/**
 * @route GET /api/workers/:id
 * @desc Get worker by ID
 * @access Admin and Supervisor only, or own profile
 */
router.get('/:id', authenticateToken, getWorkerById);

/**
 * @route POST /api/workers
 * @desc Create new worker
 * @access Admin only
 */
router.post('/', authenticateToken, requireRole(['admin']), validateBody(createWorkerSchema), createWorker);

/**
 * @route PUT /api/workers/:id
 * @desc Update worker
 * @access Admin only, or own profile for basic fields
 */
router.put('/:id', authenticateToken, validateBody(updateWorkerSchema), updateWorker);

/**
 * @route DELETE /api/workers/:id
 * @desc Delete worker
 * @access Admin only
 */
router.delete('/:id', authenticateToken, requireRole(['admin']), deleteWorker);

export default router;