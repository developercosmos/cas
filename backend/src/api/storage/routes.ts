import { Router } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth.js';

const router = Router();

const userStorage = new Map<string, Map<string, any>>();

const getUserStorage = (userId: string): Map<string, any> => {
  if (!userStorage.has(userId)) {
    userStorage.set(userId, new Map());
  }
  return userStorage.get(userId)!;
};

router.get('/:key', authenticate, (req: AuthRequest, res) => {
  const storage = getUserStorage(req.user!.id);
  const value = storage.get(req.params.key);
  
  if (value === undefined) {
    return res.status(404).json({ error: 'Key not found' });
  }
  
  res.json({ key: req.params.key, value });
});

router.post('/', authenticate, (req: AuthRequest, res) => {
  try {
    const { key, value } = req.body;
    
    if (!key) {
      return res.status(400).json({ error: 'Key is required' });
    }
    
    const storage = getUserStorage(req.user!.id);
    storage.set(key, value);
    
    res.json({ key, value });
  } catch (error) {
    res.status(500).json({ error: 'Failed to store data' });
  }
});

router.delete('/:key', authenticate, (req: AuthRequest, res) => {
  const storage = getUserStorage(req.user!.id);
  const deleted = storage.delete(req.params.key);
  
  if (!deleted) {
    return res.status(404).json({ error: 'Key not found' });
  }
  
  res.status(204).send();
});

router.get('/', authenticate, (req: AuthRequest, res) => {
  const storage = getUserStorage(req.user!.id);
  const data = Object.fromEntries(storage.entries());
  res.json(data);
});

export default router;
