import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/base-ui/styled-components';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      onClick={toggleTheme}
      variant="ghost"
      size="sm"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M10 2.5V4.5M10 15.5V17.5M4.5 10H2.5M17.5 10H15.5M15.303 15.303L13.889 13.889M15.303 4.697L13.889 6.111M4.697 15.303L6.111 13.889M4.697 4.697L6.111 6.111M13.5 10C13.5 11.933 11.933 13.5 10 13.5C8.067 13.5 6.5 11.933 6.5 10C6.5 8.067 8.067 6.5 10 6.5C11.933 6.5 13.5 8.067 13.5 10Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M17.5 11.18C17.39 11.18 17.28 11.17 17.17 11.16C15.94 11.01 14.82 10.44 13.98 9.60001C13.14 8.76001 12.57 7.64001 12.42 6.41001C12.35 5.82001 12.39 5.24001 12.53 4.68001C12.57 4.51001 12.52 4.33001 12.4 4.20001C12.28 4.07001 12.1 4.01001 11.92 4.04001C9.23 4.57001 7.25 6.96001 7.25 9.81001C7.25 13.03 9.86 15.64 13.08 15.64C15.93 15.64 18.32 13.66 18.85 10.97C18.88 10.79 18.82 10.61 18.69 10.49C18.58 10.37 18.41 10.31 18.24 10.31L17.5 11.18Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="currentColor"
          />
        </svg>
      )}
    </Button>
  );
};
