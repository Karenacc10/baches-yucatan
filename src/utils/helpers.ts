import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const generateToken = (payload: { id: string; email: string; role: string }): string => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '24h'
  });
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
};

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 12);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

export const getPagination = (page?: string, limit?: string) => {
  const pageNum = parseInt(page || '1', 10);
  const limitNum = parseInt(limit || '10', 10);
  
  return {
    skip: (pageNum - 1) * limitNum,
    take: limitNum,
    page: pageNum,
    limit: limitNum
  };
};

export const formatResponse = (data: any, page?: number, limit?: number, total?: number) => {
  if (page && limit && total !== undefined) {
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  return { data };
};

export const validateId = (id: string | undefined): string => {
  if (!id || id.trim() === '') {
    throw new Error('ID requerido');
  }
  return id;
};

export const stringifyBigInts = (value: any): any => {
  if (value === null || value === undefined) return value;

  // ✅ IMPORTANTE: manejar Date primero
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map(stringifyBigInts);
  }

  if (typeof value === 'object') {
    const out: any = {};
    for (const k of Object.keys(value)) {
      out[k] = stringifyBigInts(value[k]);
    }
    return out;
  }

  return value;
};
