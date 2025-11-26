import { Router } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth.js';
import { DatabaseStorageService } from '../../services/DatabaseStorageService.js';

const router = Router();

router.get('/:key', authenticate, async (req: AuthRequest, res) => {
  try {
    const value = await DatabaseStorageService.get(req.user!.id, req.params.key);
    
    if (value === null) {
      return res.status(404).json({ error: 'Key not found' });
    }
    
    res.json({ key: req.params.key, value });
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to get data',
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { key, value } = req.body;
    
    if (!key) {
      return res.status(400).json({ error: 'Key is required' });
    }
    
    await DatabaseStorageService.set(req.user!.id, key, value);
    
    res.json({ key, value });
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to store data',
      timestamp: new Date().toISOString()
    });
  }
});

router.delete('/:key', authenticate, async (req: AuthRequest, res) => {
  try {
    const deleted = await DatabaseStorageService.delete(req.user!.id, req.params.key);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Key not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to delete data',
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = await DatabaseStorageService.getAll(req.user!.id);
    res.json(data);
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to get all data',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
