import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors';
import { logger } from '../config/logger';

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  // Handle known operational errors
  if (err instanceof AppError) {
    const response: any = {
      success: false,
      error: err.message,
    };
    
    // Add validation errors if present
    if (err instanceof ValidationError && err.errors && err.errors.length > 0) {
      response.errors = err.errors;
    }
    
    return res.status(err.statusCode).json(response);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired',
    });
  }

  // Handle PostgreSQL unique violation
  if (err.message && err.message.includes('duplicate key')) {
    return res.status(409).json({
      success: false,
      error: 'Resource already exists',
    });
  }

  // Handle PostgreSQL connection errors
  if (err.message && err.message.includes('Connection terminated')) {
    return res.status(503).json({
      success: false,
      error: 'Database connection unavailable',
    });
  }

  // Unknown error
  const statusCode = process.env.NODE_ENV === 'production' ? 500 : 500;
  return res.status(statusCode).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
  });
}