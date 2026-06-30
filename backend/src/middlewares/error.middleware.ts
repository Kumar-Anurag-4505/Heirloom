import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

export interface AppError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error occurred';
  const requestId = crypto.randomUUID();

  // Log error with correlation ID
  console.error(`[Error] Request ID: ${requestId} | Status: ${statusCode} | Message: ${message}`);
  if (err.stack) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    data: null,
    timestamp: new Date().toISOString(),
    requestId
  });
};
