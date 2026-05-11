import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // 记录错误日志
  logger.error(`Error: ${message}`, {
    statusCode,
    path: req.path,
    method: req.method,
    stack: err.stack
  });

  // 开发环境返回详细错误
  if (process.env.NODE_ENV === 'development') {
    res.status(statusCode).json({
      status: 'error',
      statusCode,
      message,
      stack: err.stack
    });
  } else {
    // 生产环境返回简化错误
    res.status(statusCode).json({
      status: 'error',
      statusCode,
      message: err instanceof AppError ? message : 'Something went wrong'
    });
  }
};
