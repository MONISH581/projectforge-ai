import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // If response has already started sending, delegate to default express handler
  if (res.headersSent) {
    return next(err);
  }

  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

  // Handle Zod schema validation errors
  if (err instanceof ZodError) {
    const formatted = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: formatted,
        details: err.errors
      }
    });
  }

  // Handle standard HTTP status errors
  const status = typeof err.status === 'number' ? err.status : 500;
  const code = err.code || (status === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR');
  const message = err.message || 'An unexpected internal error occurred.';

  res.status(status).json({
    success: false,
    error: {
      code,
      message
    }
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`
    }
  });
}
