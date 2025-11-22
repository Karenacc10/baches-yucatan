import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/* =============================
   FUNCIÓN PARA ENCRIPTAR PASSWORD
============================= */
const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/* =============================
   CREAR TRABAJADOR
============================= */
export const createWorker = async (req: Request, res: Response) => {
  try {
    const { email, password, ...workerData } = req.body;

    /* VALIDACIÓN DE CAMPOS OBLIGATORIOS */
    if (
      !email ||
      !password ||
      !workerData.name ||
      !workerData.lastname ||
      !workerData.secondLastname ||
      !workerData.phoneNumber ||
      !workerData.fechaNacimiento ||
      !workerData.role 
    ) {
      return res.status(400).json({
        error: 'Faltan datos obligatorios',
        message:
          'Debes enviar: email, password, name, lastname, secondLastname, phoneNumber, fechaNacimiento y role'
      });
    }

    /* VERIFICAR SI YA EXISTE */
    const existingWorker = await prisma.worker.findUnique({
      where: { email }
    });

    if (existingWorker) {
      return res.status(409).json({
        error: 'Trabajador ya existe',
        message: 'Ya existe un trabajador con este email'
      });
    }

    /* ENCRIPTAR PASSWORD */
    const passwordHash = await hashPassword(password);

    /* ASEGURAR phoneNumber COMO STRING */
    if (workerData.phoneNumber !== undefined && workerData.phoneNumber !== null) {
      workerData.phoneNumber = String(workerData.phoneNumber);
    }

    /* CONVERTIR fechaNacimiento A DATE */
    if (workerData.fechaNacimiento) {
      workerData.fechaNacimiento = new Date(workerData.fechaNacimiento);
    }

    /* CREAR TRABAJADOR */
    const newWorker = await prisma.worker.create({
      data: {
        email,
        passwordHash,
        ...workerData
      }
    });

    return res.status(201).json({
      message: 'Trabajador creado correctamente ✅',
      worker: newWorker
    });

  } catch (error) {
    console.error('Error al registrar trabajador:', error);
    return res.status(500).json({
      error: 'Error al registrar trabajador',
      message: 'Ocurrió un error durante el registro'
    });
  }
};

/* =============================
   OBTENER TODOS LOS TRABAJADORES
============================= */
export const getWorkers = async (_req: Request, res: Response) => {
  try {
    const workers = await prisma.worker.findMany();

    return res.status(200).json(workers);

  } catch (error) {
    console.error('Error al obtener trabajadores:', error);
    return res.status(500).json({
      error: 'Error al obtener trabajadores'
    });
  }
};

/* =============================
   OBTENER TRABAJADOR POR ID
============================= */
export const getWorkerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const worker = await prisma.worker.findUnique({
      where: { id }
    });

    if (!worker) {
      return res.status(404).json({
        error: 'Trabajador no encontrado'
      });
    }

    return res.status(200).json(worker);

  } catch (error) {
    console.error('Error al obtener trabajador:', error);
    return res.status(500).json({
      error: 'Error al obtener trabajador'
    });
  }
};

/* =============================
   ACTUALIZAR TRABAJADOR
============================= */
export const updateWorker = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { password, ...workerData } = req.body;

    if (workerData.phoneNumber !== undefined && workerData.phoneNumber !== null) {
      workerData.phoneNumber = String(workerData.phoneNumber);
    }

    if (workerData.fechaNacimiento) {
      workerData.fechaNacimiento = new Date(workerData.fechaNacimiento);
    }

    if (password) {
      const passwordHash = await hashPassword(password);
      workerData.passwordHash = passwordHash;
    }

    const updatedWorker = await prisma.worker.update({
      where: { id },
      data: workerData
    });

    return res.status(200).json({
      message: 'Trabajador actualizado ✅',
      worker: updatedWorker
    });

  } catch (error) {
    console.error('Error al actualizar trabajador:', error);
    return res.status(500).json({
      error: 'Error al actualizar trabajador'
    });
  }
};

/* =============================
   ELIMINAR TRABAJADOR
============================= */
export const deleteWorker = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.worker.delete({
      where: { id }
    });

    return res.status(200).json({
      message: 'Trabajador eliminado ✅'
    });

  } catch (error) {
    console.error('Error al eliminar trabajador:', error);
    return res.status(500).json({
      error: 'Error al eliminar trabajador'
    });
  }
};
