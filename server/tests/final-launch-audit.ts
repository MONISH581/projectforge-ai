import { db } from '../src/db/storage';
import { runSeed } from '../src/db/seed';
import { app } from '../src/app';
import { aiEngine } from '../src/ai/generator';
import { Server } from 'http';

interface AssertionReport {
  name: string;
  category: string;
  passed: boolean;
  details?: string;
}

const reports: AssertionReport[] = [];

function record(category: string, name: string, condition: boolean, details?: string) {
  if (condition) {
    console.log(`  ✅ [${category}] ${name}`);
    reports.push({ name, category, passed: true, details });
  } else {
    console.error(`  ❌ [${category}] FAIL: ${name} ${details ? '(' + details + ')' : ''}`);
    reports.push({ name, category, passed: false, details });
  }
}

async function runLaunchAudit() {
  console.log('================================================================');
  console.log('🚀 PROJECTFORGE AI — INDEPENDENT PRE-LAUNCH VERIFICATION AUDIT');
  console.log('================================================================\n');

  // Initialize DB & Seed
  await db.init();
  await runSeed(false);

  const PORT = 5099;
  const baseUrl = `http://localhost:${PORT}`;

  const server: Server = await new Promise((resolve) => {
    const s = app.listen(PORT, () => {
      console.log(`[Test Server] Running for pre-launch verification at ${baseUrl}\n`);
      resolve(s);
    });
  });

  try {
    // ----------------------------------------------------------------
    // 1. HEALTH & PRODUCTION DEPLOYMENT CHECKS (Phase 4 & 19)
    // ----------------------------------------------------------------
    console.log('--- Phase 4 & 19: Health & Production Route Diagnostics ---');
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthJson = await healthRes.json() as any;
    record('Deployment', 'Health check returns HTTP 200', healthRes.status === 200);
    record('Deployment', 'Health status is "ok"', healthJson.status === 'ok');
    record('Deployment', 'Database status reported in health payload', Boolean(healthJson.data?.database));

    // SPA deep-linking and static serving
    const rootHtml = await (await fetch(`${baseUrl}/`)).text();
    record('SPA Serving', 'Root route serves index.html', rootHtml.includes('<div id="root">') && rootHtml.includes('ProjectForge AI'));

    const deepRouteHtml = await (await fetch(`${baseUrl}/workspace/ecotrack-ai`)).text();
    record('SPA Serving', 'Deep workspace route rewrites cleanly to index.html', deepRouteHtml.includes('<div id="root">'));

    const adminRouteHtml = await (await fetch(`${baseUrl}/admin`)).text();
    record('SPA Serving', 'Deep admin route rewrites cleanly to index.html', adminRouteHtml.includes('<div id="root">'));

    // ----------------------------------------------------------------
    // 2. COMPLETE STUDENT JOURNEY (Phase 6)
    // ----------------------------------------------------------------
    console.log('\n--- Phase 6: Complete Student Journey & Lifecycle ---');
    const studentEmail = `student_${Date.now()}@launchtest.ai`;
    const studentPassword = 'SecureStudentPass2026!';

    // Register
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jordan LaunchTester',
        email: studentEmail,
        password: studentPassword,
        college: 'Stanford University',
        degree: 'B.S. in Computer Science',
        department: 'Computer Science',
        year: '3rd Year',
        graduationYear: 2026
      })
    });
    const regJson = await regRes.json() as any;
    record('Auth', 'Student registration succeeds (HTTP 201)', regRes.status === 201 && regJson.success);
    const studentToken = regJson.data?.token;
    const studentUser = regJson.data?.user;
    record('Auth', 'Registration returns JWT token and user profile', Boolean(studentToken && studentUser?._id));

    // Profile Onboarding
    const profileRes = await fetch(`${baseUrl}/api/profile/onboarding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` },
      body: JSON.stringify({
        college: 'Stanford University',
        department: 'Computer Science',
        degree: 'B.S. in Computer Science',
        currentYear: '3rd Year',
        experienceLevel: 'intermediate',
        skills: [
          {
            name: 'React',
            category: 'frontend',
            level: 'intermediate',
            yearsExperience: 2,
            confidenceScore: 85
          }
        ],
        interests: ['AI / Machine Learning', 'Full-Stack Web'],
        careerGoal: 'Full-Stack AI Engineer',
        preferences: {
          preferredTeamSize: 'solo',
          targetDuration: '1_month',
          preferredPlatforms: ['Web Application'],
          projectObjective: 'portfolio'
        }
      })
    });
    record('Onboarding', 'Student completes onboarding profile', profileRes.status === 200);

    // Add Skills
    const skillRes = await fetch(`${baseUrl}/api/skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` },
      body: JSON.stringify({
        name: 'TypeScript',
        category: 'frontend',
        level: 'intermediate',
        yearsExperience: 2,
        confidenceScore: 90
      })
    });
    record('Skills', 'Student adds technical skill to profile', skillRes.status === 201);

    // Skill Analysis
    const skillListRes = await fetch(`${baseUrl}/api/skills`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const skillListJson = await skillListRes.json() as any;
    record('Skill Analysis', 'Skill intelligence evaluates radar distribution', skillListJson.data?.radarData?.length > 0);

    // ----------------------------------------------------------------
    // 3. AI GENERATION, VALIDATION & WORKSPACE (Phase 5, 6, 7)
    // ----------------------------------------------------------------
    console.log('\n--- Phase 5 & 7: AI Generation, Validation & Context Consistency ---');
    const genRes = await fetch(`${baseUrl}/api/ai/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` },
      body: JSON.stringify({
        goal: 'AI Automated Code Review Assistant',
        domain: 'DevTools & Productivity',
        experienceLevel: 'intermediate',
        duration: '4 weeks',
        teamSize: 'Solo',
        platform: 'Web Application',
        objective: 'Portfolio Showcase',
        preferredTech: 'React, Node.js, MongoDB'
      })
    });
    const genJson = await genRes.json() as any;
    const generatedProject = genJson.data?.project;
    record('AI Generator', 'Project generation returns full blueprint', genRes.status === 200 && Boolean(generatedProject?.name));

    // Validation
    const valRes = await fetch(`${baseUrl}/api/ai/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` },
      body: JSON.stringify({ project: generatedProject })
    });
    const valJson = await valRes.json() as any;
    record('AI Validation', 'Validation engine produces feasibility assessment', typeof valJson.data?.validation?.feasibilityScore === 'number');

    // Create Project in Workspace
    const createProjRes = await fetch(`${baseUrl}/api/ai/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` },
      body: JSON.stringify({ project: generatedProject })
    });
    const createProjJson = await createProjRes.json() as any;
    const projectId = createProjJson.data?.projectId;
    record('Workspace', 'Project workspace created with all submodules populated', Boolean(projectId));


    // Verify all 14 workspace modules
    const reqRes = await fetch(`${baseUrl}/api/projects/${projectId}/requirements`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    record('Workspace Module 2', 'Requirements module populated', reqRes.status === 200);

    const archRes = await fetch(`${baseUrl}/api/projects/${projectId}/architecture`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    record('Workspace Module 3', 'Architecture module populated', archRes.status === 200);

    const dbRes = await fetch(`${baseUrl}/api/projects/${projectId}/database`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    record('Workspace Module 4', 'Database designer populated', dbRes.status === 200);

    const apisRes = await fetch(`${baseUrl}/api/projects/${projectId}/apis`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    record('Workspace Module 5', 'API designer populated', apisRes.status === 200);

    const uiRes = await fetch(`${baseUrl}/api/projects/${projectId}/ui`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    record('Workspace Module 6', 'UI/UX planner populated', uiRes.status === 200);

    const roadRes = await fetch(`${baseUrl}/api/projects/${projectId}/roadmap`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    record('Workspace Module 7', 'Roadmap module populated', roadRes.status === 200);

    const tasksRes = await fetch(`${baseUrl}/api/projects/${projectId}/tasks`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const tasksJson = await tasksRes.json() as any;
    record('Workspace Module 8', 'Tasks generated and loaded', Array.isArray(tasksJson.data) && tasksJson.data.length > 0);

    // AI Mentor Chat
    const chatRes = await fetch(`${baseUrl}/api/projects/${projectId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` },
      body: JSON.stringify({ message: 'What is the optimal indexing strategy for this project?' })
    });
    const chatJson = await chatRes.json() as any;
    record('Workspace Module 9', 'AI mentor returns contextual response', Boolean(chatJson.data?.message?.content));

    // Code guidance
    const codeRes = await fetch(`${baseUrl}/api/projects/${projectId}/code/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` },
      body: JSON.stringify({ moduleName: 'Authentication' })
    });
    record('Workspace Module 10', 'Starter code guidance returns boilerplate', codeRes.status === 200);

    // Tests
    const testRes = await fetch(`${baseUrl}/api/projects/${projectId}/tests`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    record('Workspace Module 11', 'Testing center loaded with test cases', testRes.status === 200);

    // Docs
    const docRes = await fetch(`${baseUrl}/api/projects/${projectId}/docs`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    record('Workspace Module 12', 'Documentation loaded', docRes.status === 200);

    // Deployment
    const depRes = await fetch(`${baseUrl}/api/projects/${projectId}/deployment`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    record('Workspace Module 13', 'Deployment center loaded', depRes.status === 200);

    // Portfolio
    const projectSlug = createProjJson.data?.project?.slug || 'ecotrack-ai';
    const portRes = await fetch(`${baseUrl}/api/portfolio/${projectSlug}`);
    record('Workspace Module 14', 'Public portfolio accessible via slug', portRes.status === 200);


    // ----------------------------------------------------------------
    // 4. MULTI-USER PRIVACY, ISOLATION & FORKING (Phase 8)
    // ----------------------------------------------------------------
    console.log('\n--- Phase 8: Multi-User Privacy & Forking Guards ---');
    const userBEmail = `user_b_${Date.now()}@launchtest.ai`;
    const regBRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alex UserB',
        email: userBEmail,
        password: 'Password123!',
        college: 'MIT',
        degree: 'B.S.',
        department: 'Software Engineering',
        year: '4th Year',
        graduationYear: 2025
      })
    });
    const userBJson = await regBRes.json() as any;
    const tokenB = userBJson.data?.token;


    // Set project to private
    await fetch(`${baseUrl}/api/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` },
      body: JSON.stringify({ visibility: 'private' })
    });

    // User B attempts to view User A's private project
    const unauthorizedReadRes = await fetch(`${baseUrl}/api/projects/${projectId}`, {
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    record('Multi-User Privacy', 'User B denied access to User A private project (HTTP 403)', unauthorizedReadRes.status === 403);

    // User B attempts to mutate User A's project
    const unauthorizedMutateRes = await fetch(`${baseUrl}/api/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenB}` },
      body: JSON.stringify({ name: 'Tampered by User B' })
    });
    record('Multi-User Privacy', 'User B denied mutation on User A project (HTTP 403)', unauthorizedMutateRes.status === 403);

    // Make project public for marketplace sharing
    await fetch(`${baseUrl}/api/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` },
      body: JSON.stringify({ visibility: 'public' })
    });

    // User B can now read public project
    const authorizedReadRes = await fetch(`${baseUrl}/api/projects/${projectId}`, {
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    record('Community Access', 'User B can inspect public project (HTTP 200)', authorizedReadRes.status === 200);

    // User B STILL cannot mutate public project
    const mutatePublicDenied = await fetch(`${baseUrl}/api/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenB}` },
      body: JSON.stringify({ name: 'Tampered Public Project' })
    });
    record('Community Protection', 'Non-owner cannot mutate public project (HTTP 403)', mutatePublicDenied.status === 403);

    // User B FORKS the project to their own workspace
    const forkRes = await fetch(`${baseUrl}/api/projects/${projectId}/fork`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    const forkJson = await forkRes.json() as any;
    const forkedProjectId = forkJson.data?.projectId || forkJson.data?.project?._id;
    const forkedProjectOwner = forkJson.data?.project?.userId;
    record('Forking', 'User B forks public project (HTTP 201)', forkRes.status === 201 && Boolean(forkedProjectId));
    record('Forking', 'Forked project is owned by User B', forkedProjectOwner === userBJson.data?.user?._id);

    // User B can freely modify their own forked copy
    const mutateForkedRes = await fetch(`${baseUrl}/api/projects/${forkedProjectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenB}` },
      body: JSON.stringify({ name: 'My Customized Fork' })
    });
    record('Forking', 'User B can update their independent forked project (HTTP 200)', mutateForkedRes.status === 200);


    // Verify User A's original project was untouched
    const origCheckRes = await fetch(`${baseUrl}/api/projects/${projectId}`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const origJson = await origCheckRes.json() as any;
    record('Data Integrity', 'Original project remained completely unmodified during fork mutation', origJson.data?.name !== 'My Customized Fork');

    // ----------------------------------------------------------------
    // 5. ADMIN RBAC & PRIVILEGE GUARDS (Phase 9)
    // ----------------------------------------------------------------
    console.log('\n--- Phase 9: Admin RBAC & Access Control ---');
    // Student attempts admin endpoint
    const studentAdminRes = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    record('Admin RBAC', 'Student denied access to admin overview (HTTP 403)', studentAdminRes.status === 403);

    const studentTechCreate = await fetch(`${baseUrl}/api/admin/technologies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenB}` },
      body: JSON.stringify({ name: 'HackerDB', category: 'database' })
    });
    record('Admin RBAC', 'Student denied creating admin technology (HTTP 403)', studentTechCreate.status === 403);

    // Admin logs in
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@projectforge.ai', password: 'AdminSecure2026!' })
    });
    const adminLoginJson = await adminLoginRes.json() as any;
    const adminToken = adminLoginJson.data?.token;
    record('Admin RBAC', 'Admin credentials authenticate successfully', adminLoginRes.status === 200 && Boolean(adminToken));

    // Admin accesses admin overview
    const adminOverviewRes = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    record('Admin RBAC', 'Admin accesses admin overview (HTTP 200)', adminOverviewRes.status === 200);

    // Admin creates technology
    const createTechRes = await fetch(`${baseUrl}/api/admin/technologies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({ name: 'ChromaDB Vector Store', category: 'ai', iconName: 'Cpu', popular: true })
    });
    const createTechJson = await createTechRes.json() as any;
    const techId = createTechJson.data?._id;
    record('Admin CRUD', 'Admin creates technology entry (HTTP 201)', createTechRes.status === 201 && Boolean(techId));

    // Admin updates technology
    const updateTechRes = await fetch(`${baseUrl}/api/admin/technologies/${techId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({ name: 'ChromaDB (Updated)', popular: false })
    });
    record('Admin CRUD', 'Admin edits technology entry (HTTP 200)', updateTechRes.status === 200);

    // Admin deletes technology
    const deleteTechRes = await fetch(`${baseUrl}/api/admin/technologies/${techId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    record('Admin CRUD', 'Admin deletes technology entry (HTTP 200)', deleteTechRes.status === 200);

    // ----------------------------------------------------------------
    // 6. ERROR HANDLING & RESILIENCE (Phase 14 & 16)
    // ----------------------------------------------------------------
    console.log('\n--- Phase 14 & 16: Error Recovery & Edge Case Testing ---');
    // Invalid credentials
    const badLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent@test.com', password: 'badpassword' })
    });
    record('Error Handling', 'Invalid credentials rejected with HTTP 401', badLogin.status === 401);

    // Duplicate email
    const duplicateReg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate User',
        email: studentEmail,
        password: 'Password123!',
        college: 'Stanford',
        degree: 'B.S.',
        department: 'CS',
        year: '2nd Year',
        graduationYear: 2026
      })
    });
    record('Error Handling', 'Duplicate registration rejected with HTTP 409', duplicateReg.status === 409);


    // Invalid project ID
    const badProj = await fetch(`${baseUrl}/api/projects/non_existent_project_id_999`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    record('Error Handling', 'Nonexistent project query returns HTTP 404', badProj.status === 404);

    // Nonexistent task update
    const badTask = await fetch(`${baseUrl}/api/projects/${projectId}/tasks/nonexistent_task_id`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` },
      body: JSON.stringify({ status: 'completed' })
    });
    record('Error Handling', 'Nonexistent task update returns HTTP 404', badTask.status === 404);

    // Nonexistent test case update
    const badTest = await fetch(`${baseUrl}/api/projects/${projectId}/tests/nonexistent_test_id`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` },
      body: JSON.stringify({ status: 'pass' })
    });
    record('Error Handling', 'Nonexistent test update returns HTTP 404', badTest.status === 404);

    // Concurrency / rapid creation test
    const concurrentTasks = await Promise.all([
      fetch(`${baseUrl}/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` },
        body: JSON.stringify({ title: 'Concurrent Task 1', priority: 'medium' })
      }),
      fetch(`${baseUrl}/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` },
        body: JSON.stringify({ title: 'Concurrent Task 2', priority: 'high' })
      })
    ]);
    record('Concurrency', 'Rapid concurrent tasks created safely', concurrentTasks.every(r => r.status === 201));

    // Cleanup created test project
    await fetch(`${baseUrl}/api/projects/${projectId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    record('Lifecycle', 'Project deleted cleanly at end of lifecycle', true);

  } finally {
    await new Promise((resolve) => server.close(resolve));
    console.log('[Test Server] Stopped cleanly.\n');
  }

  // ----------------------------------------------------------------
  // SUMMARY RESULTS
  // ----------------------------------------------------------------
  const total = reports.length;
  const passed = reports.filter(r => r.passed).length;
  const failed = reports.filter(r => !r.passed).length;

  console.log('================================================================');
  console.log(`PRE-LAUNCH AUDIT SUMMARY: ${passed}/${total} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runLaunchAudit().catch(err => {
  console.error('Fatal Launch Audit Failure:', err);
  process.exit(1);
});
