import React, { useState } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import PluginManager from '@/components/PluginManager';
import { AuthService } from '@/services/AuthService';
import { Button } from '@/components/base-ui/styled-components';
import styles from './Header.module.css';

interface HeaderProps {
  username?: string;
  logoText?: string;
  isAdmin?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  username = 'Guest User',
  logoText = 'CAS Platform',
  isAdmin = false
}) => {
  const [showPluginManager, setShowPluginManager] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    AuthService.removeToken();
    window.location.href = '/login';
  };

  return (
    <>
      <header className={styles.header}>
        <div className={styles.container}>
          <div className={styles.left}>
            <div className={styles.logo}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="8" fill="var(--accent-primary)" />
                <path
                  d="M16 8L24 14V22C24 23.1046 23.1046 24 22 24H10C8.89543 24 8 23.1046 8 22V14L16 8Z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h1 className={styles.title}>{logoText}</h1>
          </div>

          <div className={styles.right}>
            {isAdmin && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowPluginManager(true)}
                title="Plugin Manager"
                className={styles.adminButton}
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 3.5L12.5 6.5L16 5.5L15 9L18 11.5L15 14L16 17.5L12.5 16.5L10 19.5L7.5 16.5L4 17.5L5 14L2 11.5L5 9L4 5.5L7.5 6.5L10 3.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 8V13M7.5 10.5H12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span>Plugins</span>
              </Button>
            )}
            <ThemeToggle />

            {/* User Menu with Button and custom dropdown */}
            <div className={styles.userInfo}>
              <Button
                variant="ghost"
                size="sm"
                className={styles.userButton}
                onClick={() => setShowUserMenu(!showUserMenu)}
                aria-label="User menu"
                aria-expanded={showUserMenu}
              >
                <div className={styles.avatar}>
                  {username.charAt(0).toUpperCase()}
                </div>
                <span className={styles.username}>{username}</span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={styles.dropdownIcon}
                  style={{ transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Button>

              {showUserMenu && (
                <>
                  <div
                    className={styles.menuOverlay}
                    onClick={() => setShowUserMenu(false)}
                    aria-hidden="true"
                  />
                  <div className={styles.userMenu}>
                    <button
                      onClick={handleLogout}
                      className={styles.menuItem}
                      role="menuitem"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 14H3C2.44772 14 2 13.5523 2 13V3C2 2.44772 2.44772 2 3 2H6M11 11L14 8M14 8L11 5M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {showPluginManager && (
        <PluginManager onClose={() => setShowPluginManager(false)} />
      )}
    </>
  );
};