import React from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import styles from './Header.module.css';

interface HeaderProps {
  username?: string;
  logoText?: string;
}

export const Header: React.FC<HeaderProps> = ({ 
  username = 'Guest User', 
  logoText = 'Dashboard' 
}) => {
  return (
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
          <ThemeToggle />
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {username.charAt(0).toUpperCase()}
            </div>
            <span className={styles.username}>{username}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
