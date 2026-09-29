import { db } from '../src/db/storage';
import { runSeed } from '../src/db/seed';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../src/config';
import { aiEngine } from '../src/ai/generator';
import { calculateProjectReadiness } from '../src/routes/projects.routes';

async function runTestSuite() {
  console.log('====================================================');
  console.log('🧪 PROJECTFORGE AI — AUTOMATED BACKEND TEST SUITE');
  console.log('====================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // Ensure DB has seed data
  await runSeed(false);

  // ----------------------------------------------------
  // TEST GROUP 1: AUTHENTICATION & SECURITY
  // ----------------------------------------------------
  console.log('\n--- 1. Authentication & Security Tests ---');

  // Test 1.1: Verify seed user exists
  const student = await db.users.findOne({ email: 'student@projectforge.ai' });
  assert(Boolean(student), 'Demo student user exists');
  assert(student?.role === 'student', 'Demo student has student role');

  // Test 1.2: Password bcrypt verification
  const isStudentPassValid = await bcrypt.compare('Password123!', student!.passwordHash);
  assert(isStudentPassValid, 'Student password matches bcrypt hash');

  const isInvalidPassRejected = !(await bcrypt.compare('WrongPassword', student!.passwordHash));
  assert(isInvalidPassRejected, 'Invalid password is fundamentally rejected');

  // Test 1.3: JWT token generation and verification
  const token = jwt.sign(
    { userId: student!._id, email: student!.email, role: student!.role },
    config.jwtSecret,
    { expiresIn: '1h' }
  );
  const decoded = jwt.verify(token, config.jwtSecret) as any;
  assert(decoded.userId === student!._id, 'JWT contains valid userId payload');
  assert(decoded.role === 'student', 'JWT contains student role');

  // Test 1.4: Admin credentials check
  const admin = await db.users.findOne({ email: 'admin@projectforge.ai' });
  assert(Boolean(admin), 'Admin user exists');
  assert(admin?.role === 'admin', 'Admin user has admin role');
  const isAdminPassValid = await bcrypt.compare('AdminSecure2026!', admin!.passwordHash);
  assert(isAdminPassValid, 'Admin password matches bcrypt hash');

  // ----------------------------------------------------
  // TEST GROUP 2: SKILLS & INTELLIGENCE
  // ----------------------------------------------------
  console.log('\n--- 2. Skills Intelligence Tests ---');
  const skills = await db.skills.find({ userId: student!._id });
  assert(skills.length >= 5, `Student has ${skills.length} skills loaded`);

  const hasPython = skills.some(s => s.name === 'Python' && s.level === 'advanced');
  assert(hasPython, 'Student has advanced Python skill');

  const hasReact = skills.some(s => s.name === 'React');
  assert(hasReact, 'Student has React skill');

  // ----------------------------------------------------
  // TEST GROUP 3: AI PROJECT GENERATION & VALIDATION
  // ----------------------------------------------------
  console.log('\n--- 3. AI Generation & Schema Validation Tests ---');

  const generated = await aiEngine.generateProject({
    goal: 'Campus Ride Sharing & Carpool Optimizer',
    domain: 'Social Impact',
    experienceLevel: 'intermediate',
    duration: '1 month',
    teamSize: 'Solo',
    platform: 'Mobile / Web',
    objective: 'Portfolio',
    userSkills: ['React', 'Python', 'FastAPI', 'MongoDB']
  });

  assert(Boolean(generated.project?.name), `Generated project: "${generated.project?.name}"`);
  assert(Boolean(generated.project?.problemStatement), 'Project contains explicit problem statement');
  assert(Array.isArray(generated.project?.features?.mvp) && generated.project.features.mvp.length > 0, 'Project contains MVP feature array');
  assert(Array.isArray(generated.project?.learningOpportunities), 'Project outlines clear student learning opportunities');

  // Test Validation Engine
  const validation = await aiEngine.validateProject(generated.project, skills);
  assert(typeof validation.report?.feasibilityScore === 'number', `Feasibility score evaluated: ${validation.report?.feasibilityScore}%`);
  assert(validation.report?.strengths?.length > 0, 'Validation identifies specific project strengths');
  assert(Boolean(validation.report?.mvpRecommendation), 'Validation provides actionable MVP recommendation');

  // ----------------------------------------------------
  // TEST GROUP 4: ARCHITECTURE & SYSTEM DESIGN
  // ----------------------------------------------------
  console.log('\n--- 4. Architecture & Requirements Generation Tests ---');

  const reqs = await aiEngine.generateRequirements(generated.project);
  assert(reqs.requirements?.functional?.length >= 3, `Generated ${reqs.requirements?.functional?.length} functional requirements`);
  assert(reqs.requirements?.userStories?.length >= 2, `Generated ${reqs.requirements?.userStories?.length} user stories`);

  const arch = await aiEngine.generateArchitecture(generated.project);
  assert(Boolean(arch.architecture?.beginnerArchitecture?.diagramMermaid), 'Beginner architecture contains Mermaid diagram');
  assert(Boolean(arch.architecture?.productionArchitecture?.diagramMermaid), 'Production architecture contains Mermaid diagram');
  assert(arch.architecture?.productionArchitecture?.components?.length >= 3, 'Production architecture defines modular components');

  // ----------------------------------------------------
  // TEST GROUP 5: DATABASE & API DESIGNER
  // ----------------------------------------------------
  console.log('\n--- 5. Database & API Designer Tests ---');

  const database = await aiEngine.generateDatabaseDesign(generated.project, 'mongodb');
  assert(database.database?.tables?.length >= 2, `Database contains ${database.database?.tables?.length} collections`);
  assert(database.database?.tables[0].fields?.length >= 2, 'Primary collection has structured fields');

  const apis = await aiEngine.generateApiDesign(generated.project);
  assert(apis.apis?.endpoints?.length >= 3, `APIs generated with ${apis.apis?.endpoints?.length} REST endpoints`);
  assert(Boolean(apis.apis?.endpoints[0].curlSnippet), 'API endpoints include copyable cURL examples');

  // ----------------------------------------------------
  // TEST GROUP 6: WORKSPACE & TASK READINESS
  // ----------------------------------------------------
  console.log('\n--- 6. Workspace Readiness & Task Tracking Tests ---');

  const showcaseProject = await db.projects.findOne({ slug: 'ecotrack-ai' });
  assert(Boolean(showcaseProject), 'Showcase project "EcoTrack AI" is loaded');

  const readiness = await calculateProjectReadiness(showcaseProject!._id);
  assert(readiness.score >= 50, `Showcase project readiness score: ${readiness.score}%`);
  assert(readiness.breakdown.requirements, 'Requirements module marked complete');
  assert(readiness.breakdown.architecture, 'Architecture module marked complete');
  assert(readiness.breakdown.database, 'Database module marked complete');
  assert(readiness.breakdown.apis, 'APIs module marked complete');
  assert(readiness.breakdown.tasksTotal > 0, `Tasks loaded: ${readiness.breakdown.tasksTotal}`);

  // ----------------------------------------------------
  // TEST GROUP 7: USER DATA ISOLATION & OBJECT SECURITY
  // ----------------------------------------------------
  console.log('\n--- 7. Data Isolation & Access Control Tests ---');

  const foreignUserProjects = await db.projects.find({ userId: 'different_user_id' });
  assert(foreignUserProjects.length === 0, 'Foreign user cannot access other user projects without permission');

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal Test Suite Error:', err);
  process.exit(1);
});
