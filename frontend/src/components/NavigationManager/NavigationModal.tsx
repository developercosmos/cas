import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavigationApiService, NavigationModule } from '@/services/NavigationService';
import styles from './styles.module.css';

interface NavigationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NavigationModal: React.FC<NavigationModalProps> = ({ isOpen, onClose }) => {
  const [modules, setModules] = useState<NavigationModule[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredModules, setFilteredModules] = useState<NavigationModule[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'plugin' | 'sortOrder'>('sortOrder');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isDraggable, setIsDraggable] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      const isDark = theme === 'dark';
      console.log('NavigationModal - Theme detected:', theme, 'isDarkMode:', isDark);
      setIsDarkMode(isDark);
    };

    checkDarkMode();
    
    // Listen for theme changes
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
      // Focus search input
      setTimeout(() => searchInputRef.current?.focus(), 100);
      // Center modal initially
      setPosition({ x: 0, y: 0 });
      setIsDraggable(true);
    } else {
      setIsDraggable(false);
    }
  }, [isOpen]);

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

  // Load all accessible modules
  const loadModules = useCallback(async () => {
    setLoading(true);
    try {
      const response = await NavigationApiService.getModules();
      if (response.success) {
        setModules(response.data);
        setFilteredModules(response.data);
      }
    } catch (error) {
      console.error('Error loading navigation modules:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle search and sort together to avoid infinite loop
  useEffect(() => {
    let result: NavigationModule[];
    
    // Filter first
    if (searchQuery.trim() === '') {
      result = [...modules];
    } else {
      result = modules.filter(module =>
        module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        module.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        module.pluginId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Then sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'plugin':
          return a.pluginId.localeCompare(b.pluginId);
        case 'sortOrder':
        default:
          return a.sortOrder - b.sortOrder;
      }
    });
    
    setFilteredModules(result);
  }, [searchQuery, modules, sortBy]);

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
    if (module.route) {
      window.location.href = module.route;
    } else if (module.externalUrl) {
      window.open(module.externalUrl, '_blank');
    }
    onClose();
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    // If query has length, perform server-side search
    if (query.trim().length >= 2) {
      try {
        const response = await NavigationApiService.searchModules(query);
        if (response.success) {
          setFilteredModules(response.data);
        }
      } catch (error) {
        console.error('Error searching modules:', error);
      }
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
          cursor: isDragging ? 'grabbing' : 'default'
        }}
      >
        <div 
          className={`${styles.modalHeader} ${isDarkMode ? styles.darkHeader : styles.lightHeader} ${isDraggable ? styles.draggableHeader : ''}`}
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
          <h2 className={styles.modalTitle}>Navigation</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            onMouseDown={(e) => e.stopPropagation()}
            aria-label="Close navigation"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

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
            <span>Press <kbd>Ctrl+K</kbd> to open</span>
          </div>
        </div>
      </div>
    </>
  );
};
