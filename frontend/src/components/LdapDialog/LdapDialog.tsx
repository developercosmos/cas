import React, { useState, useEffect, useRef, useCallback } from 'react';
import LdapConfig from '../LdapConfig/LdapConfig';
import LdapTreeBrowser from '../LdapTreeBrowser/LdapTreeBrowser';
import LdapUserManagerInline from '../LdapUserManagerInline/LdapUserManagerInline';
import { Button } from '../base-ui/styled-components';
import styles from './styles.module.css';

// LDAP Configuration Interface (from existing LdapConfig)
interface LdapConfiguration {
  id: string;
  serverUrl: string;
  baseDN: string;
  bindDN: string;
  bindPassword?: string;
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
  bindPassword: apiConfig.bindpassword,
  searchFilter: apiConfig.searchfilter,
  searchAttribute: apiConfig.searchattribute,
  groupAttribute: apiConfig.groupattribute,
  isSecure: apiConfig.issecure,
  port: apiConfig.port,
  isActive: apiConfig.isactive
});

interface LdapDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'config' | 'test' | 'users';
}

type TabType = 'config' | 'test' | 'users';

interface WindowState {
  width: number;
  height: number;
  x: number;
  y: number;
}

const STORAGE_KEY = 'ldap_dialog_window_state';
const DEFAULT_SIZE = { width: 1200, height: 600 };
const MIN_SIZE = { width: 400, height: 300 };

const getStoredWindowState = (): WindowState | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error reading window state:', e);
  }
  return null;
};

const saveWindowState = (state: WindowState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving window state:', e);
  }
};

export const LdapDialog: React.FC<LdapDialogProps> = ({ isOpen, onClose, initialTab = 'config' }) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState(DEFAULT_SIZE);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState('');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // LDAP State Management
  const [configs, setConfigs] = useState<LdapConfiguration[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<LdapConfiguration | null>(null);
  const [editingConfig, setEditingConfig] = useState<LdapConfiguration | null>(null);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [showTreeBrowser, setShowTreeBrowser] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [preMinimizeState, setPreMinimizeState] = useState<{ position: { x: number; y: number }; size: { width: number; height: number } } | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // LDAP Helper Functions
  const loadConfigs = async () => {
    try {
        const response = await fetch('/api/ldap/configs', {
          headers: {
            'Authorization': `Bearer test-token`,
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
          const activeConfig = mappedConfigs.find((c: LdapConfiguration) => c.isActive);
          setSelectedConfig(activeConfig || null);
        } else {
          console.error('Invalid API response format:', data);
        }
      } catch (error) {
        console.error('Failed to load LDAP configs:', error);
      }
  };

  const handleEditConfig = (config: LdapConfiguration) => {
    setEditingConfig(config);
    setShowConfigForm(true);
  };

  const handleRemoveConfig = async (config: LdapConfiguration) => {
    const confirmMessage = `Are you sure you want to delete the LDAP configuration for "${config.serverUrl}"?\n\nThis action cannot be undone.`;
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await fetch(`/api/ldap/configs/${config.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer test-token`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete configuration' }));
        throw new Error(errorData.message || 'Failed to delete configuration');
      }

      const result = await response.json();
      if (result.success) {
        alert('✅ LDAP configuration deleted successfully!');
        await loadConfigs(); // Reload configurations
      } else {
        throw new Error(result.message || 'Delete operation failed');
      }
    } catch (error) {
      console.error('Failed to delete LDAP config:', error);
      alert(`❌ Failed to delete configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Load LDAP configs when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadConfigs();
    }
  }, [isOpen]);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      const isDark = theme === 'dark';
      setIsDarkMode(isDark);
    };

    checkDarkMode();
    
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    return () => observer.disconnect();
  }, []);

  // Load stored window state and initialize when dialog opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setIsMinimized(false);
      
      // Load stored state
      const stored = getStoredWindowState();
      if (stored) {
        setSize({ width: stored.width, height: stored.height });
        setPosition({ x: stored.x, y: stored.y });
      } else {
        // Center the window
        const centerX = (window.innerWidth - DEFAULT_SIZE.width) / 2;
        const centerY = (window.innerHeight - DEFAULT_SIZE.height) / 2;
        setPosition({ x: Math.max(0, centerX), y: Math.max(60, centerY) });
        setSize(DEFAULT_SIZE);
      }
    }
  }, [isOpen, initialTab]);

  // Save window state when size or position changes
  const saveState = useCallback(() => {
    if (!isMinimized && position.x !== 0 && position.y !== 0) {
      saveWindowState({
        width: size.width,
        height: size.height,
        x: position.x,
        y: position.y
      });
    }
  }, [size, position, isMinimized]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      const timeoutId = setTimeout(saveState, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, saveState, isMinimized]);

  // Handle mouse down on header for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!modalRef.current || isMinimized) return;
    
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    setIsDragging(true);
    e.preventDefault();
  };

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    if (isMinimized) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  // Handle mouse move for dragging and resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && !isMinimized) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        
        // Constrain to viewport bounds
        const maxX = window.innerWidth - size.width;
        const maxY = window.innerHeight - size.height;
        
        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(60, Math.min(newY, maxY))
        });
      }
      
      if (isResizing && !isMinimized) {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        
        let newWidth = size.width;
        let newHeight = size.height;
        let newX = position.x;
        let newY = position.y;
        
        if (resizeDirection.includes('e')) {
          newWidth = Math.max(MIN_SIZE.width, size.width + deltaX);
        }
        if (resizeDirection.includes('w')) {
          const proposedWidth = size.width - deltaX;
          if (proposedWidth >= MIN_SIZE.width) {
            newWidth = proposedWidth;
            newX = position.x + deltaX;
          }
        }
        if (resizeDirection.includes('s')) {
          newHeight = Math.max(MIN_SIZE.height, size.height + deltaY);
        }
        if (resizeDirection.includes('n')) {
          const proposedHeight = size.height - deltaY;
          if (proposedHeight >= MIN_SIZE.height) {
            newHeight = proposedHeight;
            newY = position.y + deltaY;
          }
        }
        
        // Constrain to viewport
        newWidth = Math.min(newWidth, window.innerWidth - newX);
        newHeight = Math.min(newHeight, window.innerHeight - newY);
        
        setSize({ width: newWidth, height: newHeight });
        setPosition({ x: newX, y: newY });
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeDirection('');
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, size, position, resizeDirection, isMinimized]);

  // Handle minimize/restore
  const handleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMinimized) {
      // Restore
      if (preMinimizeState) {
        setPosition(preMinimizeState.position);
        setSize(preMinimizeState.size);
      }
      setIsMinimized(false);
    } else {
      // Minimize
      setPreMinimizeState({ position, size });
      setIsMinimized(true);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const tabs = [
    { id: 'config' as TabType, label: 'Configuration', icon: '⚙️' },
    { id: 'test' as TabType, label: 'Test Connection', icon: '🔗' },
    { id: 'users' as TabType, label: 'User Management', icon: '👥' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'config':
        if (showConfigForm) {
          return (
            <div className={styles.tabContent}>
              <LdapConfig 
                config={editingConfig || undefined}
                onClose={() => {
                  setShowConfigForm(false);
                  setEditingConfig(null);
                  loadConfigs(); // Reload configs when closing
                }} 
              />
            </div>
          );
        }
        
        // Show existing configurations directly, or empty state if none
        if (configs.length > 0) {
          return (
            <div className={styles.tabContent} style={{ 
              background: isDarkMode ? '#111827' : '#f9fafb', 
              padding: '2rem',
              minHeight: '100%'
            }}>
              <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: '2rem',
                  gap: '1rem'
                }}>
                  <div>
                    <h3 style={{ 
                      margin: 0, 
                      marginBottom: '0.5rem', 
                      fontSize: '1.875rem',
                      fontWeight: 700,
                      color: isDarkMode ? '#f9fafb' : '#111827',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                    }}>
                      LDAP Configuration
                    </h3>
                    <p style={{ 
                      margin: 0, 
                      color: isDarkMode ? '#d1d5db' : '#6b7280',
                      fontSize: '1rem',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                      lineHeight: '1.5'
                    }}>
                      Manage LDAP server connections and authentication settings.
                    </p>
                  </div>
                  <Button 
                    onClick={() => setShowConfigForm(true)}
                    style={{
                      padding: '0.625rem 1.25rem',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      borderRadius: '0.5rem',
                      background: '#f97316',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    + New Configuration
                  </Button>
                </div>
                
                <div>
                  <h4 style={{ 
                    marginBottom: '1.5rem',
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: isDarkMode ? '#f9fafb' : '#111827',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                  }}>
                    Existing Configurations
                  </h4>
                  {configs.map((config) => (
                    <div key={config.id} style={{ 
                      padding: '1.5rem', 
                      margin: '0', 
                      marginBottom: '1rem',
                      border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                      borderRadius: '0.75rem',
                      background: isDarkMode ? '#1f2937' : 'white',
                      boxShadow: isDarkMode 
                        ? '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)'
                        : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <strong style={{ 
                              fontSize: '1.125rem', 
                              fontWeight: 600,
                              color: isDarkMode ? '#f9fafb' : '#111827',
                              fontFamily: 'inherit'
                            }}>
                              {config.serverUrl}
                            </strong>
                            <span style={{ 
                              padding: '0.25rem 0.75rem', 
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              background: config.isActive ? '#10b981' : '#ef4444',
                              color: 'white',
                              fontFamily: 'inherit',
                              letterSpacing: '0.025em'
                            }}>
                              {config.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'auto auto', 
                            gap: '0.75rem 1.5rem', 
                            fontSize: '0.875rem',
                            lineHeight: '1.5',
                            color: isDarkMode ? '#d1d5db' : '#6b7280',
                            fontFamily: 'inherit'
                          }}>
                            <span style={{ color: isDarkMode ? '#f9fafb' : '#111827', fontWeight: 500 }}>Base DN:</span>
                            <span>{config.baseDN}</span>
                            <span style={{ color: isDarkMode ? '#f9fafb' : '#111827', fontWeight: 500 }}>Port:</span>
                            <span>{config.port}</span>
                            <span style={{ color: isDarkMode ? '#f9fafb' : '#111827', fontWeight: 500 }}>Bind DN:</span>
                            <span>{config.bindDN}</span>
                            <span style={{ color: isDarkMode ? '#f9fafb' : '#111827', fontWeight: 500 }}>Secure:</span>
                            <span>{config.isSecure ? 'Yes' : 'No'}</span>
                            <span style={{ 
                              color: isDarkMode ? '#f9fafb' : '#111827', 
                              fontWeight: 500,
                              gridColumn: '1 / -1',
                              marginTop: '0.5rem'
                            }}>Search Filter:</span>
                            <span style={{ 
                              gridColumn: '1 / -1',
                              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                              fontSize: '0.8125rem',
                              background: isDarkMode ? '#374151' : '#f9fafb',
                              padding: '0.5rem 0.75rem',
                              borderRadius: '0.5rem',
                              border: isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
                              color: isDarkMode ? '#e5e7eb' : '#374151',
                              marginTop: '0.25rem'
                            }}>
                              {config.searchFilter}
                            </span>
                            <span style={{ 
                              color: isDarkMode ? '#f9fafb' : '#111827', 
                              fontWeight: 500,
                              gridColumn: '1 / -1',
                              marginTop: '0.5rem'
                            }}>Search Attribute:</span>
                            <span style={{ 
                              gridColumn: '1 / -1',
                              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                              fontSize: '0.8125rem',
                              background: isDarkMode ? '#374151' : '#f9fafb',
                              padding: '0.5rem 0.75rem',
                              borderRadius: '0.5rem',
                              border: isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
                              color: isDarkMode ? '#e5e7eb' : '#374151',
                              marginTop: '0.25rem'
                            }}>
                              {config.searchAttribute}
                            </span>
                          </div>
                        </div>
                        
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '0.5rem', 
                          marginLeft: '1.5rem',
                          flexShrink: 0
                        }}>
                          <button
                            onClick={() => handleEditConfig(config)}
                            style={{
                              padding: '0.625rem 1rem',
                              fontSize: '0.875rem',
                              fontWeight: 500,
                              border: '1px solid #f97316',
                              borderRadius: '0.5rem',
                              background: 'white',
                              color: '#f97316',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              transition: 'all 0.15s ease',
                              fontFamily: 'inherit',
                              whiteSpace: 'nowrap'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#f97316';
                              e.currentTarget.style.color = 'white';
                              e.currentTarget.style.borderColor = '#ea580c';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'white';
                              e.currentTarget.style.color = '#f97316';
                              e.currentTarget.style.borderColor = '#f97316';
                            }}
                            title="Edit configuration"
                          >
                            ✏️ Edit
                          </button>
                          
                          <button
                            onClick={() => handleRemoveConfig(config)}
                            style={{
                              padding: '0.625rem 1rem',
                              fontSize: '0.875rem',
                              fontWeight: 500,
                              border: '1px solid #ef4444',
                              borderRadius: '0.5rem',
                              background: 'white',
                              color: '#ef4444',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              transition: 'all 0.15s ease',
                              fontFamily: 'inherit',
                              whiteSpace: 'nowrap'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#ef4444';
                              e.currentTarget.style.color = 'white';
                              e.currentTarget.style.borderColor = '#dc2626';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'white';
                              e.currentTarget.style.color = '#ef4444';
                              e.currentTarget.style.borderColor = '#ef4444';
                            }}
                            title="Delete configuration"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        }
        
        // Empty state when no configurations exist
        return (
          <div className={styles.tabContent} style={{ 
            background: isDarkMode ? '#111827' : '#f9fafb', 
            padding: '2rem',
            minHeight: '100%'
          }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ 
                  margin: 0, 
                  marginBottom: '1rem', 
                  fontSize: '1.875rem',
                  fontWeight: 700,
                  color: isDarkMode ? '#f9fafb' : '#111827',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                }}>
                  LDAP Configuration
                </h3>
                <p style={{ 
                  margin: 0, 
                  color: isDarkMode ? '#d1d5db' : '#6b7280',
                  fontSize: '1rem',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  lineHeight: '1.5',
                  maxWidth: '500px',
                  marginLeft: 'auto',
                  marginRight: 'auto'
                }}>
                  No LDAP configurations found. Create your first LDAP server connection to enable directory integration.
                </p>
              </div>
              
              <Button 
                onClick={() => setShowConfigForm(true)}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: 500,
                  borderRadius: '0.5rem',
                  background: '#f97316',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                }}
              >
                + Create LDAP Configuration
              </Button>
            </div>
          </div>
        );
      case 'test':
        if (showPasswordPrompt && selectedConfig) {
          return (
            <div className={styles.tabContent}>
              <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto' }}>
                <h3>LDAP Authentication Required</h3>
                <p>Enter the LDAP bind password to browse the directory:</p>
                <div style={{ margin: '1rem 0' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Bind Password:
                  </label>
                  <input
                    type="password"
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    placeholder="Enter LDAP bind password"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color, #ccc)',
                      borderRadius: '4px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <Button
                    onClick={() => {
                      setShowPasswordPrompt(false);
                      setTempPassword('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (tempPassword.trim()) {
                        setShowPasswordPrompt(false);
                        setShowTreeBrowser(true);
                      }
                    }}
                    disabled={!tempPassword.trim()}
                  >
                    Connect
                  </Button>
                </div>
              </div>
            </div>
          );
        }
        
        if (showTreeBrowser && selectedConfig) {
          return (
            <div className={styles.tabContent}>
              <LdapTreeBrowser
                onClose={() => {
                  setShowTreeBrowser(false);
                  setTempPassword('');
                  loadConfigs(); // Reload configs when closing
                }}
                onSelect={(dn: string) => {
                  console.log('Selected DN:', dn);
                }}
                currentBaseDn={selectedConfig.baseDN}
                serverConfig={{
                  serverurl: selectedConfig.serverUrl,
                  basedn: selectedConfig.baseDN,
                  binddn: selectedConfig.bindDN,
                  bindpassword: tempPassword,
                  issecure: selectedConfig.isSecure,
                  port: selectedConfig.port
                }}
              />
            </div>
          );
        }
        
        return (
          <div className={styles.tabContent}>
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <h3>LDAP Connection Test</h3>
              <p>Test LDAP connection and browse directory structure.</p>
              {selectedConfig ? (
                <Button 
                  onClick={() => setShowPasswordPrompt(true)}
                  style={{ margin: '1rem' }}
                >
                  Browse Directory
                </Button>
              ) : (
                <p style={{ color: 'var(--error, #dc2626)', margin: '1rem' }}>
                  Please configure an LDAP connection first in the Configuration tab.
                </p>
              )}
            </div>
          </div>
        );
      case 'users':
        return (
          <div className={styles.tabContent}>
            <LdapUserManagerInline configId={selectedConfig?.id || ''} />
          </div>
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {!isMinimized && <div className={styles.modalOverlay} onClick={onClose} />}
      <div 
        ref={modalRef}
        className={`${styles.modalContent} ${isMinimized ? styles.minimized : ''}`}
        style={{
          position: 'fixed',
          left: isMinimized ? 300 : position.x,
          top: isMinimized ? 'auto' : position.y,
          bottom: isMinimized ? 10 : 'auto',
          width: isMinimized ? 280 : size.width,
          height: isMinimized ? 'auto' : size.height,
          cursor: isDragging ? 'grabbing' : 'default',
        }}
      >
        <div 
          className={`${styles.modalHeader} ${isDarkMode ? styles.darkHeader : styles.lightHeader}`}
          style={{ cursor: isMinimized ? 'pointer' : 'grab' }}
          onMouseDown={isMinimized ? undefined : handleMouseDown}
          onClick={isMinimized ? handleMinimize : undefined}
        >
          <div className={styles.dragHandle}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="4" cy="4" r="1.5" fill="currentColor" opacity="0.5"/>
              <circle cx="8" cy="4" r="1.5" fill="currentColor" opacity="0.5"/>
              <circle cx="12" cy="4" r="1.5" fill="currentColor" opacity="0.5"/>
              <circle cx="4" cy="8" r="1.5" fill="currentColor" opacity="0.5"/>
              <circle cx="8" cy="8" r="1.5" fill="currentColor" opacity="0.5"/>
              <circle cx="12" cy="8" r="1.5" fill="currentColor" opacity="0.5"/>
              <circle cx="4" cy="12" r="1.5" fill="currentColor" opacity="0.5"/>
              <circle cx="8" cy="12" r="1.5" fill="currentColor" opacity="0.5"/>
              <circle cx="12" cy="12" r="1.5" fill="currentColor" opacity="0.5"/>
            </svg>
          </div>
          <h2 className={styles.modalTitle}>LDAP Management</h2>
          <div className={styles.windowControls}>
            <button
              className={styles.minimizeButton}
              onClick={handleMinimize}
              onMouseDown={(e) => e.stopPropagation()}
              aria-label={isMinimized ? "Restore window" : "Minimize window"}
              title={isMinimized ? "Restore" : "Minimize"}
            >
              {isMinimized ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="4" width="8" height="6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  <path d="M4 4V2H12V8H10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 10H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              )}
            </button>
            <button
              className={styles.closeButton}
              onClick={onClose}
              onMouseDown={(e) => e.stopPropagation()}
              aria-label="Close LDAP dialog"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs Navigation - hidden when minimized */}
        {!isMinimized && (
          <>
            <div className={styles.tabsContainer}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`${styles.tabButton} ${activeTab === tab.id ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className={styles.tabIcon}>{tab.icon}</span>
                  <span className={styles.tabLabel}>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className={styles.modalBody}>
              {renderTabContent()}
            </div>

            <div className={styles.modalFooter}>
              <div className={styles.footerInfo}>
                <span>Press <kbd>Esc</kbd> to close</span>
                <span>•</span>
                <span>Drag to move • Resize from edges</span>
              </div>
            </div>

            {/* Resize handles */}
            <div className={styles.resizeHandleN} onMouseDown={(e) => handleResizeStart(e, 'n')} />
            <div className={styles.resizeHandleS} onMouseDown={(e) => handleResizeStart(e, 's')} />
            <div className={styles.resizeHandleE} onMouseDown={(e) => handleResizeStart(e, 'e')} />
            <div className={styles.resizeHandleW} onMouseDown={(e) => handleResizeStart(e, 'w')} />
            <div className={styles.resizeHandleNE} onMouseDown={(e) => handleResizeStart(e, 'ne')} />
            <div className={styles.resizeHandleNW} onMouseDown={(e) => handleResizeStart(e, 'nw')} />
            <div className={styles.resizeHandleSE} onMouseDown={(e) => handleResizeStart(e, 'se')} />
            <div className={styles.resizeHandleSW} onMouseDown={(e) => handleResizeStart(e, 'sw')} />
          </>
        )}
      </div>
    </>
  );
};
