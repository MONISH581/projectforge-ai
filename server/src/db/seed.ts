import bcrypt from 'bcryptjs';
import { db } from './storage';
import {
  User, Profile, Skill, Project, ProjectRequirements,
  ProjectArchitecture, ProjectDatabase, ProjectApis,
  ProjectUI, ProjectRoadmap, Task, TestCase,
  ProjectDocument, Technology, Category
} from '../models/types';

export async function runSeed(force = false) {
  const existingUsers = await db.users.countDocuments();
  if (existingUsers > 0 && !force) {
    console.log('[Seed] Database already seeded. Skipping.');
    return;
  }

  console.log('[Seed] Seeding ProjectForge AI initial data...');

  // 1. Technologies Catalog
  const technologiesData: Omit<Technology, '_id'>[] = [
    // Programming
    { name: 'Python', slug: 'python', category: 'programming', description: 'Interpreted high-level language for AI, data science, and web services.', iconName: 'Terminal', popular: true },
    { name: 'TypeScript', slug: 'typescript', category: 'programming', description: 'Typed superset of JavaScript providing robust type safety.', iconName: 'FileCode2', popular: true },
    { name: 'JavaScript', slug: 'javascript', category: 'programming', description: 'Versatile language powering the web frontend and modern backends.', iconName: 'Code', popular: true },
    { name: 'Java', slug: 'java', category: 'programming', description: 'Enterprise-grade object-oriented language for high scalability.', iconName: 'Coffee', popular: true },
    { name: 'C++', slug: 'cpp', category: 'programming', description: 'High-performance systems programming language.', iconName: 'Cpu', popular: false },
    { name: 'Go', slug: 'go', category: 'programming', description: 'Lightweight concurrent systems language developed by Google.', iconName: 'Zap', popular: true },
    { name: 'Rust', slug: 'rust', category: 'programming', description: 'Memory-safe systems programming language with zero-cost abstractions.', iconName: 'Shield', popular: true },

    // Frontend
    { name: 'React', slug: 'react', category: 'frontend', description: 'Declarative component-based UI library for web and mobile.', iconName: 'Layout', popular: true },
    { name: 'Next.js', slug: 'nextjs', category: 'frontend', description: 'Production React framework with SSR, SSG, and edge routing.', iconName: 'Globe', popular: true },
    { name: 'Vue.js', slug: 'vue', category: 'frontend', description: 'Progressive JavaScript framework for building user interfaces.', iconName: 'Box', popular: false },
    { name: 'Tailwind CSS', slug: 'tailwindcss', category: 'frontend', description: 'Utility-first CSS framework for rapid responsive design.', iconName: 'Palette', popular: true },

    // Backend
    { name: 'Node.js', slug: 'nodejs', category: 'backend', description: 'Event-driven asynchronous JavaScript runtime.', iconName: 'Server', popular: true },
    { name: 'Express.js', slug: 'express', category: 'backend', description: 'Fast, minimalist web framework for Node.js.', iconName: 'Layers', popular: true },
    { name: 'FastAPI', slug: 'fastapi', category: 'backend', description: 'Modern, high-performance Python web framework for building APIs.', iconName: 'Flame', popular: true },
    { name: 'Django', slug: 'django', category: 'backend', description: 'High-level Python web framework encouraging clean design.', iconName: 'Grid', popular: true },
    { name: 'Spring Boot', slug: 'springboot', category: 'backend', description: 'Production-ready framework for Java microservices.', iconName: 'Cpu', popular: false },

    // Database
    { name: 'MongoDB', slug: 'mongodb', category: 'database', description: 'Document-oriented NoSQL database with flexible JSON schema.', iconName: 'Database', popular: true },
    { name: 'PostgreSQL', slug: 'postgresql', category: 'database', description: 'Powerful, open-source object-relational database system.', iconName: 'Table', popular: true },
    { name: 'MySQL', slug: 'mysql', category: 'database', description: 'Widely used open-source relational database management system.', iconName: 'Database', popular: true },
    { name: 'Redis', slug: 'redis', category: 'database', description: 'In-memory data structure store used as a cache and message broker.', iconName: 'Zap', popular: true },
    { name: 'Firebase', slug: 'firebase', category: 'database', description: 'Google platform offering Firestore, auth, and hosting.', iconName: 'Flame', popular: true },

    // AI
    { name: 'Gemini API', slug: 'gemini', category: 'ai', description: 'Google Deepmind multimodal LLM powering reasoning and generation.', iconName: 'Sparkles', popular: true },
    { name: 'OpenAI GPT-4o', slug: 'openai', category: 'ai', description: 'Frontier reasoning and language model for development.', iconName: 'Cpu', popular: true },
    { name: 'PyTorch', slug: 'pytorch', category: 'ai', description: 'Deep learning framework for tensor computation and neural networks.', iconName: 'Network', popular: true },
    { name: 'LangChain', slug: 'langchain', category: 'ai', description: 'Framework for developing applications powered by language models.', iconName: 'Link', popular: true },
    { name: 'Hugging Face', slug: 'huggingface', category: 'ai', description: 'Platform and library for open-source AI models and transformers.', iconName: 'Smile', popular: true },

    // Mobile
    { name: 'React Native', slug: 'react-native', category: 'mobile', description: 'Build native iOS and Android apps using React.', iconName: 'Smartphone', popular: true },
    { name: 'Flutter', slug: 'flutter', category: 'mobile', description: 'Google UI toolkit for compiling multi-platform apps from Dart.', iconName: 'Smartphone', popular: true },

    // Cloud / DevOps
    { name: 'Docker', slug: 'docker', category: 'cloud_devops', description: 'Containerization platform for portable application packaging.', iconName: 'Container', popular: true },
    { name: 'AWS', slug: 'aws', category: 'cloud_devops', description: 'Amazon Web Services cloud computing ecosystem.', iconName: 'Cloud', popular: true },
    { name: 'GitHub Actions', slug: 'github-actions', category: 'cloud_devops', description: 'Automate CI/CD workflows directly inside GitHub repositories.', iconName: 'GitBranch', popular: true },

    // Cybersecurity
    { name: 'Web Security (OWASP)', slug: 'owasp', category: 'cybersecurity', description: 'Standards and defenses against top web vulnerabilities.', iconName: 'ShieldAlert', popular: true }
  ];

  for (const tech of technologiesData) {
    await db.technologies.insertOne(tech);
  }

  // 2. Categories
  const categoriesData: Omit<Category, '_id'>[] = [
    { name: 'AI & Machine Learning', slug: 'ai-ml', description: 'Intelligent systems, LLM agents, vision, and predictive modeling.', iconName: 'Sparkles', projectCount: 14 },
    { name: 'Web Development', slug: 'web-development', description: 'Full-stack web apps, portals, SaaS platforms, and APIs.', iconName: 'Globe', projectCount: 22 },
    { name: 'Mobile Development', slug: 'mobile-development', description: 'Cross-platform iOS and Android apps built with modern toolkits.', iconName: 'Smartphone', projectCount: 18 },
    { name: 'Cybersecurity', slug: 'cybersecurity', description: 'Vulnerability scanners, auth auditing, and encryption utilities.', iconName: 'Shield', projectCount: 8 },
    { name: 'IoT & Embedded', slug: 'iot', description: 'Hardware sensor monitoring, telemetry dashboards, and microcontrollers.', iconName: 'Cpu', projectCount: 6 },
    { name: 'Cloud & DevOps', slug: 'cloud-devops', description: 'Serverless architectures, container orchestration, and CI/CD tools.', iconName: 'Cloud', projectCount: 9 },
    { name: 'Data Science', slug: 'data-science', description: 'Exploratory data analysis, interactive visualization, and pipelines.', iconName: 'BarChart2', projectCount: 11 },
    { name: 'Education Tech', slug: 'edtech', description: 'AI tutoring, interactive code playgrounds, and campus learning tools.', iconName: 'GraduationCap', projectCount: 15 },
    { name: 'Healthcare Tech', slug: 'healthtech', description: 'Patient monitoring, clinical decision support, and wellness trackers.', iconName: 'HeartPulse', projectCount: 7 },
    { name: 'FinTech', slug: 'fintech', description: 'Expense tracking, micro-investing, algorithmic crypto, and accounting.', iconName: 'DollarSign', projectCount: 10 },
    { name: 'Sustainability & Green', slug: 'sustainability', description: 'Eco-footprint calculators, renewable energy analytics, and recycling.', iconName: 'Leaf', projectCount: 8 },
    { name: 'Social Impact', slug: 'social-impact', description: 'Community aid platforms, disaster response coordination, and NGOs.', iconName: 'Users', projectCount: 12 }
  ];

  for (const cat of categoriesData) {
    await db.categories.insertOne(cat);
  }

  // 3. Demo Users
  const studentSalt = await bcrypt.genSalt(10);
  const studentHash = await bcrypt.hash('Password123!', studentSalt);
  const adminHash = await bcrypt.hash('AdminSecure2026!', studentSalt);

  const studentUser = await db.users.insertOne({
    name: 'Alex Chen',
    email: 'student@projectforge.ai',
    passwordHash: studentHash,
    role: 'student',
    isOnboarded: true,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const adminUser = await db.users.insertOne({
    name: 'Sarah Connor (Admin)',
    email: 'admin@projectforge.ai',
    passwordHash: adminHash,
    role: 'admin',
    isOnboarded: true,
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  // Profile for student
  await db.profiles.insertOne({
    userId: studentUser._id,
    college: 'Massachusetts Institute of Technology',
    degree: 'B.S. Computer Science',
    department: 'EECS',
    currentYear: '3rd Year',
    graduationYear: 2027,
    experienceLevel: 'intermediate',
    careerGoal: 'Full Stack AI Engineer',
    bio: 'Junior CS student passionate about building real-world AI applications and developer tools.',
    githubUrl: 'https://github.com/alexchen-forge',
    linkedinUrl: 'https://linkedin.com/in/alexchen',
    preferences: {
      preferredTeamSize: 'solo',
      targetDuration: '1_month',
      preferredPlatforms: ['web', 'ai'],
      projectObjective: 'portfolio'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  // Skills for student
  const studentSkills = [
    { name: 'Python', category: 'programming' as const, level: 'advanced' as const, yearsExperience: 3, confidenceScore: 88 },
    { name: 'React', category: 'frontend' as const, level: 'intermediate' as const, yearsExperience: 2, confidenceScore: 78 },
    { name: 'TypeScript', category: 'programming' as const, level: 'intermediate' as const, yearsExperience: 1.5, confidenceScore: 72 },
    { name: 'FastAPI', category: 'backend' as const, level: 'intermediate' as const, yearsExperience: 1.5, confidenceScore: 75 },
    { name: 'MongoDB', category: 'database' as const, level: 'intermediate' as const, yearsExperience: 2, confidenceScore: 70 },
    { name: 'Docker', category: 'cloud_devops' as const, level: 'beginner' as const, yearsExperience: 1, confidenceScore: 55 },
    { name: 'Tailwind CSS', category: 'frontend' as const, level: 'advanced' as const, yearsExperience: 2, confidenceScore: 85 }
  ];

  for (const s of studentSkills) {
    await db.skills.insertOne({
      userId: studentUser._id,
      ...s,
      projectsCount: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  // 4. Seed Showcase Project: "EcoTrack AI"
  const ecoProject = await db.projects.insertOne({
    userId: studentUser._id,
    name: 'EcoTrack AI',
    slug: 'ecotrack-ai',
    tagline: 'Turn daily habits into measurable carbon reductions with AI vision.',
    oneLineDescription: 'An AI-powered environmental assistant that estimates product carbon footprint via photo receipts & suggests smart sustainable alternatives.',
    detailedDescription: 'EcoTrack AI allows college students and urban households to scan grocery receipts, meals, and transit tickets using computer vision to estimate their daily carbon footprint. The system features a gamified campus leaderboard, automated habit nudges, and intelligent green swap recommendations.',
    problemStatement: 'Students want to live sustainably but lack actionable, real-time insight into the carbon cost of their specific consumption choices.',
    targetUsers: ['University students', 'Eco-conscious consumers', 'Campus sustainability clubs'],
    existingPainPoints: [
      'Carbon calculators require manual data entry of 50+ tedious questions',
      'Generic advice like "drive less" lacks relevance for university campus life',
      'No social accountability or rewarding progress mechanics'
    ],
    proposedSolution: 'Receipt OCR and multimodal AI classification that instantly calculates carbon equivalents (kg CO2e) with zero manual data entry and recommends local, affordable alternatives.',
    keyDifferentiator: 'Instant snapshot analysis with student budget-friendly sustainable alternatives.',
    expectedImpact: 'Average 18% reduction in personal carbon footprint over a 30-day tracking period.',
    features: {
      mvp: [
        'User authentication and personalized eco-profile',
        'Receipt & food photo upload with AI carbon footprint estimation',
        'Interactive daily and weekly emissions dashboard',
        'Green alternative recommendation engine'
      ],
      phase2: [
        'Campus dorm leaderboard and peer challenges',
        'Barcode scanner for retail items',
        'Exportable impact reports for academic sustainability credits'
      ],
      advanced: [
        'IoT smart meter integration',
        'Carbon offset marketplace with certified reforestation partners'
      ]
    },
    techStack: {
      frontend: ['React 18', 'Tailwind CSS', 'Lucide Icons', 'Vite'],
      backend: ['Node.js', 'Express.js', 'TypeScript'],
      database: ['MongoDB Atlas'],
      ai: ['Google Gemini Multimodal API', 'Tesseract OCR'],
      authentication: ['JWT with bcrypt'],
      storage: ['Cloudinary / S3 Object Storage'],
      hosting: ['Vercel (Frontend)', 'Render (Backend)'],
      monitoring: ['Sentry', 'LogRocket']
    },
    complexity: {
      difficulty: 'intermediate',
      estimatedDuration: '4 weeks',
      teamSize: 'Solo or 2 developers',
      requiredSkills: ['React', 'Python or Node.js', 'REST APIs', 'MongoDB']
    },
    learningOpportunities: [
      'Handling image uploads and multimodal LLM prompt engineering',
      'Designing relational document schemas in MongoDB',
      'Building performant, mobile-first responsive dashboards',
      'Implementing secure JWT session storage'
    ],
    category: 'Sustainability & Green',
    domain: 'Climate Tech / AI',
    visibility: 'public',
    status: 'in_development',
    isFeatured: true,
    version: 1,
    completionScore: 65,
    githubUrl: 'https://github.com/alexchen-forge/ecotrack-ai',
    liveDemoUrl: 'https://ecotrack-ai.demo.projectforge.ai',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  // Requirements for EcoTrack AI
  await db.project_requirements.insertOne({
    projectId: ecoProject._id,
    functional: [
      { id: 'FR-01', code: 'FR-01', title: 'User Registration & Onboarding', description: 'Allow students to sign up with campus email and specify dietary/transit defaults.', priority: 'must_have', module: 'Auth' },
      { id: 'FR-02', code: 'FR-02', title: 'Receipt & Meal Image Upload', description: 'Enable photo capture and upload for automated CO2e parsing via AI.', priority: 'must_have', module: 'AI Engine' },
      { id: 'FR-03', code: 'FR-03', title: 'Carbon Emissions Analytics', description: 'Display daily breakdown by category (Food, Commute, Energy, Goods).', priority: 'must_have', module: 'Dashboard' },
      { id: 'FR-04', code: 'FR-04', title: 'Sustainable Swaps Engine', description: 'Suggest lower-impact alternatives with cost parity comparison.', priority: 'should_have', module: 'Recommendations' },
      { id: 'FR-05', code: 'FR-05', title: 'Campus Dorm Leaderboard', description: 'Aggregate anonymous floor and dorm rankings for weekly eco-challenges.', priority: 'could_have', module: 'Gamification' }
    ],
    nonFunctional: [
      { id: 'NFR-01', category: 'performance', description: 'AI receipt analysis response time under 3.5 seconds.', metric: '< 3.5s p95' },
      { id: 'NFR-02', category: 'security', description: 'Receipt images must be sanitized and stripped of EXIF coordinates.', metric: 'Zero EXIF leakage' },
      { id: 'NFR-03', category: 'accessibility', description: 'WCAG 2.1 AA compliant color contrast on all charts.', metric: 'Contrast >= 4.5:1' },
      { id: 'NFR-04', category: 'scalability', description: 'Backend can ingest up to 200 concurrent receipt scans without queue stall.', metric: '200 req/sec' }
    ],
    userStories: [
      {
        id: 'US-01',
        asA: 'university student on a tight budget',
        iWant: 'to snap a photo of my cafeteria receipt',
        soThat: 'I can see the environmental impact of my lunch without typing 15 ingredients.',
        acceptanceCriteria: [
          'System identifies major food items with >85% accuracy',
          'Calculates estimated kg CO2e within 4 seconds',
          'Displays one immediate swap for next time'
        ]
      },
      {
        id: 'US-02',
        asA: 'campus environmental club leader',
        iWant: 'to view our hall leaderboards',
        soThat: 'our members stay motivated to reduce single-use plastic and food waste.',
        acceptanceCriteria: [
          'Weekly rankings refresh every Sunday at midnight',
          'Opt-in privacy toggle to stay anonymous'
        ]
      }
    ],
    updatedAt: new Date().toISOString()
  });

  // Architecture for EcoTrack AI
  await db.project_architecture.insertOne({
    projectId: ecoProject._id,
    currentView: 'beginner',
    beginnerArchitecture: {
      overview: 'Clean 3-tier architecture with React SPA frontend, Node/Express REST backend, and MongoDB database with direct Gemini AI integration.',
      diagramMermaid: `graph TD
  Client[React Mobile/Web App] -->|HTTPS REST| API[Express API Gateway]
  API -->|Auth JWT| AuthMiddleware[Auth Handler]
  API -->|Query/Mutate| DB[(MongoDB Atlas)]
  API -->|Multimodal Image Prompt| AI[Gemini 1.5 Flash API]
  API -->|File Stream| CloudStorage[Cloudinary Image Storage]`,
      components: [
        { name: 'Web/Mobile Client', type: 'client', tech: 'React + Tailwind + Vite', description: 'Responsive SPA with touch support and camera upload.', responsibilities: ['UI rendering', 'State management', 'File capture'] },
        { name: 'Core API Server', type: 'gateway', tech: 'Node.js + Express + TS', description: 'Central REST controller for data and AI coordination.', responsibilities: ['JWT verification', 'Validation', 'Rate limiting'] },
        { name: 'Database', type: 'database', tech: 'MongoDB', description: 'Primary document persistence.', responsibilities: ['User profiles', 'Emissions logs', 'Swaps catalog'] },
        { name: 'AI Vision Service', type: 'service', tech: 'Gemini API', description: 'Multimodal receipt recognition and emissions estimation.', responsibilities: ['OCR parsing', 'CO2 factor estimation'] }
      ],
      dataFlow: [
        '1. User captures receipt photo in Mobile Client',
        '2. Client uploads multipart file to Express /api/receipts/analyze',
        '3. Express verifies JWT token and calls Gemini API with strict structured prompt',
        '4. Gemini returns parsed items + emissions breakdown in JSON',
        '5. Express writes record to MongoDB and returns 201 Created to Client',
        '6. Client updates daily progress meter and invalidates cache'
      ]
    },
    productionArchitecture: {
      overview: 'High-availability microservice design with API Gateway, Redis caching, RabbitMQ asynchronous background queue for heavy OCR, and CDN edge distribution.',
      diagramMermaid: `flowchart TD
  User((Student User)) --> Cloudflare[Cloudflare CDN / WAF]
  Cloudflare --> Client[React SPA / PWA]
  Client --> Kong[Kong API Gateway]
  Kong --> AuthService[Auth Microservice]
  Kong --> CarbonService[Carbon Emissions API]
  CarbonService --> Redis[(Redis Cache)]
  CarbonService --> RabbitMQ[RabbitMQ Message Broker]
  RabbitMQ --> VisionWorker[AI Vision OCR Worker Pool]
  VisionWorker --> GeminiAPI[Gemini 1.5 Flash]
  CarbonService --> MongoDB[(MongoDB Primary + Replicas)]
  VisionWorker --> S3[(AWS S3 Encrypted)]`,
      components: [
        { name: 'Cloudflare Edge CDN', type: 'gateway', tech: 'Cloudflare', description: 'DDoS mitigation and static asset caching.', responsibilities: ['SSL termination', 'Bot detection', 'Edge caching'] },
        { name: 'Async OCR Worker', type: 'service', tech: 'Python FastAPI Worker', description: 'Consumes image processing queue jobs asynchronously.', responsibilities: ['Tesseract preprocessing', 'Gemini fallback', 'Emissions calculation'] },
        { name: 'Redis Cache', type: 'database', tech: 'Redis 7', description: 'Leaderboard ranking and session cache.', responsibilities: ['Sorted set leaderboards', 'Hot product query caching'] }
      ],
      dataFlow: [
        'Client requests presigned S3 URL',
        'Client uploads directly to S3',
        'Event triggers message onto RabbitMQ',
        'Worker processes image and notifies Client via WebSocket'
      ],
      authFlow: [
        'OAuth2 PKCE flow with JWT access token (15m expiry) and refresh token in HttpOnly cookie',
        'Gateway validates token signature locally via JWKS'
      ],
      aiPipelineFlow: [
        'Image preprocessing -> OCR confidence check -> LLM structured extraction -> Database lookup in OpenFoodFacts CO2 database'
      ],
      deploymentTopology: [
        'Frontend on Vercel Edge Network',
        'Backend APIs deployed on AWS ECS Fargate containers',
        'MongoDB Atlas M10 cluster with automated daily snapshots'
      ]
    },
    updatedAt: new Date().toISOString()
  });

  // Database Schema for EcoTrack AI
  await db.project_databases.insertOne({
    projectId: ecoProject._id,
    databaseType: 'mongodb',
    tables: [
      {
        name: 'users',
        description: 'User authentication credentials and campus affiliation.',
        fields: [
          { name: '_id', type: 'ObjectId', isPrimary: true, required: true },
          { name: 'name', type: 'String', required: true },
          { name: 'email', type: 'String', required: true, description: 'Unique campus email' },
          { name: 'passwordHash', type: 'String', required: true },
          { name: 'campusDorm', type: 'String', required: false },
          { name: 'createdAt', type: 'Date', required: true }
        ],
        indexes: ['email_unique', 'campusDorm_1'],
        sampleRecords: [
          { _id: 'usr_001', name: 'Alex Chen', email: 'student@projectforge.ai', campusDorm: 'Baker House', createdAt: '2026-09-01T00:00:00Z' }
        ]
      },
      {
        name: 'carbon_logs',
        description: 'Daily emissions entries logged by user with itemized breakdown.',
        fields: [
          { name: '_id', type: 'ObjectId', isPrimary: true, required: true },
          { name: 'userId', type: 'ObjectId', isForeign: true, references: 'users._id', required: true },
          { name: 'category', type: 'String', required: true, description: 'food | transport | shopping | energy' },
          { name: 'title', type: 'String', required: true },
          { name: 'co2eKg', type: 'Number', required: true },
          { name: 'imageUrl', type: 'String', required: false },
          { name: 'items', type: 'Array<Object>', required: true },
          { name: 'loggedAt', type: 'Date', required: true }
        ],
        indexes: ['userId_1_loggedAt_-1', 'category_1'],
        sampleRecords: [
          { _id: 'log_001', userId: 'usr_001', category: 'food', title: 'Dining Hall Beef Burger', co2eKg: 3.42, loggedAt: '2026-09-28T12:30:00Z', items: [{ name: 'Burger', co2: 3.2 }, { name: 'Fries', co2: 0.22 }] }
        ]
      },
      {
        name: 'green_swaps',
        description: 'Catalog of lower-carbon alternative items with savings metrics.',
        fields: [
          { name: '_id', type: 'ObjectId', isPrimary: true, required: true },
          { name: 'originalItem', type: 'String', required: true },
          { name: 'suggestedSwap', type: 'String', required: true },
          { name: 'co2SavingsKg', type: 'Number', required: true },
          { name: 'costDifference', type: 'String', required: true }
        ],
        indexes: ['originalItem_text'],
        sampleRecords: [
          { _id: 'swp_001', originalItem: 'Beef Burger', suggestedSwap: 'Black Bean Quinoa Patty', co2SavingsKg: 2.85, costDifference: '-$1.50' }
        ]
      }
    ],
    relationships: [
      { from: 'carbon_logs.userId', to: 'users._id', type: 'many_to_one', description: 'Each carbon log entry belongs to a registered user.' }
    ],
    diagramMermaid: `erDiagram
  users ||--o{ carbon_logs : logs
  users {
    ObjectId _id PK
    String name
    String email UK
    String campusDorm
  }
  carbon_logs {
    ObjectId _id PK
    ObjectId userId FK
    String category
    Number co2eKg
    Date loggedAt
  }
  green_swaps {
    ObjectId _id PK
    String originalItem
    String suggestedSwap
    Number co2SavingsKg
  }`,
    updatedAt: new Date().toISOString()
  });

  // APIs for EcoTrack AI
  await db.project_apis.insertOne({
    projectId: ecoProject._id,
    endpoints: [
      {
        id: 'ep-01',
        name: 'Upload & Analyze Receipt Photo',
        method: 'POST',
        path: '/api/receipts/analyze',
        authRequired: true,
        description: 'Uploads receipt or food image, triggers Gemini multimodal analysis, returns parsed items and CO2 estimate.',
        parameters: [],
        requestBody: { imageBase64: 'data:image/jpeg;base64,...', category: 'food' },
        responseSuccess: {
          status: 200,
          body: { success: true, data: { totalCo2eKg: 3.42, items: [{ name: 'Oat Milk Latte', co2eKg: 0.35 }], recommendations: ['Great choice! Oat milk saved ~0.4kg compared to dairy.'] } }
        },
        responseError: {
          status: 400,
          body: { success: false, error: { code: 'INVALID_IMAGE', message: 'Unable to parse food items from the provided image.' } }
        },
        curlSnippet: `curl -X POST https://api.ecotrack.ai/api/receipts/analyze \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"category": "food", "imageBase64": "..."}'`
      },
      {
        id: 'ep-02',
        name: 'Get Weekly Carbon Summary',
        method: 'GET',
        path: '/api/analytics/weekly',
        authRequired: true,
        description: 'Retrieves aggregated emissions for the last 7 days grouped by category.',
        parameters: [{ name: 'startDate', type: 'string', in: 'query', required: false, description: 'ISO date string' }],
        responseSuccess: {
          status: 200,
          body: { success: true, data: { weekTotalKg: 14.8, dailyAverage: 2.11, targetKg: 15.0, breakdown: { food: 8.2, transport: 4.1, energy: 2.5 } } }
        },
        responseError: {
          status: 401,
          body: { success: false, error: { code: 'UNAUTHORIZED', message: 'Missing or expired token' } }
        },
        curlSnippet: `curl -X GET "https://api.ecotrack.ai/api/analytics/weekly" -H "Authorization: Bearer YOUR_TOKEN"`
      }
    ],
    updatedAt: new Date().toISOString()
  });

  // UI Screens for EcoTrack AI
  await db.project_ui.insertOne({
    projectId: ecoProject._id,
    screens: [
      {
        id: 'scr-01',
        name: 'Home Eco Dashboard',
        purpose: 'Displays daily CO2 gauge, quick scan CTA, and recent emissions activity.',
        layoutType: 'mobile',
        components: ['Daily Progress Ring', 'Camera Quick Button', 'Category Breakdown Cards', 'Recommended Swap of the Day'],
        userActions: ['Tap scan button to launch camera', 'Click category to filter', 'View weekly trend'],
        apiDependencies: ['GET /api/analytics/weekly', 'GET /api/logs/recent'],
        wireframeLayout: {
          header: 'Top Bar: Greeting, Streak Counter (🔥 7 days), Profile Avatar',
          sections: [
            { title: 'Hero Carbon Meter', element: 'Circular Gauge Widget', details: 'Displays 2.4 / 4.0 kg daily budget with green/amber indicator.' },
            { title: 'Quick Action', element: 'Floating Action Button', details: 'Prominent Scan Receipt button with Camera icon.' },
            { title: 'Recent Logs', element: 'Scrollable List', details: 'Card list showing cafeteria lunch, subway trip, dorm electricity.' }
          ],
          bottomNav: ['Home', 'Scan', 'Leaderboard', 'Profile']
        }
      },
      {
        id: 'scr-02',
        name: 'AI Scanner & Confirmation',
        purpose: 'Camera viewfinder for scanning receipts with instant AI preview and edit capabilities.',
        layoutType: 'mobile',
        components: ['Camera Preview', 'Bounding Box Overlay', 'Parsed Item Table', 'Confirm & Save Button'],
        userActions: ['Take photo', 'Pick from gallery', 'Adjust detected item weights', 'Confirm log'],
        apiDependencies: ['POST /api/receipts/analyze', 'POST /api/logs'],
        wireframeLayout: {
          header: 'Back button, Title: "Scan Receipt", Flash toggle',
          sections: [
            { title: 'Viewfinder', element: 'Live Camera Box', details: 'Guides student to align receipt within frame.' },
            { title: 'Detected Items Drawer', element: 'Bottom Sheet Modal', details: 'Shows parsed list with edit buttons and CO2 tag.' }
          ]
        }
      }
    ],
    designSystem: {
      primaryColor: '#16a34a',
      secondaryColor: '#059669',
      fontFamily: 'Inter',
      borderRadius: '16px'
    },
    navigationFlow: 'Home -> Scanner Modal -> Confirmation Sheet -> Updated Home -> Leaderboard',
    updatedAt: new Date().toISOString()
  });

  // Development Roadmap for EcoTrack AI
  await db.roadmaps.insertOne({
    projectId: ecoProject._id,
    phases: [
      {
        phaseNumber: 1,
        title: 'Project Setup & Design Tokens',
        objective: 'Initialize Vite React project, configure Tailwind CSS, and set up Express backend server.',
        estimatedDays: 3,
        skillsRequired: ['Git', 'TypeScript', 'Node.js', 'Vite'],
        tasks: ['Initialize repo with workspaces', 'Setup ESLint & Prettier', 'Configure MongoDB connection'],
        deliverables: ['Working mono-repo', 'Health check API responding 200 OK']
      },
      {
        phaseNumber: 2,
        title: 'Authentication & Profile Management',
        objective: 'Implement JWT authentication with secure password hashing and profile onboarding.',
        estimatedDays: 4,
        skillsRequired: ['JWT', 'bcrypt', 'React Context'],
        tasks: ['User registration API', 'Login API with JWT', 'Student profile form UI'],
        deliverables: ['Working login/signup flow', 'Protected route guards']
      },
      {
        phaseNumber: 3,
        title: 'Emissions Logging & Database Storage',
        objective: 'Create carbon log endpoints and database persistence with category tagging.',
        estimatedDays: 5,
        skillsRequired: ['MongoDB', 'Express Controllers'],
        tasks: ['POST /api/logs endpoint', 'GET /api/logs with pagination', 'Daily dashboard calculation logic'],
        deliverables: ['Working CRUD for emissions logs']
      },
      {
        phaseNumber: 4,
        title: 'AI Multimodal Vision Integration',
        objective: 'Connect Gemini 1.5 Flash API for receipt OCR and CO2 calculation.',
        estimatedDays: 6,
        skillsRequired: ['Gemini API', 'Prompt Engineering', 'Multipart Uploads'],
        tasks: ['Image upload handler', 'Gemini prompt with Zod schema validation', 'Fallback error handling'],
        deliverables: ['Working receipt scan returning parsed food items in <3.5s']
      },
      {
        phaseNumber: 5,
        title: 'Dashboard & Data Visualization',
        objective: 'Build interactive mobile-first charts and circular progress meter.',
        estimatedDays: 5,
        skillsRequired: ['React', 'SVG / Canvas', 'Tailwind CSS'],
        tasks: ['Build Circular Progress Gauge', 'Weekly bar chart for categories', 'Streak tracking logic'],
        deliverables: ['Responsive, animated student dashboard']
      },
      {
        phaseNumber: 6,
        title: 'End-to-End Testing & Polish',
        objective: 'Write unit tests, responsive testing on mobile viewports, and audit edge cases.',
        estimatedDays: 4,
        skillsRequired: ['Vitest', 'Supertest', 'Manual QA'],
        tasks: ['Test AI response failure handling', 'Verify 320px mobile viewport rendering', 'Sanitize image inputs'],
        deliverables: ['All test suites passing', 'Zero console warnings']
      },
      {
        phaseNumber: 7,
        title: 'Deployment & Portfolio Presentation',
        objective: 'Deploy frontend to Vercel and backend to Render, write README, and publish portfolio page.',
        estimatedDays: 3,
        skillsRequired: ['Vercel', 'Render', 'CI/CD'],
        tasks: ['Deploy API to Render', 'Deploy SPA to Vercel', 'Generate public portfolio showcase link'],
        deliverables: ['Live URL accessible to recruiters', 'Comprehensive GitHub README']
      }
    ],
    updatedAt: new Date().toISOString()
  });

  // Tasks for EcoTrack AI
  const ecoTasks = [
    { title: 'Setup TypeScript Monorepo & Express Server', phaseNumber: 1, status: 'completed' as const, priority: 'high' as const, estimatedHours: 4, order: 1, tags: ['Backend', 'Setup'] },
    { title: 'Create MongoDB schemas for Users and CarbonLogs', phaseNumber: 1, status: 'completed' as const, priority: 'high' as const, estimatedHours: 3, order: 2, tags: ['Database'] },
    { title: 'Implement JWT Auth & Password Hashing', phaseNumber: 2, status: 'completed' as const, priority: 'high' as const, estimatedHours: 6, order: 3, tags: ['Security', 'Auth'] },
    { title: 'Build Mobile Dashboard Hero Progress Ring', phaseNumber: 5, status: 'in_progress' as const, priority: 'medium' as const, estimatedHours: 5, order: 4, tags: ['Frontend', 'UI'] },
    { title: 'Integrate Gemini API with Structured Receipt Prompt', phaseNumber: 4, status: 'todo' as const, priority: 'urgent' as const, estimatedHours: 8, order: 5, tags: ['AI', 'Backend'] },
    { title: 'Implement Dorm Leaderboard Aggregation Query', phaseNumber: 5, status: 'backlog' as const, priority: 'low' as const, estimatedHours: 4, order: 6, tags: ['Backend'] },
    { title: 'Write Unit Tests for Carbon Factor Math', phaseNumber: 6, status: 'todo' as const, priority: 'medium' as const, estimatedHours: 4, order: 7, tags: ['Testing'] }
  ];

  for (const t of ecoTasks) {
    await db.tasks.insertOne({
      projectId: ecoProject._id,
      title: t.title,
      description: `Task execution for ${t.title}. Ensure adherence to project requirements.`,
      status: t.status,
      priority: t.priority,
      phaseNumber: t.phaseNumber,
      estimatedHours: t.estimatedHours,
      dependencies: [],
      tags: t.tags,
      order: t.order,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  // Test Cases for EcoTrack AI
  const ecoTestCases = [
    { testId: 'TC-01', type: 'api' as const, feature: 'Auth', scenario: 'User registers with valid email and password', input: 'email: test@college.edu, password: ValidPassword123!', expectedResult: '201 Created with JWT token and user profile object', status: 'pass' as const },
    { testId: 'TC-02', type: 'api' as const, feature: 'Auth', scenario: 'User attempts registration with already registered email', input: 'email: student@projectforge.ai', expectedResult: '409 Conflict with message "Email already registered"', status: 'pass' as const },
    { testId: 'TC-03', type: 'unit' as const, feature: 'AI Calculation', scenario: 'Receipt contains non-food item (e.g. stationery)', input: 'Notebook: $5.00', expectedResult: 'Categorized under "shopping/goods" with baseline CO2 factor', status: 'pass' as const },
    { testId: 'TC-04', type: 'security' as const, feature: 'Image Upload', scenario: 'Malicious user uploads non-image executable', input: 'shell.php named receipt.jpg', expectedResult: '400 Bad Request with strict MIME type verification failure', status: 'pass' as const },
    { testId: 'TC-05', type: 'ui' as const, feature: 'Responsive UI', scenario: 'Render dashboard on 320px screen width', input: 'Viewport 320x640', expectedResult: 'No horizontal overflow, text wraps cleanly, cards stack vertically', status: 'pass' as const }
  ];

  for (const tc of ecoTestCases) {
    await db.test_cases.insertOne({
      projectId: ecoProject._id,
      ...tc,
      updatedAt: new Date().toISOString()
    });
  }

  // Documentation for EcoTrack AI
  await db.documents.insertOne({
    projectId: ecoProject._id,
    readme: `# EcoTrack AI — Sustainable Habits Powered by Vision AI

Turn daily student habits into measurable carbon reductions with automated receipt recognition.

## Features
- **Instant Photo Receipt OCR**: Calculates CO2 equivalents without manual data entry.
- **Smart Swaps**: Budget-friendly alternatives to high-carbon foods.
- **Campus Challenges**: Real-time dorm leaderboards.

## Tech Stack
- Frontend: React 18, Tailwind CSS, Lucide Icons, Vite
- Backend: Express.js, Node.js, TypeScript
- Database: MongoDB Atlas
- AI: Google Gemini 1.5 Flash API
`,
    abstract: 'EcoTrack AI addresses the climate information gap among university students by combining computer vision and carbon estimation models. Students scan daily receipts and food purchases, receiving instant carbon footprint calculations and actionable low-cost green swaps.',
    problemStatement: 'Most college students desire to live sustainably but lack actionable insight into the precise carbon impact of their daily cafeteria and grocery purchases.',
    objectives: [
      'Automate receipt logging using multimodal LLMs in under 3.5 seconds',
      'Provide contextual, budget-sensitive food swaps',
      'Demonstrate measurable carbon reduction through gamified dorm challenges'
    ],
    scope: 'Initial release focuses on university food and transit logging with expansion to retail barcodes in phase 2.',
    systemRequirements: 'Node.js 18+, Modern browser (Chrome/Safari/Edge), Camera-enabled mobile device.',
    architectureGuide: 'The system uses a decoupled client-server architecture with an Express API Gateway managing JWT authentication, input validation, and asynchronous calls to the Gemini multimodal model.',
    databaseGuide: 'Data is organized into three core collections: users (credentials and preferences), carbon_logs (time-series emissions records), and green_swaps (recommendation catalog).',
    apiGuide: 'RESTful API with JSON payloads protected by Bearer JWT tokens. Endpoints follow standard HTTP status codes.',
    testingReport: '5/5 automated test cases passing. Zero critical security vulnerabilities. Response latency averages 2.1s.',
    futureEnhancements: [
      'Integration with campus meal plan smart cards',
      'Direct barcode scanner for retail snacks',
      'Solar energy offset tracking for student apartments'
    ],
    updatedAt: new Date().toISOString()
  });

  // Portfolio Page for EcoTrack AI
  await db.portfolio_pages.insertOne({
    projectId: ecoProject._id,
    userId: studentUser._id,
    slug: 'ecotrack-ai',
    isPublic: true,
    customHeadline: 'EcoTrack AI: Helping 1,200+ students reduce carbon emissions with Computer Vision',
    featuredScreenshots: [
      'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800'
    ],
    highlights: [
      'Engineered multimodal AI receipt parser achieving 92% extraction accuracy',
      'Designed responsive mobile-first UI with 100% WCAG accessibility compliance',
      'Optimized MongoDB aggregation pipelines for instant leaderboard updates'
    ],
    metrics: { views: 245, likes: 38 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  // Notifications for student
  await db.notifications.insertOne({
    userId: studentUser._id,
    title: 'Welcome to ProjectForge AI! 🚀',
    message: 'Your profile has been set up with your skills in Python, React, and FastAPI. Explore recommended projects or generate a custom one.',
    type: 'system',
    read: false,
    link: '/dashboard',
    createdAt: new Date().toISOString()
  });

  console.log('[Seed] Seeding completed successfully!');
}

if (require.main === module) {
  runSeed(true).then(() => process.exit(0)).catch(err => {
    console.error('[Seed] Error:', err);
    process.exit(1);
  });
}
