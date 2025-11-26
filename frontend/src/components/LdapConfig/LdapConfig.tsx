import React, { useState, useEffect } from 'react';
import styles from './LdapConfig.module.css';

interface LdapConfiguration {
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

interface LdapConfigProps {
  onClose: () => void;
}

const LdapConfig: React.FC<LdapConfigProps> = ({ onClose }) => {
  const [configs, setConfigs] = useState<LdapConfiguration[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<LdapConfiguration | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);

  const [formData, setFormData] = useState({
    serverUrl: '',
    baseDN: '',
    bindDN: '',
    bindPassword: '',
    searchFilter: '(objectClass=person)',
    searchAttribute: 'uid',
    groupAttribute: 'memberOf',
    isSecure: false,
    port: 389
  });

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
      }
    } catch (error) {
      console.error('Failed to load LDAP configs:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTestResult(null);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setTestResult({ success: false, message: 'Not authenticated' });
        setLoading(false);
        return;
      }

      const method = editingConfig ? 'PUT' : 'POST';
      const url = editingConfig ? `/api/ldap/configs/${editingConfig.id}` : '/api/ldap/configs';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowForm(false);
        setEditingConfig(null);
        setFormData({
          serverUrl: '',
          baseDN: '',
          bindDN: '',
          bindPassword: '',
          searchFilter: '(objectClass=person)',
          searchAttribute: 'uid',
          groupAttribute: 'memberOf',
          isSecure: false,
          port: 389
        });
        loadConfigs();
      } else {
        const error = await response.json();
        setTestResult({ success: false, message: error.error || 'Failed to save configuration' });
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Configuration save failed' });
    }
    setLoading(false);
  };

  const handleTest = async () => {
    setLoading(true);
    setTestResult(null);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setTestResult({ success: false, message: 'Not authenticated' });
        setLoading(false);
        return;
      }

      const response = await fetch('/api/ldap/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      setTestResult({
        success: result.success,
        message: result.message
      });
    } catch (error) {
      setTestResult({ success: false, message: 'Connection test failed' });
    }
    setLoading(false);
  };

  const handleImport = async () => {
    setLoading(true);
    setImportResult(null);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token || !configs.length) {
        setImportResult({ success: false, message: 'Authentication required or no LDAP configuration' });
        setLoading(false);
        return;
      }

      const activeConfig = configs.find(c => c.isActive);
      if (!activeConfig) {
        setImportResult({ success: false, message: 'No active LDAP configuration found' });
        setLoading(false);
        return;
      }

      const response = await fetch('/api/ldap/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          configId: activeConfig.id
        })
      });

      const result = await response.json();
      setImportResult({
        success: result.success,
        message: result.message
      });
    } catch (error) {
      setImportResult({ success: false, message: 'Import failed' });
    }
    setLoading(false);
  };

  const editConfig = (config: LdapConfiguration) => {
    setEditingConfig(config);
    setFormData({
      serverUrl: config.serverUrl,
      baseDN: config.baseDN,
      bindDN: config.bindDN,
      bindPassword: '',
      searchFilter: config.searchFilter,
      searchAttribute: config.searchAttribute,
      groupAttribute: config.groupAttribute,
      isSecure: config.isSecure,
      port: config.port
    });
    setShowForm(true);
  };

  const deleteConfig = async (id: string) => {
    if (!confirm('Are you sure you want to delete this LDAP configuration?')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/ldap/configs/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        loadConfigs();
      }
    } catch (error) {
      console.error('Failed to delete config:', error);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>LDAP Configuration</h2>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>

        <div className={styles.content}>
          {!showForm && (
            <>
              <div className={styles.actions}>
                <button 
                  onClick={() => setShowForm(true)} 
                  className={styles.addButton}
                >
                  Add Configuration
                </button>
                {configs.some(c => c.isActive) && (
                  <button 
                    onClick={handleImport}
                    disabled={loading}
                    className={styles.importButton}
                  >
                    {loading ? 'Importing...' : 'Import Users'}
                  </button>
                )}
              </div>

              {importResult && (
                <div className={`${styles.message} ${importResult.success ? styles.success : styles.error}`}>
                  {importResult.message}
                </div>
              )}

              <div className={styles.configList}>
                {configs.map(config => (
                  <div key={config.id} className={`${styles.configCard} ${config.isActive ? styles.active : ''}`}>
                    <div className={styles.configInfo}>
                      <h4>{config.serverUrl}</h4>
                      <p>Base DN: {config.baseDN}</p>
                      <p>Port: {config.port} ({config.isSecure ? 'LDAPS' : 'LDAP'})</p>
                      <p>Status: {config.isActive ? 'Active' : 'Inactive'}</p>
                    </div>
                    <div className={styles.configActions}>
                      <button 
                        onClick={() => editConfig(config)}
                        className={styles.editButton}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => deleteConfig(config.id)}
                        className={styles.deleteButton}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {configs.length === 0 && (
                  <div className={styles.empty}>No LDAP configurations found</div>
                )}
              </div>
            </>
          )}

          {showForm && (
            <div className={styles.form}>
              <h3>{editingConfig ? 'Edit' : 'Add'} LDAP Configuration</h3>
              <form onSubmit={handleSubmit}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Server URL</label>
                    <input
                      type="text"
                      value={formData.serverUrl}
                      onChange={(e) => setFormData({...formData, serverUrl: e.target.value})}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Port</label>
                    <input
                      type="number"
                      value={formData.port}
                      onChange={(e) => setFormData({...formData, port: parseInt(e.target.value)})}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Base DN</label>
                    <input
                      type="text"
                      value={formData.baseDN}
                      onChange={(e) => setFormData({...formData, baseDN: e.target.value})}
                      placeholder="dc=example,dc=com"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Bind DN</label>
                    <input
                      type="text"
                      value={formData.bindDN}
                      onChange={(e) => setFormData({...formData, bindDN: e.target.value})}
                      placeholder="cn=admin,dc=example,dc=com"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Bind Password</label>
                    <input
                      type="password"
                      value={formData.bindPassword}
                      onChange={(e) => setFormData({...formData, bindPassword: e.target.value})}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Search Filter</label>
                    <input
                      type="text"
                      value={formData.searchFilter}
                      onChange={(e) => setFormData({...formData, searchFilter: e.target.value})}
                      placeholder="(objectClass=person)"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Search Attribute</label>
                    <input
                      type="text"
                      value={formData.searchAttribute}
                      onChange={(e) => setFormData({...formData, searchAttribute: e.target.value})}
                      placeholder="uid"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Group Attribute</label>
                    <input
                      type="text"
                      value={formData.groupAttribute}
                      onChange={(e) => setFormData({...formData, groupAttribute: e.target.value})}
                      placeholder="memberOf"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>
                      <input
                        type="checkbox"
                        checked={formData.isSecure}
                        onChange={(e) => setFormData({...formData, isSecure: e.target.checked})}
                      />
                      Use LDAPS (Secure)
                    </label>
                  </div>
                </div>

                {testResult && (
                  <div className={`${styles.message} ${testResult.success ? styles.success : styles.error}`}>
                    {testResult.message}
                  </div>
                )}

                <div className={styles.formActions}>
                  <button 
                    type="button"
                    onClick={handleTest}
                    disabled={loading}
                    className={styles.testButton}
                  >
                    {loading ? 'Testing...' : 'Test Connection'}
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className={styles.saveButton}
                  >
                    {loading ? 'Saving...' : 'Save Configuration'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingConfig(null);
                      setTestResult(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LdapConfig;
