// Dynamic API URL that works for both localhost and network access
const getApiBaseUrl = () => {
  // Check if we're in development and use the current origin
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:4000';
  }
  // For network access, use the same host but port 4000
  return `${window.location.protocol}//${window.location.hostname}:4000`;
};

const API_BASE = getApiBaseUrl();

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
}

export class AuthService {
  static async login(username: string, password: string, useAD: boolean = true): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        username, 
        password,
        authType: useAD ? 'ldap' : 'local'
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  static async register(username: string, password: string, email?: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password, email }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Registration failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  static getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  static setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  static removeToken(): void {
    localStorage.removeItem('auth_token');
  }

  static isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      // Validate token structure
      const parts = token.split('.');
      if (parts.length !== 3) {
        this.removeToken();
        return false;
      }
      
      // Check token expiration
      const payload = JSON.parse(atob(parts[1]));
      if (payload.exp) {
        const now = Math.floor(Date.now() / 1000);
        if (now >= payload.exp) {
          // Token expired, remove it
          this.removeToken();
          return false;
        }
      }
      
      return true;
    } catch {
      // Invalid token, remove it
      this.removeToken();
      return false;
    }
  }

  static isAdmin(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      
      const payload = JSON.parse(atob(parts[1]));
      return payload.username === 'admin';
    } catch {
      return false;
    }
  }
}
