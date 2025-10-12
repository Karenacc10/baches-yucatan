import { Router } from 'express';
import authRoutes from './authRoutes';
import reportRoutes from './reportRoutes';
import vehicleRoutes from './vehicleRoutes';
import workerRoutes from './workerRoutes';
import assignmentRoutes from './assignmentRoutes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'API Baches Yucatán funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/reports', reportRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/workers', workerRoutes);
router.use('/assignments', assignmentRoutes);

export default router;