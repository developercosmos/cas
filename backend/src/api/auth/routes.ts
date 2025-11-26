import { Router } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { AuthService as DatabaseAuthService } from '../../services/AuthService.js';
import { AuthService, AuthRequest } from '../../middleware/auth.js';
import LdapService from '../../services/LdapService.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

router.post('/login', async (req, res) => {
  try {
    const { username, password, authType } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    console.log(`🔐 Login attempt: username=${username}, authType=${authType || 'local'}`);

    // Check if LDAP authentication is requested
    if (authType === 'ldap') {
      // Get the active LDAP configuration
      const ldapConfigs = await LdapService.getConfigurations();
      const activeConfig = ldapConfigs.find((config: any) => config.isactive);
      
      if (!activeConfig) {
        console.log('❌ No active LDAP configuration found');
        return res.status(500).json({ 
          error: 'LDAP authentication is not configured'
        });
      }

      console.log(`🔑 Using LDAP config: ${activeConfig.id}`);

      // Try LDAP authentication
      const ldapResult = await LdapService.authenticate(username, password, activeConfig.id);
      
      if (ldapResult.success && ldapResult.user) {
        // LDAP authentication successful, generate JWT token
        const token = jwt.sign(
          { 
            id: ldapResult.user.id, 
            username: ldapResult.user.username,
            authType: 'ldap'
          },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRY } as SignOptions
        );

        console.log(`✅ LDAP login successful for user: ${username}`);

        return res.json({
          token,
          user: ldapResult.user,
        });
      } else {
        console.log(`❌ LDAP login failed for user: ${username} - ${ldapResult.message}`);
        return res.status(401).json({ 
          error: ldapResult.message || 'LDAP authentication failed'
        });
      }
    }

    // Fall back to local database authentication
    console.log(`🔑 Using local authentication for user: ${username}`);
    const result = await DatabaseAuthService.login(username, password);

    res.json({
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ 
      error: error instanceof Error ? error.message : 'Login failed',
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Constitution: Use database-backed registration
    const result = await DatabaseAuthService.register(username, password, email);

    res.status(201).json({
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Username already exists')) {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Registration failed',
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/me', AuthService, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await DatabaseAuthService.getUserById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to get user',
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/users', AuthService, async (req: AuthRequest, res) => {
  try {
    // Constitution: Admin-only endpoint for user management
    if (!DatabaseAuthService.isAdmin(req.user?.username || '')) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const users = await DatabaseAuthService.getUsers();
    
    res.json({ 
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to get users',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
