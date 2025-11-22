import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { getPagination, formatResponse, stringifyBigInts } from '../utils/helpers';
import { AuthenticatedRequest } from '../types';

export const createAssignment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const assignmentData = req.body;
    const { workerId, vehicleId } = assignmentData;

    const [worker, vehicle] = await Promise.all([
      prisma.worker.findUnique({ where: { id: workerId } }),
      prisma.vehicle.findUnique({ where: { id: vehicleId } })
    ]);

    if (!worker) {
      return res.status(404).json({ error: 'Worker not found', message: 'El trabajador especificado no existe' });
    }

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found', message: 'El vehículo especificado no existe' });
    }

    if (worker.role === 'admin' || worker.role === 'supervisor') {
      return res.status(403).json({
        error: 'Asignación no permitida',
        message: `El trabajador ${worker.name} ${worker.lastname} con rol ${worker.role} no puede tener vehículos asignados`
      });
    }

    // Verificar si ese vehículo ya está asignado en otra asignación activa
    const existingAssignment = await prisma.assignment.findFirst({
      where: {
        vehicleId,
        progressStatus: { in: ['not_started', 'in_progress'] }
      },
      include: {
        worker: {
          select: { name: true, lastname: true }
        }
      }
    });

    if (existingAssignment) {
      return res.status(409).json({
        error: 'Vehículo ya asignado',
        message: `Este vehículo ya está asignado a ${existingAssignment.worker?.name} ${existingAssignment.worker?.lastname}`
      });
    }

    const assignment = await prisma.assignment.create({
      data: assignmentData,
      include: {
        worker: {
          select: {
            id: true,
            name: true,
            lastname: true,
            email: true,
            role: true
          }
        },
        vehicle: {
          select: {
            id: true,
            licensePlate: true,
            model: true,
            year: true,
            color: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Asignación creada exitosamente',
      data: stringifyBigInts(assignment)
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({
      error: 'Error al crear asignación',
      message: 'Ocurrió un error al crear la asignación'
    });
  }
};

export const getAssignments = async (req: Request, res: Response) => {
  try {
    const { page, limit, progressStatus, priority, workerId, vehicleId } = req.query;
    const { skip, take, page: pageNum, limit: limitNum } = getPagination(
      page as string,
      limit as string
    );

    const where: any = {};

    if (progressStatus) where.progressStatus = progressStatus;
    if (priority) where.priority = priority;
    if (workerId) where.workerId = workerId;
    if (vehicleId) where.vehicleId = vehicleId;

    const [assignments, total] = await Promise.all([
      prisma.assignment.findMany({
        where,
        skip,
        take,
        orderBy: { assignedAt: 'desc' },
        include: {
          worker: {
            select: {
              id: true,
              name: true,
              lastname: true,
              email: true,
              role: true
            }
          },
          vehicle: {
            select: {
              id: true,
              licensePlate: true,
              model: true,
              year: true,
              color: true
            }
          }
        }
      }),
      prisma.assignment.count({ where })
    ]);

    res.json(formatResponse(stringifyBigInts(assignments), pageNum, limitNum, total));
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({
      error: 'Error al obtener asignaciones',
      message: 'Ocurrió un error al obtener las asignaciones'
    });
  }
};

export const getAssignmentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        worker: {
          select: {
            id: true,
            name: true,
            lastname: true,
            email: true,
            role: true,
            photoUrl: true
          }
        },
        vehicle: {
          select: {
            id: true,
            licensePlate: true,
            model: true,
            year: true,
            color: true,
            corporation: true,
            status: true
          }
        }
      }
    });

    if (!assignment) {
      return res.status(404).json({
        error: 'Asignación no encontrada',
        message: 'La asignación solicitada no existe'
      });
    }

    res.json({
      message: 'Asignación obtenida exitosamente',
      data: stringifyBigInts(assignment)
    });
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({
      error: 'Error al obtener asignación',
      message: 'Ocurrió un error al obtener la asignación'
    });
  }
};

export const updateAssignment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.progressStatus === 'completed' && !updateData.completedAt) {
      updateData.completedAt = new Date();
    }

    if (updateData.workerId || updateData.vehicleId) {
      const current = await prisma.assignment.findUnique({ where: { id } });

      if (!current) {
        return res.status(404).json({ error: 'Asignación no encontrada' });
      }

      const newWorkerId = updateData.workerId ?? current.workerId;
      const newVehicleId = updateData.vehicleId ?? current.vehicleId;

      const [worker, vehicle] = await Promise.all([
        prisma.worker.findUnique({ where: { id: newWorkerId } }),
        prisma.vehicle.findUnique({ where: { id: newVehicleId } })
      ]);

      if (!worker) return res.status(404).json({ error: 'Worker not found' });
      if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

      if (worker.role === 'admin' || worker.role === 'supervisor') {
        return res.status(403).json({
          error: 'Asignación no permitida',
          message: 'Este rol no puede tener vehículos asignados'
        });
      }

      const existingAssignment = await prisma.assignment.findFirst({
        where: {
          vehicleId: newVehicleId,
          NOT: { id },
          progressStatus: { in: ['not_started', 'in_progress'] }
        }
      });

      if (existingAssignment) {
        return res.status(409).json({
          error: 'Vehículo ya asignado',
          message: 'Este vehículo ya tiene una asignación activa'
        });
      }
    }

    const assignment = await prisma.assignment.update({
      where: { id },
      data: updateData,
      include: {
        worker: {
          select: {
            id: true,
            name: true,
            lastname: true,
            email: true,
            role: true
          }
        },
        vehicle: {
          select: {
            id: true,
            licensePlate: true,
            model: true,
            year: true,
            color: true
          }
        }
      }
    });

    res.json({
      message: 'Asignación actualizada exitosamente',
      data: stringifyBigInts(assignment)
    });
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({
      error: 'Error al actualizar asignación'
    });
  }
};

export const deleteAssignment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      select: { progressStatus: true }
    });

    if (assignment?.progressStatus === 'in_progress') {
      return res.status(409).json({
        error: 'No se puede eliminar',
        message: 'No se puede eliminar una asignación en progreso'
      });
    }

    await prisma.assignment.delete({ where: { id } });

    res.json({
      message: 'Asignación eliminada exitosamente'
    });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({
      error: 'Error al eliminar asignación'
    });
  }
};

export const getMyAssignments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page, limit, progressStatus } = req.query;
    const { skip, take, page: pageNum, limit: limitNum } = getPagination(
      page as string,
      limit as string
    );

    const where: any = {
      workerId: req.user?.id
    };

    if (progressStatus) where.progressStatus = progressStatus;

    const [assignments, total] = await Promise.all([
      prisma.assignment.findMany({
        where,
        skip,
        take,
        orderBy: { assignedAt: 'desc' },
        include: {
          vehicle: {
            select: {
              id: true,
              licensePlate: true,
              model: true,
              year: true,
              color: true
            }
          }
        }
      }),
      prisma.assignment.count({ where })
    ]);

    res.json(formatResponse(stringifyBigInts(assignments), pageNum, limitNum, total));
  } catch (error) {
    console.error('Get my assignments error:', error);
    res.status(500).json({
      error: 'Error al obtener mis asignaciones'
    });
  }
};

export const getAssignmentStats = async (req: Request, res: Response) => {
  try {
    const [
      totalAssignments,
      notStarted,
      inProgress,
      completed,
      onHold,
      highPriority,
      mediumPriority,
      lowPriority
    ] = await Promise.all([
      prisma.assignment.count(),
      prisma.assignment.count({ where: { progressStatus: 'not_started' } }),
      prisma.assignment.count({ where: { progressStatus: 'in_progress' } }),
      prisma.assignment.count({ where: { progressStatus: 'completed' } }),
      prisma.assignment.count({ where: { progressStatus: 'on_hold' } }),
      prisma.assignment.count({ where: { priority: 'high' } }),
      prisma.assignment.count({ where: { priority: 'medium' } }),
      prisma.assignment.count({ where: { priority: 'low' } })
    ]);

    const stats = {
      total: totalAssignments,
      byStatus: {
        not_started: notStarted,
        in_progress: inProgress,
        completed: completed,
        on_hold: onHold
      },
      byPriority: {
        high: highPriority,
        medium: mediumPriority,
        low: lowPriority
      }
    };

    res.json({
      message: 'Estadísticas de asignaciones obtenidas exitosamente',
      data: stats
    });
  } catch (error) {
    console.error('Get assignment stats error:', error);
    res.status(500).json({
      error: 'Error al obtener estadísticas'
    });
  }
};
