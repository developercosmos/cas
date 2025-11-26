import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { DatabaseService } from './DatabaseService.js';
import { User, UserSession } from '../types/database';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

export class AuthService {
  static async login(username: string, password: string): Promise<{ token: string; user: Omit<User, 'passwordhash'> }> {
    try {
      // Constitution: Database naming convention for users table
      const user = await DatabaseService.queryOne<User>(
        'SELECT id, username, email, passwordhash, authtype, createdat, updatedat FROM auth.users WHERE username = $1 AND deletedat IS NULL',
        [username]
      );

      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Constitution: Route authentication based on user's AuthType
      if (user.authtype === 'ldap') {
        // Constitution: Use LDAP plugin authentication
        const { PluginService } = await import('./PluginService');
        const pluginService = new PluginService();
        const ldapPlugin = await pluginService.getAuthPlugin('ldap-auth');
        
        if (ldapPlugin && ldapPlugin.authenticate) {
          const result = await ldapPlugin.authenticate(username, password);
          
          if (result.success) {
            // Constitution: Generate JWT token for LDAP user
            const token = jwt.sign(
              { id: result.user.id, username: result.user.username },
              JWT_SECRET,
              { expiresIn: JWT_EXPIRY } as SignOptions
            );

            return {
              token,
              user: result.user
            };
          } else {
            throw new Error(result.message || 'LDAP authentication failed');
          }
        } else {
          throw new Error('LDAP plugin not available');
        }
      } else {
        // Constitution: Local authentication with password hashing
        const isValidPassword = await bcrypt.compare(password, user.passwordhash);
        if (!isValidPassword) {
          throw new Error('Invalid credentials');
        }

        // Constitution: JWT tokens for authentication
        const token = jwt.sign(
          { id: user.id, username: user.username },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRY } as SignOptions
        );

        // Clean user object for response
        const { passwordhash, ...userWithoutPassword } = user;
        return {
          token,
          user: userWithoutPassword
        };
      }
    } catch (error) {
      throw new Error(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async register(username: string, password: string, email?: string): Promise<{ token: string; user: Omit<User, 'PasswordHash'> }> {
    try {
      // Check if user exists
      const existingUser = await DatabaseService.queryOne<{ count: number }>(
        'SELECT COUNT(*)::integer as count FROM auth.users WHERE Username = $1',
        [username]
      );

      if (existingUser?.count && existingUser.count > 0) {
        throw new Error('Username already exists');
      }

      // Constitution: Hash password for security
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Constitution: Use UUID and proper naming
      const newUser = await DatabaseService.queryOne<User>(
        `INSERT INTO auth.users (Username, Email, PasswordHash, CreatedAt, UpdatedAt) 
         VALUES ($1, $2, $3, NOW(), NOW()) 
         RETURNING Id, Username, Email, CreatedAt, UpdatedAt`,
        [username, email || `${username}@example.com`, hashedPassword]
      );

      if (!newUser) {
        throw new Error('Registration failed');
      }

      // Constitution: JWT token for new user
      const token = jwt.sign(
        { id: newUser.id, username: newUser.username },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY } as SignOptions
      );

      return {
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          passwordhash: newUser.passwordhash,
          authtype: newUser.authtype,
          createdat: newUser.createdat,
          updatedat: newUser.updatedat
        }
      };
    } catch (error) {
      throw new Error(`Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async verifyToken(token: string): Promise<{ id: string; username: string } | null> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; username: string };
      return decoded;
    } catch {
      return null;
    }
  }

  static async getUserById(userId: string): Promise<Omit<User, 'PasswordHash'> | null> {
    try {
      const user = await DatabaseService.queryOne<Omit<User, 'PasswordHash'>>(
        'SELECT Id, Username, Email, CreatedAt, UpdatedAt FROM auth.users WHERE Id = $1 AND DeletedAt IS NULL',
        [userId]
      );
      return user || null;
    } catch (error) {
      throw new Error(`Failed to get user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getUsers(): Promise<Omit<User, 'PasswordHash'>[]> {
    try {
      const users = await DatabaseService.query<Omit<User, 'PasswordHash'>>(
        'SELECT Id, Username, Email, CreatedAt, UpdatedAt FROM auth.users WHERE DeletedAt IS NULL ORDER BY CreatedAt DESC'
      );
      return users;
    } catch (error) {
      throw new Error(`Failed to get users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async updateUser(userId: string, updates: Partial<Pick<User, 'email' | 'username'>>): Promise<void> {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(updates)) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }

      if (fields.length === 0) {
        return;
      }

      fields.push(`UpdatedAt = NOW()`);
      
      await DatabaseService.execute(
        `UPDATE auth.users SET ${fields.join(', ')} WHERE Id = $${paramIndex + 1}`,
        [...values, userId]
      );
    } catch (error) {
      throw new Error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async deleteUser(userId: string): Promise<void> {
    try {
      // Constitution: Soft delete with UpdatedAt
      await DatabaseService.execute(
        'UPDATE auth.users SET DeletedAt = NOW(), UpdatedAt = NOW() WHERE Id = $1',
        [userId]
      );
    } catch (error) {
      throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    try {
      const user = await DatabaseService.queryOne<{ PasswordHash: string }>(
        'SELECT PasswordHash FROM auth.users WHERE Id = $1 AND DeletedAt IS NULL',
        [userId]
      );

      if (!user) {
        throw new Error('User not found');
      }

      const isValidOldPassword = await bcrypt.compare(oldPassword, user.PasswordHash);
      if (!isValidOldPassword) {
        throw new Error('Current password is incorrect');
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      
      await DatabaseService.execute(
        'UPDATE auth.users SET PasswordHash = $1, UpdatedAt = NOW() WHERE Id = $2',
        [hashedNewPassword, userId]
      );
    } catch (error) {
      throw new Error(`Failed to change password: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Constitution: Admin users from environment variable
  static isAdmin(username: string): boolean {
    const adminUsers = process.env.ADMIN_USERS?.split(',') || ['admin'];
    return adminUsers.includes(username);

}

  // Constitution: LDAP authentication support
  static async ldapLogin(username: string, password: string, configId: string): Promise<{ token: string; user: Omit<User, 'PasswordHash'> }> {
    try {
      const { LdapService } = await import('./LdapService');
      
      const ldapAuth = await LdapService.authenticate(username, password, configId);
      if (!ldapAuth.success || !ldapAuth.user) {
        throw new Error(ldapAuth.message || 'LDAP authentication failed');
      }

      // Constitution: JWT tokens for authentication
      const token = jwt.sign(
        { id: ldapAuth.user.id, username: ldapAuth.user.username },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY } as SignOptions
      );

      return {
        token,
        user: ldapAuth.user
      };
    } catch (error) {
      throw new Error(`LDAP login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Constitution: Generate JWT token for authenticated user
  static async generateToken(user: Omit<User, 'PasswordHash'>): Promise<{ token: string; user: Omit<User, 'PasswordHash'> }> {
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY } as SignOptions
    );

    return {
      token,
      user
    };
  }

  // Constitution: Check if user is LDAP user
  static async isLdapUser(username: string): Promise<boolean> {
    const user = await DatabaseService.queryOne<User>(
      'SELECT AuthType FROM auth.users WHERE Username = $1 AND DeletedAt IS NULL',
      [username]
    );

    return user?.authtype === 'ldap';
  }
}

export default AuthService;
