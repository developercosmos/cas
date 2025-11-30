import React, { useState, useEffect } from 'react';
import LdapUserManager from '@/components/LdapUserManager/LdapUserManager';
import { Button } from '@/components/base-ui/styled-components';
import '@/styles/global.css';

interface LdapConfigType {
  id: string;
  serverUrl: string;
  baseDN: string;
  bindDN: string;
  bindPassword: string;
  searchFilter: string;
  searchAttribute: string;
  groupAttribute: string;
  isSecure: boolean;
  port: number;
  isActive: boolean;
}

const LdapManageUsersPage: React.FC = () => {
  const [showUserManager, setShowUserManager] = useState(false);
  const [, setConfigs] = useState<LdapConfigType[]>([]);
  const [activeConfig, setActiveConfig] = useState<LdapConfigType | null>(null);
  const [stats, setStats] = useState({
    totalLdapUsers: 0,
    importedUsers: 0,
    lastImport: null as Date | null
  });

  useEffect(() => {
    loadConfigs();
    loadStats();
  }, []);

  const loadConfigs = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch('/api/ldap/configs', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConfigs(data.data || []);
        const active = (data.data || []).find((c: LdapConfigType) => c.isActive);
        setActiveConfig(active || null);
      }
    } catch (error) {
      console.error('Failed to load LDAP configs:', error);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const newStats = { ...stats };

      try {
        const ldapResponse = await fetch('/api/ldap/users/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (ldapResponse.ok) {
          const ldapData = await ldapResponse.json();
          if (ldapData.success) {
            newStats.totalLdapUsers = ldapData.totalUsers || 0;
          }
        }
      } catch {
        // Ignore LDAP stats errors
      }

      try {
        const importedResponse = await fetch('/api/ldap/imported-users/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (importedResponse.ok) {
          const importedData = await importedResponse.json();
          if (importedData.success) {
            newStats.importedUsers = importedData.totalUsers || 0;
            newStats.lastImport = importedData.lastImport ? new Date(importedData.lastImport) : null;
          }
        }
      } catch {
        // Ignore imported users stats errors
      }

      setStats(newStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleQuickImport = async () => {
    if (!activeConfig) {
      alert('Please configure and activate an LDAP connection first.');
      return;
    }

    if (!confirm('This will import all available users from LDAP. Continue?')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/ldap/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          configId: activeConfig.id
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        alert(`✅ Successfully imported ${result.importedCount || 0} users!`);
        loadStats(); // Refresh stats
      } else {
        throw new Error(result.message || 'Import failed');
      }
    } catch (err) {
      alert(`❌ Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  if (showUserManager && activeConfig) {
    return (
      <div className="app">
        <LdapUserManager
          onClose={() => {
            setShowUserManager(false);
            loadStats(); // Reload stats when closing
          }}
          configId={activeConfig.id}
        />
      </div>
    );
  }

  return (
    <div className="app">
      <div style={{
        padding: '2rem',
        maxWidth: '1200px',
        margin: '0 auto',
        background: 'var(--bg-primary)',
        minHeight: '100vh'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '1rem'
        }}>
          <h1 style={{
            color: 'var(--text-primary)',
            margin: 0,
            fontSize: '2rem',
            fontWeight: '600'
          }}>
            👥 LDAP User Management
          </h1>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button
              onClick={() => window.location.href = '/admin/ldap'}
              variant="secondary"
            >
              ← LDAP
            </Button>
            <Button
              onClick={() => window.location.href = '/admin/ldap/test'}
              variant="secondary"
            >
              Test
            </Button>
          </div>
        </div>

        {/* Statistics Overview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: 'var(--accent-primary)',
              marginBottom: '0.5rem'
            }}>
              {stats.totalLdapUsers}
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              Available LDAP Users
            </div>
          </div>

          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: '#10b981',
              marginBottom: '0.5rem'
            }}>
              {stats.importedUsers}
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              Imported Users
            </div>
          </div>

          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: '#f59e0b',
              marginBottom: '0.5rem'
            }}>
              {stats.totalLdapUsers > 0 ? Math.round((stats.importedUsers / stats.totalLdapUsers) * 100) : 0}%
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              Import Progress
            </div>
          </div>

          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '1.2rem',
              fontWeight: 'bold',
              color: activeConfig ? '#10b981' : '#ef4444',
              marginBottom: '0.5rem'
            }}>
              {activeConfig ? '✅ Active' : '❌ Inactive'}
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              LDAP Connection
            </div>
          </div>
        </div>

        {/* Main Actions */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.5rem'
          }}>
            <h2 style={{
              color: 'var(--text-primary)',
              marginBottom: '1rem',
              fontSize: '1.3rem'
            }}>
              📋 User Management
            </h2>
            <p style={{
              color: 'var(--text-secondary)',
              marginBottom: '1.5rem',
              lineHeight: '1.5'
            }}>
              Browse LDAP users, select multiple users for import, and manage existing imported users.
            </p>
            <Button
              onClick={() => {
                if (activeConfig) {
                  setShowUserManager(true);
                } else {
                  alert('Please configure and activate an LDAP connection first.');
                }
              }}
              variant="primary"
              style={{ width: '100%' }}
              disabled={!activeConfig}
            >
              Open User Manager
            </Button>
          </div>

          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.5rem'
          }}>
            <h2 style={{
              color: 'var(--text-primary)',
              marginBottom: '1rem',
              fontSize: '1.3rem'
            }}>
              🚀 Quick Import
            </h2>
            <p style={{
              color: 'var(--text-secondary)',
              marginBottom: '1.5rem',
              lineHeight: '1.5'
            }}>
              Import all available LDAP users in one operation. Useful for initial setup or bulk updates.
            </p>
            <Button
              onClick={handleQuickImport}
              variant="secondary"
              style={{ width: '100%' }}
              disabled={!activeConfig}
            >
              Import All Users
            </Button>
          </div>

          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.5rem'
          }}>
            <h2 style={{
              color: 'var(--text-primary)',
              marginBottom: '1rem',
              fontSize: '1.3rem'
            }}>
              ⚙️ Configuration
            </h2>
            <p style={{
              color: 'var(--text-secondary)',
              marginBottom: '1.5rem',
              lineHeight: '1.5'
            }}>
              Adjust LDAP server settings, connection parameters, and synchronization options.
            </p>
            <Button
              onClick={() => window.location.href = '/admin/ldap'}
              variant="secondary"
              style={{ width: '100%' }}
            >
              LDAP Configuration
            </Button>
          </div>

          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.5rem'
          }}>
            <h2 style={{
              color: 'var(--text-primary)',
              marginBottom: '1rem',
              fontSize: '1.3rem'
            }}>
              📊 Import History
            </h2>
            <p style={{
              color: 'var(--text-secondary)',
              marginBottom: '1.5rem',
              lineHeight: '1.5'
            }}>
              View import history, synchronization logs, and track user import status over time.
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Last Import:</strong> {stats.lastImport ? stats.lastImport.toLocaleString() : 'Never'}
            </div>
            <Button
              onClick={() => alert('Import history feature coming soon!')}
              variant="secondary"
              style={{ width: '100%' }}
            >
              View History
            </Button>
          </div>
        </div>

        {/* Status Information */}
        <div style={{
          padding: '1rem',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px'
        }}>
          <h3 style={{
            color: 'var(--text-primary)',
            marginBottom: '1rem'
          }}>
            📈 Management Status
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', color: 'var(--text-secondary)' }}>
            <div>
              <strong>LDAP Server:</strong> {activeConfig ? activeConfig.serverUrl : 'Not configured'}
            </div>
            <div>
              <strong>Base DN:</strong> {activeConfig ? activeConfig.baseDN : 'N/A'}
            </div>
            <div>
              <strong>Connection:</strong> {activeConfig ? (activeConfig.isSecure ? 'LDAPS' : 'LDAP') : 'N/A'}
            </div>
            <div>
              <strong>Status:</strong> {activeConfig ? `Active (${activeConfig.port})` : 'No active config'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LdapManageUsersPage;
