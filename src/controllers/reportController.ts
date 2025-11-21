import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { getPagination, formatResponse, stringifyBigInts } from '../utils/helpers';
import { ReportQuery, AuthenticatedRequest } from '../types';

export const createReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const reportData = req.body;
    
    const report = await prisma.report.create({
      data: {
        ...reportData,
        date: new Date(reportData.date),
        images: reportData.images || []
      },
      include: {
        reportedByVehicle: {
          select: {
            id: true,
            licensePlate: true,
            model: true
          }
        },
        reportedByWorker: {
          select: {
            id: true,
            name: true,
            lastname: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Reporte creado exitosamente',
      data: stringifyBigInts(report)
    });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({
      error: 'Error al crear reporte',
      message: 'Ocurrió un error al crear el reporte'
    });
  }
};

export const getReports = async (req: Request, res: Response) => {
  try {
    const { page, limit, status, severity, city, neighborhood } = req.query as ReportQuery;
    const { skip, take, page: pageNum, limit: limitNum } = getPagination(page, limit);

    const where: any = {};
    
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (neighborhood) where.neighborhood = { contains: neighborhood, mode: 'insensitive' };

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          reportedByVehicle: {
            select: {
              id: true,
              licensePlate: true,
              model: true
            }
          },
          reportedByWorker: {
            select: {
              id: true,
              name: true,
              lastname: true,
              email: true
            }
          }
        }
      }),
      prisma.report.count({ where })
    ]);

    res.json(formatResponse(stringifyBigInts(reports), pageNum, limitNum, total));
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      error: 'Error al obtener reportes',
      message: 'Ocurrió un error al obtener los reportes'
    });
  }
};

export const getReportById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: 'ID requerido',
        message: 'Se requiere el ID del reporte'
      });
    }

    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        reportedByVehicle: {
          select: {
            id: true,
            licensePlate: true,
            model: true,
            year: true,
            color: true
          }
        },
        reportedByWorker: {
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

    if (!report) {
      return res.status(404).json({
        error: 'Reporte no encontrado',
        message: 'El reporte solicitado no existe'
      });
    }

    res.json({
      message: 'Reporte obtenido exitosamente',
      data: stringifyBigInts(report)
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({
      error: 'Error al obtener reporte',
      message: 'Ocurrió un error al obtener el reporte'
    });
  }
};

export const updateReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
      return res.status(400).json({
        error: 'ID requerido',
        message: 'Se requiere el ID del reporte'
      });
    }

    const report = await prisma.report.update({
      where: { id },
      data: updateData,
      include: {
        reportedByVehicle: {
          select: {
            id: true,
            licensePlate: true,
            model: true
          }
        },
        reportedByWorker: {
          select: {
            id: true,
            name: true,
            lastname: true,
            email: true
          }
        }
      }
    });

    res.json({
      message: 'Reporte actualizado exitosamente',
      data: stringifyBigInts(report)
    });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({
      error: 'Error al actualizar reporte',
      message: 'Ocurrió un error al actualizar el reporte'
    });
  }
};
export const deleteReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: 'ID requerido',
        message: 'Se requiere el ID del reporte'
      });
    }

    // Validar que el usuario esté autenticado
    if (!req.user) {
      return res.status(401).json({
        error: 'No autenticado',
        message: 'Usuario no autenticado'
      });
    }

    // Buscar el reporte
    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) {
      return res.status(404).json({
        error: 'Reporte no encontrado',
        message: 'El reporte solicitado no existe'
      });
    }

    // Validar permisos: si es worker, solo puede eliminar sus propios reportes
    if (req.user.role === 'worker' && report.reportedByWorkerId !== req.user.id) {
      return res.status(403).json({
        error: 'No autorizado',
        message: 'No puedes eliminar un reporte que no creaste'
      });
    }

    await prisma.report.delete({ where: { id } });

    res.json({ message: 'Reporte eliminado exitosamente' });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({
      error: 'Error al eliminar reporte',
      message: 'Ocurrió un error al eliminar el reporte'
    });
  }
};

export const getReportsByLocation = async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, radius = 1 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        error: 'Parámetros faltantes',
        message: 'Se requieren latitude y longitude'
      });
    }

    const lat = parseFloat(latitude as string);
    const lng = parseFloat(longitude as string);
    const radiusKm = parseFloat(radius as string);

    // Simple distance calculation (not precise for large distances)
    const reports = await prisma.report.findMany({
      where: {
        AND: [
          { latitude: { gte: lat - (radiusKm / 111) } },
          { latitude: { lte: lat + (radiusKm / 111) } },
          { longitude: { gte: lng - (radiusKm / 111) } },
          { longitude: { lte: lng + (radiusKm / 111) } }
        ]
      },
      include: {
        reportedByVehicle: {
          select: {
            id: true,
            licensePlate: true,
            model: true
          }
        },
        reportedByWorker: {
          select: {
            id: true,
            name: true,
            lastname: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      message: 'Reportes por ubicación obtenidos exitosamente',
      data: stringifyBigInts(reports)
    });
  } catch (error) {
    console.error('Get reports by location error:', error);
    res.status(500).json({
      error: 'Error al obtener reportes por ubicación',
      message: 'Ocurrió un error al obtener los reportes por ubicación'
    });
  }
};