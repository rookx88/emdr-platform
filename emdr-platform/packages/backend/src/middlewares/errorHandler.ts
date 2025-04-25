import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational || false;
  
  // Log error
  console.error(`[${new Date().toISOString()}] ${err.stack}`);
  
  // Hide error details in production for non-operational errors
  const message = process.env.NODE_ENV === 'production' && !isOperational
    ? 'Internal server error'
    : err.message;
    
  res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
