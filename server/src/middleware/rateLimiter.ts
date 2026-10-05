import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const generalStore = new Map<string, RateLimitEntry>();
const aiStore = new Map<string, RateLimitEntry>();
const authStore = new Map<string, RateLimitEntry>();
const adminStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of generalStore.entries()) {
    if (now > entry.resetTime) generalStore.delete(key);
  }
  for (const [key, entry] of aiStore.entries()) {
    if (now > entry.resetTime) aiStore.delete(key);
  }
  for (const [key, entry] of authStore.entries()) {
    if (now > entry.resetTime) authStore.delete(key);
  }
  for (const [key, entry] of adminStore.entries()) {
    if (now > entry.resetTime) adminStore.delete(key);
  }
}, 5 * 60 * 1000);

export function generalRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute

  let entry = generalStore.get(ip);
  if (!entry || now > entry.resetTime) {
    entry = { count: 1, resetTime: now + windowMs };
    generalStore.set(ip, entry);
  } else {
    entry.count++;
  }

  res.setHeader('X-RateLimit-Limit', config.rateLimitMax);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, config.rateLimitMax - entry.count));
  res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));

  if (entry.count > config.rateLimitMax) {
    return res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please wait a moment before trying again.'
      }
    });
  }

  next();
}

export function authRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxLimit = 30; // 30 auth requests per minute

  let entry = authStore.get(ip);
  if (!entry || now > entry.resetTime) {
    entry = { count: 1, resetTime: now + windowMs };
    authStore.set(ip, entry);
  } else {
    entry.count++;
  }

  res.setHeader('X-RateLimit-Auth-Limit', maxLimit);
  res.setHeader('X-RateLimit-Auth-Remaining', Math.max(0, maxLimit - entry.count));

  if (entry.count > maxLimit) {
    return res.status(429).json({
      success: false,
      error: {
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        message: 'Too many authentication attempts. Please wait a minute before trying again.'
      }
    });
  }

  next();
}

export function aiRateLimiter(req: Request, res: Response, next: NextFunction) {
  const key = (req as any).user?._id || req.ip || 'anonymous';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxLimit = config.ai.rateLimitMax;

  let entry = aiStore.get(key);
  if (!entry || now > entry.resetTime) {
    entry = { count: 1, resetTime: now + windowMs };
    aiStore.set(key, entry);
  } else {
    entry.count++;
  }

  res.setHeader('X-RateLimit-AI-Limit', maxLimit);
  res.setHeader('X-RateLimit-AI-Remaining', Math.max(0, maxLimit - entry.count));

  if (entry.count > maxLimit) {
    return res.status(429).json({
      success: false,
      error: {
        code: 'AI_RATE_LIMIT_EXCEEDED',
        message: 'AI request limit reached (20 req/min). Please slow down to preserve resources.'
      }
    });
  }

  next();
}

export function adminRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxLimit = 60;

  let entry = adminStore.get(ip);
  if (!entry || now > entry.resetTime) {
    entry = { count: 1, resetTime: now + windowMs };
    adminStore.set(ip, entry);
  } else {
    entry.count++;
  }

  if (entry.count > maxLimit) {
    return res.status(429).json({
      success: false,
      error: {
        code: 'ADMIN_RATE_LIMIT_EXCEEDED',
        message: 'Too many administrative requests. Please slow down.'
      }
    });
  }

  next();
}
