import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

const ADMIN_USERS = process.env.ADMIN_USERS?.split(',') || ['admin'];

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!ADMIN_USERS.includes(req.user.username)) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};
