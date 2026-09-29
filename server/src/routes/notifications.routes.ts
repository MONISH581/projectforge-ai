import { Router, Response } from 'express';
import { db } from '../db/storage';
import { authenticateToken, AuthRequest } from '../middleware/auth';

export const notificationsRouter = Router();

// GET /api/notifications — list user notifications
notificationsRouter.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!._id;
  const notifications = await db.notifications.find({ userId }, { sort: { createdAt: -1 }, limit: 50 });
  const unreadCount = notifications.filter(n => !n.read).length;

  return res.status(200).json({
    success: true,
    data: {
      notifications,
      unreadCount
    }
  });
});

// PUT /api/notifications/:id/read — mark single notification as read
notificationsRouter.put('/:id/read', authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!._id;
  await db.notifications.updateOne(
    { _id: req.params.id, userId },
    { $set: { read: true } }
  );

  return res.status(200).json({ success: true, data: { message: 'Marked as read' } });
});

// PUT /api/notifications/read-all — mark all as read
notificationsRouter.put('/read-all', authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!._id;
  await db.notifications.updateMany(
    { userId, read: false },
    { $set: { read: true } }
  );

  return res.status(200).json({ success: true, data: { message: 'All notifications marked as read' } });
});
