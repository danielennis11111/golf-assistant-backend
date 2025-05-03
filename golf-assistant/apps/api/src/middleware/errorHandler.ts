import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ApiError } from '@golf-assistant/types';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: string;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  // Default status code is 500 (Internal Server Error)
  const statusCode = err.statusCode || 500;
  
  // Log the error
  logger.error(`${statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  
  if (err.stack) {
    logger.error(err.stack);
  }
  
  // Don't expose stack traces in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  // Prepare the error response
  const errorResponse: ApiError = {
    error: err.message || 'Internal Server Error',
    details: isDevelopment ? err.details || err.stack : undefined,
    timestamp: new Date().toISOString()
  };
  
  // Send the error response
  res.status(statusCode).json(errorResponse);
}; 