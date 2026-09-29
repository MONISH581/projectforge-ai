// ProjectForge AI — End-to-End Live System Verification Script

const BASE_URL = 'http://localhost:5000/api';

async function runLiveE2ETest() {
  console.log('================================================================');
  console.log('🚀 PROJECTFORGE AI — END-TO-END LIVE USER JOURNEY AUDIT');
  console.log('================================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, stepName: string, extraInfo: string = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${stepName} ${extraInfo ? `(${extraInfo})` : ''}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${stepName} ${extraInfo ? `(${extraInfo})` : ''}`);
      failed++;
    }
  }

  // 1. Health check
  const healthRes = await fetch(`${BASE_URL}/health`).then(r => r.json());
  assert(healthRes.success && healthRes.data.status === 'healthy', '1. System Health Check', healthRes.data?.aiProvider);

  // 2. Register new student
  const testEmail = `student_${Date.now()}@college.edu`;
  const registerPayload = {
    name: 'Maria Rodriguez',
    email: testEmail,
    password: 'Password123!',
    college: 'UC Berkeley',
    degree: 'B.S. EECS',
    department: 'Computer Science',
    year: '3rd Year',
    graduationYear: 2027
  };

  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registerPayload)
  }).then(r => r.json());

  assert(regRes.success && Boolean(regRes.data.token), '2. Student Registration Flow', `Email: ${testEmail}`);
  const studentToken = regRes.data.token;
  const studentId = regRes.data.user._id;

  // 3. Authenticated session check (GET /api/auth/me)
  const meRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  }).then(r => r.json());
  assert(meRes.success && meRes.data.user.email === testEmail, '3. Authenticated Session /me', meRes.data.user.name);

  // 4. Guided Onboarding (5 Steps)
  const onboardingPayload = {
    college: 'UC Berkeley',
    degree: 'B.S. EECS',
    department: 'Computer Science',
    currentYear: '3rd Year',
    experienceLevel: 'intermediate',
    skills: [
      { name: 'Python', category: 'programming', level: 'advanced', yearsExperience: 2, confidenceScore: 85 },
      { name: 'React', category: 'frontend', level: 'intermediate', yearsExperience: 1.5, confidenceScore: 75 },
      { name: 'MongoDB', category: 'database', level: 'intermediate', yearsExperience: 1, confidenceScore: 70 },
      { name: 'FastAPI', category: 'backend', level: 'intermediate', yearsExperience: 1, confidenceScore: 70 }
    ],
    interests: ['Sustainability & Green', 'AI & Machine Learning'],
    careerGoal: 'Full Stack AI Engineer',
    preferences: {
      preferredTeamSize: 'solo',
      targetDuration: '1_month',
      preferredPlatforms: ['Web', 'AI'],
      projectObjective: 'portfolio'
    }
  };

  const onboardRes = await fetch(`${BASE_URL}/profile/onboarding`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${studentToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(onboardingPayload)
  }).then(r => r.json());
  assert(onboardRes.success && onboardRes.data.user.isOnboarded === true, '4. 5-Step Guided Onboarding Completed');

  // 5. Skill Intelligence & Radar
  const skillsRes = await fetch(`${BASE_URL}/skills`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  }).then(r => r.json());
  assert(skillsRes.success && skillsRes.data.skills.length === 4, '5. Skill Profile Loaded', `Skills: 4`);
  assert(skillsRes.data.radarData.length > 0, '5.1 Skill Radar Distribution Calculated');
  assert(Boolean(skillsRes.data.recommendation), '5.2 AI Career Recommendation Generated', skillsRes.data.recommendation.slice(0, 50) + '...');

  // 6. Student Dashboard Stats
  const dashRes = await fetch(`${BASE_URL}/projects/dashboard-stats`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  }).then(r => r.json());
  assert(dashRes.success && typeof dashRes.data.stats.projectsCreated === 'number', '6. Dashboard Metrics Loaded');

  // 7. Project Discovery Marketplace with Skill Match Intelligence
  const discoverRes = await fetch(`${BASE_URL}/projects/discover`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  }).then(r => r.json());
  assert(discoverRes.success && discoverRes.data.projects.length > 0, '7. Project Discovery Marketplace', `Count: ${discoverRes.data.projects.length}`);
  const matchedProject = discoverRes.data.projects.find((p: any) => p.skillMatch?.count > 0);
  assert(Boolean(matchedProject), '7.1 Smart Skill-Matching Badge Calculated', matchedProject?.skillMatch?.explanation);

  // 8. AI Project Generator Wizard
  const generatePayload = {
    goal: 'SolarGrid AI: Microgrid solar energy distribution and battery monitor for student co-ops',
    domain: 'Sustainability & Green',
    experienceLevel: 'intermediate',
    duration: '1 month',
    teamSize: 'Solo',
    platform: 'Web & AI',
    objective: 'Portfolio'
  };

  const genRes = await fetch(`${BASE_URL}/ai/generate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${studentToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(generatePayload)
  }).then(r => r.json());

  assert(genRes.success && Boolean(genRes.data.project.name), '8. AI Project Generator', `Title: "${genRes.data.project.name}"`);
  const generated = genRes.data.project;

  // 9. Validation Engine
  const valRes = await fetch(`${BASE_URL}/ai/validate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${studentToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ project: generated })
  }).then(r => r.json());

  assert(valRes.success && typeof valRes.data.validation.feasibilityScore === 'number', '9. AI Validation Engine', `Score: ${valRes.data.validation.feasibilityScore}%`);
  assert(valRes.data.validation.strengths.length > 0, '9.1 Validation Strengths Identified');
  assert(Boolean(valRes.data.validation.mvpRecommendation), '9.2 MVP Recommendation Scoped');

  // 10. Accept Project & Full Workspace Auto-Assembly
  const acceptRes = await fetch(`${BASE_URL}/ai/accept`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${studentToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ project: generated })
  }).then(r => r.json());

  assert(acceptRes.success && Boolean(acceptRes.data.projectId), '10. Project Accepted & Workspace Assembled', `ID: ${acceptRes.data.projectId}`);
  const projectId = acceptRes.data.projectId;
  const projectSlug = acceptRes.data.project.slug;

  // 11. Inspect Workspace Modules
  const [wReqs, wArch, wDb, wApis, wUi, wRoadmap, wTasks, wTests, wDocs, wDeploy] = await Promise.all([
    fetch(`${BASE_URL}/projects/${projectId}/requirements`, { headers: { 'Authorization': `Bearer ${studentToken}` } }).then(r => r.json()),
    fetch(`${BASE_URL}/projects/${projectId}/architecture`, { headers: { 'Authorization': `Bearer ${studentToken}` } }).then(r => r.json()),
    fetch(`${BASE_URL}/projects/${projectId}/database`, { headers: { 'Authorization': `Bearer ${studentToken}` } }).then(r => r.json()),
    fetch(`${BASE_URL}/projects/${projectId}/apis`, { headers: { 'Authorization': `Bearer ${studentToken}` } }).then(r => r.json()),
    fetch(`${BASE_URL}/projects/${projectId}/ui`, { headers: { 'Authorization': `Bearer ${studentToken}` } }).then(r => r.json()),
    fetch(`${BASE_URL}/projects/${projectId}/roadmap`, { headers: { 'Authorization': `Bearer ${studentToken}` } }).then(r => r.json()),
    fetch(`${BASE_URL}/projects/${projectId}/tasks`, { headers: { 'Authorization': `Bearer ${studentToken}` } }).then(r => r.json()),
    fetch(`${BASE_URL}/projects/${projectId}/tests`, { headers: { 'Authorization': `Bearer ${studentToken}` } }).then(r => r.json()),
    fetch(`${BASE_URL}/projects/${projectId}/docs`, { headers: { 'Authorization': `Bearer ${studentToken}` } }).then(r => r.json()),
    fetch(`${BASE_URL}/projects/${projectId}/deployment`, { headers: { 'Authorization': `Bearer ${studentToken}` } }).then(r => r.json())
  ]);

  assert(wReqs.success && wReqs.data.functional.length >= 3, '11.1 Workspace Requirements Loaded', `${wReqs.data.functional.length} FRs`);
  assert(wArch.success && Boolean(wArch.data.beginnerArchitecture?.diagramMermaid), '11.2 Workspace Architecture Loaded');
  assert(wDb.success && wDb.data.tables.length >= 2, '11.3 Workspace Database Schema Loaded', `${wDb.data.tables.length} tables`);
  assert(wApis.success && wApis.data.endpoints.length >= 3, '11.4 Workspace APIs Loaded', `${wApis.data.endpoints.length} endpoints`);
  assert(wUi.success && wUi.data.screens.length >= 3, '11.5 Workspace UI Wireframes Loaded', `${wUi.data.screens.length} screens`);
  assert(wRoadmap.success && wRoadmap.data.phases.length >= 5, '11.6 Workspace 8-Phase Roadmap Loaded', `${wRoadmap.data.phases.length} phases`);
  assert(wTasks.success && wTasks.data.length >= 5, '11.7 Workspace Tasks Board Loaded', `${wTasks.data.length} tasks`);
  assert(wTests.success && wTests.data.testCases.length >= 4, '11.8 Workspace Testing Center Loaded', `${wTests.data.testCases.length} tests`);
  assert(wDocs.success && Boolean(wDocs.data.readme), '11.9 Workspace Documentation Loaded');
  assert(wDeploy.success && wDeploy.data.platforms.length >= 2, '11.10 Workspace Deployment Guide Loaded');

  // 12. Task Management Action: Complete a task
  const firstTask = wTasks.data[0];
  const updateTaskRes = await fetch(`${BASE_URL}/projects/${projectId}/tasks/${firstTask._id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${studentToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status: 'completed' })
  }).then(r => r.json());
  assert(updateTaskRes.success && updateTaskRes.data.status === 'completed', '12. Task Status Transition (todo -> completed)');

  // 13. Context-Aware AI Mentor Chat
  const chatRes = await fetch(`${BASE_URL}/projects/${projectId}/chat`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${studentToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message: 'How should I structure the authentication and database models for this project?' })
  }).then(r => r.json());
  assert(chatRes.success && Boolean(chatRes.data.message?.content), '13. Context-Aware AI Mentor Chat Responded');

  // 14. Starter Code Guidance
  const codeRes = await fetch(`${BASE_URL}/projects/${projectId}/code/generate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${studentToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ moduleName: 'Authentication' })
  }).then(r => r.json());
  assert(codeRes.success && Boolean(codeRes.data.code), '14. Starter Code Generator', codeRes.data?.filename);

  // 15. Testing Center Status Update
  const firstTest = wTests.data.testCases[0];
  const testUpdateRes = await fetch(`${BASE_URL}/projects/${projectId}/tests/${firstTest._id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${studentToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status: 'pass' })
  }).then(r => r.json());
  assert(testUpdateRes.success && testUpdateRes.data.status === 'pass', '15. QA Test Status Verification (pass)');

  // 16. Documentation Export
  const exportRes = await fetch(`${BASE_URL}/projects/${projectId}/docs/export?format=markdown`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  }).then(r => r.json());
  assert(exportRes.success && exportRes.data.markdown.includes('Project Blueprint'), '16. Documentation Export (Markdown)');

  // 17. Public Portfolio Showcase (Unauthenticated)
  const portfolioRes = await fetch(`${BASE_URL}/portfolio/${projectSlug}`).then(r => r.json());
  assert(portfolioRes.success && portfolioRes.data.project.name === generated.name, '17. Public Portfolio Showcase Accessible Without Login');

  // 18. Security & RBAC Audit
  // 18.1 Student attempting to access admin route
  const studentAdminAttempt = await fetch(`${BASE_URL}/admin/overview`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  assert(studentAdminAttempt.status === 403, '18.1 Student Forbidden from Admin Console (403)');

  // 18.2 Admin Login
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@projectforge.ai', password: 'AdminSecure2026!' })
  }).then(r => r.json());
  assert(adminLoginRes.success && Boolean(adminLoginRes.data.token), '18.2 Admin Secure Login');

  const adminToken = adminLoginRes.data.token;
  const adminOverview = await fetch(`${BASE_URL}/admin/overview`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }).then(r => r.json());
  assert(adminOverview.success && typeof adminOverview.data.metrics.totalUsers === 'number', '18.3 Admin Authorized Access (200)', `Users: ${adminOverview.data.metrics.totalUsers}`);

  console.log('\n================================================================');
  console.log(`AUDIT RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runLiveE2ETest().catch(err => {
  console.error('E2E Audit Execution Error:', err);
  process.exit(1);
});
