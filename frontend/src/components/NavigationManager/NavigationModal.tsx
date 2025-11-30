import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavigationApiService, NavigationModule } from '@/services/NavigationService';
import styles from './styles.module.css';

interface NavigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLdapDialog?: (tab: 'config' | 'test' | 'users') => void;
}

interface WindowState {
  width: number;
  height: number;
  x: number;
  y: number;
}

const STORAGE_KEY = 'nav_modal_window_state';
const DEFAULT_SIZE = { width: 800, height: 500 };
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

export const NavigationModal: React.FC<NavigationModalProps> = ({ isOpen, onClose, onOpenLdapDialog }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredModules, setFilteredModules] = useState<NavigationModule[]>([]);
  const [originalModules, setOriginalModules] = useState<NavigationModule[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'plugin' | 'sortOrder'>('sortOrder');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState(DEFAULT_SIZE);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState('');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [preMinimizeState, setPreMinimizeState] = useState<{ position: { x: number; y: number }; size: { width: number; height: number } } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
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

  // Load modules when modal opens
  useEffect(() => {
    if (isOpen) {
      loadModules();
      setIsMinimized(false);
      // Focus search input
      setTimeout(() => searchInputRef.current?.focus(), 100);
      
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
  }, [isOpen]);

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

  // Load modules function
  const loadModules = async () => {
    try {
      setLoading(true);
      const response = await NavigationApiService.getModules();
      if (response.success) {
        setOriginalModules(response.data);
        setFilteredModules(response.data);
      }
    } catch (error) {
      console.error('Error loading modules:', error);
      setOriginalModules([]);
      setFilteredModules([]);
    } finally {
      setLoading(false);
    }
  };

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

  const handleModuleClick = (module: NavigationModule) => {
    // Handle LDAP modules specially - open dialog without closing navigation
    if (module.pluginId === 'ldap-auth') {
      let initialTab: 'config' | 'test' | 'users' = 'config';
      
      if (module.route?.includes('/test')) {
        initialTab = 'test';
      } else if (module.route?.includes('/users')) {
        initialTab = 'users';
      }
      
      // Open LDAP dialog - navigation modal stays open, user can close it separately
      if (onOpenLdapDialog) {
        onOpenLdapDialog(initialTab);
      }
      // Close navigation modal after opening the dialog
      onClose();
      return;
    }

    // Handle other modules
    if (module.route) {
      window.location.href = module.route;
    } else if (module.externalUrl) {
      window.open(module.externalUrl, '_blank');
    }
    onClose();
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    // If query has length, perform client-side search
    if (query.trim().length >= 2) {
      // Simple client-side search
      const filtered = originalModules.filter(module =>
        module.name.toLowerCase().includes(query.toLowerCase()) ||
        module.description.toLowerCase().includes(query.toLowerCase()) ||
        module.pluginId.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredModules(filtered);
    } else {
      // Reset to original list
      setFilteredModules(originalModules);
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
          <h2 className={styles.modalTitle}>Navigation</h2>
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
              aria-label="Close navigation"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
          <div className={styles.modalBody}>
            {/* Search Bar and Sort */}
            <div className={styles.searchSortContainer}>
            <div className={styles.searchInputWrapper}>
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 20 20" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg" 
                className={styles.searchIcon}
              >
                <path d="M9 16A7 7 0 1 0 9 2A7 7 0 0 0 9 16Z" stroke={isDarkMode ? '#ffffff' : '#000000'} strokeWidth="2" strokeLinecap="round"/>
                <path d="M14 14L18 18" stroke={isDarkMode ? '#ffffff' : '#000000'} strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                className={styles.searchInput}
                placeholder="Search modules..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
              <div className={styles.sortContainer}>
                <span className={styles.sortLabel}>Sort:</span>
                <select
                  className={styles.sortSelect}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'plugin' | 'sortOrder')}
                >
                  <option value="sortOrder">Order</option>
                  <option value="name">Name</option>
                  <option value="plugin">Plugin</option>
                </select>
              </div>
            </div>

            {/* Modules List */}
            <div className={styles.modulesContainer}>
            {loading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <span>Loading modules...</span>
              </div>
            ) : filteredModules.length > 0 ? (
              <div className={styles.modulesGrid}>
                {filteredModules.map((module) => (
                  <button
                    key={module.id}
                    className={styles.moduleCard}
                    onClick={() => handleModuleClick(module)}
                  >
                    {module.icon && (
                      <div className={styles.moduleIcon}>
                        {/* Render icon or placeholder */}
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect width="24" height="24" rx="4" fill="var(--accent-primary)" />
                          <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </div>
                    )}
                    <div className={styles.moduleContent}>
                      <h3 className={styles.moduleName}>{module.name}</h3>
                      <p className={styles.moduleDescription}>{module.description}</p>
                      <span className={styles.modulePlugin}>{module.pluginId}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2"/>
                  <path d="M24 16V24M24 32H24.02" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <p>No modules found</p>
                {searchQuery && (
                  <p>Try a different search term</p>
                )}
              </div>
            )}
            </div>
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

export default NavigationModal;
