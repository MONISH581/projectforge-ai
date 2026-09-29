import { Request, Response, NextFunction } from 'express';
import { db } from '../db/storage';

export function requestAuditLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const userId = (req as any).user?._id || 'unauthenticated';

    // Log to memory/file asynchronously
    db.usage_logs.insertOne({
      userId,
      endpoint: req.originalUrl || req.url,
      method: req.method,
      statusCode: res.statusCode,
      responseTimeMs: duration,
      createdAt: new Date().toISOString()
    }).catch(err => {
      // Non-blocking log failure
      console.warn('[AuditLogger] Failed to write usage log:', err);
    });
  });

  next();
}

export async function logAdminAction(adminId: string, action: string, details: Record<string, any>, targetId?: string, ipAddress?: string) {
  try {
    await db.admin_logs.insertOne({
      adminId,
      action,
      targetId,
      details,
      ipAddress,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('[AuditLogger] Failed to write admin audit log:', err);
  }
}

export async function logAiGeneration(params: {
  userId: string;
  projectId?: string;
  type: any;
  provider: string;
  promptSnippet: string;
  latencyMs: number;
  success: boolean;
  tokensUsed?: number;
  errorMessage?: string;
}) {
  try {
    await db.ai_generations.insertOne({
      ...params,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('[AuditLogger] Failed to write AI generation log:', err);
  }
}
