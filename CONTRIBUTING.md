# Contributing to ProjectForge AI

Thank you for your interest in contributing to **ProjectForge AI**! We welcome contributions from developers, architects, educators, and students.

## Code of Conduct
We are committed to providing a friendly, safe, and welcoming environment for all contributors regardless of experience level.

## Getting Started Locally
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/projectforge-ai.git
   cd projectforge-ai
   ```
2. Install dependencies:
   ```bash
   npm install --prefix server
   npm install --prefix client
   ```
3. Set up environment variables:
   ```bash
   cp .env.example server/.env
   ```
4. Run development servers concurrently:
   ```bash
   npm run dev
   ```
   - Client: `http://localhost:5173`
   - Server: `http://localhost:5000`

## Submitting Pull Requests
- Ensure all automated tests pass:
  ```bash
  npm test
  ```
- Build both packages:
  ```bash
  npm run build
  ```
- Write clear commit messages and explain architectural decisions.
