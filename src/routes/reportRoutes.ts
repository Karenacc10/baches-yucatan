import { Router } from 'express';
import {
  createReport,
  getReports,
  getReportById,
  updateReport,
  deleteReport,
  getReportsByLocation
} from '../controllers/reportController';
import { validateBody } from '../middleware/validation';
import { authenticateToken, requireRole } from '../middleware/auth';
import { createReportSchema, updateReportSchema } from '../utils/validations';

const router = Router();

/**
 * @route GET /api/reports
 * @desc Get all reports with pagination and filters
 * @access Private
 */
router.get('/', authenticateToken, getReports);

/**
 * @route GET /api/reports/location
 * @desc Get reports by location (within radius)
 * @access Private
 */
router.get('/location', authenticateToken, getReportsByLocation);

/**
 * @route GET /api/reports/:id
 * @desc Get report by ID
 * @access Private
 */
router.get('/:id', authenticateToken, getReportById);

/**
 * @route POST /api/reports
 * @desc Create new report
 * @access Private
 */
router.post('/', authenticateToken, validateBody(createReportSchema), createReport);

/**
 * @route PUT /api/reports/:id
 * @desc Update report
 * @access Private - Workers can update, Supervisors and Admins can update any
 */
router.put('/:id', authenticateToken, validateBody(updateReportSchema), updateReport);

/**
 * @route DELETE /api/reports/:id
 * @desc Delete report
 * @access Admin and Supervisor only
 */
router.delete('/:id', authenticateToken, requireRole(['admin', 'supervisor']), deleteReport);

export default router;