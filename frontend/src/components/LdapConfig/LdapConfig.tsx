import React, { useState, useEffect } from 'react';
import styles from './LdapConfig.module.css';
import { Button, Input, Switch } from '../base-ui/styled-components';

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

// API Response format (snake_case)
interface LdapConfigApiResponse {
  id: string;
  serverurl: string;
  basedn: string;
  binddn: string;
  bindpassword?: string;
  searchfilter: string;
  searchattribute: string;
  groupattribute: string;
  issecure: boolean;
  port: number;
  isactive: boolean;
  createdat?: string;
  updatedat?: string;
}

// Helper function to convert API response to frontend format
const mapApiResponseToConfig = (apiConfig: LdapConfigApiResponse): LdapConfiguration => ({
  id: apiConfig.id,
  serverUrl: apiConfig.serverurl,
  baseDN: apiConfig.basedn,
  bindDN: apiConfig.binddn,
  bindPassword: apiConfig.bindpassword || '',
  searchFilter: apiConfig.searchfilter,
  searchAttribute: apiConfig.searchattribute,
  groupAttribute: apiConfig.groupattribute,
  isSecure: apiConfig.issecure,
  port: apiConfig.port,
  isActive: apiConfig.isactive
});

interface LdapConfigProps {
  onClose: () => void;
  config?: LdapConfiguration;
}

const LdapConfig: React.FC<LdapConfigProps> = ({ onClose, config }) => {
  const [configs, setConfigs] = useState<LdapConfiguration[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<LdapConfiguration | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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
    if (config) {
      // If editing, populate form with existing config data
      setFormData({
        serverUrl: config.serverUrl,
        baseDN: config.baseDN,
        bindDN: config.bindDN,
        bindPassword: config.bindPassword || '',
        searchFilter: config.searchFilter,
        searchAttribute: config.searchAttribute,
        groupAttribute: config.groupAttribute,
        isSecure: config.isSecure,
        port: config.port
      });
      setEditingConfig(config);
      setShowForm(true);
    } else {
      loadConfigs();
    }
  }, [config]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.serverUrl.trim()) {
      errors.serverUrl = 'Server URL is required';
    } else if (!/^https?:\/\/.+/.test(formData.serverUrl)) {
      errors.serverUrl = 'Server URL must be a valid URL (e.g., ldap://example.com)';
    }

    if (!formData.baseDN.trim()) {
      errors.baseDN = 'Base DN is required';
    }

    if (!formData.bindDN.trim()) {
      errors.bindDN = 'Bind DN is required';
    }

    if (!formData.bindPassword.trim() && !editingConfig) {
      errors.bindPassword = 'Bind Password is required for new configurations';
    }

    if (!formData.port || formData.port < 1 || formData.port > 65535) {
      errors.port = 'Port must be between 1 and 65535';
    }

    if (!formData.searchFilter.trim()) {
      errors.searchFilter = 'Search filter is required';
    }

    if (!formData.searchAttribute.trim()) {
      errors.searchAttribute = 'Search attribute is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const loadConfigs = async () => {
    try {
      const token = localStorage.getItem('auth_token') || 'test-token';

      const response = await fetch('/api/ldap/configs', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Failed to load LDAP configs: HTTP', response.status);
        return;
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        // Map API response to frontend format
        const mappedConfigs = data.data.map((apiConfig: LdapConfigApiResponse) => 
          mapApiResponseToConfig(apiConfig)
        );
        setConfigs(mappedConfigs);
      } else {
        console.error('Invalid API response format:', data);
      }
    } catch (error) {
      console.error('Failed to load LDAP configs:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

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
        setFormErrors({});
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
    if (!validateForm()) {
      return;
    }

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
    setFormErrors({});
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

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>LDAP Configuration</h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className={styles.closeButton}
          >
            ×
          </Button>
        </div>

        <div className={styles.content}>
          {!showForm && (
            <>
              <div className={styles.actions}>
                <Button
                  onClick={() => setShowForm(true)}
                  variant="primary"
                >
                  Add Configuration
                </Button>
                {configs.some(c => c.isActive) && (
                  <Button
                    onClick={handleImport}
                    disabled={loading}
                    variant="secondary"
                  >
                    {loading ? 'Importing...' : 'Import Users'}
                  </Button>
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
                      <Button
                        onClick={() => editConfig(config)}
                        variant="secondary"
                        size="sm"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => deleteConfig(config.id)}
                        variant="danger"
                        size="sm"
                      >
                        Delete
                      </Button>
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

              <form onSubmit={handleSubmit}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Server URL</label>
                    <Input
                      type="text"
                      value={formData.serverUrl}
                      onChange={(e) => handleInputChange('serverUrl', e.target.value)}
                      placeholder="ldap://example.com"
                      fullWidth
                      required
                    />
                    {formErrors.serverUrl && (
                      <span className={styles.errorText}>{formErrors.serverUrl}</span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Port</label>
                    <Input
                      type="number"
                      value={formData.port.toString()}
                      onChange={(e) => handleInputChange('port', parseInt(e.target.value) || 389)}
                      min="1"
                      max="65535"
                      fullWidth
                      required
                    />
                    {formErrors.port && (
                      <span className={styles.errorText}>{formErrors.port}</span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Base DN</label>
                    <Input
                      type="text"
                      value={formData.baseDN}
                      onChange={(e) => handleInputChange('baseDN', e.target.value)}
                      placeholder="dc=example,dc=com"
                      fullWidth
                      required
                    />
                    {formErrors.baseDN && (
                      <span className={styles.errorText}>{formErrors.baseDN}</span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Bind DN</label>
                    <Input
                      type="text"
                      value={formData.bindDN}
                      onChange={(e) => handleInputChange('bindDN', e.target.value)}
                      placeholder="cn=admin,dc=example,dc=com"
                      fullWidth
                      required
                    />
                    {formErrors.bindDN && (
                      <span className={styles.errorText}>{formErrors.bindDN}</span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Bind Password</label>
                    <Input
                      type="password"
                      value={formData.bindPassword}
                      onChange={(e) => handleInputChange('bindPassword', e.target.value)}
                      placeholder={editingConfig ? "Leave empty to keep current password" : "Enter bind password"}
                      fullWidth
                      required={!editingConfig}
                    />
                    {formErrors.bindPassword && (
                      <span className={styles.errorText}>{formErrors.bindPassword}</span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Search Filter</label>
                    <Input
                      type="text"
                      value={formData.searchFilter}
                      onChange={(e) => handleInputChange('searchFilter', e.target.value)}
                      placeholder="(objectClass=person)"
                      fullWidth
                    />
                    {formErrors.searchFilter && (
                      <span className={styles.errorText}>{formErrors.searchFilter}</span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Search Attribute</label>
                    <Input
                      type="text"
                      value={formData.searchAttribute}
                      onChange={(e) => handleInputChange('searchAttribute', e.target.value)}
                      placeholder="uid"
                      fullWidth
                    />
                    {formErrors.searchAttribute && (
                      <span className={styles.errorText}>{formErrors.searchAttribute}</span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Group Attribute</label>
                    <Input
                      type="text"
                      value={formData.groupAttribute}
                      onChange={(e) => handleInputChange('groupAttribute', e.target.value)}
                      placeholder="memberOf"
                      fullWidth
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <Switch
                      checked={formData.isSecure}
                      onCheckedChange={(checked) => handleInputChange('isSecure', checked)}
                      label="Use LDAPS (Secure)"
                      id="ldap-secure"
                    />
                  </div>
                </div>

                {testResult && (
                  <div className={`${styles.message} ${testResult.success ? styles.success : styles.error}`}>
                    {testResult.message}
                  </div>
                )}

                <div className={styles.formActions}>
                  <Button
                    type="button"
                    onClick={handleTest}
                    disabled={loading}
                    variant="secondary"
                  >
                    {loading ? 'Testing...' : 'Test Connection'}
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    variant="primary"
                  >
                    {loading ? 'Saving...' : 'Save Configuration'}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingConfig(null);
                      setTestResult(null);
                      setFormErrors({});
                    }}
                    variant="ghost"
                  >
                    Cancel
                  </Button>
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