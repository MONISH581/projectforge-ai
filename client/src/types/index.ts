// Client TypeScript Type Definitions

export type UserRole = 'student' | 'admin';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isOnboarded: boolean;
  avatarUrl?: string;
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface Profile {
  _id: string;
  userId: string;
  college: string;
  degree: string;
  department: string;
  currentYear: string;
  graduationYear: number;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  careerGoal: string;
  bio?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  preferences: {
    preferredTeamSize: 'solo' | 'team' | 'any';
    targetDuration: '1_week' | '2_weeks' | '1_month' | '2_months' | '3_plus_months';
    preferredPlatforms: string[];
    projectObjective: 'academic' | 'portfolio' | 'hackathon' | 'startup' | 'learning';
  };
}

export interface Skill {
  _id: string;
  userId: string;
  name: string;
  category: 'programming' | 'frontend' | 'backend' | 'database' | 'ai' | 'mobile' | 'cloud_devops' | 'cybersecurity' | 'other';
  level: 'beginner' | 'intermediate' | 'advanced';
  yearsExperience: number;
  confidenceScore: number;
  projectsCount?: number;
}

export interface Project {
  _id: string;
  userId: string;
  name: string;
  slug: string;
  tagline: string;
  oneLineDescription: string;
  detailedDescription: string;
  problemStatement: string;
  targetUsers: string[];
  existingPainPoints: string[];
  proposedSolution: string;
  keyDifferentiator: string;
  expectedImpact: string;
  features: {
    mvp: string[];
    phase2: string[];
    advanced: string[];
  };
  techStack: {
    frontend: string[];
    backend: string[];
    database: string[];
    ai: string[];
    authentication: string[];
    storage: string[];
    hosting: string[];
    monitoring: string[];
  };
  complexity: {
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedDuration: string;
    teamSize: string;
    requiredSkills: string[];
  };
  learningOpportunities: string[];
  category: string;
  domain: string;
  visibility: 'public' | 'private' | 'unlisted';
  status: 'draft' | 'planning' | 'in_development' | 'testing' | 'completed' | 'archived';
  isFeatured?: boolean;
  version: number;
  completionScore?: number;
  githubUrl?: string;
  liveDemoUrl?: string;
  skillMatch?: {
    count: number;
    skills: string[];
    explanation: string;
  };
  readinessBreakdown?: {
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
  createdAt: string;
  updatedAt: string;
}

export interface FunctionalRequirement {
  id: string;
  code: string;
  title: string;
  description: string;
  priority: 'must_have' | 'should_have' | 'could_have';
  module: string;
}

export interface NonFunctionalRequirement {
  id: string;
  category: 'performance' | 'security' | 'scalability' | 'availability' | 'accessibility';
  description: string;
  metric: string;
}

export interface UserStory {
  id: string;
  asA: string;
  iWant: string;
  soThat: string;
  acceptanceCriteria: string[];
}

export interface ProjectRequirements {
  _id: string;
  projectId: string;
  functional: FunctionalRequirement[];
  nonFunctional: NonFunctionalRequirement[];
  userStories: UserStory[];
}

export interface ArchitectureComponent {
  name: string;
  type: 'client' | 'gateway' | 'service' | 'database' | 'storage' | 'external';
  description: string;
  tech: string;
  responsibilities: string[];
}

export interface ProjectArchitecture {
  _id: string;
  projectId: string;
  beginnerArchitecture: {
    overview: string;
    diagramMermaid: string;
    components: ArchitectureComponent[];
    dataFlow: string[];
  };
  productionArchitecture: {
    overview: string;
    diagramMermaid: string;
    components: ArchitectureComponent[];
    dataFlow: string[];
    authFlow: string[];
    aiPipelineFlow: string[];
    deploymentTopology: string[];
  };
  currentView: 'beginner' | 'production';
}

export interface DatabaseField {
  name: string;
  type: string;
  isPrimary?: boolean;
  isForeign?: boolean;
  references?: string;
  required: boolean;
  description?: string;
}

export interface DatabaseTableOrCollection {
  name: string;
  description: string;
  fields: DatabaseField[];
  indexes: string[];
  sampleRecords: Record<string, any>[];
}

export interface ProjectDatabase {
  _id: string;
  projectId: string;
  databaseType: 'mongodb' | 'postgresql' | 'mysql';
  tables: DatabaseTableOrCollection[];
  relationships: {
    from: string;
    to: string;
    type: 'one_to_one' | 'one_to_many' | 'many_to_one' | 'many_to_many';
    description: string;
  }[];
  diagramMermaid: string;
}

export interface ApiEndpoint {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  authRequired: boolean;
  description: string;
  headers?: Record<string, string>;
  parameters?: { name: string; type: string; in: 'path' | 'query'; required: boolean; description: string }[];
  requestBody?: Record<string, any>;
  responseSuccess: { status: number; body: Record<string, any> };
  responseError: { status: number; body: Record<string, any> };
  curlSnippet?: string;
}

export interface ProjectApis {
  _id: string;
  projectId: string;
  endpoints: ApiEndpoint[];
}

export interface UIScreen {
  id: string;
  name: string;
  purpose: string;
  layoutType: 'mobile' | 'tablet' | 'responsive';
  components: string[];
  userActions: string[];
  navigationTarget?: string;
  apiDependencies: string[];
  wireframeLayout: {
    header: string;
    sections: { title: string; element: string; details: string }[];
    bottomNav?: string[];
  };
}

export interface ProjectUI {
  _id: string;
  projectId: string;
  screens: UIScreen[];
  designSystem: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    borderRadius: string;
  };
  navigationFlow: string;
}

export interface RoadmapPhase {
  phaseNumber: number;
  title: string;
  objective: string;
  estimatedDays: number;
  skillsRequired: string[];
  tasks: string[];
  deliverables: string[];
}

export interface ProjectRoadmap {
  _id: string;
  projectId: string;
  phases: RoadmapPhase[];
}

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'testing' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  _id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  phaseNumber: number;
  estimatedHours: number;
  dependencies: string[];
  tags: string[];
  order: number;
}

export interface TestCase {
  _id: string;
  projectId: string;
  testId: string;
  type: 'unit' | 'integration' | 'api' | 'ui' | 'security' | 'edge_case';
  feature: string;
  scenario: string;
  input: string;
  expectedResult: string;
  status: 'pass' | 'fail' | 'blocked' | 'untested';
}

export interface ProjectDocument {
  _id: string;
  projectId: string;
  readme: string;
  abstract: string;
  problemStatement: string;
  objectives: string[];
  scope: string;
  systemRequirements: string;
  architectureGuide: string;
  databaseGuide: string;
  apiGuide: string;
  testingReport: string;
  futureEnhancements: string[];
}

export interface NotificationItem {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'deadline' | 'milestone' | 'ai_completed' | 'system';
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface Technology {
  _id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  iconName: string;
  popular: boolean;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  iconName: string;
  projectCount?: number;
}

export interface ValidationReport {
  feasibilityScore: number;
  complexityVerdict: 'manageable' | 'challenging' | 'high_risk' | 'ideal';
  strengths: string[];
  risks: string[];
  missingSkills: string[];
  scopeProblems: string[];
  recommendedChanges: string[];
  mvpRecommendation: string;
  skillCompatibilityAnalysis: string;
  deploymentFeasibility: string;
}
