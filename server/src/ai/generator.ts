import { config } from '../config';
import { GeminiProvider, OpenAIProvider, GroqProvider, AIProvider } from './provider';
import {
  GeneratedProjectSchema, ValidationReportSchema, RequirementsSchema,
  ArchitectureSchema, DatabaseSchema, ApiDesignSchema,
  UIPlanSchema, RoadmapSchema, TestCasesSchema, extractAndParseJson
} from './validator';
import { Project, Skill, Profile } from '../models/types';
import { v4 as uuidv4 } from 'uuid';

export interface GenerateProjectParams {
  goal: string;
  domain: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  teamSize: string;
  platform: string;
  objective: string;
  preferredTech?: string;
  userSkills: string[];
}

export class AIEngine {
  private providers: AIProvider[];

  constructor() {
    this.providers = [
      new GeminiProvider(),
      new OpenAIProvider(),
      new GroqProvider(),
    ];
  }

  public getProviderChain(): AIProvider[] {
    const chain: AIProvider[] = [];
    const primaryName = (config.ai.provider || '').toLowerCase();

    // 1. Primary configured provider
    const primary = this.providers.find(p => p.name.toLowerCase() === primaryName && p.isAvailable());
    if (primary) chain.push(primary);

    // 2. Add remaining available providers in fallback order
    for (const p of this.providers) {
      if (p.isAvailable() && !chain.includes(p)) {
        chain.push(p);
      }
    }

    return chain;
  }

  public getActiveProvider(): AIProvider | null {
    return this.getProviderChain()[0] || null;
  }

  // Helper to execute LLM call with multi-provider fallback to heuristic engine
  private async executeWithFallback<T>(
    prompt: string,
    systemPrompt: string,
    schema: any,
    fallbackGenerator: () => T
  ): Promise<{ data: T; providerUsed: string }> {
    const chain = this.getProviderChain();

    for (const provider of chain) {
      try {
        const raw = await provider.generateCompletion(prompt, systemPrompt);
        const parsed = extractAndParseJson(raw, schema);
        return { data: parsed as T, providerUsed: provider.name };
      } catch (err: any) {
        console.warn(`[AIEngine] Live provider ${provider.name} failed (${err.message}). Attempting next provider in fallback chain...`);
      }
    }

    // Heuristic Fallback
    const fallbackData = fallbackGenerator();
    return { data: fallbackData, providerUsed: 'Deterministic Heuristic Architect' };
  }

  // 1. Generate Project Idea
  async generateProject(params: GenerateProjectParams): Promise<{ project: any; providerUsed: string }> {
    const prompt = `
Generate a structured, production-grade project proposal for a student.
Goal/Idea: "${params.goal}"
Domain: ${params.domain}
Experience Level: ${params.experienceLevel}
Duration: ${params.duration}
Team Size: ${params.teamSize}
Platform: ${params.platform}
Objective: ${params.objective}
User Skills: ${params.userSkills.join(', ')}
Preferred Tech: ${params.preferredTech || 'Best matching modern stack'}

Return strictly JSON matching:
{
  "name": "Project Name",
  "tagline": "Catchy 1-sentence tagline",
  "oneLineDescription": "Brief summary",
  "detailedDescription": "Thorough paragraph explaining what the project does",
  "problemStatement": "Specific student/real-world pain point",
  "targetUsers": ["User group 1", "User group 2"],
  "existingPainPoints": ["Pain 1", "Pain 2", "Pain 3"],
  "proposedSolution": "How this software directly solves the pain point",
  "keyDifferentiator": "Why this stands out from standard tutorials",
  "expectedImpact": "Quantifiable metric or educational takeaway",
  "features": {
    "mvp": ["Core feature 1", "Core feature 2", "Core feature 3"],
    "phase2": ["Enhanced feature 1", "Enhanced feature 2"],
    "advanced": ["Cutting edge feature 1"]
  },
  "techStack": {
    "frontend": ["React", "Tailwind CSS"],
    "backend": ["Node.js", "Express"],
    "database": ["MongoDB"],
    "ai": ["Gemini API"],
    "authentication": ["JWT"],
    "storage": ["Local / Cloudinary"],
    "hosting": ["Vercel", "Render"],
    "monitoring": ["Sentry"]
  },
  "complexity": {
    "difficulty": "${params.experienceLevel}",
    "estimatedDuration": "${params.duration}",
    "teamSize": "${params.teamSize}",
    "requiredSkills": ["Skills needed"]
  },
  "learningOpportunities": ["What the student will learn in this project"],
  "category": "${params.domain}",
  "domain": "${params.domain}"
}
`;

    const systemPrompt = `You are an elite Principal Software Architect and Startup Incubator Mentor designing serious, buildable student projects. Never output generic trivial todo apps. Always provide complete, realistic architectures. Output pure JSON.`;

    const fallback = () => {
      // Deterministic generation customized to goal & skills
      const titleWords = params.goal.split(' ').filter(w => w.length > 2);
      const mainSubject = titleWords.length > 0 ? titleWords[0] : 'Pulse';
      const cleanGoal = params.goal.length > 3 ? params.goal : 'AI-Powered Campus Assistant';

      const frontend = params.userSkills.includes('Next.js') ? ['Next.js 14', 'Tailwind CSS', 'Lucide Icons']
        : params.userSkills.includes('Vue') ? ['Vue.js 3', 'Tailwind CSS', 'Vite']
        : ['React 18', 'Tailwind CSS', 'Vite', 'Lucide Icons'];

      const backend = params.userSkills.includes('FastAPI') ? ['FastAPI', 'Python 3.11', 'Pydantic']
        : params.userSkills.includes('Django') ? ['Django REST Framework', 'Python']
        : ['Node.js', 'Express.js', 'TypeScript'];

      const database = params.userSkills.includes('PostgreSQL') ? ['PostgreSQL 16', 'Prisma ORM']
        : params.userSkills.includes('Firebase') ? ['Firebase Firestore', 'Firebase Auth']
        : ['MongoDB Atlas', 'Mongoose'];

      const ai = params.userSkills.some(s => ['Machine Learning', 'Deep Learning', 'LLMs', 'NLP'].includes(s))
        ? ['Google Gemini 1.5 Flash API', 'LangChain', 'Vector Embeddings']
        : ['Google Gemini API (Structured Outputs)'];

      return {
        name: `${mainSubject.charAt(0).toUpperCase() + mainSubject.slice(1)}Forge`,
        tagline: `Intelligent ${params.domain} platform solving ${params.goal.toLowerCase() || 'core student challenges'}.`,
        oneLineDescription: `A ${params.experienceLevel}-level ${params.platform} application addressing ${cleanGoal} with modern cloud architecture.`,
        detailedDescription: `This application combines real-time data ingestion, automated intelligence, and responsive design to deliver ${cleanGoal}. Built specifically for ${params.objective} goals, it gives students deep practical exposure to end-to-end full-stack systems engineering.`,
        problemStatement: `Target users in ${params.domain} currently rely on fragmented, manual workflows lacking intelligent automation and seamless data persistence.`,
        targetUsers: ['Students & Campus Communities', 'Junior Developers', 'Domain Enthusiasts'],
        existingPainPoints: [
          'Manual, repetitive data collation with high friction',
          'Lack of contextual recommendations tailored to individual preferences',
          'No automated telemetry or progress tracking'
        ],
        proposedSolution: `An integrated ${params.platform} solution providing automated workflow processing, secure authentication, and interactive visual reporting.`,
        keyDifferentiator: `Context-aware AI synthesis combined with a lightweight mobile-first interface optimized for rapid daily usage.`,
        expectedImpact: `Reduces workflow turnaround time by 40% while providing an impressive portfolio showcase project.`,
        features: {
          mvp: [
            'Secure User Authentication & Profile Customization',
            'Core Data Ingestion & Validation Pipeline',
            'Interactive Real-time Visual Dashboard',
            'Automated AI Insights & Structured Recommendations'
          ],
          phase2: [
            'Peer Sharing & Community Collaboration',
            'Batch Processing & Export (PDF / CSV / JSON)',
            'Push & Email Notification Alerts'
          ],
          advanced: [
            'Multimodal File/Image Processing',
            'Predictive Trend Analytics & Anomaly Detection'
          ]
        },
        techStack: {
          frontend,
          backend,
          database,
          ai,
          authentication: ['JWT with bcrypt hashing'],
          storage: ['Cloudinary Object Storage / Local Disk'],
          hosting: ['Vercel (Client)', 'Render (API Server)'],
          monitoring: ['Sentry Error Tracking']
        },
        complexity: {
          difficulty: params.experienceLevel,
          estimatedDuration: params.duration,
          teamSize: params.teamSize,
          requiredSkills: params.userSkills.length > 0 ? params.userSkills.slice(0, 4) : ['TypeScript', 'React', 'REST APIs', 'Database Design']
        },
        learningOpportunities: [
          'Full-stack TypeScript and RESTful API architecture',
          'Database indexing, relational modeling, and query optimization',
          'Secure token-based authentication and authorization guards',
          'AI prompt engineering and deterministic JSON schema validation'
        ],
        category: params.domain,
        domain: params.domain
      };
    };

    const res = await this.executeWithFallback(prompt, systemPrompt, GeneratedProjectSchema, fallback);
    return { project: res.data, providerUsed: res.providerUsed };
  }

  // 2. Validate Project Idea
  async validateProject(project: Partial<Project>, userSkills: Skill[]): Promise<{ report: any; providerUsed: string }> {
    const prompt = `
Validate this student software project for feasibility, complexity, and skill alignment.
Project: ${JSON.stringify(project)}
User Skills: ${JSON.stringify(userSkills.map(s => ({ name: s.name, level: s.level, score: s.confidenceScore })))}

Return strictly JSON matching:
{
  "feasibilityScore": 88,
  "complexityVerdict": "manageable", // "manageable" | "challenging" | "high_risk" | "ideal"
  "strengths": ["Clear strength 1", "Strength 2"],
  "risks": ["Realistic risk 1", "Risk 2"],
  "missingSkills": ["Skills they might need to study"],
  "scopeProblems": ["Specific scope issues if any, or empty"],
  "recommendedChanges": ["Actionable change 1", "Actionable change 2"],
  "mvpRecommendation": "Exact scoped advice for building the first version in time",
  "skillCompatibilityAnalysis": "Thorough breakdown comparing their actual skills vs tech stack",
  "deploymentFeasibility": "Clear explanation of how they can host this on free or cheap student tiers"
}
`;

    const systemPrompt = `You are a strict, constructive Senior Engineering Director reviewing a student project proposal. Be candid about scope creep and skill bottlenecks. Output pure JSON.`;

    const fallback = () => {
      const skillNames = userSkills.map(s => s.name.toLowerCase());
      const requiredTech = [
        ...(project.techStack?.frontend || []),
        ...(project.techStack?.backend || []),
        ...(project.techStack?.database || [])
      ];

      const missing = requiredTech.filter(t => !skillNames.some(s => t.toLowerCase().includes(s)));
      const hasMissing = missing.length > 0;

      return {
        feasibilityScore: hasMissing ? 82 : 94,
        complexityVerdict: (project.complexity?.difficulty === 'advanced' ? 'challenging' : 'manageable') as any,
        strengths: [
          `Clear problem statement with distinct target user personas.`,
          `Tech stack aligns well with modern industry hiring trends.`,
          `Clean separation between MVP deliverables and future phase features.`
        ],
        risks: [
          hasMissing ? `Need to ramp up on ${missing.slice(0, 2).join(', ')} while building.` : `Asynchronous API latency must be mitigated with loading skeletons.`,
          `Avoid spending too much initial time styling before database endpoints are solid.`
        ],
        missingSkills: missing.slice(0, 3),
        scopeProblems: project.features?.advanced && project.features.advanced.length > 3
          ? ['Advanced feature list is ambitious; recommend deferring real-time multiplayer until MVP is verified.']
          : [],
        recommendedChanges: [
          `Implement authentication and core schema before adding AI enhancements.`,
          `Use predefined mock datasets during frontend development to avoid backend blocking.`,
          `Keep deployment configuration in .env from Day 1.`
        ],
        mvpRecommendation: `Build the core CRUD flow and 1 primary AI recommendation feature first. Ensure that loop is bug-free before adding phase 2 features.`,
        skillCompatibilityAnalysis: `Student demonstrates solid foundation in ${skillNames.slice(0, 3).join(', ') || 'core programming'}. Developing this project will reinforce architectural best practices.`,
        deploymentFeasibility: `Fully deployable on student-friendly free/hobby tiers: Frontend on Vercel, Backend API on Render, Database on MongoDB Atlas / Supabase.`
      };
    };

    const res = await this.executeWithFallback(prompt, systemPrompt, ValidationReportSchema, fallback);
    return { report: res.data, providerUsed: res.providerUsed };
  }

  // 3. Generate Requirements
  async generateRequirements(project: Project): Promise<{ requirements: any; providerUsed: string }> {
    const prompt = `
Generate formal software requirements for:
${project.name} — ${project.tagline}
Description: ${project.detailedDescription}
MVP Features: ${project.features.mvp.join(', ')}

Return strictly JSON matching:
{
  "functional": [
    { "id": "FR-01", "code": "FR-01", "title": "Requirement Title", "description": "Specific functional description", "priority": "must_have", "module": "Module Name" }
  ],
  "nonFunctional": [
    { "id": "NFR-01", "category": "performance", "description": "Specific metric", "metric": "Latency < 200ms" }
  ],
  "userStories": [
    { "id": "US-01", "asA": "user persona", "iWant": "action", "soThat": "benefit", "acceptanceCriteria": ["Criterion 1", "Criterion 2"] }
  ]
}
`;
    const systemPrompt = `You are a Principal Product Architect generating formal IEEE-style software requirements. Output pure JSON.`;

    const fallback = () => ({
      functional: [
        { id: 'FR-01', code: 'FR-01', title: 'User Authentication & Session Management', description: 'Enable secure sign-up, login, and session persistence using JWT tokens with password hashing.', priority: 'must_have' as const, module: 'Authentication' },
        { id: 'FR-02', code: 'FR-02', title: 'Entity Ingestion & Management', description: `Allow authorized users to create, view, update, and manage core ${project.category} resources.`, priority: 'must_have' as const, module: 'Core Services' },
        { id: 'FR-03', code: 'FR-03', title: 'AI Intelligence & Analysis Engine', description: `Process user inputs and generate structured contextual insights using ${project.techStack.ai?.[0] || 'AI API'}.`, priority: 'must_have' as const, module: 'AI Engine' },
        { id: 'FR-04', code: 'FR-04', title: 'Interactive Analytics & Dashboard', description: 'Display aggregated metrics, progress indicators, and visual trends with responsive charts.', priority: 'should_have' as const, module: 'Analytics' },
        { id: 'FR-05', code: 'FR-05', title: 'Data Export & Sharing', description: 'Enable export of project data and generate shareable read-only summary links.', priority: 'could_have' as const, module: 'Portfolio' }
      ],
      nonFunctional: [
        { id: 'NFR-01', category: 'performance' as const, description: 'API endpoints must respond within 300ms for p95 requests under standard load.', metric: '< 300ms p95' },
        { id: 'NFR-02', category: 'security' as const, description: 'All passwords hashed with bcrypt, secrets loaded strictly via environment variables.', metric: 'Bcrypt salt rounds >= 10' },
        { id: 'NFR-03', category: 'accessibility' as const, description: 'Mobile UI complies with WCAG 2.1 AA standards with minimum 44px touch targets.', metric: 'WCAG 2.1 AA' },
        { id: 'NFR-04', category: 'availability' as const, description: 'Application gracefully handles offline conditions and displays friendly fallback notices.', metric: '100% Graceful degradation' }
      ],
      userStories: [
        {
          id: 'US-01',
          asA: 'student developer',
          iWant: `to easily create and monitor ${project.name} workflows from my mobile phone`,
          soThat: 'I can track project execution on the go without horizontal scrolling.',
          acceptanceCriteria: [
            'Layout dynamically adapts to mobile screens (320px to 414px)',
            'Forms validate inputs with clear inline error messages',
            'Changes reflect immediately in the dashboard'
          ]
        },
        {
          id: 'US-02',
          asA: 'team lead or evaluator',
          iWant: 'to inspect generated architecture, schemas, and test reports',
          soThat: 'I can verify technical depth and production readiness.',
          acceptanceCriteria: [
            'Architecture diagrams render clearly in Mermaid format',
            'APIs include copyable cURL commands and response contracts',
            'Test coverage shows pass/fail counts'
          ]
        }
      ]
    });

    const res = await this.executeWithFallback(prompt, systemPrompt, RequirementsSchema, fallback);
    return { requirements: res.data, providerUsed: res.providerUsed };
  }

  // 4. Generate Architecture
  async generateArchitecture(project: Project): Promise<{ architecture: any; providerUsed: string }> {
    const prompt = `
Generate system architecture (both Beginner 3-tier and Production microservice/cloud topology) for:
${project.name}
Stack: ${JSON.stringify(project.techStack)}

Return strictly JSON matching:
{
  "beginnerArchitecture": {
    "overview": "Clear explanation of simple monolith/3-tier architecture",
    "diagramMermaid": "graph TD...",
    "components": [{ "name": "Client", "type": "client", "tech": "React", "description": "...", "responsibilities": ["..."] }],
    "dataFlow": ["Step 1", "Step 2"]
  },
  "productionArchitecture": {
    "overview": "Production-ready scalable cloud architecture",
    "diagramMermaid": "flowchart TD...",
    "components": [{ "name": "API Gateway", "type": "gateway", "tech": "...", "description": "...", "responsibilities": ["..."] }],
    "dataFlow": ["Step 1", "Step 2"],
    "authFlow": ["Auth step 1", "Auth step 2"],
    "aiPipelineFlow": ["AI step 1", "AI step 2"],
    "deploymentTopology": ["Topology details"]
  }
}
`;
    const systemPrompt = `You are a Principal Cloud Architect designing software architectures. Output pure JSON.`;

    const fallback = () => {
      const clientTech = project.techStack.frontend.join(' + ');
      const backendTech = project.techStack.backend.join(' + ');
      const dbTech = project.techStack.database.join(' + ');
      const aiTech = project.techStack.ai?.[0] || 'AI Intelligence Engine';

      return {
        beginnerArchitecture: {
          overview: `A streamlined 3-tier architecture designed for rapid development, maintainability, and clean separation of concerns.`,
          diagramMermaid: `graph TD
  Client[Web/Mobile Client (${clientTech})] -->|HTTPS REST / JSON| API[Backend API Server (${backendTech})]
  API -->|JWT Authentication| AuthModule[Auth Guard]
  API -->|Read / Write| Database[(Primary Database: ${dbTech})]
  API -->|Async Inference Prompt| AIService[AI Provider (${aiTech})]
  API -->|Static Assets| Storage[Local Disk / Cloud Storage]`,
          components: [
            { name: 'Web & Mobile Client', type: 'client' as const, tech: clientTech, description: 'Responsive single-page application providing touch navigation and dynamic state.', responsibilities: ['UI rendering', 'Client-side input validation', 'Token storage in secure memory'] },
            { name: 'Backend API Service', type: 'gateway' as const, tech: backendTech, description: 'RESTful API controller layer routing requests to services.', responsibilities: ['Route dispatching', 'JWT validation', 'Rate limiting', 'Error handling'] },
            { name: 'Primary Database', type: 'database' as const, tech: dbTech, description: 'Persistent structured document or relational store.', responsibilities: ['ACID / Document storage', 'Indexing', 'Data consistency'] },
            { name: 'AI Service Gateway', type: 'service' as const, tech: aiTech, description: 'Inference bridge with schema repair and deterministic fallback.', responsibilities: ['Prompt formatting', 'Token management', 'JSON output validation'] }
          ],
          dataFlow: [
            '1. Client authenticates via POST /api/auth/login and receives signed JWT token',
            '2. Client issues authenticated REST requests with Bearer header',
            '3. Backend validates token and checks role permissions',
            '4. Business logic executes queries against primary database',
            '5. When AI is requested, backend constructs context-isolated prompt and validates returned JSON schema',
            '6. Standardized JSON response returned to client'
          ]
        },
        productionArchitecture: {
          overview: `Enterprise-grade cloud topology featuring edge CDN caching, resilient API Gateway, asynchronous task queues, and zero-trust auth.`,
          diagramMermaid: `flowchart TD
  User((End User)) --> CDN[Cloudflare Edge CDN / WAF]
  CDN --> SPA[Static Frontend (${clientTech})]
  SPA --> Gateway[Kong / Envoy API Gateway]
  Gateway --> AuthService[Auth Microservice]
  Gateway --> CoreService[Core Domain Service (${backendTech})]
  Gateway --> AIService[AI Orchestration Service]
  CoreService --> Redis[(Redis 7 Distributed Cache)]
  CoreService --> MainDB[(Primary DB Cluster: ${dbTech})]
  AIService --> ModelPool[Model Provider Pool (Gemini / OpenAI / Groq)]
  CoreService --> EventQueue[RabbitMQ / Kafka Event Bus]
  EventQueue --> Worker[Async Background Workers]`,
          components: [
            { name: 'Edge CDN & WAF', type: 'gateway' as const, tech: 'Cloudflare', description: 'Global CDN edge with DDoS protection and SSL termination.', responsibilities: ['Edge caching', 'Rate limiting', 'SSL termination'] },
            { name: 'API Gateway', type: 'gateway' as const, tech: 'Kong / Envoy', description: 'Central reverse proxy managing routing, auth headers, and metrics.', responsibilities: ['Request routing', 'Cross-cutting telemetry', 'Circuit breaker'] },
            { name: 'Distributed Cache', type: 'database' as const, tech: 'Redis 7 Cluster', description: 'Sub-millisecond in-memory cache for sessions and rate limits.', responsibilities: ['Hot query caching', 'Session invalidation', 'Rate limit counters'] },
            { name: 'AI Model Pool', type: 'service' as const, tech: 'Multi-Provider Bridge', description: 'Multi-model inference with automatic health-checked failover.', responsibilities: ['Load balancing', 'Structured schema enforcement', 'Cost tracking'] }
          ],
          dataFlow: [
            'Client sends request through Cloudflare WAF to API Gateway',
            'Gateway verifies JWT signature locally using cached public key',
            'Request routed to microservice with trace ID header injected',
            'Service checks Redis cache; on miss, queries primary replica',
            'Heavy compute or AI tasks dispatched to async event queue',
            'Response streamed or returned with telemetry headers'
          ],
          authFlow: [
            'OAuth2 / OIDC authentication with short-lived JWT access tokens (15m)',
            'Encrypted refresh tokens stored in HttpOnly, SameSite=Strict cookies',
            'Role-Based Access Control (RBAC) enforced at both Gateway and Service levels'
          ],
          aiPipelineFlow: [
            'Input sanitization & prompt injection scrubbing',
            'Dynamic context injection with strictly tenant-isolated project data',
            'Model invocation with timeout and retry budget',
            'Schema enforcement via Zod with automatic repair pass'
          ],
          deploymentTopology: [
            'Frontend deployed on globally distributed edge networks (Vercel / Cloudflare Pages)',
            'Backend containerized with Docker on Kubernetes / AWS ECS Fargate',
            'Multi-AZ managed database cluster with automated replication and continuous backup'
          ]
        }
      };
    };

    const res = await this.executeWithFallback(prompt, systemPrompt, ArchitectureSchema, fallback);
    return { architecture: res.data, providerUsed: res.providerUsed };
  }

  // 5. Generate Database Design
  async generateDatabaseDesign(project: Project, dbType: 'mongodb' | 'postgresql' | 'mysql' = 'mongodb'): Promise<{ database: any; providerUsed: string }> {
    const prompt = `
Generate database schema for ${project.name} using ${dbType}.
Description: ${project.detailedDescription}
Return strictly JSON matching:
{
  "databaseType": "${dbType}",
  "tables": [
    {
      "name": "collection_or_table_name",
      "description": "table description",
      "fields": [
        { "name": "_id", "type": "ObjectId", "isPrimary": true, "required": true, "description": "Primary key" }
      ],
      "indexes": ["field_1"],
      "sampleRecords": [{ "_id": "1", "field": "val" }]
    }
  ],
  "relationships": [
    { "from": "tableA.id", "to": "tableB.id", "type": "one_to_many", "description": "relationship explanation" }
  ],
  "diagramMermaid": "erDiagram..."
}
`;
    const systemPrompt = `You are an expert Database Architect. Generate production-ready schemas with primary keys, foreign keys, indexes, and sample records. Output pure JSON.`;

    const fallback = () => {
      const isMongo = dbType === 'mongodb';
      const idType = isMongo ? 'ObjectId' : 'UUID';
      const dateType = isMongo ? 'Date' : 'TIMESTAMP';
      const safeSlug = (project.slug || project.name || 'project').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

      return {
        databaseType: dbType,
        tables: [
          {
            name: 'users',
            description: 'Stores student and user authentication credentials, profiles, and roles.',
            fields: [
              { name: '_id', type: idType, isPrimary: true, required: true, description: 'Unique user identifier' },
              { name: 'name', type: 'String', required: true, description: 'Full name' },
              { name: 'email', type: 'String', required: true, description: 'Unique email address' },
              { name: 'passwordHash', type: 'String', required: true, description: 'Bcrypt hashed password' },
              { name: 'role', type: 'String', required: true, description: 'student | admin' },
              { name: 'createdAt', type: dateType, required: true, description: 'Record creation timestamp' }
            ],
            indexes: ['email_unique', 'role_1'],
            sampleRecords: [
              { _id: 'usr_101', name: 'Alex Student', email: 'alex@projectforge.ai', role: 'student', createdAt: '2026-09-01T00:00:00Z' }
            ]
          },
          {
            name: `${safeSlug}_records`,
            description: `Primary entity collection storing core data records for ${project.name}.`,
            fields: [
              { name: '_id', type: idType, isPrimary: true, required: true, description: 'Primary record ID' },
              { name: 'userId', type: idType, isForeign: true, references: 'users._id', required: true, description: 'Foreign key to users' },
              { name: 'title', type: 'String', required: true, description: 'Record title' },
              { name: 'status', type: 'String', required: true, description: 'active | completed | archived' },
              { name: 'metadata', type: isMongo ? 'Object' : 'JSONB', required: false, description: 'Flexible attributes' },
              { name: 'createdAt', type: dateType, required: true, description: 'Creation date' }
            ],
            indexes: ['userId_1_status_1', 'createdAt_-1'],
            sampleRecords: [
              { _id: 'rec_501', userId: 'usr_101', title: 'Sample Milestone Record', status: 'active', createdAt: '2026-09-28T10:00:00Z' }
            ]
          },
          {
            name: 'audit_events',
            description: 'Chronological timeline of system changes and AI actions.',
            fields: [
              { name: '_id', type: idType, isPrimary: true, required: true, description: 'Event identifier' },
              { name: 'recordId', type: idType, isForeign: true, references: `${safeSlug}_records._id`, required: true },
              { name: 'action', type: 'String', required: true, description: 'Event action type' },
              { name: 'timestamp', type: dateType, required: true, description: 'Event occurrence time' }
            ],
            indexes: ['recordId_1_timestamp_-1'],
            sampleRecords: [
              { _id: 'aud_901', recordId: 'rec_501', action: 'STATUS_UPDATED', timestamp: '2026-09-28T10:30:00Z' }
            ]
          }
        ],
        relationships: [
          { from: `${safeSlug}_records.userId`, to: 'users._id', type: 'many_to_one' as const, description: 'Multiple records are owned by one user.' },
          { from: 'audit_events.recordId', to: `${safeSlug}_records._id`, type: 'many_to_one' as const, description: 'Audit events track changes on a record.' }
        ],
        diagramMermaid: `erDiagram
  users ||--o{ ${safeSlug}_records : owns
  ${safeSlug}_records ||--o{ audit_events : logs
  users {
    ${idType} _id PK
    String name
    String email UK
    String role
  }
  ${safeSlug}_records {
    ${idType} _id PK
    ${idType} userId FK
    String title
    String status
    ${dateType} createdAt
  }
  audit_events {
    ${idType} _id PK
    ${idType} recordId FK
    String action
    ${dateType} timestamp
  }`
      };
    };

    const res = await this.executeWithFallback(prompt, systemPrompt, DatabaseSchema, fallback);
    return { database: res.data, providerUsed: res.providerUsed };
  }

  // 6. Generate API Design
  async generateApiDesign(project: Project): Promise<{ apis: any; providerUsed: string }> {
    const prompt = `
Generate RESTful API specifications for ${project.name}.
Endpoints needed: CRUD for resources, AI action, and analytics.
Return strictly JSON matching:
{
  "endpoints": [
    {
      "id": "ep-01",
      "name": "Endpoint name",
      "method": "GET",
      "path": "/api/...",
      "authRequired": true,
      "description": "...",
      "headers": { "Authorization": "Bearer <token>" },
      "parameters": [{ "name": "id", "type": "string", "in": "path", "required": true, "description": "..." }],
      "requestBody": { ... },
      "responseSuccess": { "status": 200, "body": { ... } },
      "responseError": { "status": 400, "body": { ... } },
      "curlSnippet": "curl ..."
    }
  ]
}
`;
    const systemPrompt = `You are a Principal API Architect. Provide clear, RESTful API endpoint definitions with status codes and cURL examples. Output pure JSON.`;

    const fallback = () => {
      const slug = (project.slug || project.name || 'project').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      return {
        endpoints: [
          {
            id: 'ep-01',
            name: `List ${project.name} Resources`,
            method: 'GET' as const,
            path: `/api/${slug}/items`,
            authRequired: true,
            description: `Retrieves a paginated list of items belonging to the authenticated user.`,
            parameters: [
              { name: 'page', type: 'integer', in: 'query' as const, required: false, description: 'Page number (default 1)' },
              { name: 'limit', type: 'integer', in: 'query' as const, required: false, description: 'Page size (default 20)' }
            ],
            responseSuccess: {
              status: 200,
              body: { success: true, data: { items: [{ id: '1', title: 'Example Resource', status: 'active' }], total: 1, page: 1 } }
            },
            responseError: {
              status: 401,
              body: { success: false, error: { code: 'UNAUTHORIZED', message: 'Bearer token missing or expired' } }
            },
            curlSnippet: `curl -X GET "http://localhost:5000/api/${slug}/items?page=1&limit=20" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`
          },
          {
            id: 'ep-02',
            name: `Create New ${project.name} Item`,
            method: 'POST' as const,
            path: `/api/${slug}/items`,
            authRequired: true,
            description: `Validates payload and inserts a new resource record.`,
            requestBody: { title: 'New Item Title', category: 'general', metadata: { priority: 'high' } },
            responseSuccess: {
              status: 201,
              body: { success: true, data: { id: 'item_101', title: 'New Item Title', status: 'active', createdAt: '2026-09-29T20:00:00Z' } }
            },
            responseError: {
              status: 400,
              body: { success: false, error: { code: 'VALIDATION_ERROR', message: 'Title is required and must exceed 3 characters' } }
            },
            curlSnippet: `curl -X POST "http://localhost:5000/api/${slug}/items" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"title": "Sample Item", "category": "general"}'`
          },
          {
            id: 'ep-03',
            name: `Run AI Analysis & Inference`,
            method: 'POST' as const,
            path: `/api/${slug}/analyze`,
            authRequired: true,
            description: `Sends context to AI engine and returns structured insights.`,
            requestBody: { inputData: 'Raw input content to analyze', mode: 'summary' },
            responseSuccess: {
              status: 200,
              body: { success: true, data: { insights: ['Key takeaway 1', 'Optimization opportunity'], confidence: 0.94 } }
            },
            responseError: {
              status: 429,
              body: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'AI request limit reached. Please wait 60 seconds.' } }
            },
            curlSnippet: `curl -X POST "http://localhost:5000/api/${slug}/analyze" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"inputData": "Student project data", "mode": "summary"}'`
          },
          {
            id: 'ep-04',
            name: `Delete Item`,
            method: 'DELETE' as const,
            path: `/api/${slug}/items/:id`,
            authRequired: true,
            description: `Permanently deletes resource if owned by caller.`,
            parameters: [{ name: 'id', type: 'string', in: 'path' as const, required: true, description: 'Item unique identifier' }],
            responseSuccess: {
              status: 200,
              body: { success: true, data: { message: 'Item deleted successfully' } }
            },
            responseError: {
              status: 404,
              body: { success: false, error: { code: 'NOT_FOUND', message: 'Item does not exist or access forbidden' } }
            },
            curlSnippet: `curl -X DELETE "http://localhost:5000/api/${slug}/items/item_101" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`
          }
        ]
      };
    };

    const res = await this.executeWithFallback(prompt, systemPrompt, ApiDesignSchema, fallback);
    return { apis: res.data, providerUsed: res.providerUsed };
  }

  // 7. Generate UI Plan
  async generateUIPlan(project: Project): Promise<{ ui: any; providerUsed: string }> {
    const prompt = `
Generate mobile-first UI screens and design system tokens for:
${project.name}
Return strictly JSON matching UIPlanSchema.
`;
    const systemPrompt = `You are a Senior Mobile UI/UX Designer. Create clean, accessible, mobile-first screen layouts with wireframe structure. Output pure JSON.`;

    const fallback = () => ({
      screens: [
        {
          id: 'scr-01',
          name: 'Dashboard Overview',
          purpose: 'Central hub showing activity metrics, quick actions, and status summaries.',
          layoutType: 'mobile' as const,
          components: ['Top Header Bar', 'Metric Cards Carousel', 'Recent Activity Feed', 'Floating Action Button'],
          userActions: ['Tap quick action to create', 'Swipe cards to view weekly analytics', 'Tap notification bell'],
          apiDependencies: ['GET /api/dashboard/stats', 'GET /api/items/recent'],
          wireframeLayout: {
            header: 'Logo, greeting, profile avatar, and unread notifications icon',
            sections: [
              { title: 'Metrics Row', element: 'Horizontal Card Scroll', details: 'Shows total tasks, active sessions, and completion rate' },
              { title: 'Main Feed', element: 'Card List', details: 'Displays prioritized item list with status tags' }
            ],
            bottomNav: ['Home', 'Explore', 'Tasks', 'Settings']
          }
        },
        {
          id: 'scr-02',
          name: 'Creation & AI Assistant Modal',
          purpose: 'Step-by-step form to create new resources with real-time AI validation guidance.',
          layoutType: 'mobile' as const,
          components: ['Progress Stepper', 'Input Fields with Validation', 'AI Suggestion Chip Box', 'Submit CTA'],
          userActions: ['Enter data', 'Click AI Suggest button', 'Confirm and submit'],
          apiDependencies: ['POST /api/analyze', 'POST /api/items'],
          wireframeLayout: {
            header: 'Cancel button, modal title, save draft button',
            sections: [
              { title: 'Form Body', element: 'Vertical Input Stack', details: 'Title, category select, multi-line description' },
              { title: 'AI Assist Box', element: 'Tonal Blue Card', details: 'Displays live tips and syntax completions' }
            ]
          }
        },
        {
          id: 'scr-03',
          name: 'Item Detail & History',
          purpose: 'Deep view of resource attributes, timeline events, and export options.',
          layoutType: 'responsive' as const,
          components: ['Breadcrumb Navigation', 'Status Badge', 'Details Tab Bar', 'Action Buttons'],
          userActions: ['Edit details', 'Export to PDF', 'Delete item'],
          apiDependencies: ['GET /api/items/:id', 'DELETE /api/items/:id'],
          wireframeLayout: {
            header: 'Back arrow, resource title, dropdown action menu',
            sections: [
              { title: 'Metadata Overview', element: 'Grid 2-column', details: 'Owner, created date, difficulty score' },
              { title: 'Audit Trail', element: 'Vertical Timeline', details: 'Chronological events with user badges' }
            ]
          }
        }
      ],
      designSystem: {
        primaryColor: '#4f46e5',
        secondaryColor: '#06b6d4',
        fontFamily: 'Inter, system-ui, sans-serif',
        borderRadius: '12px'
      },
      navigationFlow: 'Home -> Create Modal -> Detail View -> Home Feed'
    });

    const res = await this.executeWithFallback(prompt, systemPrompt, UIPlanSchema, fallback);
    return { ui: res.data, providerUsed: res.providerUsed };
  }

  // 8. Generate Roadmap
  async generateRoadmap(project: Project): Promise<{ roadmap: any; providerUsed: string }> {
    const prompt = `Generate an 8-phase development roadmap for ${project.name}. Output pure JSON matching RoadmapSchema.`;
    const systemPrompt = `You are a Technical Project Manager. Generate a realistic 8-phase development plan. Output pure JSON.`;

    const fallback = () => ({
      phases: [
        { phaseNumber: 1, title: 'Project Initialization & Environment Setup', objective: 'Configure monorepo, tooling, TypeScript compiler, and database connectivity.', estimatedDays: 3, skillsRequired: ['Git', 'TypeScript', 'Node.js'], tasks: ['Initialize repo workspaces', 'Configure ESLint and Tailwind CSS', 'Verify database connection'], deliverables: ['Working build pipeline', 'Health check API endpoint'] },
        { phaseNumber: 2, title: 'Authentication & Access Control', objective: 'Build secure authentication, password hashing, and role-based route guards.', estimatedDays: 4, skillsRequired: ['JWT', 'bcrypt', 'Express Middleware'], tasks: ['Register & login routes', 'Token verification middleware', 'Auth state management on client'], deliverables: ['User registration and login flows'] },
        { phaseNumber: 3, title: 'Database Modeling & CRUD Endpoints', objective: 'Define schemas, indexes, and write core REST controllers.', estimatedDays: 5, skillsRequired: ['Database Schema Design', 'REST API'], tasks: ['Create models with validation', 'Implement GET/POST/PUT/DELETE handlers', 'Write unit tests for queries'], deliverables: ['Full CRUD API suite'] },
        { phaseNumber: 4, title: 'AI Integration & Prompt Engineering', objective: 'Connect AI provider, configure system prompts, and implement schema validation with fallback.', estimatedDays: 5, skillsRequired: ['AI APIs', 'Zod Validation'], tasks: ['Build provider adapter', 'Create prompt templates', 'Implement rate limiting and error recovery'], deliverables: ['Working AI inference endpoints'] },
        { phaseNumber: 5, title: 'Frontend UI & Mobile-First Views', objective: 'Implement responsive screens, bottom tabs, forms, and interactive charts.', estimatedDays: 6, skillsRequired: ['React', 'Tailwind CSS', 'State Management'], tasks: ['Build reusable UI components', 'Implement mobile bottom navigation', 'Wire API queries to UI views'], deliverables: ['Mobile and desktop responsive interface'] },
        { phaseNumber: 6, title: 'Testing & Error Handling', objective: 'Execute unit, integration, UI, and security test suites.', estimatedDays: 4, skillsRequired: ['Automated Testing', 'QA'], tasks: ['Write API integration tests', 'Audit responsive breakpoints (320px to 1440px)', 'Verify input sanitization'], deliverables: ['Passing automated test suite'] },
        { phaseNumber: 7, title: 'Documentation & Portfolio Generation', objective: 'Produce comprehensive documentation, README, and public showcase page.', estimatedDays: 3, skillsRequired: ['Technical Writing', 'Markdown'], tasks: ['Generate architectural README', 'Create API documentation table', 'Publish public portfolio page'], deliverables: ['Live portfolio page and GitHub-ready README'] },
        { phaseNumber: 8, title: 'Deployment & Production Release', objective: 'Deploy application to cloud platforms and verify production checklist.', estimatedDays: 3, skillsRequired: ['DevOps', 'Vercel / Render'], tasks: ['Configure production environment variables', 'Build production bundles', 'Execute live user smoke test'], deliverables: ['Publicly accessible live URL'] }
      ]
    });

    const res = await this.executeWithFallback(prompt, systemPrompt, RoadmapSchema, fallback);
    return { roadmap: res.data, providerUsed: res.providerUsed };
  }

  // 9. Generate Test Cases
  async generateTestCases(project: Project): Promise<{ testCases: any[]; providerUsed: string }> {
    const prompt = `Generate comprehensive test cases (unit, integration, API, UI, security) for ${project.name}. Output pure JSON matching TestCasesSchema.`;
    const systemPrompt = `You are a Principal QA and Security Engineer. Output pure JSON.`;

    const fallback = () => ({
      testCases: [
        { testId: 'TC-01', type: 'api' as const, feature: 'Authentication', scenario: 'User registers with valid credentials', input: 'email: valid@domain.com, password: StrongPassword123!', expectedResult: '201 Created with JWT auth token and user record', status: 'pass' as const },
        { testId: 'TC-02', type: 'security' as const, feature: 'Auth Guard', scenario: 'Unauthenticated request to protected endpoint', input: 'GET /api/items without Bearer token', expectedResult: '401 Unauthorized with code UNAUTHORIZED', status: 'pass' as const },
        { testId: 'TC-03', type: 'unit' as const, feature: 'Validation', scenario: 'Form submission with missing required fields', input: 'Empty payload {}', expectedResult: '400 Bad Request with field-level Zod validation errors', status: 'pass' as const },
        { testId: 'TC-04', type: 'security' as const, feature: 'Rate Limiting', scenario: 'Rapid repeated calls exceeding 20 req/min on AI endpoint', input: '25 consecutive POST calls', expectedResult: '429 Rate Limit Exceeded with friendly message', status: 'pass' as const },
        { testId: 'TC-05', type: 'ui' as const, feature: 'Mobile Viewport', scenario: 'Verify layout on 320px mobile viewport', input: 'Screen width: 320px', expectedResult: 'Zero horizontal scroll, cards stack cleanly, touch buttons >= 44px', status: 'pass' as const }
      ]
    });

    const res = await this.executeWithFallback(prompt, systemPrompt, TestCasesSchema, fallback);
    return { testCases: res.data.testCases, providerUsed: res.providerUsed };
  }

  // 10. Generate Code Guidance
  async generateCodeGuidance(project: Project, moduleName: string): Promise<{ code: string; language: string; filename: string; explanation: string }> {
    const provider = this.getActiveProvider();
    const prompt = `
Generate starter implementation code for the "${moduleName}" module of the project "${project.name}".
Tech Stack: ${JSON.stringify(project.techStack)}
Write clean, modern, fully commented TypeScript code with proper types, error handling, and comments explaining architectural decisions.
`;

    if (provider) {
      try {
        const raw = await provider.generateCompletion(prompt, 'You are a Senior Full-Stack Engineer writing clean, production-grade starter code.');
        return {
          code: raw,
          language: 'typescript',
          filename: `${moduleName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.ts`,
          explanation: `Generated starter code for ${moduleName} utilizing ${project.techStack.backend[0] || 'Node.js'}.`
        };
      } catch (err) {
        // Fallback
      }
    }

    // High quality deterministic starter templates
    if (moduleName.toLowerCase().includes('auth') || moduleName.toLowerCase().includes('user')) {
      return {
        filename: 'src/routes/auth.routes.ts',
        language: 'typescript',
        code: `import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

export const authRouter = Router();

// Validation Schemas
const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

// POST /api/auth/register
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const validated = RegisterSchema.parse(req.body);

    // 1. Check if user already exists
    // const existing = await UserModel.findOne({ email: validated.email });
    // if (existing) return res.status(409).json({ success: false, error: 'Email registered' });

    // 2. Hash password securely
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(validated.password, salt);

    // 3. Save to database
    // const user = await UserModel.create({ name: validated.name, email: validated.email, passwordHash });

    // 4. Generate JWT
    const token = jwt.sign(
      { userId: 'usr_new_id', email: validated.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      data: { token, user: { name: validated.name, email: validated.email } }
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});`,
        explanation: 'Production-ready authentication route with Zod validation, bcrypt password hashing, and JWT token issuance.'
      };
    }

    return {
      filename: `src/services/${moduleName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.service.ts`,
      language: 'typescript',
      code: `// ${project.name} — ${moduleName} Service
import { z } from 'zod';

export interface ${moduleName.replace(/[^a-zA-Z]/g, '')}Config {
  apiKey?: string;
  timeoutMs: number;
}

export class ${moduleName.replace(/[^a-zA-Z]/g, '')}Service {
  constructor(private config: ${moduleName.replace(/[^a-zA-Z]/g, '')}Config) {}

  /**
   * Processes request with input validation and safe error boundaries
   */
  async execute(payload: Record<string, any>): Promise<{ success: boolean; data: any }> {
    try {
      console.log('[${moduleName}Service] Processing request with payload:', payload);

      // Business logic implementation
      const result = {
        status: 'processed',
        timestamp: new Date().toISOString(),
        details: payload
      };

      return { success: true, data: result };
    } catch (error: any) {
      console.error('[${moduleName}Service] Execution error:', error);
      throw new Error(\`Failed to execute ${moduleName}: \${error.message}\`);
    }
  }
}`,
      explanation: `Modular service class for ${moduleName} featuring typed configuration and error containment.`
    };
  }

  // 11. Contextual AI Development Assistant Chat
  async chatWithAssistant(project: Project, history: { sender: string; content: string }[], userMessage: string): Promise<string> {
    const chain = this.getProviderChain();
    const systemPrompt = `
You are the ProjectForge AI Mentor & Senior Architect assigned to the project "${project.name}".
Tagline: "${project.tagline}"
Description: "${project.detailedDescription}"
Tech Stack: Frontend: ${project.techStack.frontend.join(', ')} | Backend: ${project.techStack.backend.join(', ')} | Database: ${project.techStack.database.join(', ')} | AI: ${project.techStack.ai?.join(', ') || 'N/A'}
Difficulty: ${project.complexity.difficulty} | Duration: ${project.complexity.estimatedDuration}

Provide crisp, technically authoritative, friendly mentorship for students.
Always provide concrete code snippets or architectural explanations directly relevant to their specific project and stack. Keep formatting clean using markdown.
`;

    for (const provider of chain) {
      try {
        const conversationText = history.slice(-6).map(m => `${m.sender.toUpperCase()}: ${m.content}`).join('\n');
        const prompt = `${conversationText}\nUSER: ${userMessage}\nASSISTANT:`;
        return await provider.generateCompletion(prompt, systemPrompt);
      } catch (err: any) {
        console.warn(`[AIEngine] Chat provider ${provider.name} failed (${err.message}), trying next provider...`);
      }
    }

    // Contextual Heuristic Assistant
    const query = userMessage.toLowerCase();
    if (query.includes('auth') || query.includes('login') || query.includes('jwt')) {
      return `For **${project.name}**, I recommend standardizing on **JWT (JSON Web Tokens)** with bcrypt password hashing.

Here is the recommended workflow:
1. **Password Hashing**: Always hash user passwords before saving them:
\`\`\`typescript
const salt = await bcrypt.genSalt(10);
const passwordHash = await bcrypt.hash(password, salt);
\`\`\`
2. **Token Sign**: On successful login, return a signed token:
\`\`\`typescript
const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
\`\`\`
3. **Client Storage**: Store the token in \`localStorage\` or React Context state, and attach it to outgoing API requests via \`Authorization: Bearer <token>\`.`;
    }

    if (query.includes('database') || query.includes('schema') || query.includes('mongo') || query.includes('sql')) {
      return `Based on your chosen database stack (**${project.techStack.database.join(', ')}**), remember to:
- Establish a primary compound index on frequently queried fields (e.g. \`userId + createdAt\`).
- Avoid deeply nesting unbounded arrays inside documents; instead, create a child collection referencing the parent ID.
- Keep validation tight with schemas so corrupted documents are rejected at the API boundary.`;
    }

    if (query.includes('deploy') || query.includes('host') || query.includes('vercel') || query.includes('render')) {
      return `Here is your deployment roadmap for **${project.name}**:
- **Frontend (${project.techStack.frontend[0]})**: Deploy to **Vercel** with continuous deployment from your \`main\` GitHub branch.
- **Backend (${project.techStack.backend[0]})**: Deploy to **Render** as a Web Service. Set environment variables (\`JWT_SECRET\`, \`PORT=5000\`, \`FRONTEND_URL\`).
- **Database (${project.techStack.database[0]})**: Use a free managed cluster on **MongoDB Atlas** or **Supabase**. Ensure Network Access allows \`0.0.0.0/0\` for cloud servers.`;
    }

    return `Great question regarding **${project.name}**!

To keep your momentum on this ${project.complexity.difficulty} project:
1. Focus on validating the core end-to-end data pipeline first before adding secondary cosmetic features.
2. Ensure your backend endpoints return consistent response structures:
\`\`\`json
{
  "success": true,
  "data": { ... }
}
\`\`\`
3. Test your endpoints with cURL or the built-in Testing Center before building the React components.

What specific file or module would you like help implementing next?`;
  }
}

export const aiEngine = new AIEngine();
