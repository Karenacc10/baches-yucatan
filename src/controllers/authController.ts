import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { hashPassword, comparePassword, generateToken } from '../utils/helpers';
import { AuthenticatedRequest } from '../types';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, ...userData } = req.body;

    // Check if user already exists
    const existingWorker = await prisma.worker.findUnique({
      where: { email }
    });

    if (existingWorker) {
      return res.status(409).json({
        error: 'Usuario ya existe',
        message: 'Ya existe un trabajador con este email'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create worker
   const worker = await prisma.worker.create({
  data: {
    email,
    passwordHash,
    name: userData.name,
    lastname: userData.lastname,
    role: userData.role,
    status: userData.status ?? 'active',
    ...(userData.secondName && { secondName: userData.secondName }),
    ...(userData.secondLastname && { secondLastname: userData.secondLastname }),
    ...(userData.photoUrl && { photoUrl: userData.photoUrl }),
    ...(userData.phoneNumber && { phoneNumber: String(userData.phoneNumber) }),
    ...(userData.fechaNacimiento && { fechaNacimiento: new Date(userData.fechaNacimiento) })
  },
  select: {
    id: true,
    email: true,
    name: true,
    lastname: true,
    role: true,
    status: true,
    createdAt: true
  }
});

    // Generate token
    const token = generateToken({
      id: worker.id,
      email: worker.email,
      role: worker.role
    });

    res.status(201).json({
      message: 'Trabajador registrado exitosamente',
      data: worker,
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      error: 'Error al registrar trabajador',
      message: 'Ocurrió un error durante el registro'
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find worker
    const worker = await prisma.worker.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        name: true,
        lastname: true,
        role: true,
        status: true
      }
    });

    if (!worker) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }

    if (worker.status !== 'active') {
      return res.status(403).json({
        error: 'Cuenta inactiva',
        message: 'Tu cuenta está inactiva. Contacta al administrador.'
      });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, worker.passwordHash);
    
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }

    // Generate token
    const token = generateToken({
      id: worker.id,
      email: worker.email,
      role: worker.role
    });

    const { passwordHash, ...workerData } = worker;

    // Si el rol es 'worker', requiere vehículo asignado para permitir el acceso móvil
    if (worker.role === 'worker') {
      const assignedVehicle = await prisma.vehicle.findFirst({
        where: { assignedWorkerId: worker.id },
        select: { id: true, licensePlate: true, model: true, year: true, color: true }
      });

      if (!assignedVehicle) {
        return res.status(403).json({
          error: 'Sin vehículo asignado',
          message: 'No tienes un vehículo asignado. No puedes ingresar a la app móvil hasta que se te asigne uno.'
        });
      }

      return res.json({
        message: 'Login exitoso',
        data: workerData,
        token,
        vehicle: assignedVehicle
      });
    }

    // Para admin/supervisor permitir login normalmente
    res.json({
      message: 'Login exitoso',
      data: workerData,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Error al iniciar sesión',
      message: 'Ocurrió un error durante el login'
    });
  }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        error: 'No autenticado',
        message: 'Usuario no autenticado'
      });
    }

    const worker = await prisma.worker.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        secondName: true,
        lastname: true,
        secondLastname: true,
        role: true,
        status: true,
        phoneNumber: true,
        fechaNacimiento: true,
        photoUrl: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!worker) {
      return res.status(404).json({
        error: 'Trabajador no encontrado',
        message: 'El perfil del trabajador no existe'
      });
    }

    res.json({
      message: 'Perfil obtenido exitosamente',
      data: worker
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Error al obtener perfil',
      message: 'Ocurrió un error al obtener el perfil'
    });
  }
};