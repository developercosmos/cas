import React, { useState, useEffect } from 'react';
import LdapConfig from '@/components/LdapConfig/LdapConfig';
import LdapTreeBrowser from '@/components/LdapTreeBrowser/LdapTreeBrowser';
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

const LdapTestPage: React.FC = () => {
  const [showConfig, setShowConfig] = useState(false);
  const [showTreeBrowser, setShowTreeBrowser] = useState(false);
  const [configs, setConfigs] = useState<LdapConfigType[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<LdapConfigType | null>(null);

  useEffect(() => {
    loadConfigs();
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
        const activeConfig = (data.data || []).find((c: LdapConfigType) => c.isActive);
        setSelectedConfig(activeConfig || null);
      }
    } catch (error) {
      console.error('Failed to load LDAP configs:', error);
    }
  };

  const handleTreeBrowserSelect = (baseDn: string) => {
    console.log('Selected Base DN:', baseDn);
    // Here you could update the selected config with new base DN
    loadConfigs(); // Reload configs to show any changes
  };

  if (showConfig) {
    return (
      <div className="app">
        <LdapConfig onClose={() => {
          setShowConfig(false);
          loadConfigs(); // Reload configs when closing
        }} />
      </div>
    );
  }

  if (showTreeBrowser && selectedConfig) {
    return (
      <div className="app">
        <LdapTreeBrowser
          onClose={() => setShowTreeBrowser(false)}
          onSelect={handleTreeBrowserSelect}
          currentBaseDn={selectedConfig.baseDN}
          serverConfig={{
            serverurl: selectedConfig.serverUrl,
            basedn: selectedConfig.baseDN,
            binddn: selectedConfig.bindDN,
            bindpassword: selectedConfig.bindPassword,
            issecure: selectedConfig.isSecure,
            port: selectedConfig.port
          }}
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
            🔐 LDAP Test Center
          </h1>
          <Button
            onClick={() => window.location.href = '/admin/ldap'}
            variant="secondary"
          >
            ← Back to LDAP
          </Button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '2rem'
        }}>
          {/* Configuration Section */}
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
              ⚙️ LDAP Configuration
            </h2>
            <p style={{
              color: 'var(--text-secondary)',
              marginBottom: '1.5rem',
              lineHeight: '1.5'
            }}>
              Configure LDAP server settings, test connections, and manage authentication parameters.
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Configurations:</strong> {configs.length}
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <strong>Active Config:</strong> {selectedConfig ? selectedConfig.serverUrl : 'None'}
            </div>
            <Button
              onClick={() => setShowConfig(true)}
              variant="primary"
              style={{ width: '100%' }}
            >
              Configure LDAP
            </Button>
          </div>

          {/* Directory Browser Section */}
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
              🌳 Directory Browser
            </h2>
            <p style={{
              color: 'var(--text-secondary)',
              marginBottom: '1.5rem',
              lineHeight: '1.5'
            }}>
              Browse LDAP directory structure, explore organizational units, and select Base DN settings.
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Status:</strong> {selectedConfig ? 'Ready' : 'No active config'}
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <strong>Current Base DN:</strong> {selectedConfig ? selectedConfig.baseDN : 'N/A'}
            </div>
            <Button
              onClick={() => {
                if (selectedConfig) {
                  setShowTreeBrowser(true);
                } else {
                  alert('Please configure and activate an LDAP connection first.');
                  setShowConfig(true);
                }
              }}
              variant="primary"
              style={{ width: '100%' }}
              disabled={!selectedConfig}
            >
              Browse Directory
            </Button>
          </div>

          {/* Connection Test Section */}
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
              🔗 Connection Test
            </h2>
            <p style={{
              color: 'var(--text-secondary)',
              marginBottom: '1.5rem',
              lineHeight: '1.5'
            }}>
              Test LDAP server connectivity, authentication, and search functionality.
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Test Results:</strong> Available in configuration
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <strong>Test Actions:</strong> Connect, Bind, Search, Filter validation
            </div>
            <Button
              onClick={() => setShowConfig(true)}
              variant="secondary"
              style={{ width: '100%' }}
            >
              Run Connection Tests
            </Button>
          </div>

          {/* Quick Actions Section */}
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
              ⚡ Quick Actions
            </h2>
            <p style={{
              color: 'var(--text-secondary)',
              marginBottom: '1.5rem',
              lineHeight: '1.5'
            }}>
              Common LDAP operations and quick access to user management features.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Button
                onClick={() => window.location.href = '/admin/ldap/users'}
                variant="secondary"
                style={{ width: '100%' }}
              >
                👥 Manage Users
              </Button>
              <Button
                onClick={() => setShowConfig(true)}
                variant="secondary"
                style={{ width: '100%' }}
              >
                🔄 Test Connection
              </Button>
              <Button
                onClick={() => {
                  if (confirm('This will import all users from LDAP. Continue?')) {
                    setShowConfig(true); // Open config to access import
                  }
                }}
                variant="secondary"
                style={{ width: '100%' }}
              >
                📥 Import Users
              </Button>
            </div>
          </div>
        </div>

        {/* Status Summary */}
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px'
        }}>
          <h3 style={{
            color: 'var(--text-primary)',
            marginBottom: '0.5rem'
          }}>
            📊 Status Summary
          </h3>
          <div style={{ color: 'var(--text-secondary)' }}>
            <div>• Total LDAP Configurations: {configs.length}</div>
            <div>• Active Configuration: {selectedConfig ? '✅' : '❌'}</div>
            <div>• Directory Browser: {selectedConfig ? '✅ Available' : '❌ No config'}</div>
            <div>• Test Connection: {configs.length > 0 ? '✅ Available' : '❌ No configs'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LdapTestPage;
