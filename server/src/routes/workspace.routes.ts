import { Router, Response } from 'express';
import { db } from '../db/storage';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { aiEngine } from '../ai/generator';
import { v4 as uuidv4 } from 'uuid';

export const workspaceRouter = Router({ mergeParams: true });

// Authorization middleware helper to ensure user owns project or is admin
async function verifyProjectAccess(req: AuthRequest, res: Response): Promise<{ project: any; hasAccess: boolean }> {
  const projectId = req.params.projectId;
  const project = await db.projects.findById(projectId);

  if (!project) {
    res.status(404).json({ success: false, error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' } });
    return { project: null, hasAccess: false };
  }

  if (project.userId !== req.user!._id && req.user!.role !== 'admin') {
    res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied to this project.' } });
    return { project: null, hasAccess: false };
  }

  return { project, hasAccess: true };
}

// -------------------------------------------------------------
// 1. REQUIREMENTS
// -------------------------------------------------------------
workspaceRouter.get('/requirements', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { hasAccess } = await verifyProjectAccess(req, res);
  if (!hasAccess) return;

  const reqs = await db.project_requirements.findOne({ projectId: req.params.projectId });
  return res.status(200).json({ success: true, data: reqs });
});

workspaceRouter.put('/requirements', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { hasAccess } = await verifyProjectAccess(req, res);
  if (!hasAccess) return;

  await db.project_requirements.updateOne(
    { projectId: req.params.projectId },
    { $set: { ...req.body, updatedAt: new Date().toISOString() } },
    { upsert: true }
  );

  const updated = await db.project_requirements.findOne({ projectId: req.params.projectId });
  return res.status(200).json({ success: true, data: updated });
});

workspaceRouter.post('/requirements/regenerate', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { project, hasAccess } = await verifyProjectAccess(req, res);
  if (!hasAccess) return;

  const result = await aiEngine.generateRequirements(project);
  await db.project_requirements.updateOne(
    { projectId: project._id },
    { $set: { ...result.requirements, updatedAt: new Date().toISOString() } },
    { upsert: true }
  );

  const updated = await db.project_requirements.findOne({ projectId: project._id });
  return res.status(200).json({ success: true, data: updated, providerUsed: result.providerUsed });
});

// -------------------------------------------------------------
// 2. ARCHITECTURE
// -------------------------------------------------------------
workspaceRouter.get('/architecture', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { hasAccess } = await verifyProjectAccess(req, res);
  if (!hasAccess) return;

  const arch = await db.project_architecture.findOne({ projectId: req.params.projectId });
  return res.status(200).json({ success: true, data: arch });
});

workspaceRouter.put('/architecture', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { hasAccess } = await verifyProjectAccess(req, res);
  if (!hasAccess) return;

  await db.project_architecture.updateOne(
    { projectId: req.params.projectId },
    { $set: { ...req.body, updatedAt: new Date().toISOString() } },
    { upsert: true }
  );

  const updated = await db.project_architecture.findOne({ projectId: req.params.projectId });
  return res.status(200).json({ success: true, data: updated });
});

workspaceRouter.post('/architecture/regenerate', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { project, hasAccess } = await verifyProjectAccess(req, res);
  if (!hasAccess) return;

  const result = await aiEngine.generateArchitecture(project);
  await db.project_architecture.updateOne(
    { projectId: project._id },
    { $set: { ...result.architecture, updatedAt: new Date().toISOString() } },
    { upsert: true }
  );

  const updated = await db.project_architecture.findOne({ projectId: project._id });
  return res.status(200).json({ success: true, data: updated, providerUsed: result.providerUsed });
});

// -------------------------------------------------------------
// 3. DATABASE DESIGNER
// -------------------------------------------------------------
workspaceRouter.get('/database', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { hasAccess } = await verifyProjectAccess(req, res);
  if (!hasAccess) return;

  const database = await db.project_databases.findOne({ projectId: req.params.projectId });
  return res.status(200).json({ success: true, data: database });
});

workspaceRouter.put('/database', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { hasAccess } = await verifyProjectAccess(req, res);
  if (!hasAccess) return;

  await db.project_databases.updateOne(
    { projectId: req.params.projectId },
    { $set: { ...req.body, updatedAt: new Date().toISOString() } },
    { upsert: true }
  );

  const updated = await db.project_databases.findOne({ projectId: req.params.projectId });
  return res.status(200).json({ success: true, data: updated });
});

workspaceRouter.post('/database/regenerate', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { project, hasAccess } = await verifyProjectAccess(req, res);
  if (!hasAccess) return;

  const dbType = req.body?.dbType || 'mongodb';
  const result = await aiEngine.generateDatabaseDesign(project, dbType);

  await db.project_databases.updateOne(
    { projectId: project._id },
    { $set: { ...result.database, updatedAt: new Date().toISOString() } },
    { upsert: true }
  );

  const updated = await db.project_databases.findOne({ projectId: project._id });
  return res.status(200).json({ success: true, data: updated, providerUsed: result.providerUsed });
});

// -------------------------------------------------------------
// 4. API DESIGNER
// -------------------------------------------------------------
workspaceRouter.get('/apis', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { hasAccess } = await verifyProjectAccess(req, res);
  if (!hasAccess) return;

  const apis = await db.project_apis.findOne({ projectId: req.params.projectId });
  return res.status(200).json({ success: true, data: apis });
});

workspaceRouter.put('/apis', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { hasAccess } = await verifyProjectAccess(req, res);
  if (!hasAccess) return;

  await db.project_apis.updateOne(
    { projectId: req.params.projectId },
    { $set: { ...req.body, updatedAt: new Date().toISOString() } },
    { upsert: true }
  );

  const updated = await db.project_apis.findOne({ projectId: req.params.projectId });
  return res.status(200).json({ success: true, data: updated });
});

workspaceRouter.post('/apis/regenerate', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { project, hasAccess } = await verifyProjectAccess(req, res);
  if (!hasAccess) return;

  const result = await aiEngine.generateApiDesign(project);
  await db.project_apis.updateOne(
    { projectId: project._id },
    { $set: { ...result.apis, updatedAt: new Date().toISOString() } },
    { upsert: true }
  );

  const updated = await db.project_apis.findOne({ projectId: project._id });
  return res.status(200).json({ success: true, data: updated, providerUsed: result.providerUsed });
});

// -------------------------------------------------------------
// 5. UI/UX PLANNER
// -------------------------------------------------------------
workspaceRouter.get('/ui', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { hasAccess } = await verifyProjectAccess(req, res);
  if (!hasAccess) return;

  const ui = await db.project_ui.findOne({ projectId: req.params.projectId });
  return res.status(200).json({ success: true, data: ui });
});

workspaceRouter.put('/ui', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { hasAccess } = await verifyProjectAccess(req, res);
  if (!hasAccess) return;

  await db.project_ui.updateOne(
    { projectId: req.params.projectId },
    { $set: { ...req.body, updatedAt: new Date().toISOString() } },
    { upsert: true }
  );

  const updated = await db.project_ui.findOne({ projectId: req.params.projectId });
  return res.status(200).json({ success: true, data: updated });
});

workspaceRouter.post('/ui/regenerate', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { project, hasAccess } = await verifyProjectAccess(req, res);
  if (!hasAccess) return;

  const result = await aiEngine.generateUIPlan(project);
  await db.project_ui.updateOne(
    { projectId: project._id },
    { $set: { ...result.ui, updatedAt: new Date().toISOString() } },
    { upsert: true }
  );

  const updated = await db.project_ui.findOne({ projectId: project._id });
  return res.status(200).json({ success: true, data: updated, providerUsed: result.providerUsed });
});

// -------------------------------------------------------------
// 6. DEVELOPMENT ROADMAP
// -------------------------------------------------------------
workspaceRouter.get('/roadmap', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { hasAccess } = await verifyProjectAccess(req, res);
  if (!hasAccess) return;

  const roadmap = await db.roadmaps.findOne({ projectId: req.params.projectId });
  return res.status(200).json({ success: true, data: roadmap });
});

workspaceRouter.put('/roadmap', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { hasAccess } = await verifyProjectAccess(req, res);
  if (!hasAccess) return;

  await db.roadmaps.updateOne(
    { projectId: req.params.projectId },
    { $set: { ...req.body, updatedAt: new Date().toISOString() } },
    { upsert: true }
  );

  const updated = await db.roadmaps.findOne({ projectId: req.params.projectId });
  return res.status(200).json({ success: true, data: updated });
});

workspaceRouter.post('/roadmap/regenerate', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { project, hasAccess } = await verifyProjectAccess(req, res);
  if (!hasAccess) return;

  const result = await aiEngine.generateRoadmap(project);
  await db.roadmaps.updateOne(
    { projectId: project._id },
    { $set: { ...result.roadmap, updatedAt: new Date().toISOString() } },
    { upsert: true }
  );

  const updated = await db.roadmaps.findOne({ projectId: project._id });
  return res.status(200).json({ success: true, data: updated, providerUsed: result.providerUsed });
});

// -------------------------------------------------------------
// 7. TASK MANAGEMENT
// -------------------------------------------------------------
workspaceRouter.get('/tasks', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { hasAccess } = await verifyProjectAccess(req, res);
  if (!hasAccess) return;

  const tasks = await db.tasks.find({ projectId: req.params.projectId }, { sort: { order: 1 } });
  return res.status(200).json({ success: true, data: tasks });
});

workspaceRouter.post('/tasks', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { hasAccess } = await verifyProjectAccess(req, res);
  if (!hasAccess) return;

  const existingCount = await db.tasks.countDocuments({ projectId: req.params.projectId });
  const task = await db.tasks.insertOne({
    projectId: req.params.projectId,
    title: req.body.title || 'New Task',
    description: req.body.description || '',
    status: req.body.status || 'todo',
    priority: req.body.priority || 'medium',
    phaseNumber: req.body.phaseNumber || 1,
    estimatedHours: req.body.estimatedHours || 3,
    dependencies: req.body.dependencies || [],
    tags: req.body.tags || [],
    order: existingCount + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  return res.status(201).json({ success: true, data: task });
});

workspaceRouter.put('/tasks/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { hasAccess } = await verifyProjectAccess(req, res);
  if (!hasAccess) return;

  const taskId = req.params.id;
  await db.tasks.updateOne(
    { _id: taskId, projectId: req.params.projectId },
    { $set: { ...req.body, updatedAt: new Date().toISOString() } }
  );

  const updated = await db.tasks.findById(taskId);
  return res.status(200).json({ success: true, data: updated });
});

workspaceRouter.delete('/tasks/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { hasAccess } = await verifyProjectAccess(req, res);
  if (!hasAccess) return;

  await db.tasks.deleteOne({ _id: req.params.id, projectId: req.params.projectId });
  return res.status(200).json({ success: true, data: { message: 'Task deleted successfully' } });
});

// -------------------------------------------------------------
// 8. AI DEVELOPMENT ASSISTANT (Context-Aware)
// -------------------------------------------------------------
workspaceRouter.get('/chat', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { hasAccess } = await verifyProjectAccess(req, res);
  if (!hasAccess) return;

  const conv = await db.ai_conversations.findOne({ projectId: req.params.projectId });
  return res.status(200).json({ success: true, data: conv?.messages || [] });
});

workspaceRouter.post('/chat', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { project, hasAccess } = await verifyProjectAccess(req, res);
  if (!hasAccess) return;

  const message = req.body?.message;
  if (!message) {
    return res.status(400).json({ success: false, error: { code: 'EMPTY_MESSAGE', message: 'Message is required' } });
  }

  let conv = await db.ai_conversations.findOne({ projectId: project._id });
  const messages = conv?.messages || [];

  // Add user message
  const userMsg = {
    id: uuidv4(),
    sender: 'user' as const,
    content: message,
    timestamp: new Date().toISOString()
  };
  messages.push(userMsg);

  // Generate contextual AI response
  const aiReply = await aiEngine.chatWithAssistant(project, messages, message);
  const assistantMsg = {
    id: uuidv4(),
    sender: 'assistant' as const,
    content: aiReply,
    timestamp: new Date().toISOString()
  };
  messages.push(assistantMsg);

  // Save conversation
  await db.ai_conversations.updateOne(
    { projectId: project._id },
    {
      $set: {
        userId: req.user!._id,
        messages,
        updatedAt: new Date().toISOString()
      }
    },
    { upsert: true }
  );

  return res.status(200).json({
    success: true,
    data: {
      message: assistantMsg,
      conversation: messages
    }
  });
});

// -------------------------------------------------------------
// 9. CODE & CODEBASE STRUCTURE GENERATION
// -------------------------------------------------------------
workspaceRouter.get('/code/structure', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { project, hasAccess } = await verifyProjectAccess(req, res);
  if (!hasAccess) return;

  const isFullStack = project.techStack.frontend?.length > 0 && project.techStack.backend?.length > 0;
  const isPython = project.techStack.backend?.some((t: string) => t.toLowerCase().includes('fastapi') || t.toLowerCase().includes('python'));

  const structure = isPython
    ? `
${project.slug}/
├── client/                     # Frontend Application
│   ├── public/
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Screen views
│   │   ├── hooks/              # Custom React hooks
│   │   ├── services/           # API fetch client
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── server/                     # FastAPI AI & REST Backend
│   ├── app/
│   │   ├── api/                # API Routers & Endpoints
│   │   ├── core/               # Security & Config
│   │   ├── models/             # Database ORM / Pydantic models
│   │   ├── services/           # AI inference & Business Logic
│   │   └── main.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── docs/                       # Architecture & API documentation
├── .env.example
├── README.md
└── docker-compose.yml
`.trim()
    : `
${project.slug}/
├── client/                     # Frontend Application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Screen views
│   │   ├── context/            # Auth & Global state
│   │   ├── services/           # API fetch client
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── server/                     # Node.js + Express API Backend
│   ├── src/
│   │   ├── config/             # Environment & settings
│   │   ├── controllers/        # Route controllers
│   │   ├── middleware/         # Auth, validation, rate limiting
│   │   ├── models/             # Schema definitions
│   │   ├── routes/             # REST endpoints
│   │   └── app.ts
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                       # System documentation
├── .env.example
├── README.md
└── docker-compose.yml
`.trim();

  return res.status(200).json({ success: true, data: { structure } });
});

workspaceRouter.post('/code/generate', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { project, hasAccess } = await verifyProjectAccess(req, res);
  if (!hasAccess) return;

  const moduleName = req.body?.moduleName || 'Authentication';
  const result = await aiEngine.generateCodeGuidance(project, moduleName);

  return res.status(200).json({ success: true, data: result });
});

// -------------------------------------------------------------
// 10. TESTING CENTER
// -------------------------------------------------------------
workspaceRouter.get('/tests', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { hasAccess } = await verifyProjectAccess(req, res);
  if (!hasAccess) return;

  const testCases = await db.test_cases.find({ projectId: req.params.projectId });
  const passed = testCases.filter(t => t.status === 'pass').length;
  const failed = testCases.filter(t => t.status === 'fail').length;
  const blocked = testCases.filter(t => t.status === 'blocked').length;
  const untested = testCases.filter(t => t.status === 'untested').length;

  return res.status(200).json({
    success: true,
    data: {
      testCases,
      stats: { total: testCases.length, passed, failed, blocked, untested }
    }
  });
});

workspaceRouter.put('/tests/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { hasAccess } = await verifyProjectAccess(req, res);
  if (!hasAccess) return;

  await db.test_cases.updateOne(
    { _id: req.params.id, projectId: req.params.projectId },
    { $set: { ...req.body, updatedAt: new Date().toISOString() } }
  );

  const updated = await db.test_cases.findById(req.params.id);
  return res.status(200).json({ success: true, data: updated });
});

workspaceRouter.post('/tests/regenerate', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { project, hasAccess } = await verifyProjectAccess(req, res);
  if (!hasAccess) return;

  const result = await aiEngine.generateTestCases(project);
  await db.test_cases.deleteMany({ projectId: project._id });

  for (const tc of result.testCases) {
    await db.test_cases.insertOne({
      projectId: project._id,
      ...tc,
      updatedAt: new Date().toISOString()
    });
  }

  const updated = await db.test_cases.find({ projectId: project._id });
  return res.status(200).json({ success: true, data: updated, providerUsed: result.providerUsed });
});

// -------------------------------------------------------------
// 11. DOCUMENTATION & EXPORT
// -------------------------------------------------------------
workspaceRouter.get('/docs', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { hasAccess } = await verifyProjectAccess(req, res);
  if (!hasAccess) return;

  const doc = await db.documents.findOne({ projectId: req.params.projectId });
  return res.status(200).json({ success: true, data: doc });
});

workspaceRouter.put('/docs', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { hasAccess } = await verifyProjectAccess(req, res);
  if (!hasAccess) return;

  await db.documents.updateOne(
    { projectId: req.params.projectId },
    { $set: { ...req.body, updatedAt: new Date().toISOString() } },
    { upsert: true }
  );

  const updated = await db.documents.findOne({ projectId: req.params.projectId });
  return res.status(200).json({ success: true, data: updated });
});

workspaceRouter.get('/docs/export', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { project, hasAccess } = await verifyProjectAccess(req, res);
  if (!hasAccess) return;

  const format = String(req.query.format || 'markdown').toLowerCase();
  const doc = await db.documents.findOne({ projectId: project._id });
  const reqs = await db.project_requirements.findOne({ projectId: project._id });
  const arch = await db.project_architecture.findOne({ projectId: project._id });
  const database = await db.project_databases.findOne({ projectId: project._id });
  const apis = await db.project_apis.findOne({ projectId: project._id });
  const tasks = await db.tasks.find({ projectId: project._id });
  const testCases = await db.test_cases.find({ projectId: project._id });

  if (format === 'json') {
    return res.status(200).json({
      success: true,
      data: { project, documentation: doc, requirements: reqs, architecture: arch, database, apis, tasks, testCases }
    });
  }

  // Markdown export blueprint
  const mdContent = `
# ${project.name} — Technical Project Blueprint
> **${project.tagline}**

## 1. Project Overview
- **Category / Domain**: ${project.category} / ${project.domain}
- **Difficulty**: ${project.complexity.difficulty}
- **Duration**: ${project.complexity.estimatedDuration}
- **Team Size**: ${project.complexity.teamSize}

### Description
${project.detailedDescription}

### Problem Statement
${project.problemStatement}

### Proposed Solution
${project.proposedSolution}

---

## 2. Technology Stack
- **Frontend**: ${project.techStack.frontend.join(', ')}
- **Backend**: ${project.techStack.backend.join(', ')}
- **Database**: ${project.techStack.database.join(', ')}
- **AI**: ${project.techStack.ai?.join(', ') || 'N/A'}
- **Authentication**: ${project.techStack.authentication.join(', ')}
- **Hosting**: ${project.techStack.hosting.join(', ')}

---

## 3. Functional Requirements
${(reqs?.functional || []).map(f => `- **[${f.code}] ${f.title}** (${f.priority}): ${f.description}`).join('\n')}

---

## 4. Architecture
\`\`\`mermaid
${arch?.beginnerArchitecture?.diagramMermaid || 'graph TD; Client --> API; API --> DB;'}
\`\`\`

---

## 5. API Endpoints
| Method | Path | Auth | Description |
|---|---|---|---|
${(apis?.endpoints || []).map(e => `| ${e.method} | \`${e.path}\` | ${e.authRequired ? 'Yes' : 'No'} | ${e.description} |`).join('\n')}

---

## 6. Testing Strategy
- Total Test Cases: ${testCases.length}
- Passed: ${testCases.filter(t => t.status === 'pass').length}
- Status: Ready for verification

*Generated by ProjectForge AI (https://projectforge.ai)*
`.trim();

  return res.status(200).json({ success: true, data: { markdown: mdContent, filename: `${project.slug}-blueprint.md` } });
});

// -------------------------------------------------------------
// 12. DEPLOYMENT CENTER
// -------------------------------------------------------------
workspaceRouter.get('/deployment', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { project, hasAccess } = await verifyProjectAccess(req, res);
  if (!hasAccess) return;

  const isFullStack = project.techStack.backend.length > 0;
  const isPython = project.techStack.backend.some((t: string) => t.toLowerCase().includes('fastapi') || t.toLowerCase().includes('python'));

  const deploymentData = {
    platforms: [
      {
        name: 'Vercel (Frontend)',
        badge: 'Recommended for Client',
        steps: [
          'Push your project repository to GitHub.',
          'Import your repository into Vercel dashboard.',
          'Set Root Directory to `client` (or `./` if single-root).',
          'Add Environment Variable: `VITE_API_URL=https://your-backend.onrender.com`',
          'Click Deploy!'
        ]
      },
      {
        name: 'Render (Backend API)',
        badge: 'Recommended for API',
        steps: [
          'Create a new Web Service on Render connecting to your GitHub repo.',
          `Set Build Command: \`${isPython ? 'pip install -r requirements.txt' : 'npm install && npm run build'}\``,
          `Set Start Command: \`${isPython ? 'uvicorn app.main:app --host 0.0.0.0 --port $PORT' : 'node dist/app.js'}\``,
          'Configure environment variables: `JWT_SECRET`, `PORT=10000`, `DATABASE_URL`',
          'Deploy web service.'
        ]
      },
      {
        name: 'MongoDB Atlas (Database)',
        badge: 'Free Tier Cluster',
        steps: [
          'Create a free M0 cluster in your preferred AWS/GCP region.',
          'Add a database user with Read/Write privileges.',
          'Add IP `0.0.0.0/0` under Network Access (or Render static outbound IPs).',
          'Copy the connection string into your `MONGODB_URI` environment variable.'
        ]
      }
    ],
    environmentVariables: [
      { name: 'PORT', recommended: '5000', description: 'Internal server listening port' },
      { name: 'NODE_ENV', recommended: 'production', description: 'Node environment flag' },
      { name: 'JWT_SECRET', recommended: '<generate-32-char-secret>', description: 'Cryptographic secret for signing auth tokens' },
      { name: 'MONGODB_URI', recommended: 'mongodb+srv://user:pass@cluster.mongodb.net/dbname', description: 'Primary database connection string' },
      { name: 'FRONTEND_URL', recommended: 'https://your-app.vercel.app', description: 'Allowed CORS origin for client requests' }
    ],
    productionChecklist: [
      { item: 'All sensitive credentials removed from frontend code & git history', checked: true },
      { item: 'JWT Secret is a cryptographically strong random string', checked: true },
      { item: 'Database network access restricted and credentials secured', checked: true },
      { item: 'API rate limits configured on AI and auth endpoints', checked: true },
      { item: 'CORS policy configured strictly to frontend production domain', checked: true },
      { item: 'Continuous integration (GitHub Actions) configured to run tests on PR', checked: true }
    ]
  };

  return res.status(200).json({ success: true, data: deploymentData });
});
