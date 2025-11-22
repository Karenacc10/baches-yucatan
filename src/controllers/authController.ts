import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { Role } from '@prisma/client';
import {
  hashPassword,
  comparePassword,
  generateToken,
  stringifyBigInts
} from '../utils/helpers';
import { AuthenticatedRequest } from '../types';
import {
  createWorkerSchema,
  loginSchema
} from '../utils/validations';

/* ===========================
   REGISTER
=========================== */
export const register = async (req: Request, res: Response) => {
  try {
    // ✅ Validar body con Zod
    const validatedData = createWorkerSchema.parse(req.body);
    const { email, password, ...userData } = validatedData;

    // 📌 Validar fechaNacimiento
    let birthDate: Date;
    if (userData.fechaNacimiento) {
      birthDate = new Date(userData.fechaNacimiento);
      if (isNaN(birthDate.getTime())) {
        return res.status(400).json({
          error: 'Fecha inválida',
          message: 'fechaNacimiento debe tener formato: YYYY-MM-DD'
        });
      }
    } else {
      return res.status(400).json({
        error: 'Falta fechaNacimiento',
        message: 'Debes enviar fechaNacimiento'
      });
    }

    // 📌 Validar role
    const roleValue: Role = (() => {
      switch (userData.role?.toLowerCase()) {
        case 'admin': return Role.admin;
        case 'supervisor': return Role.supervisor;
        case 'worker': return Role.worker;
        default:
          return Role.worker; // valor por defecto
      }
    })();

    // 📌 Verificar si ya existe
    const existingWorker = await prisma.worker.findUnique({
      where: { email }
    });

    if (existingWorker) {
      return res.status(409).json({
        error: 'Usuario ya existe',
        message: 'Ya existe un trabajador con este correo'
      });
    }

    // 🔒 Encriptar contraseña
    const passwordHash = await hashPassword(password);

    // ✅ Crear trabajador
    const worker = await prisma.worker.create({
      data: {
        email,
        passwordHash,
        name: userData.name,
        secondName: userData.secondName ?? null,
        lastname: userData.lastname,
        secondLastname: userData.secondLastname,
        role: roleValue,
        status: userData.status ?? 'active',
        phoneNumber: String(userData.phoneNumber),
        fechaNacimiento: birthDate,
        photoUrl: userData.photoUrl ?? null
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

    // 🔑 Generar token
    const token = generateToken({
      id: worker.id,
      email: worker.email,
      role: worker.role
    });

    return res.status(201).json({
      message: 'Trabajador registrado exitosamente',
      data: worker,
      token
    });

  } catch (error: any) {
    console.error('Register error:', error);

    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: error.errors
      });
    }

    res.status(500).json({
      error: 'Error al registrar trabajador',
      message: 'Ocurrió un error durante el registro'
    });
  }
};

/* ===========================
   LOGIN
=========================== */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

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

    const isValidPassword = await comparePassword(password, worker.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }

    const token = generateToken({
      id: worker.id,
      email: worker.email,
      role: worker.role
    });

    const { passwordHash, ...workerData } = worker;

    // Si es worker, verificar vehículo asignado
    if (worker.role === 'worker') {
      const assignedVehicle = await prisma.vehicle.findFirst({
        where: {
          assignments: {
            some: {
              workerId: worker.id,
              active: true
            }
          }
        },
        select: {
          id: true,
          licensePlate: true,
          model: true,
          year: true,
          color: true
        }
      });

      if (!assignedVehicle) {
        return res.status(403).json({
          error: 'Sin vehículo asignado',
          message:
            'No tienes un vehículo asignado. No puedes ingresar a la app móvil hasta que se te asigne uno.'
        });
      }

      return res.json({
        message: 'Login exitoso',
        data: stringifyBigInts(workerData),
        token,
        vehicle: stringifyBigInts(assignedVehicle)
      });
    }

    // Admin/Supervisor
    return res.json({
      message: 'Login exitoso',
      data: stringifyBigInts(workerData),
      token
    });

  } catch (error: any) {
    console.error('Login error:', error);

    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: error.errors
      });
    }

    res.status(500).json({
      error: 'Error al iniciar sesión',
      message: 'Ocurrió un error durante el login'
    });
  }
};

/* ===========================
   GET PROFILE
=========================== */
export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response
) => {
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

    return res.json({
      message: 'Perfil obtenido exitosamente',
      data: stringifyBigInts(worker)
    });

  } catch (error) {
    console.error('Get profile error:', error);

    res.status(500).json({
      error: 'Error al obtener perfil',
      message: 'Ocurrió un error al obtener el perfil'
    });
  }
};
