import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { getPagination, formatResponse, hashPassword, stringifyBigInts } from '../utils/helpers';
import { WorkerQuery, AuthenticatedRequest } from '../types';

export const createWorker = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password, ...workerData } = req.body;

    // Check if worker already exists
    const existingWorker = await prisma.worker.findUnique({
      where: { email }
    });

    if (existingWorker) {
      return res.status(409).json({
        error: 'Trabajador ya existe',
        message: 'Ya existe un trabajador con este email'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Coerce phoneNumber to BigInt if provided
    if (workerData.phoneNumber !== undefined && workerData.phoneNumber !== null) {
      workerData.phoneNumber = BigInt(String(workerData.phoneNumber));
    }

    const worker = await prisma.worker.create({
      data: {
        ...workerData,
        email,
        passwordHash
      },
      select: {
        id: true,
        role: true,
        email: true,
        name: true,
        secondName: true,
        lastname: true,
        secondLastname: true,
        status: true,
        phoneNumber: true,
        fechaNacimiento: true,
        photoUrl: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.status(201).json({
      message: 'Trabajador creado exitosamente',
      data: stringifyBigInts(worker)
    });
  } catch (error) {
    console.error('Create worker error:', error);
    res.status(500).json({
      error: 'Error al crear trabajador',
      message: 'Ocurrió un error al crear el trabajador'
    });
  }
};

export const getWorkers = async (req: Request, res: Response) => {
  try {
    const { page, limit, role, status, name } = req.query as WorkerQuery;
    const { skip, take, page: pageNum, limit: limitNum } = getPagination(page, limit);

    const where: any = {};
    
    if (role) where.role = role;
    if (status) where.status = status;
    if (name) {
      where.OR = [
        { name: { contains: name, mode: 'insensitive' } },
        { lastname: { contains: name, mode: 'insensitive' } }
      ];
    }

    const [workers, total] = await Promise.all([
      prisma.worker.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          role: true,
          email: true,
          name: true,
          secondName: true,
          lastname: true,
          secondLastname: true,
          status: true,
          phoneNumber: true,
          fechaNacimiento: true,
          photoUrl: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              reports: true,
              assignments: true,
              vehicleAssigned: true
            }
          }
        }
      }),
      prisma.worker.count({ where })
    ]);

    res.json(formatResponse(stringifyBigInts(workers), pageNum, limitNum, total));
  } catch (error) {
    console.error('Get workers error:', error);
    res.status(500).json({
      error: 'Error al obtener trabajadores',
      message: 'Ocurrió un error al obtener los trabajadores'
    });
  }
};

export const getWorkerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const worker = await prisma.worker.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
        email: true,
        name: true,
        secondName: true,
        lastname: true,
        secondLastname: true,
        status: true,
        phoneNumber: true,
        fechaNacimiento: true,
        photoUrl: true,
        createdAt: true,
        updatedAt: true,
        vehicleAssigned: {
          select: {
            id: true,
            licensePlate: true,
            model: true,
            year: true,
            color: true,
            status: true
          }
        },
        reports: {
          select: {
            id: true,
            latitude: true,
            longitude: true,
            street: true,
            neighborhood: true,
            status: true,
            severity: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        assignments: {
          select: {
            id: true,
            progressStatus: true,
            priority: true,
            assignedAt: true,
            completedAt: true,
            vehicle: {
              select: {
                id: true,
                licensePlate: true,
                model: true
              }
            }
          },
          orderBy: { assignedAt: 'desc' },
          take: 10
        }
      }
    });

    if (!worker) {
      return res.status(404).json({
        error: 'Trabajador no encontrado',
        message: 'El trabajador solicitado no existe'
      });
    }

    res.json({
      message: 'Trabajador obtenido exitosamente',
      data: stringifyBigInts(worker)
    });
  } catch (error) {
    console.error('Get worker error:', error);
    res.status(500).json({
      error: 'Error al obtener trabajador',
      message: 'Ocurrió un error al obtener el trabajador'
    });
  }
};

export const updateWorker = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { password, ...updateData } = req.body;

    // If password is being updated, hash it
    if (password) {
      updateData.passwordHash = await hashPassword(password);
    }

    // Coerce phoneNumber to BigInt if provided
    if (updateData.phoneNumber !== undefined && updateData.phoneNumber !== null) {
      updateData.phoneNumber = BigInt(String(updateData.phoneNumber));
    }

    const worker = await prisma.worker.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        role: true,
        email: true,
        name: true,
        secondName: true,
        lastname: true,
        secondLastname: true,
        status: true,
        phoneNumber: true,
        fechaNacimiento: true,
        photoUrl: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Trabajador actualizado exitosamente',
      data: stringifyBigInts(worker)
    });
  } catch (error) {
    console.error('Update worker error:', error);
    res.status(500).json({
      error: 'Error al actualizar trabajador',
      message: 'Ocurrió un error al actualizar el trabajador'
    });
  }
};

export const deleteWorker = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if worker has active assignments
    const activeAssignments = await prisma.assignment.count({
      where: {
        workerId: id,
        progressStatus: { in: ['not_started', 'in_progress'] }
      }
    });

    if (activeAssignments > 0) {
      return res.status(409).json({
        error: 'No se puede eliminar',
        message: 'El trabajador tiene asignaciones activas'
      });
    }

    await prisma.worker.delete({
      where: { id }
    });

    res.json({
      message: 'Trabajador eliminado exitosamente'
    });
  } catch (error) {
    console.error('Delete worker error:', error);
    res.status(500).json({
      error: 'Error al eliminar trabajador',
      message: 'Ocurrió un error al eliminar el trabajador'
    });
  }
};

export const getAvailableWorkers = async (req: Request, res: Response) => {
  try {
    const { role } = req.query;

    const where: any = {
      status: 'active'
    };

    if (role) where.role = role;

    const workers = await prisma.worker.findMany({
      where,
      select: {
        id: true,
        name: true,
        lastname: true,
        email: true,
        phoneNumber: true,
        fechaNacimiento: true,
        role: true
      },
      orderBy: [
        { lastname: 'asc' },
        { name: 'asc' }
      ]
    });

    res.json({
      message: 'Trabajadores disponibles obtenidos exitosamente',
      data: stringifyBigInts(workers)
    });
  } catch (error) {
    console.error('Get available workers error:', error);
    res.status(500).json({
      error: 'Error al obtener trabajadores disponibles',
      message: 'Ocurrió un error al obtener los trabajadores disponibles'
    });
  }
};