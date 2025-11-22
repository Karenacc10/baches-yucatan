
import { z } from 'zod';

// Report
export const createReportSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  street: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  description: z.string().optional(),
  date: z.coerce.date(),
  reportedByVehicleId: z.string().uuid().optional(),
  reportedByWorkerId: z.string().uuid().optional(),
  severity: z.enum(['low', 'medium', 'high']),
  comments: z.string().optional(),
  images: z.array(z.string()).optional() // ← corregido
  // Si quieres validar que sean URLs: z.array(z.string().url()).optional()
});

export const updateReportSchema = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  street: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['reported', 'in_progress', 'resolved']).optional(),
  severity: z.enum(['low', 'medium', 'high']).optional(),
  comments: z.string().optional(),
  images: z.array(z.string()).optional() // ← corregido
});

// Vehicle
export const createVehicleSchema = z.object({
  licensePlate: z.string().min(1, 'License plate is required'),
  model: z.string().optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  color: z.string().optional(),
  corporation: z.string().optional()
});

export const updateVehicleSchema = z.object({
  licensePlate: z.string().min(1).optional(),
  model: z.string().optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  color: z.string().optional(),
  corporation: z.string().optional(),
  status: z.enum(['active', 'inactive', 'maintenance']).optional()
});

// Worker
export const createWorkerSchema = z.object({
  role: z.enum(['admin', 'supervisor', 'worker']),
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  secondName: z.string().optional(),
  lastname: z.string().min(1, 'Last name is required'),
  secondLastname: z.string().min(1, 'Second lastname is required'),
  phoneNumber: z.string().min(7).max(20), // ← ahora string (puedes afinar con regex)
  fechaNacimiento: z.coerce.date(),
  photoUrl: z.string().url().optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional()
});

export const updateWorkerSchema = z.object({
  role: z.enum(['admin', 'supervisor', 'worker']).optional(),
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
  secondName: z.string().optional(),
  lastname: z.string().min(1).optional(),
  secondLastname: z.string().optional(),
  phoneNumber: z.string().min(7).max(20).optional(), // ← string
  fechaNacimiento: z.coerce.date().optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  photoUrl: z.string().url().optional()
});

// Assignment
export const createAssignmentSchema = z.object({
  workerId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  notes: z.string().optional()
});

export const updateAssignmentSchema = z.object({
  vehicleId: z.string().uuid().optional(),
  progressStatus: z.enum(['not_started', 'in_progress', 'completed', 'on_hold']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  notes: z.string().optional(),
  completedAt: z.coerce.date().optional()
});

// Login
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required')
});
