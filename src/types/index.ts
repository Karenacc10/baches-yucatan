import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface ReportQuery extends PaginationQuery {
  status?: string;
  severity?: string;
  city?: string;
  neighborhood?: string;
}

export interface VehicleQuery extends PaginationQuery {
  status?: string;
  licensePlate?: string;
}

export interface WorkerQuery extends PaginationQuery {
  role?: string;
  status?: string;
  name?: string;
}