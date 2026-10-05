import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/storage';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import { logAdminAction } from '../middleware/auditLogger';
import { adminRateLimiter } from '../middleware/rateLimiter';

export const adminRouter = Router();

// Apply auth + requireAdmin + adminRateLimiter to all admin routes
adminRouter.use(authenticateToken, requireAdmin, adminRateLimiter);

// GET /api/admin/overview — Dashboard metrics and system status
adminRouter.get('/overview', async (_req: AuthRequest, res: Response) => {
  const [
    totalUsers,
    totalProjects,
    totalTasks,
    aiGenerations,
    allTechs,
    allCategories,
    recentLogs
  ] = await Promise.all([
    db.users.countDocuments(),
    db.projects.countDocuments(),
    db.tasks.countDocuments(),
    db.ai_generations.find({}, { limit: 100, sort: { createdAt: -1 } }),
    db.technologies.countDocuments(),
    db.categories.countDocuments(),
    db.admin_logs.find({}, { limit: 10, sort: { createdAt: -1 } })
  ]);

  const activeUsers = await db.users.countDocuments({ status: 'active' });
  const completedProjects = await db.projects.countDocuments({ status: 'completed' });

  // AI Usage summary
  const totalAiRequests = aiGenerations.length;
  const successfulAi = aiGenerations.filter(g => g.success).length;
  const avgLatency = totalAiRequests > 0
    ? Math.round(aiGenerations.reduce((acc, g) => acc + g.latencyMs, 0) / totalAiRequests)
    : 0;

  return res.status(200).json({
    success: true,
    data: {
      metrics: {
        totalUsers,
        activeUsers,
        totalProjects,
        completedProjects,
        totalTasks,
        totalTechnologies: allTechs,
        totalCategories: allCategories,
        aiRequests: totalAiRequests,
        aiSuccessRate: totalAiRequests > 0 ? Math.round((successfulAi / totalAiRequests) * 100) : 100,
        averageAiLatencyMs: avgLatency
      },
      systemHealth: {
        apiServer: 'healthy',
        databaseEngine: 'connected',
        aiService: 'operational',
        uptimeSeconds: Math.round(process.uptime()),
        memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
      },
      recentLogs
    }
  });
});

// GET /api/admin/users — List & search users
adminRouter.get('/users', async (req: AuthRequest, res: Response) => {
  const search = String(req.query.search || '');
  let filter: any = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const users = await db.users.find(filter, { sort: { createdAt: -1 }, limit: 50 });
  const sanitized = users.map(u => ({
    _id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    isOnboarded: u.isOnboarded,
    status: u.status,
    createdAt: u.createdAt
  }));

  return res.status(200).json({ success: true, data: sanitized });
});

// PUT /api/admin/users/:id/status — Suspend or reactivate user
adminRouter.put('/users/:id/status', async (req: AuthRequest, res: Response) => {
  const targetId = req.params.id;
  const { status } = req.body;

  if (status !== 'active' && status !== 'suspended') {
    return res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Status must be active or suspended' } });
  }

  await db.users.updateOne(
    { _id: targetId },
    { $set: { status, updatedAt: new Date().toISOString() } }
  );

  await logAdminAction(req.user!._id, 'USER_STATUS_CHANGE', { targetId, status }, targetId, req.ip);

  return res.status(200).json({ success: true, data: { message: `User marked as ${status}` } });
});

// GET /api/admin/projects — List projects with admin controls
adminRouter.get('/projects', async (req: AuthRequest, res: Response) => {
  const projects = await db.projects.find({}, { sort: { createdAt: -1 }, limit: 50 });
  return res.status(200).json({ success: true, data: projects });
});

// PUT /api/admin/projects/:id/feature — Toggle featured status
adminRouter.put('/projects/:id/feature', async (req: AuthRequest, res: Response) => {
  const project = await db.projects.findById(req.params.id);
  if (!project) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
  }

  const newFeatured = !project.isFeatured;
  await db.projects.updateOne(
    { _id: project._id },
    { $set: { isFeatured: newFeatured, updatedAt: new Date().toISOString() } }
  );

  await logAdminAction(req.user!._id, 'TOGGLE_FEATURED_PROJECT', { projectId: project._id, isFeatured: newFeatured }, project._id, req.ip);

  return res.status(200).json({ success: true, data: { isFeatured: newFeatured } });
});

// -------------------------------------------------------------
// TECHNOLOGIES CRUD
// -------------------------------------------------------------
adminRouter.get('/technologies', async (_req: AuthRequest, res: Response) => {
  const techs = await db.technologies.find({}, { sort: { name: 1 } });
  return res.status(200).json({ success: true, data: techs });
});

adminRouter.post('/technologies', async (req: AuthRequest, res: Response) => {
  const { name, category, description, iconName, popular } = req.body;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const created = await db.technologies.insertOne({
    name,
    slug,
    category: category || 'programming',
    description: description || '',
    iconName: iconName || 'Code',
    popular: Boolean(popular)
  });

  await logAdminAction(req.user!._id, 'CREATE_TECHNOLOGY', { name, slug }, created._id, req.ip);
  return res.status(201).json({ success: true, data: created });
});

adminRouter.put('/technologies/:id', async (req: AuthRequest, res: Response) => {
  const { name, category, description, iconName, popular } = req.body;
  const existing = await db.technologies.findById(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Technology not found' } });
  }

  const updateData: any = {};
  if (name !== undefined) {
    updateData.name = name;
    updateData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }
  if (category !== undefined) updateData.category = category;
  if (description !== undefined) updateData.description = description;
  if (iconName !== undefined) updateData.iconName = iconName;
  if (popular !== undefined) updateData.popular = Boolean(popular);

  await db.technologies.updateOne({ _id: req.params.id }, { $set: updateData });
  const updated = await db.technologies.findById(req.params.id);

  await logAdminAction(req.user!._id, 'UPDATE_TECHNOLOGY', { techId: req.params.id, ...updateData }, req.params.id, req.ip);
  return res.status(200).json({ success: true, data: updated });
});

adminRouter.delete('/technologies/:id', async (req: AuthRequest, res: Response) => {
  await db.technologies.deleteOne({ _id: req.params.id });
  await logAdminAction(req.user!._id, 'DELETE_TECHNOLOGY', { techId: req.params.id }, req.params.id, req.ip);
  return res.status(200).json({ success: true, data: { message: 'Technology deleted' } });
});

// -------------------------------------------------------------
// CATEGORIES CRUD
// -------------------------------------------------------------
adminRouter.get('/categories', async (_req: AuthRequest, res: Response) => {
  const categories = await db.categories.find({}, { sort: { name: 1 } });
  return res.status(200).json({ success: true, data: categories });
});

adminRouter.post('/categories', async (req: AuthRequest, res: Response) => {
  const { name, description, iconName } = req.body;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const created = await db.categories.insertOne({
    name,
    slug,
    description: description || '',
    iconName: iconName || 'Folder',
    projectCount: 0
  });

  await logAdminAction(req.user!._id, 'CREATE_CATEGORY', { name, slug }, created._id, req.ip);
  return res.status(201).json({ success: true, data: created });
});

adminRouter.put('/categories/:id', async (req: AuthRequest, res: Response) => {
  const { name, description, iconName } = req.body;
  const existing = await db.categories.findById(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } });
  }

  const updateData: any = {};
  if (name !== undefined) {
    updateData.name = name;
    updateData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }
  if (description !== undefined) updateData.description = description;
  if (iconName !== undefined) updateData.iconName = iconName;

  await db.categories.updateOne({ _id: req.params.id }, { $set: updateData });
  const updated = await db.categories.findById(req.params.id);

  await logAdminAction(req.user!._id, 'UPDATE_CATEGORY', { catId: req.params.id, ...updateData }, req.params.id, req.ip);
  return res.status(200).json({ success: true, data: updated });
});

adminRouter.delete('/categories/:id', async (req: AuthRequest, res: Response) => {
  await db.categories.deleteOne({ _id: req.params.id });
  await logAdminAction(req.user!._id, 'DELETE_CATEGORY', { catId: req.params.id }, req.params.id, req.ip);
  return res.status(200).json({ success: true, data: { message: 'Category deleted' } });
});

// -------------------------------------------------------------
// AI USAGE & TELEMETRY
// -------------------------------------------------------------
adminRouter.get('/ai-usage', async (_req: AuthRequest, res: Response) => {
  const logs = await db.ai_generations.find({}, { sort: { createdAt: -1 }, limit: 100 });
  return res.status(200).json({ success: true, data: logs });
});
