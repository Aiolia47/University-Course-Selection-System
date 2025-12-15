import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logRequest } from '../utils/logger';

// Extend Request interface to include startTime and requestId
declare global {
  namespace Express {
    interface Request {
      startTime?: number;
      requestId?: string;
    }
  }
}

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Generate unique request ID
  req.requestId = uuidv4();
  req.startTime = Date.now();

  // Add request ID to response headers
  res.setHeader('X-Request-ID', req.requestId);

  // Log when request is completed
  res.on('finish', () => {
    const responseTime = req.startTime ? Date.now() - req.startTime : undefined;
    logRequest(req, res, responseTime);
  });

  next();
};