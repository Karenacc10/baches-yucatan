import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError, z } from 'zod';

// ✅ Middleware para validar el cuerpo de la solicitud
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Datos de entrada inválidos',
          details: error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
};

// ✅ Middleware para manejar errores globales
export const errorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', error);

  if (error.code === 'P2002') {
    return res.status(409).json({
      error: 'Conflicto de datos únicos',
      message: 'Ya existe un registro con estos datos únicos'
    });
  }

  if (error.code === 'P2025') {
    return res.status(404).json({
      error: 'Registro no encontrado',
      message: 'El registro solicitado no existe'
    });
  }

  return res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Ha ocurrido un error inesperado'
  });
};

// Los esquemas Zod se definen en `src/utils/validations.ts`.
// Usa `validateBody(schema)` importando los esquemas desde allí.