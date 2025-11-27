import React, { useState, useEffect } from 'react';
import { PluginMetadata, PluginInstallRequest } from '../../types';
import { PluginAdminService } from '../../services/PluginAdminService';
import { PluginDocumentationService } from '../../services/PluginDocumentationService';
import LdapUserManager from '../LdapUserManager';
import LdapTreeBrowser from '../LdapTreeBrowser';

// Dynamic API URL that works for both localhost and network access
const getApiBaseUrl = () => {
  // Constitution: Always use localhost for development to avoid CORS issues
  // Only use localhost if actually accessing via localhost
  if (window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1') {
    return 'http://localhost:4000';
  }
  // For network access (e.g., 192.168.1.225), use same hostname with port 4000
  return `${window.location.protocol}//${window.location.hostname}:4000`;
};

const API_BASE = getApiBaseUrl();

// Constitution: Ensure authentication token is available and valid
const getAuthToken = () => {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    // Try to get from session storage as backup
    const sessionToken = sessionStorage.getItem('auth_token');
    if (sessionToken) {
      localStorage.setItem('auth_token', sessionToken);
      return sessionToken;
    }
    return null;
  }
  return token;
};

import styles from './PluginManager.module.css';

interface PluginManagerProps {
  onClose: () => void;
}

const PluginManager: React.FC<PluginManagerProps> = ({ onClose }) => {
  const [plugins, setPlugins] = useState<PluginMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInstallForm, setShowInstallForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<string | null>(null);
  const [ldapConfig, setLdapConfig] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [documentationModal, setDocumentationModal] = useState<PluginMetadata | null>(null);
  const [documentationContent, setDocumentationContent] = useState<any>(null);
  const [documentationLoading, setDocumentationLoading] = useState(false);
  const [documentationError, setDocumentationError] = useState<string | null>(null);
  const [showUserManager, setShowUserManager] = useState(false);
  const [ldapConfigId, setLdapConfigId] = useState<string | null>(null);
  const [showTreeBrowser, setShowTreeBrowser] = useState(false);
  const [ldapServerConfig, setLdapServerConfig] = useState<any>(null);

  // Install form state
  const [installForm, setInstallForm] = useState<PluginInstallRequest>({
    id: '',
    name: '',
    version: '1.0.0',
    description: '',
    author: '',
    permissions: [],
    entry: ''
  });

  useEffect(() => {
    loadPlugins();
  }, []);

  // Load saved LDAP configuration
  useEffect(() => {
    const loadLdapConfig = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        const response = await fetch(`${API_BASE}/api/plugins/ldap/status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.plugin?.configuration) {
            setLdapConfig(data.plugin.configuration);
            console.log('🔌 LDAP Configuration loaded:', data.plugin.configuration);
          }
        }
      } catch (error) {
        console.error('Failed to load LDAP config:', error);
      }
    };

    loadLdapConfig();
  }, []);

  const loadPlugins = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await PluginAdminService.listPlugins();
      if (response.success) {
        // Constitution: Use plugins from API response (includes LDAP, RAG, etc.)
        setPlugins(response.data);
        console.log('✅ Loaded plugins:', response.data.map((p: any) => p.name));
      } else {
        setError('Failed to load plugins');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plugins');
    } finally {
      setLoading(false);
    }
  };

  const loadPluginDocumentation = async (plugin: PluginMetadata) => {
    try {
      setDocumentationLoading(true);
      setDocumentationError(null);
      
      const docs = await PluginDocumentationService.getByPluginId(plugin.id, 'en', false);
      
      if (docs.length > 0) {
        // Group documentation by type for easier display
        const groupedDocs = docs.reduce((acc, doc) => {
          if (!acc[doc.documentType]) {
            acc[doc.documentType] = doc;
          }
          return acc;
        }, {} as Record<string, any>);
        
        setDocumentationContent(groupedDocs);
      } else {
        // Fallback: create minimal documentation
        setDocumentationContent({
          readme: {
            title: `${plugin.name} Documentation`,
            content: `# ${plugin.name}\n\n${plugin.description}\n\n**Version:** ${plugin.version}\n**Author:** ${plugin.author}`,
            contentFormat: 'markdown'
          }
        });
      }
    } catch (error) {
      console.error('Failed to load plugin documentation:', error);
      setDocumentationError(error instanceof Error ? error.message : 'Failed to load documentation');
      // Fallback to basic documentation
      setDocumentationContent({
        readme: {
          title: `${plugin.name} Documentation`,
          content: `# ${plugin.name}\n\n${plugin.description}\n\n**Version:** ${plugin.version}\n**Author:** ${plugin.author}`,
          contentFormat: 'markdown'
        }
      });
    } finally {
      setDocumentationLoading(false);
    }
  };

  const handleInstall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!installForm.id || !installForm.name) {
      setError('Plugin ID and name are required');
      return;
    }

    try {
      setActionLoading('install');
      const response = await PluginAdminService.installPlugin(installForm);
      if (response.success) {
        setShowInstallForm(false);
        setInstallForm({
          id: '',
          name: '',
          version: '1.0.0',
          description: '',
          author: '',
          permissions: [],
          entry: ''
        });
        await loadPlugins();
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to install plugin');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUninstall = async (id: string) => {
    if (!confirm('Are you sure you want to uninstall this plugin?')) {
      return;
    }

    try {
      setActionLoading(id);
      const response = await PluginAdminService.uninstallPlugin(id);
      if (response.success) {
        await loadPlugins();
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to uninstall plugin');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (id: string, enable: boolean) => {
    try {
      setActionLoading(id);
      setError(null); // Clear any previous errors
      
      const response = enable 
        ? await PluginAdminService.enablePlugin(id)
        : await PluginAdminService.disablePlugin(id);
      
      if (response.success) {
        // Show success message
        const plugin = plugins.find(p => p.id === id);
        const message = `✅ ${plugin?.name || 'Plugin'} ${enable ? 'enabled' : 'disabled'} successfully!`;
        
        // Create temporary success message
        const successDiv = document.createElement('div');
        successDiv.className = styles.success;
        successDiv.textContent = message;
        successDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; background: var(--success-bg, #10b981); color: white; padding: 1rem 1.5rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 10000; animation: slideInRight 0.3s ease;';
        document.body.appendChild(successDiv);
        
        // Remove success message after 3 seconds
        setTimeout(() => {
          successDiv.style.animation = 'slideOutRight 0.3s ease';
          setTimeout(() => successDiv.remove(), 300);
        }, 3000);
        
        // Reload plugins to reflect new status
        await loadPlugins();
      } else {
        setError(response.message || `Failed to ${enable ? 'enable' : 'disable'} plugin`);
      }
    } catch (err) {
      console.error('Toggle status error:', err);
      setError(err instanceof Error ? err.message : `Failed to ${enable ? 'enable' : 'disable'} plugin`);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { text: 'Active', className: styles.active },
      disabled: { text: 'Disabled', className: styles.disabled },
      error: { text: 'Error', className: styles.error }
    };
    
    const config = statusMap[status as keyof typeof statusMap] || statusMap.disabled;
    return (
      <span className={`${styles.statusBadge} ${config.className}`}>
        {config.text}
      </span>
    );
  };

  const handleLdapAction = async (action: string) => {
    try {
      setActionLoading(`ldap-${action}`);
      
      // Constitution: Ensure token exists
      const token = getAuthToken();
      if (!token) {
        alert('Authentication required. Please login again.');
        return;
      }

      // Only 'test' action is supported now - import is handled by "Manage Users" button
      
      const response = await fetch(`${API_BASE}/api/plugins/ldap/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(action === 'test' ? {
          ...(ldapConfig || {}),
          ...(ldapConfig ? {} : {
            serverurl: 'ldap://10.99.99.11:389',
            basedn: 'DC=starcosmos,DC=intranet',
            binddn: 'admst@starcosmos.intranet',
            bindpassword: 'StarCosmos*888',
            issecure: false,
            port: 389
          })
        } : {
          searchQuery: '*'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success || response.ok) {
        alert('LDAP connection test successful!');
      } else {
        alert(`LDAP connection test failed: ${result.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('LDAP API Error:', err);
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        alert('Unable to connect to backend server. Please check if backend is running on port 4000.');
      } else {
        alert(`LDAP ${action} failed: ${err instanceof Error ? err.message : 'Connection error'}`);
      }
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.overlay}>
        <div className={styles.container}>
          <div className={styles.loading}>Loading plugins...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>Plugin Manager</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        {error && (
          <div className={styles.error}>
            {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        <div className={styles.actions}>
          <button 
            className={styles.primaryButton}
            onClick={() => setShowInstallForm(true)}
          >
            Install Plugin
          </button>
          <button onClick={loadPlugins} disabled={actionLoading !== null}>
            Refresh
          </button>
        </div>

        {showInstallForm && (
          <div className={styles.installForm}>
            <h3>Install New Plugin</h3>
            <form onSubmit={handleInstall}>
              <div className={styles.formGroup}>
                <label>Plugin ID *</label>
                <input
                  type="text"
                  value={installForm.id}
                  onChange={(e) => setInstallForm({ ...installForm, id: e.target.value })}
                  required
                  placeholder="e.g., my-plugin"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Name *</label>
                <input
                  type="text"
                  value={installForm.name}
                  onChange={(e) => setInstallForm({ ...installForm, name: e.target.value })}
                  required
                  placeholder="e.g., My Plugin"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Version</label>
                <input
                  type="text"
                  value={installForm.version}
                  onChange={(e) => setInstallForm({ ...installForm, version: e.target.value })}
                  placeholder="1.0.0"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Description</label>
                <input
                  type="text"
                  value={installForm.description}
                  onChange={(e) => setInstallForm({ ...installForm, description: e.target.value })}
                  placeholder="Plugin description"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Author</label>
                <input
                  type="text"
                  value={installForm.author}
                  onChange={(e) => setInstallForm({ ...installForm, author: e.target.value })}
                  placeholder="Author name"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Entry Point</label>
                <input
                  type="text"
                  value={installForm.entry}
                  onChange={(e) => setInstallForm({ ...installForm, entry: e.target.value })}
                  placeholder="main.js"
                />
              </div>
              <div className={styles.formActions}>
                <button 
                  type="submit" 
                  className={styles.primaryButton}
                  disabled={actionLoading === 'install'}
                >
                  {actionLoading === 'install' ? 'Installing...' : 'Install'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowInstallForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className={styles.pluginList}>
          {plugins.length === 0 ? (
            <div className={styles.empty}>No plugins installed</div>
          ) : (
            plugins.map((plugin) => (
              <div key={plugin.id || `plugin-${Math.random()}`} className={styles.pluginCard}>
                <div className={styles.pluginInfo}>
                  <h3>{plugin.name}</h3>
                  <p>{plugin.description}</p>
                  <div className={styles.pluginMeta}>
                    <span>ID: {plugin.id}</span>
                    <span>Version: {plugin.version}</span>
                    {plugin.author && <span>Author: {plugin.author}</span>}
                  </div>
                  <div className={styles.pluginMeta}>
                    {getStatusBadge(plugin.status)}
                  </div>
                </div>
                <div className={styles.pluginActions}>
                  {plugin.status === 'active' ? (
                    <button 
                      onClick={() => handleToggleStatus(plugin.id, false)}
                      disabled={actionLoading === plugin.id}
                    >
                      {actionLoading === plugin.id ? '...' : 'Disable'}
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleToggleStatus(plugin.id, true)}
                      disabled={actionLoading === plugin.id}
                    >
                      {actionLoading === plugin.id ? '...' : 'Enable'}
                    </button>
                  )}
                  <button 
                    onClick={() => setEditingConfig(editingConfig === plugin.id ? null : plugin.id)}
                  >
                    {editingConfig === plugin.id ? 'Hide' : 'Config'}
                  </button>
                  <button 
                    onClick={() => {
                      setDocumentationModal(plugin);
                      loadPluginDocumentation(plugin);
                    }}
                    className={styles.documentationButton}
                  >
                    📚 Docs
                  </button>
                  {plugin.id === 'ldap-auth' && (
                    <>
                      <button 
                        onClick={() => handleLdapAction('test')}
                        disabled={actionLoading === 'ldap-test'}
                      >
                        {actionLoading === 'ldap-test' ? '...' : 'Test LDAP'}
                      </button>
                      <button 
                        onClick={async () => {
                          try {
                            const token = getAuthToken();
                            if (!token) {
                              alert('Authentication required');
                              return;
                            }

                            const response = await fetch(`${API_BASE}/api/ldap/configs`, {
                              headers: { 'Authorization': `Bearer ${token}` }
                            });

                            if (response.ok) {
                              const data = await response.json();
                              if (data.success && data.data && data.data.length > 0) {
                                setLdapConfigId(data.data[0].id);
                                setShowUserManager(true);
                              } else {
                                alert('No LDAP configuration found. Please configure LDAP first.');
                              }
                            } else {
                              alert('Failed to load LDAP configuration');
                            }
                          } catch (error) {
                            console.error('Failed to load config:', error);
                            alert('Failed to load LDAP configuration');
                          }
                        }}
                      >
                        👥 Manage Users
                      </button>
                    </>
                  )}
                  {!plugin.isSystem && (
                    <button 
                      onClick={() => handleUninstall(plugin.id)}
                      disabled={actionLoading === plugin.id}
                      className={styles.dangerButton}
                    >
                      {actionLoading === plugin.id ? '...' : 'Uninstall'}
                    </button>
                  )}
                </div>
                
                {editingConfig === plugin.id && (
                  <div className={styles.configEditor}>
                    {plugin.id === 'ldap-auth' ? (
                      <>
                        <h4>LDAP Plugin Configuration</h4>
                        <form className={styles.ldapConfigForm} onSubmit={(e) => e.preventDefault()}>
                          <div className={styles.formGroup}>
                            <label>Server URL *</label>
                            <input
                              type="text"
                              id="ldap-serverurl"
                              placeholder="ldap.example.com"
                              className={styles.ldapInput}
                              defaultValue={ldapConfig?.serverurl || "ldap://10.99.99.11:389"}
                              autoComplete="url"
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Port *</label>
                            <input
                              type="number"
                              id="ldap-port"
                              placeholder="389"
                              className={styles.ldapInput}
                              defaultValue={ldapConfig?.port?.toString() || "389"}
                              autoComplete="off"
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Use SSL/TLS</label>
                            <select
                              id="ldap-issecure"
                              className={styles.ldapInput}
                              defaultValue="false"
                            >
                              <option value="false">No</option>
                              <option value="true">Yes</option>
                            </select>
                          </div>
                          <div className={styles.formGroup}>
                            <label>Base DN * (User Search Base)</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <input
                                type="text"
                                id="ldap-basedn"
                                placeholder="dc=example,dc=com"
                                className={styles.ldapInput}
                                defaultValue={ldapConfig?.baseDN || "DC=starcosmos,DC=intranet"}
                                autoComplete="organization"
                                style={{ flex: 1 }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const serverUrl = (document.getElementById('ldap-serverurl') as HTMLInputElement)?.value;
                                  const baseDn = (document.getElementById('ldap-basedn') as HTMLInputElement)?.value;
                                  const bindDn = (document.getElementById('ldap-binddn') as HTMLInputElement)?.value;
                                  const bindPassword = (document.getElementById('ldap-bindpassword') as HTMLInputElement)?.value;
                                  const port = parseInt((document.getElementById('ldap-port') as HTMLInputElement)?.value || '389');
                                  const secure = (document.getElementById('ldap-issecure') as HTMLSelectElement)?.value === 'true';

                                  if (!serverUrl || !bindDn || !bindPassword) {
                                    alert('Please fill in Server URL, Bind DN, and Bind Password first');
                                    return;
                                  }

                                  setLdapServerConfig({
                                    serverurl: serverUrl,
                                    basedn: baseDn || 'DC=starcosmos,DC=intranet',
                                    binddn: bindDn,
                                    bindpassword: bindPassword,
                                    port: port,
                                    issecure: secure
                                  });
                                  setShowTreeBrowser(true);
                                }}
                                style={{
                                  padding: '0.75rem 1rem',
                                  background: 'var(--accent-primary)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.9rem',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                🌳 Browse...
                              </button>
                            </div>
                            <small style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                              Click "Browse..." to navigate the LDAP directory tree
                            </small>
                          </div>
                          <div className={styles.formGroup}>
                            <label>Bind DN *</label>
                            <input
                              type="text"
                              id="ldap-binddn"
                              placeholder="cn=admin,dc=example,dc=com"
                              className={styles.ldapInput}
                              defaultValue={ldapConfig?.bindDN || "admst@starcosmos.intranet"}
                              autoComplete="username"
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Bind Password *</label>
                            <input
                              type="password"
                              id="ldap-bindpassword"
                              placeholder="LDAP bind password"
                              autoComplete="current-password"
                              className={styles.ldapInput}
                              defaultValue={ldapConfig?.bindPassword || "StarCosmos*888"}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>User Search Base (Optional)</label>
                            <input
                              type="text"
                              id="ldap-searchbase"
                              placeholder="ou=users,dc=example,dc=com"
                              className={styles.ldapInput}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Search Filter *</label>
                            <input
                              type="text"
                              id="ldap-searchfilter"
                              placeholder="(objectClass=person)"
                              className={styles.ldapInput}
                              defaultValue="(objectClass=person)"
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Username Attribute *</label>
                            <input
                              type="text"
                              id="ldap-searchattribute"
                              placeholder="uid"
                              className={styles.ldapInput}
                              defaultValue="uid"
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Email Attribute (Optional)</label>
                            <input
                              type="text"
                              id="ldap-emailattribute"
                              placeholder="mail"
                              className={styles.ldapInput}
                              defaultValue="mail"
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Display Name Attribute (Optional)</label>
                            <input
                              type="text"
                              id="ldap-displaynameattribute"
                              placeholder="cn"
                              className={styles.ldapInput}
                              defaultValue="cn"
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Group Attribute (Optional)</label>
                            <input
                              type="text"
                              id="ldap-groupattribute"
                              placeholder="memberOf"
                              className={styles.ldapInput}
                              defaultValue="memberOf"
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Connection Timeout (seconds)</label>
                            <input
                              type="number"
                              id="ldap-timeout"
                              placeholder="30"
                              className={styles.ldapInput}
                              defaultValue="30"
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Sync Users on Login</label>
                            <select
                              id="ldap-syncusersonlogin"
                              className={styles.ldapInput}
                              defaultValue="true"
                            >
                              <option value="true">Yes</option>
                              <option value="false">No</option>
                            </select>
                          </div>
                          <div className={styles.formGroup}>
                            <label>Create Users Automatically</label>
                            <select
                              id="ldap-createusers"
                              className={styles.ldapInput}
                              defaultValue="true"
                            >
                              <option value="true">Yes</option>
                              <option value="false">No</option>
                            </select>
                          </div>
                        </form>
                      </>
                    ) : (
                      <>
                        <h4>Plugin Configuration</h4>
                        <form className={styles.configForm} onSubmit={(e) => e.preventDefault()}>
                          <div className={styles.configActions}>
                            <button 
                              onClick={async () => {
                                const textarea = document.querySelector(`.${styles.configForm} textarea`) as HTMLTextAreaElement;
                              
                              let config;
                              try {
                                config = JSON.parse(textarea.value);
                              } catch (err) {
                                alert('Invalid JSON configuration. Please check your syntax.');
                                return;
                              }
                              
                              // Validation
                              if (!config || Object.keys(config).length === 0) {
                                alert('Please provide a valid configuration object.');
                                return;
                              }
                              
                              setActionLoading(plugin.id);
                              
                              try {
                                const response = await fetch(`${API_BASE}/api/admin/plugins/${plugin.id}/config`, {
                                  method: 'PUT',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${getAuthToken()}`
                                  },
                                  body: JSON.stringify({ config })
                                });
                                
                                if (!response.ok) {
                                  throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                                }
                                
                                const result = await response.json();
                                if (result.success) {
                                  alert('Plugin configuration saved successfully!');
                                  await loadPlugins();
                                  setEditingConfig(null);
                                } else {
                                  alert('Plugin configuration failed: ' + (result.message || 'Unknown error'));
                                }
                              } catch (fetchError) {
                                console.error('Plugin Configuration Error:', fetchError);
                                if (fetchError instanceof TypeError && fetchError.message.includes('Failed to fetch')) {
                                  alert('Unable to connect to backend server. Please check if backend is running on port 4000.');
                                } else {
                                  alert('Plugin configuration failed: ' + (fetchError instanceof Error ? fetchError.message : 'Connection error'));
                                }
                              } finally {
                                setActionLoading(null);
                              }
                            }}
                            disabled={actionLoading === plugin.id}
                            className={styles.primaryButton}
                          >
                            {actionLoading === plugin.id ? 'Saving...' : 'Save'}
                          </button>
                          <button 
                            onClick={() => setEditingConfig(null)}
                          >
                            Cancel
                          </button>
                          </div>
                        </form>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Documentation Modal */}
      {documentationModal && (
        <div className={styles.documentationModal}>
          <div className={styles.documentationContent}>
            <div className={styles.documentationHeader}>
              <h2>
                <span className={styles.pluginIcon}>
                  {documentationModal.id === 'ldap-auth' ? '🔐' : 
                   documentationModal.id === 'core.text-block' ? '📝' : '🔌'}
                </span>
                {documentationModal.name}
              </h2>
              <button 
                onClick={() => setDocumentationModal(null)}
                className={styles.closeButton}
              >
                ✕
              </button>
            </div>

            <div className={styles.documentationBody}>
              {/* Plugin Description */}
              <section className={styles.documentationSection}>
                <h3>Description</h3>
                <p>{documentationModal.description}</p>
                <div className={styles.pluginMeta}>
                  <span><strong>Version:</strong> {documentationModal.version}</span>
                  <span><strong>Author:</strong> {documentationModal.author}</span>
                  <span><strong>Status:</strong> 
                    <span className={`${styles.status} ${styles[documentationModal.status]}`}>
                      {documentationModal.status}
                    </span>
                  </span>
                </div>
              </section>

              {/* Database-fetched Documentation */}
              {documentationLoading && (
                <section className={styles.documentationSection}>
                  <h3>Loading documentation...</h3>
                  <div className={styles.loading}>Loading documentation from database...</div>
                </section>
              )}

              {documentationError && (
                <section className={styles.documentationSection}>
                  <h3>Documentation Error</h3>
                  <div className={styles.error}>
                    Error loading documentation: {documentationError}
                  </div>
                </section>
              )}

              {documentationContent && Object.keys(documentationContent).length > 0 && (
                <>
                  {/* Display database documentation */}
                  {Object.entries(documentationContent).map(([docType, doc]: [string, any]) => (
                    <section key={docType} className={styles.documentationSection}>
                      <h3>{doc.title || docType.charAt(0).toUpperCase() + docType.slice(1)}</h3>
                      {doc.contentFormat === 'markdown' ? (
                        <div dangerouslySetInnerHTML={{ __html: 
                          doc.content
                            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                            .replace(/^\*\*(.*)\*\*/gm, '<strong>$1</strong>')
                            .replace(/\*\*(.*)\*\*/gm, '<strong>$1</strong>')
                            .replace(/^\* (.*$)/gm, '<li>$1</li>')
                            .replace(/^- (.*$)/gm, '<li>$1</li>')
                            .replace(/`([^`]+)`/gm, '<code>$1</code>')
                            .replace(/\n/g, '<br>')
                        }} />
                      ) : (
                        <div dangerouslySetInnerHTML={{ __html: doc.content }} />
                      )}
                    </section>
                  ))}
                </>
              )}

              {/* Plugin-specific Documentation */}
              {documentationModal.id === 'ldap-auth' && (
                <>
                  {/* Configuration Fields */}
                  <section className={styles.documentationSection}>
                    <h3>Configuration Fields</h3>
                    <div className={styles.fieldTable}>
                      <table>
                        <thead>
                          <tr>
                            <th>Field</th>
                            <th>Required</th>
                            <th>Type</th>
                            <th>Description</th>
                            <th>Example</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td><code>serverurl</code></td>
                            <td><span className={styles.required}>Yes</span></td>
                            <td>string</td>
                            <td>LDAP server hostname or IP address</td>
                            <td><code>ldap.company.com</code></td>
                          </tr>
                          <tr>
                            <td><code>port</code></td>
                            <td><span className={styles.required}>Yes</span></td>
                            <td>number</td>
                            <td>LDAP server port (389 for LDAP, 636 for LDAPS)</td>
                            <td><code>389</code> / <code>636</code></td>
                          </tr>
                          <tr>
                            <td><code>issecure</code></td>
                            <td>No</td>
                            <td>boolean</td>
                            <td>Use SSL/TLS encryption for LDAP connection</td>
                            <td><code>true</code> / <code>false</code></td>
                          </tr>
                          <tr>
                            <td><code>basedn</code></td>
                            <td><span className={styles.required}>Yes</span></td>
                            <td>string</td>
                            <td>Base Distinguished Name for LDAP directory</td>
                            <td><code>dc=company,dc=com</code></td>
                          </tr>
                          <tr>
                            <td><code>binddn</code></td>
                            <td><span className={styles.required}>Yes</span></td>
                            <td>string</td>
                            <td>Distinguished Name for LDAP bind user</td>
                            <td><code>cn=admin,dc=company,dc=com</code></td>
                          </tr>
                          <tr>
                            <td><code>bindpassword</code></td>
                            <td><span className={styles.required}>Yes</span></td>
                            <td>string</td>
                            <td>Password for LDAP bind user</td>
                            <td><code>••••••••••</code></td>
                          </tr>
                          <tr>
                            <td><code>searchbase</code></td>
                            <td>No</td>
                            <td>string</td>
                            <td>Base OU for user search (optional)</td>
                            <td><code>ou=users,dc=company,dc=com</code></td>
                          </tr>
                          <tr>
                            <td><code>searchfilter</code></td>
                            <td><span className={styles.required}>Yes</span></td>
                            <td>string</td>
                            <td>LDAP filter for finding users</td>
                            <td><code>(objectClass=person)</code></td>
                          </tr>
                          <tr>
                            <td><code>searchattribute</code></td>
                            <td><span className={styles.required}>Yes</span></td>
                            <td>string</td>
                            <td>LDAP attribute containing username</td>
                            <td><code>uid</code> / <code>sAMAccountName</code></td>
                          </tr>
                          <tr>
                            <td><code>emailattribute</code></td>
                            <td>No</td>
                            <td>string</td>
                            <td>LDAP attribute containing email address</td>
                            <td><code>mail</code></td>
                          </tr>
                          <tr>
                            <td><code>displaynameattribute</code></td>
                            <td>No</td>
                            <td>string</td>
                            <td>LDAP attribute containing display name</td>
                            <td><code>cn</code> / <code>displayName</code></td>
                          </tr>
                          <tr>
                            <td><code>groupattribute</code></td>
                            <td>No</td>
                            <td>string</td>
                            <td>LDAP attribute containing group membership</td>
                            <td><code>memberOf</code></td>
                          </tr>
                          <tr>
                            <td><code>timeout</code></td>
                            <td>No</td>
                            <td>number</td>
                            <td>Connection timeout in seconds</td>
                            <td><code>30</code></td>
                          </tr>
                          <tr>
                            <td><code>syncusersonlogin</code></td>
                            <td>No</td>
                            <td>boolean</td>
                            <td>Update user data on each LDAP login</td>
                            <td><code>true</code></td>
                          </tr>
                          <tr>
                            <td><code>createusers</code></td>
                            <td>No</td>
                            <td>boolean</td>
                            <td>Automatically create users from LDAP</td>
                            <td><code>true</code></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </section>

                  {/* API Documentation */}
                  <section className={styles.documentationSection}>
                    <h3>API Endpoints</h3>
                    <div className={styles.apiTable}>
                      <table>
                        <thead>
                          <tr>
                            <th>Endpoint</th>
                            <th>Method</th>
                            <th>Description</th>
                            <th>Required Fields</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td><code>/api/ldap/config</code></td>
                            <td><span className={styles.methodPost}>POST</span></td>
                            <td>Create/update LDAP configuration</td>
                            <td>serverurl, port, basedn, binddn, bindpassword</td>
                          </tr>
                          <tr>
                            <td><code>/api/ldap/configs</code></td>
                            <td><span className={styles.methodGet}>GET</span></td>
                            <td>Get all LDAP configurations</td>
                            <td>None</td>
                          </tr>
                          <tr>
                            <td><code>/api/plugins/ldap/test</code></td>
                            <td><span className={styles.methodPost}>POST</span></td>
                            <td>Test LDAP connection and bind</td>
                            <td>All configuration fields</td>
                          </tr>
                          <tr>
                            <td><code>/api/ldap/tree</code></td>
                            <td><span className={styles.methodPost}>POST</span></td>
                            <td>Get LDAP directory tree structure</td>
                            <td>config, baseDn</td>
                          </tr>
                          <tr>
                            <td><code>/api/ldap/users</code></td>
                            <td><span className={styles.methodGet}>GET</span></td>
                            <td>List available LDAP users (with photos, titles, departments)</td>
                            <td>configId</td>
                          </tr>
                          <tr>
                            <td><code>/api/ldap/imported-users</code></td>
                            <td><span className={styles.methodGet}>GET</span></td>
                            <td>List imported users from database</td>
                            <td>None</td>
                          </tr>
                          <tr>
                            <td><code>/api/ldap/import-selected</code></td>
                            <td><span className={styles.methodPost}>POST</span></td>
                            <td>Import selected users by username</td>
                            <td>configId, usernames[]</td>
                          </tr>
                          <tr>
                            <td><code>/api/ldap/remove-user/:userId</code></td>
                            <td><span className={styles.methodDelete}>DELETE</span></td>
                            <td>Remove user from application (soft delete)</td>
                            <td>userId (URL parameter)</td>
                          </tr>
                          <tr>
                            <td><code>/api/auth/login</code></td>
                            <td><span className={styles.methodPost}>POST</span></td>
                            <td>Authenticate user (supports LDAP/local)</td>
                            <td>username, password, authType</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </section>

                  {/* User Guide */}
                  <section className={styles.documentationSection}>
                    <h3>User Guide</h3>
                    <div className={styles.guideSteps}>
                      <h4>🔧 Setup Instructions</h4>
                      <ol>
                        <li>
                          <strong>Configure LDAP Server:</strong>
                          <ul>
                            <li>Open Plugin Manager from CAS Platform header</li>
                            <li>Find "LDAP Authentication" plugin</li>
                            <li>Click "Config" tab to open configuration form</li>
                            <li>Enter Server URL (e.g., ldap://10.99.99.11:389)</li>
                            <li>Fill in Bind DN and Password for service account</li>
                            <li><strong>NEW: 🌳 Use Tree Browser</strong> - Click "Browse..." next to Base DN</li>
                            <li>Navigate directory tree, expand folders, select organizational unit</li>
                            <li>Selected DN is automatically filled into Base DN field</li>
                            <li>Configure search attributes (sAMAccountName for AD, uid for OpenLDAP)</li>
                            <li>Click "Save Configuration"</li>
                          </ul>
                        </li>
                        <li>
                          <strong>Test Connection:</strong>
                          <ul>
                            <li>Click "Test LDAP" button in plugin actions</li>
                            <li>Verify "LDAP connection test successful!" message</li>
                            <li>If failed, check server URL, bind credentials, and network access</li>
                            <li>Review browser console for detailed error messages</li>
                          </ul>
                        </li>
                        <li>
                          <strong>Manage Users (Enhanced Interface):</strong>
                          <ul>
                            <li>Click "👥 Manage Users" button (replaces old Import Users)</li>
                            <li><strong>Available Users Tab:</strong> Browse all LDAP users with photos, titles, departments</li>
                            <li>Search/filter by name, email, department, or job title</li>
                            <li>Select specific users with checkboxes (supports multi-select)</li>
                            <li>Click "Select All" for bulk selection, or choose individually</li>
                            <li>Click "Import Selected (N)" to import only chosen users</li>
                            <li><strong>Imported Users Tab:</strong> View all imported users</li>
                            <li>See user photos, positions, departments, and email</li>
                            <li>Click "🗑️ Remove" to delete users from application (soft delete)</li>
                            <li>Use "🔄 Refresh" to reload user lists</li>
                          </ul>
                        </li>
                        <li>
                          <strong>Enable Plugin:</strong>
                          <ul>
                            <li>Ensure plugin status is "active"</li>
                            <li>If disabled, click "Enable" button</li>
                            <li>Plugin will be available for user authentication</li>
                          </ul>
                        </li>
                      </ol>

                      <h4>👥 User Authentication</h4>
                      <ol>
                        <li>
                          <strong>LDAP User Login:</strong>
                          <ul>
                            <li>Users login with their LDAP credentials</li>
                            <li>System authenticates against LDAP directory</li>
                            <li>User account is created/updated automatically (if enabled)</li>
                            <li>Access is granted based on LDAP group membership</li>
                          </ul>
                        </li>
                        <li>
                          <strong>Fallback Authentication:</strong>
                          <ul>
                            <li>Local admin accounts still work</li>
                            <li>System fails gracefully if LDAP is unavailable</li>
                            <li>Users can be manually created in local system</li>
                          </ul>
                        </li>
                      </ol>

                      <h4>⚙️ Configuration Examples</h4>
                      <div className={styles.configExamples}>
                        <h5>Active Directory (Microsoft)</h5>
                        <pre><code>{`{
  "serverurl": "ad.company.com",
  "port": 389,
  "issecure": false,
  "basedn": "dc=company,dc=com",
  "binddn": "cn=ldap-service,dc=company,dc=com",
  "bindpassword": "service-password",
  "searchattribute": "sAMAccountName",
  "emailattribute": "mail",
  "displaynameattribute": "displayName",
  "groupattribute": "memberOf"
}`}</code></pre>

                        <h5>OpenLDAP (Linux)</h5>
                        <pre><code>{`{
  "serverurl": "ldap.company.com",
  "port": 389,
  "issecure": false,
  "basedn": "dc=company,dc=com",
  "binddn": "cn=admin,dc=company,dc=com",
  "bindpassword": "admin-password",
  "searchattribute": "uid",
  "emailattribute": "mail",
  "displaynameattribute": "cn",
  "groupattribute": "memberOf"
}`}</code></pre>

                        <h5>Secure LDAP (LDAPS)</h5>
                        <pre><code>{`{
  "serverurl": "ldap.company.com",
  "port": 636,
  "issecure": true,
  "basedn": "dc=company,dc=com",
  "binddn": "cn=admin,dc=company,dc=com",
  "bindpassword": "secure-password"
}`}</code></pre>
                      </div>

                      <h4>🔍 Troubleshooting</h4>
                      <div className={styles.troubleshooting}>
                        <ul>
                          <li>
                            <strong>Connection Failed:</strong>
                            <ul>
                              <li>Verify server URL and port are correct</li>
                              <li>Check firewall allows LDAP port access</li>
                              <li>Ensure bind DN and password are valid</li>
                              <li>Test with LDAP browser tools</li>
                            </ul>
                          </li>
                          <li>
                            <strong>Authentication Failed:</strong>
                            <ul>
                              <li>Check search filter matches your LDAP schema</li>
                              <li>Verify username attribute is correct</li>
                              <li>Ensure user exists in LDAP directory</li>
                              <li>Check user account is not locked/disabled</li>
                            </ul>
                          </li>
                          <li>
                            <strong>Import Issues:</strong>
                            <ul>
                              <li>Verify search base contains users</li>
                              <li>Check user has required attributes</li>
                              <li>Review import logs for specific errors</li>
                              <li>Test with smaller search scope first</li>
                            </ul>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </section>
                </>
              )}

              {/* Text Block Plugin Documentation */}
              {documentationModal.id === 'core.text-block' && (
                <>
                  <section className={styles.documentationSection}>
                    <h3>Description</h3>
                    <p>Basic text content block for creating rich text content in pages and posts.</p>
                  </section>

                  <section className={styles.documentationSection}>
                    <h3>Features</h3>
                    <ul>
                      <li>Rich text editor with formatting toolbar</li>
                      <li>Support for headings, lists, links, and images</li>
                      <li>HTML and Markdown support</li>
                      <li>Responsive content rendering</li>
                      <li>SEO-friendly content structure</li>
                    </ul>
                  </section>

                  <section className={styles.documentationSection}>
                    <h3>Usage Guide</h3>
                    <ol>
                      <li>Add text block to any page or post</li>
                      <li>Click "Edit" to open rich text editor</li>
                      <li>Format content using toolbar options</li>
                      <li>Add images, links, and formatted text</li>
                      <li>Save changes to publish content</li>
                    </ol>
                  </section>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LDAP User Manager Modal */}
      {showUserManager && ldapConfigId && (
        <LdapUserManager 
          configId={ldapConfigId}
          onClose={() => setShowUserManager(false)}
        />
      )}

      {/* LDAP Tree Browser Modal */}
      {showTreeBrowser && ldapServerConfig && (
        <LdapTreeBrowser
          serverConfig={ldapServerConfig}
          currentBaseDn={ldapServerConfig.basedn}
          onSelect={(dn) => {
            const input = document.getElementById('ldap-basedn') as HTMLInputElement;
            if (input) {
              input.value = dn;
            }
          }}
          onClose={() => setShowTreeBrowser(false)}
        />
      )}
    </div>
  );
};

export default PluginManager;
