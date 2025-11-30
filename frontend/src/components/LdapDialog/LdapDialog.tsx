import React, { useState, useEffect, useRef } from 'react';
import LdapConfig from '@/components/LdapConfig/LdapConfig';
import LdapTreeBrowser from '@/components/LdapTreeBrowser/LdapTreeBrowser';
import LdapUserManager from '@/components/LdapUserManager/LdapUserManager';
import styles from './styles.module.css';

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

interface LdapDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'config' | 'test' | 'users';
}

type TabType = 'config' | 'test' | 'users';

export const LdapDialog: React.FC<LdapDialogProps> = ({ isOpen, onClose, initialTab = 'config' }) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isDraggable, setIsDraggable] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

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

  // Load configs when dialog opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setPosition({ x: 0, y: 0 });
      setIsDraggable(true);
    } else {
      setIsDraggable(false);
    }
  }, [isOpen, initialTab]);

  // Handle mouse down on header for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!modalRef.current || !isDraggable) return;
    
    const rect = modalRef.current.getBoundingClientRect();
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
    e.preventDefault();
  };

  // Handle mouse move for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !modalRef.current) return;
      
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // Constrain to viewport bounds
      const maxX = window.innerWidth - modalRef.current.offsetWidth;
      const maxY = window.innerHeight - modalRef.current.offsetHeight;
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

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

  const loadConfigs = async () => {
    try {
      const token = localStorage.getItem('auth_token') || 'test-token';
      
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

  const tabs = [
    { id: 'config' as TabType, label: 'Configuration', icon: '⚙️' },
    { id: 'test' as TabType, label: 'Test Connection', icon: '🔗' },
    { id: 'users' as TabType, label: 'User Management', icon: '👥' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'config':
        return (
          <div className={styles.tabContent}>
            <div className={styles.infoMessage}>
              LDAP Configuration component would be rendered here
              <br />
              <small>This tab contains the LDAP server configuration interface</small>
            </div>
          </div>
        );
      case 'test':
        return (
          <div className={styles.tabContent}>
            <div className={styles.infoMessage}>
              LDAP Connection Test component would be rendered here
              <br />
              <small>This tab contains the LDAP directory browser and connection testing tools</small>
            </div>
          </div>
        );
      case 'users':
        return (
          <div className={styles.tabContent}>
            <div className={styles.infoMessage}>
              LDAP User Management component would be rendered here
              <br />
              <small>This tab contains the LDAP user import and management interface</small>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.modalOverlay} onClick={onClose} />
      <div 
        ref={modalRef}
        className={styles.modalContent}
        style={{
          position: position.x === 0 && position.y === 0 ? 'fixed' : 'fixed',
          left: position.x === 0 && position.y === 0 ? '50%' : position.x,
          top: position.y === 0 && position.y === 0 ? '50%' : position.y,
          transform: position.x === 0 && position.y === 0 ? 'translate(-50%, -50%)' : 'none',
          cursor: isDragging ? 'grabbing' : 'default',
          width: '95%',
          maxWidth: '1200px',
          height: '85vh'
        }}
      >
        <div 
          className={`${styles.modalHeader} ${isDarkMode ? styles.darkHeader : styles.lightHeader}`}
          style={{ cursor: isDraggable ? 'grab' : 'default' }}
          onMouseDown={handleMouseDown}
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
          <button
            className={styles.closeButton}
            onClick={onClose}
            onMouseDown={(e) => e.stopPropagation()}
            aria-label="Close LDAP dialog"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Tabs Navigation */}
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
            <span>Drag header to move window</span>
          </div>
        </div>
      </div>
    </>
  );
};
