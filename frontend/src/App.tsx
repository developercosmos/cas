import { ThemeProvider } from '@/contexts/ThemeContext';
import { Header } from '@/components/Header';
import { Canvas } from '@/components/Canvas';
import { AuthService } from '@/services/AuthService';
import '@/styles/global.css';
import { useState, useEffect } from 'react';

function App() {
  // Check authentication status
  const isAuthenticated = AuthService.isAuthenticated();
  const isAdmin = AuthService.isAdmin();
  const token = AuthService.getToken();
  const [ldapEnabled, setLdapEnabled] = useState(false);

  // Check if LDAP plugin is enabled
  useEffect(() => {
    if (!isAuthenticated) {
      const checkLdapStatus = async () => {
        try {
          // Construct API URL dynamically
          const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:4000'
            : `${window.location.protocol}//${window.location.hostname}:4000`;
          
          const response = await fetch(`${apiUrl}/api/ldap/status`);
          if (response.ok) {
            const data = await response.json();
            console.log('LDAP status:', data);
            setLdapEnabled(data.enabled === true);
          }
        } catch (error) {
          console.error('Failed to check LDAP status:', error);
          // LDAP not configured, keep checkbox hidden
          setLdapEnabled(false);
        }
      };
      checkLdapStatus();
    }
  }, [isAuthenticated]);
  
  // If not authenticated, show login screen
  if (!isAuthenticated) {
    return (
      <ThemeProvider>
        <div className="app">
          <div className="login-screen">
            <div className="login-container">
              <h1>CAS Platform Login</h1>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const username = formData.get('username') as string;
                const password = formData.get('password') as string;
                const useAD = formData.get('useAD') === 'on';
                
                try {
                  const response = await AuthService.login(username, password, useAD);
                  AuthService.setToken(response.token);
                  window.location.reload();
                } catch (error) {
                  alert(error instanceof Error ? error.message : 'Login failed');
                }
              }}>
                <div className="form-group">
                  <label>Username</label>
                  <input name="username" type="text" required placeholder="Enter username" />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input name="password" type="password" required placeholder="Enter password" />
                </div>
                {ldapEnabled && (
                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input name="useAD" type="checkbox" defaultChecked />
                      <span>Use Active Directory Login</span>
                    </label>
                  </div>
                )}
                <button type="submit">Login</button>
              </form>
            </div>
          </div>
          
          <style>{`
            .login-screen {
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              background: var(--bg-primary);
            }
            
            .login-container {
              background: var(--bg-secondary);
              border: 1px solid var(--border-color, #333);
              border-radius: 12px;
              padding: 2rem;
              width: 100%;
              max-width: 400px;
            }
            
            .login-container h1 {
              color: var(--text-primary);
              margin-bottom: 2rem;
              text-align: center;
            }
            
            .form-group {
              margin-bottom: 1rem;
            }
            
            .form-group label {
              display: block;
              margin-bottom: 0.5rem;
              color: var(--text-primary);
              font-weight: 500;
            }
            
            .form-group input {
              width: 100%;
              padding: 0.75rem;
              border: 1px solid var(--border-color, #333);
              border-radius: 6px;
              background: var(--bg-primary);
              color: var(--text-primary);
              font-size: 14px;
            }
            
            .form-group input:focus {
              outline: none;
              border-color: var(--accent-primary);
              box-shadow: 0 0 0 2px rgba(var(--accent-primary-rgb), 0.2);
            }

            .checkbox-group {
              margin-top: 0.5rem;
              margin-bottom: 1.5rem;
            }

            .checkbox-label {
              display: flex;
              align-items: center;
              gap: 0.5rem;
              cursor: pointer;
              font-weight: 400;
            }

            .checkbox-label input[type="checkbox"] {
              width: auto;
              cursor: pointer;
              margin: 0;
            }

            .checkbox-label span {
              color: var(--text-primary);
              font-size: 0.9rem;
            }
            
            button {
              width: 100%;
              padding: 0.75rem;
              background: var(--accent-primary);
              color: white;
              border: none;
              border-radius: 6px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.15s ease;
            }
            
            button:hover {
              background: var(--accent-hover);
            }
          `}</style>
        </div>
      </ThemeProvider>
    );
  }
  
  // If authenticated, show main app
  let username = 'User';
  if (token) {
    try {
      username = JSON.parse(atob(token.split('.')[1])).username;
    } catch {
      username = 'User';
    }
  }
  
  return (
    <ThemeProvider>
      <div className="app">
        <Header username={username} logoText="CAS Platform" isAdmin={isAdmin} />
        <Canvas />
      </div>
    </ThemeProvider>
  );
}

export default App;
