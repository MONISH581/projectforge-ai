import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../db/storage';
import { generateToken, authenticateToken, AuthRequest } from '../middleware/auth';
import { logAdminAction } from '../middleware/auditLogger';
import { authRateLimiter } from '../middleware/rateLimiter';

export const authRouter = Router();
authRouter.use(authRateLimiter);

const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  college: z.string().min(2, 'College name is required'),
  degree: z.string().min(2, 'Degree is required'),
  department: z.string().min(2, 'Department is required'),
  year: z.string().min(1, 'Current year is required'),
  graduationYear: z.number().int().min(2024).max(2035),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  careerGoal: z.string().optional()
});

const LoginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required')
});

// POST /api/auth/register
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const data = RegisterSchema.parse(req.body);

    const existingUser = await db.users.findOne({ email: data.email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: { code: 'EMAIL_ALREADY_EXISTS', message: 'An account with this email already exists.' }
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await db.users.insertOne({
      name: data.name,
      email: data.email,
      passwordHash,
      role: 'student',
      isOnboarded: false,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const profile = await db.profiles.insertOne({
      userId: user._id,
      college: data.college,
      degree: data.degree,
      department: data.department,
      currentYear: data.year,
      graduationYear: data.graduationYear,
      experienceLevel: data.experienceLevel || 'beginner',
      careerGoal: data.careerGoal || 'Software Engineer',
      preferences: {
        preferredTeamSize: 'solo',
        targetDuration: '1_month',
        preferredPlatforms: ['web'],
        projectObjective: 'portfolio'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Create welcome notification
    await db.notifications.insertOne({
      userId: user._id,
      title: 'Welcome to ProjectForge AI! 🚀',
      message: 'Your account is ready. Complete onboarding to discover tailored project recommendations.',
      type: 'system',
      read: false,
      link: '/onboarding',
      createdAt: new Date().toISOString()
    });

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isOnboarded: user.isOnboarded,
          avatarUrl: user.avatarUrl
        },
        profile
      }
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: err.errors[0]?.message || 'Invalid input' }
      });
    }
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message || 'Registration failed' }
    });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const data = LoginSchema.parse(req.body);

    const user = await db.users.findOne({ email: data.email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' }
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCOUNT_SUSPENDED', message: 'Your account has been suspended. Please contact support.' }
      });
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' }
      });
    }

    const profile = await db.profiles.findOne({ userId: user._id });
    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isOnboarded: user.isOnboarded,
          avatarUrl: user.avatarUrl
        },
        profile
      }
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: err.errors[0]?.message || 'Invalid input' }
      });
    }
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Login failed' }
    });
  }
});

// GET /api/auth/me
authRouter.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const profile = await db.profiles.findOne({ userId: user._id });
  const skills = await db.skills.find({ userId: user._id });

  return res.status(200).json({
    success: true,
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isOnboarded: user.isOnboarded,
        avatarUrl: user.avatarUrl,
        status: user.status,
        createdAt: user.createdAt
      },
      profile,
      skills
    }
  });
});

// POST /api/auth/logout
authRouter.post('/logout', authenticateToken, (_req: AuthRequest, res: Response) => {
  return res.status(200).json({
    success: true,
    data: { message: 'Logged out successfully' }
  });
});

// POST /api/auth/forgot-password
authRouter.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: { code: 'MISSING_EMAIL', message: 'Email is required' } });
  }

  // We return a friendly message even if email not found to avoid account enumeration
  return res.status(200).json({
    success: true,
    data: { message: 'If an account exists with that email, password reset instructions have been generated.' }
  });
});
