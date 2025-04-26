// HIPAA-compliant error handler

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = async (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational || false;
  
  // Generate error ID for tracing
  const errorId = crypto.randomUUID();
  
  // Log detailed error information securely
  console.error(`[${errorId}] ${err.stack}`);
  
  // Log to database for audit trail
  try {
    await prisma.errorLog.create({
      data: {
        errorId,
        message: err.message,
        stack: err.stack,
        statusCode,
        isOperational,
        userId: req.user?.userId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || 'Unknown',
        endpoint: req.originalUrl,
        method: req.method,
        requestBody: JSON.stringify(req.body),
        requestQuery: JSON.stringify(req.query),
        timestamp: new Date()
      }
    });
  } catch (logError) {
    console.error('Failed to log error to database:', logError);
  }
  
  // In production, hide error details for non-operational errors
  const message = process.env.NODE_ENV === 'production' && !isOperational
    ? 'An error occurred while processing your request'
    : err.message;
    
  res.status(statusCode).json({
    status: 'error',
    message,
    errorId, // Include error ID for support reference
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};