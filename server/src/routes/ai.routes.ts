import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/storage';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { aiRateLimiter } from '../middleware/rateLimiter';
import { logAiGeneration } from '../middleware/auditLogger';
import { aiEngine } from '../ai/generator';

export const aiRouter = Router();

const GenerateProjectRequestSchema = z.object({
  goal: z.string().min(3, 'Please describe what you want to build'),
  domain: z.string().default('Web Development'),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
  duration: z.string().default('1 month'),
  teamSize: z.string().default('Solo'),
  platform: z.string().default('Web'),
  objective: z.string().default('Portfolio'),
  preferredTech: z.string().optional()
});

// POST /api/ai/generate — Generates structured project proposal
aiRouter.post('/generate', authenticateToken, aiRateLimiter, async (req: AuthRequest, res: Response) => {
  const start = Date.now();
  const userId = req.user!._id;

  try {
    const params = GenerateProjectRequestSchema.parse(req.body);

    // Fetch user's registered skills
    const userSkills = await db.skills.find({ userId });
    const skillNames = userSkills.map(s => s.name);

    const result = await aiEngine.generateProject({
      ...params,
      userSkills: skillNames
    });

    const latency = Date.now() - start;
    await logAiGeneration({
      userId,
      type: 'project_discovery',
      provider: result.providerUsed,
      promptSnippet: params.goal,
      latencyMs: latency,
      success: true
    });

    return res.status(200).json({
      success: true,
      data: {
        project: result.project,
        providerUsed: result.providerUsed,
        latencyMs: latency
      }
    });
  } catch (err: any) {
    const latency = Date.now() - start;
    await logAiGeneration({
      userId,
      type: 'project_discovery',
      provider: 'error',
      promptSnippet: req.body?.goal || 'unknown',
      latencyMs: latency,
      success: false,
      errorMessage: err.message
    });

    return res.status(400).json({
      success: false,
      error: { code: 'AI_GENERATION_FAILED', message: err.message || 'Failed to generate project' }
    });
  }
});

// POST /api/ai/validate — Validates project idea with structured findings
aiRouter.post('/validate', authenticateToken, aiRateLimiter, async (req: AuthRequest, res: Response) => {
  const start = Date.now();
  const userId = req.user!._id;

  try {
    const { project } = req.body;
    if (!project || !project.name) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_PROJECT', message: 'Project data is required' } });
    }

    const userSkills = await db.skills.find({ userId });
    const result = await aiEngine.validateProject(project, userSkills);

    const latency = Date.now() - start;
    await logAiGeneration({
      userId,
      type: 'validation',
      provider: result.providerUsed,
      promptSnippet: `Validate ${project.name}`,
      latencyMs: latency,
      success: true
    });

    return res.status(200).json({
      success: true,
      data: {
        validation: result.report,
        providerUsed: result.providerUsed,
        latencyMs: latency
      }
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'VALIDATION_FAILED', message: err.message || 'Validation failed' }
    });
  }
});

// POST /api/ai/accept — Accepts project proposal and automatically initializes the entire workspace!
aiRouter.post('/accept', authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!._id;
  const { project } = req.body;

  if (!project || !project.name) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_DATA', message: 'Valid project object required' } });
  }

  try {
    const slug = project.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + `-${Date.now().toString().slice(-4)}`;

    // 1. Insert Project
    const savedProject = await db.projects.insertOne({
      userId,
      name: project.name,
      slug,
      tagline: project.tagline || '',
      oneLineDescription: project.oneLineDescription || '',
      detailedDescription: project.detailedDescription || '',
      problemStatement: project.problemStatement || '',
      targetUsers: project.targetUsers || [],
      existingPainPoints: project.existingPainPoints || [],
      proposedSolution: project.proposedSolution || '',
      keyDifferentiator: project.keyDifferentiator || '',
      expectedImpact: project.expectedImpact || '',
      features: project.features || { mvp: [], phase2: [], advanced: [] },
      techStack: project.techStack || { frontend: [], backend: [], database: [], ai: [], authentication: [], storage: [], hosting: [], monitoring: [] },
      complexity: project.complexity || { difficulty: 'intermediate', estimatedDuration: '4 weeks', teamSize: 'Solo', requiredSkills: [] },
      learningOpportunities: project.learningOpportunities || [],
      category: project.category || 'Web Development',
      domain: project.domain || 'Software Engineering',
      visibility: 'public',
      status: 'planning',
      version: 1,
      completionScore: 25,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const projectId = savedProject._id;

    // 2. Concurrently generate initial workspace artifacts:
    // Requirements, Architecture, Database, APIs, UI, Roadmap, Tasks, Test Cases, and Docs
    const [reqs, arch, database, apis, ui, roadmap, testCases] = await Promise.all([
      aiEngine.generateRequirements(savedProject),
      aiEngine.generateArchitecture(savedProject),
      aiEngine.generateDatabaseDesign(savedProject, (savedProject.techStack.database[0]?.toLowerCase().includes('mongo') ? 'mongodb' : 'postgresql')),
      aiEngine.generateApiDesign(savedProject),
      aiEngine.generateUIPlan(savedProject),
      aiEngine.generateRoadmap(savedProject),
      aiEngine.generateTestCases(savedProject)
    ]);

    // Save Requirements
    await db.project_requirements.insertOne({
      projectId,
      ...reqs.requirements,
      updatedAt: new Date().toISOString()
    });

    // Save Architecture
    await db.project_architecture.insertOne({
      projectId,
      ...arch.architecture,
      currentView: 'beginner',
      updatedAt: new Date().toISOString()
    });

    // Save Database
    await db.project_databases.insertOne({
      projectId,
      ...database.database,
      updatedAt: new Date().toISOString()
    });

    // Save APIs
    await db.project_apis.insertOne({
      projectId,
      ...apis.apis,
      updatedAt: new Date().toISOString()
    });

    // Save UI
    await db.project_ui.insertOne({
      projectId,
      ...ui.ui,
      updatedAt: new Date().toISOString()
    });

    // Save Roadmap
    await db.roadmaps.insertOne({
      projectId,
      ...roadmap.roadmap,
      updatedAt: new Date().toISOString()
    });

    // Populate Initial Tasks from Roadmap
    let taskOrder = 1;
    for (const phase of roadmap.roadmap.phases || []) {
      for (const taskTitle of phase.tasks || []) {
        await db.tasks.insertOne({
          projectId,
          title: taskTitle,
          description: `Deliverable for Phase ${phase.phaseNumber}: ${phase.title}`,
          status: phase.phaseNumber === 1 && taskOrder === 1 ? 'in_progress' : 'todo',
          priority: phase.phaseNumber <= 2 ? 'high' : 'medium',
          phaseNumber: phase.phaseNumber,
          estimatedHours: 4,
          dependencies: [],
          tags: phase.skillsRequired || [],
          order: taskOrder++,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }

    // Save Test Cases
    for (const tc of testCases.testCases || []) {
      await db.test_cases.insertOne({
        projectId,
        ...tc,
        updatedAt: new Date().toISOString()
      });
    }

    // Save Initial Documentation
    await db.documents.insertOne({
      projectId,
      readme: `# ${savedProject.name}\n\n> ${savedProject.tagline}\n\n${savedProject.detailedDescription}\n\n## Tech Stack\n- Frontend: ${savedProject.techStack.frontend.join(', ')}\n- Backend: ${savedProject.techStack.backend.join(', ')}\n- Database: ${savedProject.techStack.database.join(', ')}\n- AI: ${savedProject.techStack.ai?.join(', ') || 'N/A'}\n`,
      abstract: savedProject.oneLineDescription,
      problemStatement: savedProject.problemStatement,
      objectives: savedProject.learningOpportunities,
      scope: `MVP release with ${savedProject.features.mvp.length} core features.`,
      systemRequirements: 'Modern Web Browser, Node.js 18+ or Python 3.10+ depending on service.',
      architectureGuide: arch.architecture.beginnerArchitecture.overview,
      databaseGuide: `Managed via ${database.database.databaseType} with ${database.database.tables.length} schemas.`,
      apiGuide: `REST endpoints documented in the ProjectForge API Designer.`,
      testingReport: 'Baseline test suite initialized with automated unit, integration, and security scenarios.',
      futureEnhancements: savedProject.features.phase2,
      updatedAt: new Date().toISOString()
    });

    // Create Notification
    await db.notifications.insertOne({
      userId,
      title: `Project "${savedProject.name}" Workspace Initialized! 🎉`,
      message: 'Full architecture, database, APIs, tasks, and test cases have been generated for you.',
      type: 'milestone',
      read: false,
      link: `/workspace/${projectId}`,
      createdAt: new Date().toISOString()
    });

    return res.status(201).json({
      success: true,
      data: {
        projectId: savedProject._id,
        project: savedProject,
        message: 'Project accepted and workspace fully assembled!'
      }
    });
  } catch (err: any) {
    console.error('[AIAccept] Error assembling workspace:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'WORKSPACE_SETUP_FAILED', message: err.message || 'Failed to assemble workspace' }
    });
  }
});
