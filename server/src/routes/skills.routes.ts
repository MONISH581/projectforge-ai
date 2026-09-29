import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/storage';
import { authenticateToken, AuthRequest } from '../middleware/auth';

export const skillsRouter = Router();

const SkillInputSchema = z.object({
  name: z.string().min(1, 'Skill name is required'),
  category: z.enum(['programming', 'frontend', 'backend', 'database', 'ai', 'mobile', 'cloud_devops', 'cybersecurity', 'other']),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  yearsExperience: z.number().min(0).default(1),
  confidenceScore: z.number().min(1).max(100).default(70),
});

// GET /api/skills — list user skills with computed intelligence analytics
skillsRouter.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!._id;
  const skills = await db.skills.find({ userId });
  const profile = await db.profiles.findOne({ userId });

  // Calculate radar chart distribution by category
  const categories = ['programming', 'frontend', 'backend', 'database', 'ai', 'mobile', 'cloud_devops', 'cybersecurity'];
  const categoryScores: Record<string, { totalConfidence: number; count: number; avg: number }> = {};

  for (const cat of categories) {
    categoryScores[cat] = { totalConfidence: 0, count: 0, avg: 0 };
  }

  for (const s of skills) {
    if (categoryScores[s.category]) {
      categoryScores[s.category].totalConfidence += s.confidenceScore;
      categoryScores[s.category].count++;
    }
  }

  const radarData = categories.map(cat => ({
    category: cat,
    displayName: cat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    score: categoryScores[cat].count > 0 ? Math.round(categoryScores[cat].totalConfidence / categoryScores[cat].count) : 0,
    skillCount: categoryScores[cat].count
  }));

  // Identify strengths & gaps
  const strengths = skills.filter(s => s.confidenceScore >= 75 || s.level === 'advanced');
  const learningGaps = skills.filter(s => s.confidenceScore < 60 || s.level === 'beginner');

  // AI-like Skill Intelligence Recommendation
  let recommendationText = 'Continue expanding your foundational skills with a hands-on full-stack project.';
  const hasFrontend = skills.some(s => s.category === 'frontend');
  const hasBackend = skills.some(s => s.category === 'backend');
  const hasAi = skills.some(s => s.category === 'ai');

  if (hasFrontend && hasBackend && hasAi) {
    recommendationText = 'You have balanced full-stack and AI competencies! You are well-positioned for an Intermediate or Advanced AI-assisted web application.';
  } else if (hasFrontend && !hasBackend) {
    recommendationText = 'Your frontend skills are strong, but backend proficiency is limited. Consider an API-driven project to bridge your server-side gap.';
  } else if (hasBackend && !hasFrontend) {
    recommendationText = 'You have solid backend fundamentals. Consider pairing your API services with a React or Next.js user interface.';
  } else if (profile?.careerGoal?.toLowerCase().includes('ai') && !hasAi) {
    recommendationText = `Your target career is "${profile.careerGoal}". To reach this goal, prioritize projects incorporating LLM APIs (Gemini/OpenAI) or Machine Learning pipelines.`;
  }

  return res.status(200).json({
    success: true,
    data: {
      skills,
      radarData,
      strengths: strengths.map(s => s.name),
      gaps: learningGaps.map(s => s.name),
      careerGoal: profile?.careerGoal || 'Full Stack Engineer',
      recommendation: recommendationText
    }
  });
});

// POST /api/skills — add individual skill
skillsRouter.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const data = SkillInputSchema.parse(req.body);
    const userId = req.user!._id;

    // Check if skill already exists
    const existing = await db.skills.findOne({ userId, name: { $regex: `^${data.name}$`, $options: 'i' } });
    if (existing) {
      return res.status(409).json({ success: false, error: { code: 'SKILL_EXISTS', message: 'You have already added this skill.' } });
    }

    const newSkill = await db.skills.insertOne({
      userId,
      name: data.name,
      category: data.category,
      level: data.level,
      yearsExperience: data.yearsExperience,
      confidenceScore: data.confidenceScore,
      projectsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return res.status(201).json({ success: true, data: newSkill });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors[0]?.message } });
    }
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// PUT /api/skills/:id — update skill
skillsRouter.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const data = SkillInputSchema.partial().parse(req.body);
    const userId = req.user!._id;
    const skillId = req.params.id;

    const skill = await db.skills.findOne({ _id: skillId, userId });
    if (!skill) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Skill not found' } });
    }

    await db.skills.updateOne(
      { _id: skillId },
      { $set: { ...data, updatedAt: new Date().toISOString() } }
    );

    const updated = await db.skills.findById(skillId);
    return res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.message } });
  }
});

// DELETE /api/skills/:id — remove skill
skillsRouter.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!._id;
  const skillId = req.params.id;

  const result = await db.skills.deleteOne({ _id: skillId, userId });
  if (result.deletedCount === 0) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Skill not found' } });
  }

  return res.status(200).json({ success: true, data: { message: 'Skill removed successfully' } });
});
