import { Router } from 'express';
import {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  getAvailableVehicles,
  getVehicleByPlate
} from '../controllers/vehicleController';
import { validateBody } from '../middleware/validation';
import { authenticateToken, requireRole } from '../middleware/auth';
import { createVehicleSchema, updateVehicleSchema } from '../utils/validations';


const router = Router();

/**
 * @route GET /api/vehicles
 * @desc Get all vehicles with pagination and filters
 * @access Private
 */
router.get('/', authenticateToken, getVehicles);

/**
 * @route GET /api/vehicles/available
 * @desc Get available vehicles (active status, no assigned worker)
 * @access Private
 */
router.get('/available', authenticateToken, getAvailableVehicles);
/**
 * @route GET /api/vehicles/plate/:licensePlate
 * @desc Get vehicle by license plate
 * @access Private (worker, supervisor, admin)
 */
router.get('/plate/:licensePlate', authenticateToken, getVehicleByPlate);
/**
 * @route GET /api/vehicles/:id
 * @desc Get vehicle by ID
 * @access Private
 */
router.get('/:id', authenticateToken, getVehicleById);


/**
 * @route POST /api/vehicles
 * @desc Create new vehicle
 * @access Admin and Supervisor only
 */
router.post('/', authenticateToken, requireRole(['admin', 'supervisor']), validateBody(createVehicleSchema), createVehicle);

/**
 * @route PUT /api/vehicles/:id
 * @desc Update vehicle
 * @access Admin and Supervisor only
 */
router.put('/:id', authenticateToken, requireRole(['admin', 'supervisor']), validateBody(updateVehicleSchema), updateVehicle);

/**
 * @route DELETE /api/vehicles/:id
 * @desc Delete vehicle
 * @access Admin only
 */
router.delete('/:id', authenticateToken, requireRole(['admin']), deleteVehicle);

export default router;