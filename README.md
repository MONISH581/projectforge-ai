# 🚀 ProjectForge AI

> **Turn your skills and ideas into projects you can actually build.**

ProjectForge AI is an AI-powered project discovery, planning, architecture, development, and execution platform tailored for students and aspiring engineers.

```
Student Profile ➔ Skill Analysis ➔ Project Discovery ➔ AI Project Generation ➔ Project Validation 
   ➔ Requirements ➔ Architecture ➔ Database ➔ APIs ➔ UI Screens ➔ Development Roadmap 
   ➔ Task Management ➔ AI Coding Assistance ➔ Testing ➔ Documentation ➔ Deployment Guidance ➔ Portfolio
```

---

## 🌟 Key Features

1. **Guided Student Onboarding**: Map your university program, programming languages, frontend/backend proficiencies, and career goals.
2. **Skill Intelligence Engine**: Automated competency radar chart, gap analysis, and tailored project complexity matching.
3. **AI Project Discovery & Marketplace**: Explore curated student projects with live skill matching indicators (*e.g., "Matches 3 of your skills: React, Python, MongoDB"*).
4. **Multi-Step AI Generator**: Turn high-level goals into production-grade proposals categorized by MVP, Phase 2, and Advanced frontiers.
5. **Project Validation Engine**: Evaluates technical feasibility score, real-world risks, skill bottlenecks, scope problems, and actionable MVP recommendations.
6. **Unified Project Workspace (14 Engineering Modules)**:
   - **Overview**: Problem statement, solution, target personas, and tech stack.
   - **Requirements Engine**: IEEE-formatted functional requirements, NFR metrics, and user stories with acceptance criteria.
   - **Architecture Designer**: Switch between **Beginner 3-tier Monolith** and **Production Cloud Microservices** with interactive Mermaid diagrams.
   - **Database Designer**: Multi-engine schema generator (**MongoDB**, **PostgreSQL**, **MySQL**) with fields, relations, indexes, and sample records.
   - **API Designer**: Interactive REST documentation with parameter contracts, status codes, and copyable cURL snippets.
   - **UI/UX Planner**: Mobile-first screen blueprints with wireframe layout hierarchies and design system tokens.
   - **Development Roadmap**: 8-phase implementation timeline with effort estimates.
   - **Task Management Board**: Interactive Kanban and list views with progress synchronization.
   - **AI Development Assistant**: Project-aware AI mentor chat loaded with project context.
   - **Starter Code Guidance**: Codebase directory structure generator and boilerplate starter code.
   - **Testing Center**: Test cases (Unit, Integration, API, UI, Security) with pass/fail tracking.
   - **Documentation Generator**: Automated README, Project Abstract, and SRS with Markdown/JSON export.
   - **Deployment Center**: Step-by-step guidance for Vercel, Render, Railway, and MongoDB Atlas.
   - **Shareable Portfolio**: Public showcase page accessible at `/project/:slug`.
7. **Device Simulation Mode**: Preview and test the app in Mobile Phone (390px), Tablet (768px), or Fluid Desktop modes with a single click.
8. **Role-Based Access Control (RBAC)**: Secure separation between Student accounts and Admin management dashboards.

---

## 🏗️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Canvas Confetti |
| **Backend** | Node.js, Express.js, TypeScript, JWT, bcryptjs, Helmet, Zod |
| **Database** | MongoDB Atlas driver + Persistent Zero-Dependency Embedded JSON Engine |
| **AI Providers** | Google Gemini 1.5 Flash, OpenAI GPT-4o, Groq LLaMA 3.3, and Deterministic Heuristic Engine |
| **Testing** | Automated TSX Test Suite, Unit & Integration Validation |

---

## ⚡ Quick Start & Local Setup

### Prerequisites
- Node.js v18+ (tested on Node.js v22)
- npm v9+

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/projectforge-ai.git
cd "ai idea generator"

# Install server and client dependencies
npm install --prefix server
npm install --prefix client
```

### 2. Environment Configuration
Copy the example environment configuration:
```bash
cp .env.example server/.env
```

Default `.env` configuration works out of the box with zero external dependencies using the embedded storage and deterministic heuristic AI architect engine. To enable live cloud LLMs, supply your API key:
```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Run Development Servers Concurrently
```bash
# Starts Express API (Port 5000) and Vite Client (Port 5173) with proxy
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🎓 Demo Accounts Out of the Box

The database is pre-seeded with ready-to-test accounts (with quick-fill buttons on the login screen):

| Role | Email | Password | Features Accessible |
|---|---|---|---|
| **Student** | `student@projectforge.ai` | `Password123!` | Dashboard, Project Generator, Workspace (14 modules), Skills, Tasks |
| **Admin** | `admin@projectforge.ai` | `AdminSecure2026!` | Admin Dashboard, User moderation, Projects moderation, Tech catalog CRUD |

---

## 🧪 Running Automated Tests

Run the comprehensive 36-scenario backend test suite:
```bash
npm run test --prefix server
```

Build production packages:
```bash
npm run build --prefix server
npm run build --prefix client
```

---

## 🚀 Unified Production Deployment

The Express backend automatically serves the compiled static client build from `client/dist` in production mode. You can start the unified production server with:
```bash
npm run start --prefix server
```
Then visit **`http://localhost:5000`** to access both frontend and backend on a single port!

---

## 📄 License
Released under the [MIT License](LICENSE).
