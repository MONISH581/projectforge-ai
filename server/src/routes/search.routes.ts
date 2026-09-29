import { Router, Response } from 'express';
import { db } from '../db/storage';
import { optionalAuth, AuthRequest } from '../middleware/auth';

export const searchRouter = Router();

// GET /api/search?q=query
searchRouter.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  const query = String(req.query.q || '').trim();
  if (!query || query.length < 2) {
    return res.status(200).json({
      success: true,
      data: {
        query,
        projects: [],
        tasks: [],
        technologies: [],
        skills: [],
        total: 0
      }
    });
  }

  const userId = req.user?._id;

  // Search Projects (Public or Owned)
  const projectFilter: any = {
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { tagline: { $regex: query, $options: 'i' } },
      { oneLineDescription: { $regex: query, $options: 'i' } },
      { category: { $regex: query, $options: 'i' } }
    ]
  };
  const projects = await db.projects.find(projectFilter, { limit: 10 });
  const visibleProjects = projects.filter(p => p.visibility === 'public' || p.userId === userId);

  // Search Technologies
  const technologies = await db.technologies.find(
    {
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } }
      ]
    },
    { limit: 8 }
  );

  // Search Tasks (if authenticated)
  let tasks: any[] = [];
  if (userId) {
    const userProjects = await db.projects.find({ userId });
    const userProjectIds = userProjects.map(p => p._id);
    tasks = await db.tasks.find(
      {
        projectId: { $in: userProjectIds },
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ]
      },
      { limit: 10 }
    );
  }

  // Search Skills Catalog
  const categories = await db.categories.find(
    {
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    },
    { limit: 5 }
  );

  const total = visibleProjects.length + technologies.length + tasks.length + categories.length;

  return res.status(200).json({
    success: true,
    data: {
      query,
      projects: visibleProjects.map(p => ({
        _id: p._id,
        name: p.name,
        slug: p.slug,
        tagline: p.tagline,
        category: p.category,
        difficulty: p.complexity?.difficulty
      })),
      technologies,
      tasks: tasks.map(t => ({
        _id: t._id,
        projectId: t.projectId,
        title: t.title,
        status: t.status,
        priority: t.priority
      })),
      categories,
      total
    }
  });
});
