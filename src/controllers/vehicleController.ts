import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { getPagination, formatResponse, stringifyBigInts } from '../utils/helpers';
import { VehicleQuery, AuthenticatedRequest } from '../types';

export const createVehicle = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const vehicleData = req.body;
    // If assignedWorker provided, validate role and conflicts
    if (vehicleData.assignedWorkerId) {
      const worker = await prisma.worker.findUnique({ where: { id: vehicleData.assignedWorkerId } });
      if (!worker) return res.status(404).json({ error: 'Worker not found', message: 'El trabajador especificado no existe' });
      if (worker.role === 'admin' || worker.role === 'supervisor') {
        return res.status(403).json({ error: 'Asignación no permitida', message: `El trabajador ${worker.name} ${worker.lastname} con rol ${worker.role} no puede tener vehículos asignados` });
      }

      // Ensure the worker doesn't already have a vehicle with same plate
      if (vehicleData.licensePlate) {
        const dup = await prisma.vehicle.findFirst({ where: { assignedWorkerId: vehicleData.assignedWorkerId, licensePlate: vehicleData.licensePlate } });
        if (dup) return res.status(409).json({ error: 'Placa duplicada para trabajador', message: `El trabajador ${worker.name} ${worker.lastname} ya tiene asignado un vehículo con placa ${vehicleData.licensePlate}` });
      }
    }

    const vehicle = await prisma.vehicle.create({
      data: vehicleData,
      include: {
        assignedWorker: {
          select: {
            id: true,
            name: true,
            lastname: true,
            email: true,
            phoneNumber: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Vehículo creado exitosamente',
      data: stringifyBigInts(vehicle)
    });
  } catch (error) {
    console.error('Create vehicle error:', error);
    res.status(500).json({
      error: 'Error al crear vehículo',
      message: 'Ocurrió un error al crear el vehículo'
    });
  }
};

export const getVehicles = async (req: Request, res: Response) => {
  try {
    const { page, limit, status, licensePlate } = req.query as VehicleQuery;
    const { skip, take, page: pageNum, limit: limitNum } = getPagination(page, limit);

    const where: any = {};
    
    if (status) where.status = status;
    if (licensePlate) where.licensePlate = { contains: licensePlate, mode: 'insensitive' };

    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedWorker: {
            select: {
              id: true,
              name: true,
              lastname: true,
              email: true,
              phoneNumber: true
            }
          },
          _count: {
            select: {
              reports: true,
              assignments: true
            }
          }
        }
      }),
      prisma.vehicle.count({ where })
    ]);

    res.json(formatResponse(stringifyBigInts(vehicles), pageNum, limitNum, total));
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({
      error: 'Error al obtener vehículos',
      message: 'Ocurrió un error al obtener los vehículos'
    });
  }
};

export const getVehicleByPlate = async (req: Request, res: Response) => {
  try {
    const { licensePlate } = req.params;

    if (!licensePlate) {
      return res.status(400).json({
        error: 'Placa requerida',
        message: 'Debes proporcionar la placa del vehículo'
      });
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { licensePlate },
      include: {
        assignedWorker: {
          select: { id: true, name: true, lastname: true, email: true }
        },
        reports: true,
        assignments: true
      }
    });

    if (!vehicle) {
      return res.status(404).json({
        error: 'Vehículo no encontrado',
        message: `No existe un vehículo con la placa ${licensePlate}`
      });
    }

    res.json({
      message: 'Vehículo obtenido exitosamente',
      data: stringifyBigInts(vehicle)
    });
  } catch (error) {
    console.error('Get vehicle by plate error:', error);
    res.status(500).json({
      error: 'Error al obtener vehículo',
      message: 'Ocurrió un error al buscar el vehículo por placa'
    });
  }
};

export const getVehicleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: 'ID requerido',
        message: 'Se requiere el ID del vehículo'
      });
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        assignedWorker: {
          select: {
            id: true,
            name: true,
            lastname: true,
            email: true,
            phoneNumber: true,
            role: true
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
            worker: {
              select: {
                id: true,
                name: true,
                lastname: true,
                email: true
              }
            }
          },
          orderBy: { assignedAt: 'desc' },
          take: 10
        }
      }
    });

    if (!vehicle) {
      return res.status(404).json({
        error: 'Vehículo no encontrado',
        message: 'El vehículo solicitado no existe'
      });
    }

    res.json({
      message: 'Vehículo obtenido exitosamente',
      data: vehicle
    });
  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({
      error: 'Error al obtener vehículo',
      message: 'Ocurrió un error al obtener el vehículo'
    });
  }
};

export const updateVehicle = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
      return res.status(400).json({
        error: 'ID requerido',
        message: 'Se requiere el ID del vehículo'
      });
    }

    // If assignedWorkerId being set/changed, validate
    if (updateData.assignedWorkerId !== undefined) {
      if (updateData.assignedWorkerId === null) {
        // unassigning, OK
      } else {
        const worker = await prisma.worker.findUnique({ where: { id: updateData.assignedWorkerId } });
        if (!worker) return res.status(404).json({ error: 'Worker not found', message: 'El trabajador especificado no existe' });
        if (worker.role === 'admin' || worker.role === 'supervisor') {
          return res.status(403).json({ error: 'Asignación no permitida', message: `El trabajador ${worker.name} ${worker.lastname} con rol ${worker.role} no puede tener vehículos asignados` });
        }

        // Ensure the worker doesn't already have another vehicle with same plate
        const vehicleToCheck = updateData.licensePlate ? updateData.licensePlate : (await prisma.vehicle.findUnique({ where: { id } }))?.licensePlate;
        if (vehicleToCheck) {
          const dup = await prisma.vehicle.findFirst({ where: { assignedWorkerId: updateData.assignedWorkerId, licensePlate: vehicleToCheck, NOT: { id } } });
          if (dup) return res.status(409).json({ error: 'Placa duplicada para trabajador', message: `El trabajador ${worker.name} ${worker.lastname} ya tiene asignado un vehículo con placa ${vehicleToCheck}` });
        }
      }
    }

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: updateData,
      include: {
        assignedWorker: {
          select: {
            id: true,
            name: true,
            lastname: true,
            email: true,
            phoneNumber: true
          }
        }
      }
    });

    res.json({
      message: 'Vehículo actualizado exitosamente',
      data: stringifyBigInts(vehicle)
    });
  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({
      error: 'Error al actualizar vehículo',
      message: 'Ocurrió un error al actualizar el vehículo'
    });
  }
};

export const deleteVehicle = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: 'ID requerido',
        message: 'Se requiere el ID del vehículo'
      });
    }

    // Check if vehicle has active assignments
    const activeAssignments = await prisma.assignment.count({
      where: {
        vehicleId: id,
        progressStatus: { in: ['not_started', 'in_progress'] }
      }
    });

    if (activeAssignments > 0) {
      return res.status(409).json({
        error: 'No se puede eliminar',
        message: 'El vehículo tiene asignaciones activas'
      });
    }

    await prisma.vehicle.delete({
      where: { id }
    });

    res.json({
      message: 'Vehículo eliminado exitosamente'
    });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({
      error: 'Error al eliminar vehículo',
      message: 'Ocurrió un error al eliminar el vehículo'
    });
  }
};

export const getAvailableVehicles = async (req: Request, res: Response) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: {
        status: 'active',
        assignedWorker: null
      },
      select: {
        id: true,
        licensePlate: true,
        model: true,
        year: true,
        color: true,
        corporation: true
      },
      orderBy: { licensePlate: 'asc' }
    });

    res.json({
      message: 'Vehículos disponibles obtenidos exitosamente',
      data: stringifyBigInts(vehicles)
    });
  } catch (error) {
    console.error('Get available vehicles error:', error);
    res.status(500).json({
      error: 'Error al obtener vehículos disponibles',
      message: 'Ocurrió un error al obtener los vehículos disponibles'
    });
  }
};