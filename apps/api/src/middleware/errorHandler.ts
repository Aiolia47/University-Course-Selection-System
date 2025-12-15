import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { config } from '../config';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: Record<string, any>;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  public statusCode: number;
  public code: string;
  public details?: Record<string, any>;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: Record<string, any>,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'CustomError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, CustomError);
  }
}

// Predefined error types
export class ValidationError extends CustomError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends CustomError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends CustomError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends CustomError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 409, 'CONFLICT', details);
    this.name = 'ConflictError';
  }
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Set default values
  let statusCode = error.statusCode || 500;
  let code = error.code || 'INTERNAL_ERROR';
  let message = error.message || 'Internal Server Error';
  let details = error.details;

  // Handle specific error types
  if (error.name === 'ValidationError' && error.details) {
    // Handle validation errors (e.g., from class-validator)
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = error.details;
  } else if (error.name === 'QueryFailedError') {
    // Handle MySQL/TypeORM query errors
    statusCode = 500;
    code = 'DATABASE_ERROR';
    message = 'Database operation failed';
  } else if ((error as any).errno === 1062) {
    // Handle MySQL duplicate entry errors
    statusCode = 409;
    code = 'DUPLICATE_ERROR';
    message = 'Resource already exists';
    details = { field: 'duplicate_entry' };
  } else if (error.name === 'JsonWebTokenError') {
    // Handle JWT errors
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  }

  // Log the error
  const errorLog = {
    message: error.message,
    stack: error.stack,
    statusCode,
    code,
    details,
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    },
  };

  if (statusCode >= 500) {
    logger.error('Server Error', errorLog);
  } else {
    logger.warn('Client Error', errorLog);
  }

  // Prepare response
  const response: any = {
    error: {
      code,
      message,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown',
    },
  };

  // Include details in development or if explicitly provided
  if (config.env === 'development' || details) {
    response.error.details = details;
  }

  // Include stack trace in development
  if (config.env === 'development' && error.stack) {
    response.error.stack = error.stack;
  }

  res.status(statusCode).json(response);
};