import { Router } from 'express';
import {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  getMyAssignments,
  getAssignmentStats
} from '../controllers/assignmentController';
import { validateBody } from '../middleware/validation';
import { authenticateToken, requireRole } from '../middleware/auth';
import { createAssignmentSchema, updateAssignmentSchema } from '../utils/validations';

const router = Router();

/**
 * @route GET /api/assignments
 * @desc Get all assignments with pagination and filters
 * @access Admin and Supervisor only
 */
router.get('/', authenticateToken, requireRole(['admin', 'supervisor']), getAssignments);

/**
 * @route GET /api/assignments/my
 * @desc Get current user's assignments
 * @access Private
 */
router.get('/my', authenticateToken, getMyAssignments);

/**
 * @route GET /api/assignments/stats
 * @desc Get assignment statistics
 * @access Admin and Supervisor only
 */
router.get('/stats', authenticateToken, requireRole(['admin', 'supervisor']), getAssignmentStats);

/**
 * @route GET /api/assignments/:id
 * @desc Get assignment by ID
 * @access Private
 */
router.get('/:id', authenticateToken, getAssignmentById);

/**
 * @route POST /api/assignments
 * @desc Create new assignment
 * @access Admin and Supervisor only
 */
router.post('/', authenticateToken, requireRole(['admin', 'supervisor']), validateBody(createAssignmentSchema), createAssignment);

/**
 * @route PUT /api/assignments/:id
 * @desc Update assignment
 * @access Admin and Supervisor can update any, Workers can update their own
 */
router.put('/:id', authenticateToken, validateBody(updateAssignmentSchema), updateAssignment);

/**
 * @route DELETE /api/assignments/:id
 * @desc Delete assignment
 * @access Admin and Supervisor only
 */
router.delete('/:id', authenticateToken, requireRole(['admin', 'supervisor']), deleteAssignment);

export default router;