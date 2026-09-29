import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import { runSeed } from './db/seed';
import { generalRateLimiter } from './middleware/rateLimiter';
import { requestAuditLogger } from './middleware/auditLogger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Route imports
import { authRouter } from './routes/auth.routes';
import { profileRouter } from './routes/profile.routes';
import { skillsRouter } from './routes/skills.routes';
import { projectsRouter } from './routes/projects.routes';
import { aiRouter } from './routes/ai.routes';
import { workspaceRouter } from './routes/workspace.routes';
import { portfolioRouter } from './routes/portfolio.routes';
import { notificationsRouter } from './routes/notifications.routes';
import { searchRouter } from './routes/search.routes';
import { analyticsRouter } from './routes/analytics.routes';
import { adminRouter } from './routes/admin.routes';

export const app = express();

// Security & Parsing Middleware
app.use(helmet({
  contentSecurityPolicy: false, // relaxed for local dev and embedded diagrams
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: true, // Allow frontend dev server and production origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Global rate limiting & telemetry audit
app.use(generalRateLimiter);
app.use(requestAuditLogger);

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      app: 'ProjectForge AI',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      aiProvider: config.ai.provider
    }
  });
});

// Mount API Routers
app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/skills', skillsRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/projects/:projectId', workspaceRouter);
app.use('/api/portfolio', portfolioRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/search', searchRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/admin', adminRouter);

// Serve static frontend build if it exists (for unified production deployment)
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req: Request, res: Response, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// 404 & Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start server function
export async function startServer() {
  try {
    // Run seed data check
    await runSeed(false);

    const server = app.listen(config.port, () => {
      console.log(`=======================================================`);
      console.log(`🚀 PROJECTFORGE AI SERVER INITIALIZED`);
      console.log(`📡 URL: http://localhost:${config.port}`);
      console.log(`🌍 Environment: ${config.nodeEnv}`);
      console.log(`🤖 AI Provider: ${config.ai.provider}`);
      console.log(`=======================================================`);
    });

    return server;
  } catch (err) {
    console.error('Failed to start ProjectForge server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}
