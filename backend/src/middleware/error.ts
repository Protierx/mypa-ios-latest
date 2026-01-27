import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

export class AppError extends Error {
  statusCode: number;
  code?: string;
  
  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('Error:', err);
  
  // Default error
  let statusCode = 500;
  let message = 'Internal server error';
  let code: string | undefined;
  
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code;
  } else if (err.name === 'PrismaClientKnownRequestError') {
    // Handle Prisma errors
    const prismaError = err as any;
    if (prismaError.code === 'P2002') {
      statusCode = 409;
      message = 'A record with this value already exists';
      code = 'DUPLICATE_ENTRY';
    } else if (prismaError.code === 'P2025') {
      statusCode = 404;
      message = 'Record not found';
      code = 'NOT_FOUND';
    }
  }
  
  res.status(statusCode).json({
    success: false,
    error: message,
    code,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  });
}
