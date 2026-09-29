import { Router, Request, Response } from 'express';
import { db } from '../db/storage';
import { authenticateToken, optionalAuth, AuthRequest } from '../middleware/auth';

export const portfolioRouter = Router();

// GET /api/portfolio/:slug — Public Portfolio View
portfolioRouter.get('/:slug', optionalAuth, async (req: Request, res: Response) => {
  const slug = req.params.slug;

  const project = await db.projects.findOne({ slug });
  if (!project) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project portfolio not found' } });
  }

  // Check visibility: if private, only owner or admin can see it
  if (project.visibility === 'private') {
    const authUser = (req as any).user;
    if (!authUser || (authUser._id !== project.userId && authUser.role !== 'admin')) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'This project portfolio is private.' } });
    }
  }

  // Fetch developer profile
  const user = await db.users.findById(project.userId);
  const profile = await db.profiles.findOne({ userId: project.userId });
  const doc = await db.documents.findOne({ projectId: project._id });
  const arch = await db.project_architecture.findOne({ projectId: project._id });
  const tasks = await db.tasks.find({ projectId: project._id });
  const testCases = await db.test_cases.find({ projectId: project._id });

  let portfolioPage = await db.portfolio_pages.findOne({ projectId: project._id });
  if (!portfolioPage) {
    portfolioPage = await db.portfolio_pages.insertOne({
      projectId: project._id,
      userId: project.userId,
      slug: project.slug,
      isPublic: project.visibility !== 'private',
      featuredScreenshots: [],
      highlights: [
        `Engineered with ${project.techStack.frontend[0] || 'modern frontend'} and ${project.techStack.backend[0] || 'cloud backend'}`,
        `Designed modular database schema with complete validation`,
        `Comprehensive test suite passing`
      ],
      metrics: { views: 1, likes: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  } else {
    // Increment view count asynchronously
    await db.portfolio_pages.updateOne(
      { _id: portfolioPage._id },
      { $inc: { 'metrics.views': 1 } }
    );
  }

  return res.status(200).json({
    success: true,
    data: {
      project: {
        _id: project._id,
        name: project.name,
        slug: project.slug,
        tagline: project.tagline,
        oneLineDescription: project.oneLineDescription,
        detailedDescription: project.detailedDescription,
        problemStatement: project.problemStatement,
        proposedSolution: project.proposedSolution,
        features: project.features,
        techStack: project.techStack,
        complexity: project.complexity,
        category: project.category,
        domain: project.domain,
        githubUrl: project.githubUrl,
        liveDemoUrl: project.liveDemoUrl,
        completionScore: project.completionScore || 80,
        createdAt: project.createdAt
      },
      developer: {
        name: user?.name || 'Anonymous Student',
        avatarUrl: user?.avatarUrl,
        college: profile?.college || 'University',
        degree: profile?.degree || 'Computer Science',
        currentYear: profile?.currentYear || 'Senior',
        githubUrl: profile?.githubUrl,
        linkedinUrl: profile?.linkedinUrl
      },
      architecture: arch?.beginnerArchitecture,
      documentation: doc,
      taskStats: {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length
      },
      testStats: {
        total: testCases.length,
        passed: testCases.filter(t => t.status === 'pass').length
      },
      portfolioMeta: portfolioPage
    }
  });
});

// POST /api/portfolio/:slug/like — Increment like
portfolioRouter.post('/:slug/like', async (req: Request, res: Response) => {
  const slug = req.params.slug;
  const project = await db.projects.findOne({ slug });
  if (!project) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
  }

  await db.portfolio_pages.updateOne(
    { projectId: project._id },
    { $inc: { 'metrics.likes': 1 } }
  );

  const updated = await db.portfolio_pages.findOne({ projectId: project._id });
  return res.status(200).json({ success: true, data: { likes: updated?.metrics.likes || 1 } });
});

// PUT /api/portfolio/:projectId — Update portfolio page settings
portfolioRouter.put('/settings/:projectId', authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!._id;
  const projectId = req.params.projectId;

  const project = await db.projects.findById(projectId);
  if (!project || (project.userId !== userId && req.user!.role !== 'admin')) {
    return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not authorized' } });
  }

  const { isPublic, customHeadline, highlights, featuredScreenshots, githubUrl, liveDemoUrl } = req.body;

  if (githubUrl !== undefined || liveDemoUrl !== undefined) {
    await db.projects.updateOne(
      { _id: projectId },
      { $set: { githubUrl, liveDemoUrl, visibility: isPublic ? 'public' : 'private', updatedAt: new Date().toISOString() } }
    );
  }

  await db.portfolio_pages.updateOne(
    { projectId },
    {
      $set: {
        isPublic: Boolean(isPublic),
        customHeadline,
        highlights,
        featuredScreenshots,
        updatedAt: new Date().toISOString()
      }
    },
    { upsert: true }
  );

  const updated = await db.portfolio_pages.findOne({ projectId });
  return res.status(200).json({ success: true, data: updated });
});
