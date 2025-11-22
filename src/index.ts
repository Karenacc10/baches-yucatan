import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import routes from './routes';
import { errorHandler } from './middleware/validation';

const app = express();
app.set('trust proxy', 1); // ← IMPORTANTE PARA RENDER
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Demasiadas solicitudes',
    message: 'Has excedido el límite de solicitudes. Intenta de nuevo en 15 minutos.'
  }
});
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (_, res) => {
  res.json({
    message: 'API Baches Yucatán funcionando 🚀',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      reports: '/api/reports',
      vehicles: '/api/vehicles',
      workers: '/api/workers',
      assignments: '/api/assignments'
    }
  });
});

app.use('/api', routes);

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    message: `La ruta ${req.originalUrl} no existe en esta API`
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 API Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📚 Endpoints disponibles:`);
  console.log(`   - Autenticación: http://localhost:${PORT}/api/auth`);
  console.log(`   - Reportes: http://localhost:${PORT}/api/reports`);
  console.log(`   - Vehículos: http://localhost:${PORT}/api/vehicles`);
  console.log(`   - Trabajadores: http://localhost:${PORT}/api/workers`);
  console.log(`   - Asignaciones: http://localhost:${PORT}/api/assignments`);
});