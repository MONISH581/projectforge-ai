import { Router, Response } from 'express';
import { db } from '../db/storage';
import { authenticateToken, AuthRequest } from '../middleware/auth';

export const analyticsRouter = Router();

// GET /api/analytics — Product & User Performance Metrics
analyticsRouter.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!._id;

  const userProjects = await db.projects.find({ userId });
  const userProjectIds = userProjects.map(p => p._id);
  const tasks = await db.tasks.find({ projectId: { $in: userProjectIds } });
  const testCases = await db.test_cases.find({ projectId: { $in: userProjectIds } });
  const aiLogs = await db.ai_generations.find({ userId });

  // Task breakdown by status
  const taskStatusCounts = {
    backlog: tasks.filter(t => t.status === 'backlog').length,
    todo: tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    review: tasks.filter(t => t.status === 'review').length,
    testing: tasks.filter(t => t.status === 'testing').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  const totalTasks = tasks.length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((taskStatusCounts.completed / totalTasks) * 100) : 0;

  // Category distribution
  const categoryCounts: Record<string, number> = {};
  for (const p of userProjects) {
    const cat = p.category || 'Other';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }

  // Difficulty distribution
  const difficultyCounts = {
    beginner: userProjects.filter(p => p.complexity?.difficulty === 'beginner').length,
    intermediate: userProjects.filter(p => p.complexity?.difficulty === 'intermediate').length,
    advanced: userProjects.filter(p => p.complexity?.difficulty === 'advanced').length,
  };

  // AI Usage summary
  const totalAiRequests = aiLogs.length;
  const avgLatency = totalAiRequests > 0
    ? Math.round(aiLogs.reduce((acc, log) => acc + log.latencyMs, 0) / totalAiRequests)
    : 0;

  return res.status(200).json({
    success: true,
    data: {
      summary: {
        totalProjects: userProjects.length,
        completedProjects: userProjects.filter(p => p.status === 'completed').length,
        inDevelopmentProjects: userProjects.filter(p => p.status === 'in_development').length,
        totalTasks,
        completedTasks: taskStatusCounts.completed,
        taskCompletionRate,
        totalTestCases: testCases.length,
        testsPassed: testCases.filter(t => t.status === 'pass').length,
        aiGenerationsCount: totalAiRequests,
        averageAiLatencyMs: avgLatency
      },
      taskStatusCounts,
      difficultyCounts,
      categoryCounts
    }
  });
});
