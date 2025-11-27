import React, { useState, useEffect } from 'react';
import { PluginMetadata, PluginInstallRequest } from '../../types';
import { PluginAdminService } from '../../services/PluginAdminService';
import { PluginDocumentationService } from '../../services/PluginDocumentationService';
import LdapUserManager from '../LdapUserManager';
import LdapTreeBrowser from '../LdapTreeBrowser';

// Dynamic API URL that works for both localhost and network access
const getApiBaseUrl = () => {
  // Constitution: Always use localhost for development to avoid CORS issues
  if (import.meta.env.DEV || 
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1') {
    return 'http://localhost:4000';
  }
  // For production, use same host but port 4000
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
        setError(response.message || 'Failed to install plugin');
      }
    } catch (err) {
      console.error('Install error:', err);
      setError(err instanceof Error ? err.message : 'Failed to install plugin');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUninstall = async (pluginId: string) => {
    if (!confirm('Are you sure you want to uninstall this plugin? This will remove all associated data.')) {
      return;
    }

    try {
      setActionLoading(pluginId);
      const response = await PluginAdminService.uninstallPlugin(pluginId);
      if (response.success) {
        await loadPlugins();
      } else {
        setError(response.message || 'Failed to uninstall plugin');
      }
    } catch (err) {
      console.error('Uninstall error:', err);
      setError(err instanceof Error ? err.message : 'Failed to uninstall plugin');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (pluginId: string, enable: boolean) => {
    try {
      setActionLoading(pluginId);
      const endpoint = enable ? '/api/plugins/enable' : '/api/plugins/disable';
      const token = getAuthToken();
      
      if (!token) {
        alert('Authentication required. Please login again.');
        return;
      }

      const response = await fetch(`${API_BASE}${endpoint}/${pluginId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
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

  const loadPlugins = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await PluginAdminService.listPlugins();
      if (response.success) {
        // Constitution: Use plugins from API response (includes LDAP, RAG, etc.)
        setPlugins(response.data);
      } else {
        setError(response.message || 'Failed to load plugins');
      }
    } catch (err) {
      console.error('Load plugins error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load plugins');
    } finally {
      setLoading(false);
    }
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

      const response = await fetch(`${API_BASE}/api/plugins/ldap/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(action === 'test' ? {
          ...(ldapConfig || {}),
          ...(ldapConfig ? {} : {
            "serverurl": "ldap.example.com",
            "port": 389,
            "issecure": false,
            "basedn": "dc=example,dc=com",
            "binddn": "cn=admin,dc=example,dc=com",
            "bindpassword": "password",
            "searchattribute": "uid"
          })
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert(`${action.charAt(0).toUpperCase() + action.slice(1)} successful!`);
        } else {
          alert(`Failed to ${action}: ${data.message || 'Unknown error'}`);
        }
      } else {
        alert(`Failed to ${action}: Server error`);
      }
    } catch (error) {
      console.error(`LDAP ${action} error:`, error);
      alert(`Failed to ${action}: Network error`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Plugin Manager</h1>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>

        <div className={styles.content}>
          <div className={styles.headerActions}>
            <button onClick={loadPlugins} disabled={actionLoading !== null}>
              {actionLoading !== null ? '...' : '🔄 Refresh'}
            </button>
            <button onClick={() => setShowInstallForm(!showInstallForm)}>
              {showInstallForm ? 'Cancel' : '+ Install Plugin'}
            </button>
          </div>

          {error && (
            <div className={styles.error}>
              {error}
              <button onClick={() => setError(null)}>×</button>
            </div>
          )}

          {showInstallForm ? (
            <div className={styles.installForm}>
              <h2>Install Plugin</h2>
              <form onSubmit={handleInstall}>
                <div className={styles.formGroup}>
                  <label>Plugin ID *</label>
                  <input
                    type="text"
                    value={installForm.id}
                    onChange={(e) => setInstallForm({...installForm, id: e.target.value})}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Plugin Name *</label>
                  <input
                    type="text"
                    value={installForm.name}
                    onChange={(e) => setInstallForm({...installForm, name: e.target.value})}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Version</label>
                  <input
                    type="text"
                    value={installForm.version}
                    onChange={(e) => setInstallForm({...installForm, version: e.target.value})}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Description</label>
                  <textarea
                    value={installForm.description}
                    onChange={(e) => setInstallForm({...installForm, description: e.target.value})}
                    rows={3}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Author</label>
                  <input
                    type="text"
                    value={installForm.author}
                    onChange={(e) => setInstallForm({...installForm, author: e.target.value})}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Entry Point</label>
                  <input
                    type="text"
                    value={installForm.entry}
                    onChange={(e) => setInstallForm({...installForm, entry: e.target.value})}
                  />
                </div>
                <div className={styles.formActions}>
                  <button type="submit" disabled={actionLoading === 'install'}>
                    {actionLoading === 'install' ? 'Installing...' : 'Install Plugin'}
                  </button>
                  <button type="button" onClick={() => setShowInstallForm(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className={styles.pluginsList}>
              {loading ? (
                <div className={styles.loading}>Loading plugins...</div>
              ) : (
                <div className={styles.pluginsGrid}>
                  {plugins.map((plugin) => (
                    <div key={plugin.id} className={styles.pluginCard}>
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
                      
                      {editingConfig === plugin.id && plugin.id === 'ldap-auth' && (
                        <div className={styles.configEditor}>
                          <h4>LDAP Plugin Configuration</h4>
                          <form className={styles.ldapConfigForm}>
                            <div className={styles.formGroup}>
                              <label>Server URL *</label>
                              <input
                                type="text"
                                defaultValue={ldapConfig?.serverurl || ''}
                                placeholder="ldap.example.com"
                                className={styles.ldapInput}
                              />
                            </div>
                            <div className={styles.formGroup}>
                              <label>Port *</label>
                              <input
                                type="number"
                                defaultValue={ldapConfig?.port || 389}
                                placeholder="389"
                                className={styles.ldapInput}
                              />
                            </div>
                            <div className={styles.formGroup}>
                              <label>Base DN *</label>
                              <input
                                type="text"
                                defaultValue={ldapConfig?.basedn || ''}
                                placeholder="dc=example,dc=com"
                                className={styles.ldapInput}
                              />
                            </div>
                            <div className={styles.formGroup}>
                              <label>Bind DN *</label>
                              <input
                                type="text"
                                defaultValue={ldapConfig?.binddn || ''}
                                placeholder="cn=admin,dc=example,dc=com"
                                className={styles.ldapInput}
                              />
                            </div>
                            <div className={styles.formGroup}>
                              <label>Bind Password *</label>
                              <input
                                type="password"
                                defaultValue={ldapConfig?.bindpassword || ''}
                                placeholder="password"
                                className={styles.ldapInput}
                              />
                            </div>
                            <div className={styles.formGroup}>
                              <label>Search Attribute *</label>
                              <input
                                type="text"
                                defaultValue={ldapConfig?.searchattribute || 'sAMAccountName'}
                                placeholder="sAMAccountName"
                                className={styles.ldapInput}
                              />
                            </div>
                            <div className={styles.ldapConfigActions}>
                              <button 
                                onClick={() => handleLdapAction('save')}
                                disabled={actionLoading === 'ldap-save'}
                              >
                                {actionLoading === 'ldap-save' ? 'Saving...' : 'Save Configuration'}
                              </button>
                              <button 
                                onClick={() => setEditingConfig(null)}
                                disabled={actionLoading === 'ldap-save'}
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
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
                   documentationModal.id === 'core.text-block' ? '📝' : 
                   documentationModal.id === 'rag-retrieval' ? '🧠' : '🔌'}
                </span>
                {documentationModal.name}
              </h2>
              <button 
                onClick={() => {
                  setDocumentationModal(null);
                  setDocumentationContent(null);
                  setDocumentationError(null);
                }}
                className={styles.closeButton}
              >
                ✕
              </button>
            </div>

            <div className={styles.documentationBody}>
              {documentationLoading ? (
                <div className={styles.loadingState}>
                  <div className={styles.spinner}></div>
                  <p>Loading documentation...</p>
                </div>
              ) : documentationError ? (
                <div className={styles.errorState}>
                  <p><strong>Error loading documentation:</strong> {documentationError}</p>
                  <button onClick={() => loadPluginDocumentation(documentationModal)} className={styles.retryButton}>
                    Retry
                  </button>
                </div>
              ) : documentationContent ? (
                <>
                  {/* Show available documentation types */}
                  {Object.keys(documentationContent).length > 1 && (
                    <div className={styles.documentationTabs}>
                      {Object.entries(documentationContent).map(([type, doc]: [string, any]) => (
                        <button
                          key={type}
                          className={styles.documentationTab}
                          onClick={() => {
                            // Switch to specific documentation type
                            const element = document.getElementById(`doc-section-${type}`);
                            if (element) {
                              element.scrollIntoView({ behavior: 'smooth' });
                            }
                          }}
                        >
                          {PluginDocumentationService.getDocumentTypeIcon(type as any)} 
                          {PluginDocumentationService.getDocumentTypeDisplayName(type as any)}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Render documentation content */}
                  {Object.entries(documentationContent).map(([type, doc]: [string, any]) => (
                    <section key={type} id={`doc-section-${type}`} className={styles.documentationSection}>
                      <h3>
                        {PluginDocumentationService.getDocumentTypeIcon(type as any)} 
                        {doc.title || PluginDocumentationService.getDocumentTypeDisplayName(type as any)}
                      </h3>
                      {doc.contentFormat === 'markdown' ? (
                        <div 
                          className={styles.markdownContent}
                          dangerouslySetInnerHTML={{ 
                            __html: PluginDocumentationService.renderMarkdown(doc.content) 
                          }}
                        />
                      ) : doc.contentFormat === 'html' ? (
                        <div 
                          className={styles.htmlContent}
                          dangerouslySetInnerHTML={{ __html: doc.content }} 
                        />
                      ) : (
                        <pre className={styles.plainContent}>{doc.content}</pre>
                      )}
                    </section>
                  ))}
                </>
              ) : (
                <section className={styles.documentationSection}>
                  <p>No documentation available for this plugin.</p>
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PluginManager;
