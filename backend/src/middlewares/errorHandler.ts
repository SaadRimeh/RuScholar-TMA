import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
  errors?: unknown;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[Error] ${statusCode} - ${message}`, err.stack);

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(config.nodeEnv === 'development' ? { stack: err.stack, details: err.errors } : {}),
  });
};
