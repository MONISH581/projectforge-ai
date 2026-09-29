import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:5000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'projectforge_super_secure_jwt_token_secret_key_2026_dev',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  mongodbUri: process.env.MONGODB_URI || '',
  dataDir: process.env.DATA_DIR || path.resolve(__dirname, '../../data'),
  ai: {
    provider: (process.env.AI_PROVIDER || 'deterministic').toLowerCase(),
    apiKey: process.env.AI_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY || '',
    geminiKey: process.env.GEMINI_API_KEY || '',
    openAiKey: process.env.OPENAI_API_KEY || '',
    groqKey: process.env.GROQ_API_KEY || '',
    rateLimitMax: parseInt(process.env.AI_RATE_LIMIT_MAX || '20', 10),
  },
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
};
