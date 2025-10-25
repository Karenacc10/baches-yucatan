import { z } from 'zod';


// Validation schemas
export const createReportSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  street: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  description: z.string().optional(),
  date: z.string().datetime(),
  reportedByVehicleId: z.string().uuid().optional(),
  reportedByWorkerId: z.string().uuid().optional(),
  severity: z.enum(['low', 'medium', 'high']),
  comments: z.string().optional(),
  images: z.array(z.string()).optional()
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
  comments: z.string().optional()
});

export const createVehicleSchema = z.object({
  licensePlate: z.string().min(1, 'License plate is required'),
  model: z.string().optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  color: z.string().optional(),
  corporation: z.string().optional(),
  assignedWorkerId: z.string().uuid().optional()
});

export const updateVehicleSchema = z.object({
  licensePlate: z.string().min(1).optional(),
  model: z.string().optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  color: z.string().optional(),
  corporation: z.string().optional(),
  assignedWorkerId: z.string().uuid().optional(),
  status: z.enum(['active', 'inactive', 'maintenance']).optional()
});

export const createWorkerSchema = z.object({
  role: z.enum(['admin', 'supervisor', 'worker']),
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  secondName: z.string().optional(),
  lastname: z.string().min(1, 'Last name is required'),
  secondLastname: z.string().optional(),
  badgeNumber: z.string().optional(),
  rank: z.string().optional(),
  photoUrl: z.string().url().optional(),
  yearsOfService: z.number().int().min(0).optional(),
  specialization: z.array(z.string()).optional(),
  languagesSpoken: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  awards: z.array(z.string()).optional(),
  notes: z.string().optional()
});

export const updateWorkerSchema = z.object({
  role: z.enum(['admin', 'supervisor', 'worker']).optional(),
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
  secondName: z.string().optional(),
  lastname: z.string().min(1).optional(),
  secondLastname: z.string().min(1).optional(),
  badgeNumber: z.string().optional(),
  rank: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  photoUrl: z.string().url().optional(),
  yearsOfService: z.number().int().min(0).optional(),
  specialization: z.array(z.string()).optional(),
  languagesSpoken: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  awards: z.array(z.string()).optional(),
  notes: z.string().optional()
});

export const createAssignmentSchema = z.object({
  workerId: z.string().uuid(),
  vehicleId: z.string().uuid().optional(),
  teamId: z.number().int().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  notes: z.string().optional()
});

export const updateAssignmentSchema = z.object({
  vehicleId: z.string().uuid().optional(),
  teamId: z.number().int().optional(),
  progressStatus: z.enum(['not_started', 'in_progress', 'completed', 'on_hold']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  notes: z.string().optional(),
  completedAt: z.string().datetime().optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required')
});