import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/storage';
import { authenticateToken, optionalAuth, AuthRequest } from '../middleware/auth';
import { Project } from '../models/types';

export const projectsRouter = Router();

// Helper to compute readiness score (0-100) based on actual modules
export async function calculateProjectReadiness(projectId: string): Promise<{
  score: number;
  breakdown: {
    requirements: boolean;
    architecture: boolean;
    database: boolean;
    apis: boolean;
    ui: boolean;
    roadmap: boolean;
    tasksTotal: number;
    tasksCompleted: number;
    testsTotal: number;
    testsPassed: number;
    documentation: boolean;
  };
}> {
  const reqs = await db.project_requirements.findOne({ projectId });
  const arch = await db.project_architecture.findOne({ projectId });
  const database = await db.project_databases.findOne({ projectId });
  const apis = await db.project_apis.findOne({ projectId });
  const ui = await db.project_ui.findOne({ projectId });
  const roadmap = await db.roadmaps.findOne({ projectId });
  const tasks = await db.tasks.find({ projectId });
  const testCases = await db.test_cases.find({ projectId });
  const doc = await db.documents.findOne({ projectId });

  const tasksCompleted = tasks.filter(t => t.status === 'completed').length;
  const testsPassed = testCases.filter(t => t.status === 'pass').length;

  let points = 0;
  if (reqs && reqs.functional?.length > 0) points += 10;
  if (arch && arch.beginnerArchitecture) points += 10;
  if (database && database.tables?.length > 0) points += 10;
  if (apis && apis.endpoints?.length > 0) points += 10;
  if (ui && ui.screens?.length > 0) points += 10;
  if (roadmap && roadmap.phases?.length > 0) points += 10;
  if (tasks.length > 0) {
    const taskScore = Math.min(20, Math.round((tasksCompleted / tasks.length) * 20));
    points += taskScore;
  }
  if (testCases.length > 0) {
    const testScore = Math.min(10, Math.round((testsPassed / testCases.length) * 10));
    points += testScore;
  }
  if (doc && doc.readme) points += 10;

  return {
    score: Math.min(100, points),
    breakdown: {
      requirements: Boolean(reqs && reqs.functional?.length > 0),
      architecture: Boolean(arch && arch.beginnerArchitecture),
      database: Boolean(database && database.tables?.length > 0),
      apis: Boolean(apis && apis.endpoints?.length > 0),
      ui: Boolean(ui && ui.screens?.length > 0),
      roadmap: Boolean(roadmap && roadmap.phases?.length > 0),
      tasksTotal: tasks.length,
      tasksCompleted,
      testsTotal: testCases.length,
      testsPassed,
      documentation: Boolean(doc && doc.readme)
    }
  };
}

// GET /api/projects/dashboard-stats — Student Dashboard metrics
projectsRouter.get('/dashboard-stats', authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!._id;

  const userProjects = await db.projects.find({ userId });
  const totalCreated = userProjects.length;
  const completedProjects = userProjects.filter(p => p.status === 'completed').length;
  const activeProjects = userProjects.filter(p => p.status === 'in_development' || p.status === 'planning').length;

  // Total completed tasks across user's projects
  const userProjectIds = userProjects.map(p => p._id);
  const allTasks = await db.tasks.find({ projectId: { $in: userProjectIds } });
  const completedTasksCount = allTasks.filter(t => t.status === 'completed').length;

  // Active / featured project
  const currentProject = userProjects.find(p => p.status === 'in_development') || userProjects[0] || null;
  let currentProjectStats = null;
  if (currentProject) {
    const readiness = await calculateProjectReadiness(currentProject._id);
    const nextTask = allTasks.find(t => t.projectId === currentProject._id && t.status !== 'completed');
    currentProjectStats = {
      project: currentProject,
      progress: readiness.score,
      readinessBreakdown: readiness.breakdown,
      nextTask: nextTask ? { id: nextTask._id, title: nextTask.title, priority: nextTask.priority } : null
    };
  }

  // AI recommendations based on user skills
  const skills = await db.skills.find({ userId });
  const skillNames = skills.map(s => s.name);
  const recommendations: string[] = [];

  if (skillNames.includes('Python') && skillNames.includes('React')) {
    recommendations.push('Based on your Python + React skills, you are primed for a high-impact AI web application.');
  }
  if (skills.some(s => s.category === 'frontend') && !skills.some(s => s.category === 'backend')) {
    recommendations.push('Your frontend skills are stronger than backend. Consider building a project with FastAPI or Express to practice REST APIs.');
  }
  if (skills.length === 0) {
    recommendations.push('Add your technical skills in your Profile to unlock intelligent project matching.');
  } else {
    recommendations.push(`Explore projects matching your top skills: ${skillNames.slice(0, 3).join(', ')}.`);
  }

  return res.status(200).json({
    success: true,
    data: {
      stats: {
        projectsCreated: totalCreated,
        projectsCompleted: completedProjects,
        activeProjects,
        tasksCompleted: completedTasksCount,
        ideasSaved: totalCreated
      },
      currentProject: currentProjectStats,
      recommendations
    }
  });
});

// GET /api/projects/discover — Project Marketplace & Discovery
projectsRouter.get('/discover', optionalAuth, async (req: AuthRequest, res: Response) => {
  const { category, difficulty, search, tech } = req.query;
  const user = req.user;

  let filter: any = { visibility: 'public' };
  if (category && category !== 'all') {
    filter.category = { $regex: String(category), $options: 'i' };
  }
  if (difficulty && difficulty !== 'all') {
    filter['complexity.difficulty'] = String(difficulty);
  }
  if (search) {
    const term = String(search);
    filter.$or = [
      { name: { $regex: term, $options: 'i' } },
      { tagline: { $regex: term, $options: 'i' } },
      { oneLineDescription: { $regex: term, $options: 'i' } },
      { category: { $regex: term, $options: 'i' } },
      { 'techStack.frontend': { $in: [term] } },
      { 'techStack.backend': { $in: [term] } }
    ];
  }

  const projects = await db.projects.find(filter, { sort: { createdAt: -1 }, limit: 50 });

  // If user is logged in, attach skill match intelligence
  let userSkillNames: string[] = [];
  if (user) {
    const userSkills = await db.skills.find({ userId: user._id });
    userSkillNames = userSkills.map(s => s.name.toLowerCase());
  }

  const enrichedProjects = projects.map(p => {
    const projectTech = [
      ...(p.techStack.frontend || []),
      ...(p.techStack.backend || []),
      ...(p.techStack.database || []),
      ...(p.techStack.ai || [])
    ];

    const matched = projectTech.filter(t => userSkillNames.some(s => t.toLowerCase().includes(s)));
    return {
      ...p,
      skillMatch: {
        count: matched.length,
        skills: matched,
        explanation: matched.length > 0
          ? `Matches ${matched.length} of your skills (${matched.slice(0, 3).join(', ')})`
          : 'Great project to learn a fresh technology stack'
      }
    };
  });

  return res.status(200).json({
    success: true,
    data: {
      projects: enrichedProjects,
      total: enrichedProjects.length
    }
  });
});

// GET /api/projects — List user projects
projectsRouter.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!._id;
  const projects = await db.projects.find({ userId }, { sort: { updatedAt: -1 } });

  // Attach dynamic readiness score
  const withScores = await Promise.all(
    projects.map(async p => {
      const readiness = await calculateProjectReadiness(p._id);
      return {
        ...p,
        completionScore: readiness.score,
        readinessBreakdown: readiness.breakdown
      };
    })
  );

  return res.status(200).json({ success: true, data: withScores });
});

// GET /api/projects/:id — Get single project with workspace status
projectsRouter.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!._id;
  const project = await db.projects.findById(req.params.id);

  if (!project) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
  }

  // Security check: only owner or public project can be read; admin can read any
  if (project.userId !== userId && project.visibility === 'private' && req.user!.role !== 'admin') {
    return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied to private project.' } });
  }

  const readiness = await calculateProjectReadiness(project._id);

  return res.status(200).json({
    success: true,
    data: {
      ...project,
      completionScore: readiness.score,
      readinessBreakdown: readiness.breakdown
    }
  });
});

// POST /api/projects — Create project
projectsRouter.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const body = req.body;

    const slug = (body.name || 'project')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + `-${Date.now().toString().slice(-4)}`;

    const newProject = await db.projects.insertOne({
      userId,
      name: body.name || 'Untitled Project',
      slug,
      tagline: body.tagline || '',
      oneLineDescription: body.oneLineDescription || '',
      detailedDescription: body.detailedDescription || '',
      problemStatement: body.problemStatement || '',
      targetUsers: body.targetUsers || [],
      existingPainPoints: body.existingPainPoints || [],
      proposedSolution: body.proposedSolution || '',
      keyDifferentiator: body.keyDifferentiator || '',
      expectedImpact: body.expectedImpact || '',
      features: body.features || { mvp: [], phase2: [], advanced: [] },
      techStack: body.techStack || { frontend: [], backend: [], database: [], ai: [], authentication: [], storage: [], hosting: [], monitoring: [] },
      complexity: body.complexity || { difficulty: 'intermediate', estimatedDuration: '4 weeks', teamSize: 'Solo', requiredSkills: [] },
      learningOpportunities: body.learningOpportunities || [],
      category: body.category || 'Web Development',
      domain: body.domain || 'Software Engineering',
      visibility: body.visibility || 'public',
      status: 'planning',
      version: 1,
      completionScore: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return res.status(201).json({ success: true, data: newProject });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// PUT /api/projects/:id — Update project
projectsRouter.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!._id;
  const project = await db.projects.findById(req.params.id);

  if (!project) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
  }

  if (project.userId !== userId && req.user!.role !== 'admin') {
    return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not authorized to edit this project' } });
  }

  await db.projects.updateOne(
    { _id: project._id },
    { $set: { ...req.body, updatedAt: new Date().toISOString() } }
  );

  const updated = await db.projects.findById(project._id);
  return res.status(200).json({ success: true, data: updated });
});

// DELETE /api/projects/:id — Delete project and cascaded records
projectsRouter.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!._id;
  const projectId = req.params.id;
  const project = await db.projects.findById(projectId);

  if (!project) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
  }

  if (project.userId !== userId && req.user!.role !== 'admin') {
    return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not authorized to delete this project' } });
  }

  // Cascade deletion across child collections
  await Promise.all([
    db.projects.deleteOne({ _id: projectId }),
    db.project_requirements.deleteMany({ projectId }),
    db.project_architecture.deleteMany({ projectId }),
    db.project_databases.deleteMany({ projectId }),
    db.project_apis.deleteMany({ projectId }),
    db.project_ui.deleteMany({ projectId }),
    db.roadmaps.deleteMany({ projectId }),
    db.tasks.deleteMany({ projectId }),
    db.ai_conversations.deleteMany({ projectId }),
    db.test_cases.deleteMany({ projectId }),
    db.documents.deleteMany({ projectId }),
    db.portfolio_pages.deleteMany({ projectId })
  ]);

  return res.status(200).json({ success: true, data: { message: 'Project and all workspace data deleted successfully' } });
});

// POST /api/projects/:id/fork — Clone/fork public template or project into user workspace
projectsRouter.post('/:id/fork', authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!._id;
  const sourceProject = await db.projects.findById(req.params.id);

  if (!sourceProject) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
  }

  // Security check: only public projects or projects owned by user/admin can be forked
  if (sourceProject.visibility === 'private' && sourceProject.userId !== userId && req.user!.role !== 'admin') {
    return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Cannot fork private project.' } });
  }

  const slug = `${sourceProject.slug}-fork-${Date.now().toString().slice(-4)}`;
  const forkedProject = await db.projects.insertOne({
    userId,
    name: `${sourceProject.name} (My Copy)`,
    slug,
    tagline: sourceProject.tagline,
    oneLineDescription: sourceProject.oneLineDescription,
    detailedDescription: sourceProject.detailedDescription,
    problemStatement: sourceProject.problemStatement,
    targetUsers: [...sourceProject.targetUsers],
    existingPainPoints: [...sourceProject.existingPainPoints],
    proposedSolution: sourceProject.proposedSolution,
    keyDifferentiator: sourceProject.keyDifferentiator,
    expectedImpact: sourceProject.expectedImpact,
    features: JSON.parse(JSON.stringify(sourceProject.features)),
    techStack: JSON.parse(JSON.stringify(sourceProject.techStack)),
    complexity: JSON.parse(JSON.stringify(sourceProject.complexity)),
    learningOpportunities: [...sourceProject.learningOpportunities],
    category: sourceProject.category,
    domain: sourceProject.domain,
    visibility: 'private',
    status: 'in_development',
    version: 1,
    completionScore: sourceProject.completionScore || 50,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const newId = forkedProject._id;
  const oldId = sourceProject._id;

  // Duplicate workspace modules
  const [reqs, arch, database, apis, ui, roadmap, tasks, testCases, doc] = await Promise.all([
    db.project_requirements.findOne({ projectId: oldId }),
    db.project_architecture.findOne({ projectId: oldId }),
    db.project_databases.findOne({ projectId: oldId }),
    db.project_apis.findOne({ projectId: oldId }),
    db.project_ui.findOne({ projectId: oldId }),
    db.roadmaps.findOne({ projectId: oldId }),
    db.tasks.find({ projectId: oldId }),
    db.test_cases.find({ projectId: oldId }),
    db.documents.findOne({ projectId: oldId })
  ]);

  const insertPromises: Promise<any>[] = [];

  if (reqs) {
    const { _id, ...rest } = reqs;
    insertPromises.push(db.project_requirements.insertOne({ ...rest, projectId: newId, updatedAt: new Date().toISOString() }));
  }
  if (arch) {
    const { _id, ...rest } = arch;
    insertPromises.push(db.project_architecture.insertOne({ ...rest, projectId: newId, updatedAt: new Date().toISOString() }));
  }
  if (database) {
    const { _id, ...rest } = database;
    insertPromises.push(db.project_databases.insertOne({ ...rest, projectId: newId, updatedAt: new Date().toISOString() }));
  }
  if (apis) {
    const { _id, ...rest } = apis;
    insertPromises.push(db.project_apis.insertOne({ ...rest, projectId: newId, updatedAt: new Date().toISOString() }));
  }
  if (ui) {
    const { _id, ...rest } = ui;
    insertPromises.push(db.project_ui.insertOne({ ...rest, projectId: newId, updatedAt: new Date().toISOString() }));
  }
  if (roadmap) {
    const { _id, ...rest } = roadmap;
    insertPromises.push(db.roadmaps.insertOne({ ...rest, projectId: newId, updatedAt: new Date().toISOString() }));
  }
  if (tasks.length > 0) {
    for (const t of tasks) {
      const { _id, ...rest } = t;
      insertPromises.push(db.tasks.insertOne({ ...rest, projectId: newId, status: 'todo', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }));
    }
  }
  if (testCases.length > 0) {
    for (const tc of testCases) {
      const { _id, ...rest } = tc;
      insertPromises.push(db.test_cases.insertOne({ ...rest, projectId: newId, status: 'untested', updatedAt: new Date().toISOString() }));
    }
  }
  if (doc) {
    const { _id, ...rest } = doc;
    insertPromises.push(db.documents.insertOne({ ...rest, projectId: newId, updatedAt: new Date().toISOString() }));
  }

  await Promise.all(insertPromises);

  return res.status(201).json({
    success: true,
    data: {
      projectId: newId,
      project: forkedProject,
      message: `Successfully cloned "${sourceProject.name}" into your workspace!`
    }
  });
});
