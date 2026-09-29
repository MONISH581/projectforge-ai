import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/storage';
import { authenticateToken, AuthRequest } from '../middleware/auth';

export const profileRouter = Router();

const UpdateProfileSchema = z.object({
  college: z.string().optional(),
  degree: z.string().optional(),
  department: z.string().optional(),
  currentYear: z.string().optional(),
  graduationYear: z.number().int().optional(),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  careerGoal: z.string().optional(),
  bio: z.string().optional(),
  githubUrl: z.string().url().optional().or(z.literal('')),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  preferences: z.object({
    preferredTeamSize: z.enum(['solo', 'team', 'any']).optional(),
    targetDuration: z.enum(['1_week', '2_weeks', '1_month', '2_months', '3_plus_months']).optional(),
    preferredPlatforms: z.array(z.string()).optional(),
    projectObjective: z.enum(['academic', 'portfolio', 'hackathon', 'startup', 'learning']).optional(),
  }).optional()
});

const OnboardingSchema = z.object({
  college: z.string().min(2),
  degree: z.string().min(2),
  department: z.string().min(2),
  currentYear: z.string().min(1),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  skills: z.array(z.object({
    name: z.string().min(1),
    category: z.enum(['programming', 'frontend', 'backend', 'database', 'ai', 'mobile', 'cloud_devops', 'cybersecurity', 'other']),
    level: z.enum(['beginner', 'intermediate', 'advanced']),
    yearsExperience: z.number().min(0),
    confidenceScore: z.number().min(1).max(100),
  })).min(1, 'Please select or add at least one skill'),
  interests: z.array(z.string()).min(1, 'Please select at least one interest domain'),
  careerGoal: z.string().min(2),
  preferences: z.object({
    preferredTeamSize: z.enum(['solo', 'team', 'any']),
    targetDuration: z.enum(['1_week', '2_weeks', '1_month', '2_months', '3_plus_months']),
    preferredPlatforms: z.array(z.string()).min(1),
    projectObjective: z.enum(['academic', 'portfolio', 'hackathon', 'startup', 'learning']),
  })
});

// GET /api/profile
profileRouter.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  const profile = await db.profiles.findOne({ userId: req.user!._id });
  return res.status(200).json({ success: true, data: profile });
});

// PUT /api/profile
profileRouter.put('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const data = UpdateProfileSchema.parse(req.body);
    const userId = req.user!._id;

    await db.profiles.updateOne(
      { userId },
      { $set: { ...data, updatedAt: new Date().toISOString() } },
      { upsert: true }
    );

    const updated = await db.profiles.findOne({ userId });
    return res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors[0]?.message } });
    }
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// POST /api/profile/onboarding
profileRouter.post('/onboarding', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const data = OnboardingSchema.parse(req.body);
    const userId = req.user!._id;

    // 1. Update/upsert profile
    await db.profiles.updateOne(
      { userId },
      {
        $set: {
          college: data.college,
          degree: data.degree,
          department: data.department,
          currentYear: data.currentYear,
          experienceLevel: data.experienceLevel,
          careerGoal: data.careerGoal,
          preferences: data.preferences,
          updatedAt: new Date().toISOString()
        }
      },
      { upsert: true }
    );

    // 2. Remove existing user skills and insert newly configured ones
    await db.skills.deleteMany({ userId });
    for (const s of data.skills) {
      await db.skills.insertOne({
        userId,
        name: s.name,
        category: s.category,
        level: s.level,
        yearsExperience: s.yearsExperience,
        confidenceScore: s.confidenceScore,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    // 3. Save interests
    await db.interests.deleteMany({ userId });
    for (const interestName of data.interests) {
      await db.interests.insertOne({
        userId,
        name: interestName,
        category: 'domain',
        createdAt: new Date().toISOString()
      });
    }

    // 4. Mark user as onboarded
    await db.users.updateOne(
      { _id: userId },
      { $set: { isOnboarded: true, updatedAt: new Date().toISOString() } }
    );

    const updatedUser = await db.users.findById(userId);
    const updatedProfile = await db.profiles.findOne({ userId });
    const userSkills = await db.skills.find({ userId });

    return res.status(200).json({
      success: true,
      data: {
        message: 'Onboarding completed successfully!',
        user: {
          _id: updatedUser!._id,
          name: updatedUser!.name,
          email: updatedUser!.email,
          role: updatedUser!.role,
          isOnboarded: updatedUser!.isOnboarded
        },
        profile: updatedProfile,
        skills: userSkills
      }
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors[0]?.message } });
    }
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});
