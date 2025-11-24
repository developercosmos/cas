import { Router } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth.js';

const router = Router();

interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  permissions: string[];
}

const pluginRegistry = new Map<string, PluginManifest>([
  ['core.text-block', {
    id: 'core.text-block',
    name: 'Text Block',
    version: '1.0.0',
    description: 'Basic text editing block',
    author: 'Dashboard Team',
    permissions: ['storage.read', 'storage.write'],
  }],
]);

router.get('/', authenticate, (req: AuthRequest, res) => {
  res.json({
    plugins: Array.from(pluginRegistry.values()),
  });
});

router.get('/:id', authenticate, (req: AuthRequest, res) => {
  const plugin = pluginRegistry.get(req.params.id);
  if (!plugin) {
    return res.status(404).json({ error: 'Plugin not found' });
  }
  res.json(plugin);
});

router.post('/', authenticate, (req: AuthRequest, res) => {
  try {
    const manifest: PluginManifest = req.body;
    
    if (!manifest.id || !manifest.name || !manifest.version) {
      return res.status(400).json({ error: 'Invalid plugin manifest' });
    }

    if (pluginRegistry.has(manifest.id)) {
      return res.status(409).json({ error: 'Plugin already exists' });
    }

    pluginRegistry.set(manifest.id, manifest);
    res.status(201).json(manifest);
  } catch (error) {
    res.status(500).json({ error: 'Failed to register plugin' });
  }
});

router.delete('/:id', authenticate, (req: AuthRequest, res) => {
  const deleted = pluginRegistry.delete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Plugin not found' });
  }
  res.status(204).send();
});

export default router;
