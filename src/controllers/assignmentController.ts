import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { getPagination, formatResponse } from '../utils/helpers';
import { AuthenticatedRequest } from '../types';

export const createAssignment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const assignmentData = req.body;
    const { workerId, vehicleId } = assignmentData;

    // Validate worker and vehicle exist
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

    // Disallow admin/supervisor from being assigned vehicles
    if (worker.role === 'admin' || worker.role === 'supervisor') {
      return res.status(403).json({
        error: 'Asignación no permitida',
        message: `El trabajador ${worker.name} ${worker.lastname} con rol ${worker.role} no puede tener vehículos asignados`
      });
    }

    // If vehicle already assigned to someone else, block
    if (vehicle.assignedWorkerId && vehicle.assignedWorkerId !== workerId) {
      const assignedWorker = await prisma.worker.findUnique({ where: { id: vehicle.assignedWorkerId } });
      return res.status(409).json({
        error: 'Vehículo ya asignado',
        message: `El vehículo con placa ${vehicle.licensePlate} ya está asignado al trabajador ${assignedWorker?.name ?? 'desconocido'} ${assignedWorker?.lastname ?? ''}`
      });
    }

    // Prevent same worker having another vehicle with the same plate (safety check)
    const duplicate = await prisma.vehicle.findFirst({ where: { assignedWorkerId: workerId, licensePlate: vehicle.licensePlate, NOT: { id: vehicle.id } } });
    if (duplicate) {
      return res.status(409).json({
        error: 'Placa duplicada para trabajador',
        message: `El trabajador ${worker.name} ${worker.lastname} ya tiene asignado un vehículo con placa ${vehicle.licensePlate}`
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
      data: assignment
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
    const { skip, take, page: pageNum, limit: limitNum } = getPagination(page as string, limit as string);

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

    res.json(formatResponse(assignments, pageNum, limitNum, total));
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
      data: assignment
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

    // If marking as completed, set completedAt
    if (updateData.progressStatus === 'completed' && !updateData.completedAt) {
      updateData.completedAt = new Date();
    }

    // If changing worker or vehicle, perform same validations as on create
    if (updateData.workerId || updateData.vehicleId) {
      const current = await prisma.assignment.findUnique({ where: { id } });
      const newWorkerId = updateData.workerId ?? current?.workerId;
      const newVehicleId = updateData.vehicleId ?? current?.vehicleId;

      const [worker, vehicle] = await Promise.all([
        prisma.worker.findUnique({ where: { id: newWorkerId } }),
        prisma.vehicle.findUnique({ where: { id: newVehicleId } })
      ]);

      if (!worker) return res.status(404).json({ error: 'Worker not found', message: 'El trabajador especificado no existe' });
      if (!vehicle) return res.status(404).json({ error: 'Vehicle not found', message: 'El vehículo especificado no existe' });

      if (worker.role === 'admin' || worker.role === 'supervisor') {
        return res.status(403).json({ error: 'Asignación no permitida', message: `El trabajador ${worker.name} ${worker.lastname} con rol ${worker.role} no puede tener vehículos asignados` });
      }

      if (vehicle.assignedWorkerId && vehicle.assignedWorkerId !== newWorkerId) {
        const assignedWorker = await prisma.worker.findUnique({ where: { id: vehicle.assignedWorkerId } });
        return res.status(409).json({ error: 'Vehículo ya asignado', message: `El vehículo con placa ${vehicle.licensePlate} ya está asignado al trabajador ${assignedWorker?.name ?? 'desconocido'} ${assignedWorker?.lastname ?? ''}` });
      }

      const duplicate = await prisma.vehicle.findFirst({ where: { assignedWorkerId: newWorkerId, licensePlate: vehicle.licensePlate, NOT: { id: vehicle.id } } });
      if (duplicate) return res.status(409).json({ error: 'Placa duplicada para trabajador', message: `El trabajador ${worker.name} ${worker.lastname} ya tiene asignado un vehículo con placa ${vehicle.licensePlate}` });
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
      data: assignment
    });
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({
      error: 'Error al actualizar asignación',
      message: 'Ocurrió un error al actualizar la asignación'
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

    await prisma.assignment.delete({
      where: { id }
    });

    res.json({
      message: 'Asignación eliminada exitosamente'
    });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({
      error: 'Error al eliminar asignación',
      message: 'Ocurrió un error al eliminar la asignación'
    });
  }
};

export const getMyAssignments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page, limit, progressStatus } = req.query;
    const { skip, take, page: pageNum, limit: limitNum } = getPagination(page as string, limit as string);

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

    res.json(formatResponse(assignments, pageNum, limitNum, total));
  } catch (error) {
    console.error('Get my assignments error:', error);
    res.status(500).json({
      error: 'Error al obtener mis asignaciones',
      message: 'Ocurrió un error al obtener las asignaciones'
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
      error: 'Error al obtener estadísticas',
      message: 'Ocurrió un error al obtener las estadísticas de asignaciones'
    });
  }
};