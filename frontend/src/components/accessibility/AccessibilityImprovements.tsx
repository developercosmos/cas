import React from 'react';

/**
 * Accessibility Improvement Components and Hooks
 * This file contains components and utilities to fix accessibility issues
 * identified in the comprehensive audit.
 */

// 1. Skip Link Component
export const SkipLink: React.FC<{ href: string; children: React.ReactNode }> = ({
  href,
  children
}) => (
  <a
    href={href}
    style={{
      position: 'absolute',
      top: '-40px',
      left: '6px',
      background: 'var(--accent-primary)',
      color: 'white',
      padding: '8px',
      textDecoration: 'none',
      borderRadius: '4px',
      zIndex: 9999,
      transition: 'top 0.3s'
    }}
    onFocus={(e) => {
      e.currentTarget.style.top = '6px';
    }}
    onBlur={(e) => {
      e.currentTarget.style.top = '-40px';
    }}
  >
    {children}
  </a>
);

// 2. Focus Trap Hook for Modals
export const useFocusTrap = (isOpen: boolean) => {
  React.useEffect(() => {
    if (!isOpen) return;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = document.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Trigger close callback
        document.dispatchEvent(new CustomEvent('closeModal'));
      }
    };

    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('keydown', handleEscapeKey);

    // Focus first element
    const firstFocusable = document.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement;
    firstFocusable?.focus();

    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);
};

// 3. Accessible Button Component
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  iconOnly?: boolean;
  ariaLabel?: string;
  ariaExpanded?: boolean;
  ariaHasPopup?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  iconOnly = false,
  ariaLabel,
  ariaExpanded,
  ariaHasPopup,
  ...props
}) => {
  return (
    <button
      {...props}
      aria-label={iconOnly ? ariaLabel : undefined}
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaHasPopup}
      style={{
        ...props.style,
        // Ensure minimum touch target size
        minWidth: iconOnly ? '44px' : undefined,
        minHeight: '44px',
        // Improve focus visibility
        outline: '2px solid transparent',
        outlineOffset: '2px'
      }}
    >
      {children}
    </button>
  );
};

// 4. Accessible Form Field Component
interface AccessibleFormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  help?: string;
  children: React.ReactElement;
}

export const AccessibleFormField: React.FC<AccessibleFormFieldProps> = ({
  id,
  label,
  required = false,
  error,
  help,
  children
}) => {
  const helpId = help ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(' ') || undefined;

  const enhancedChild = React.cloneElement(children, {
    id,
    'aria-required': required,
    'aria-invalid': !!error,
    'aria-describedby': describedBy,
    ...(children.props as any)
  });

  return (
    <div style={{ marginBottom: '1rem' }}>
      <label
        htmlFor={id}
        style={{
          display: 'block',
          marginBottom: '0.5rem',
          fontWeight: '500',
          color: 'var(--text-primary)'
        }}
      >
        {label}
        {required && (
          <span
            style={{
              color: 'var(--accent-primary)',
              marginLeft: '0.25rem'
            }}
            aria-label="required"
          >
            *
          </span>
        )}
      </label>

      {enhancedChild}

      {help && (
        <small
          id={helpId}
          style={{
            display: 'block',
            marginTop: '0.25rem',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)'
          }}
        >
          {help}
        </small>
      )}

      {error && (
        <div
          id={errorId}
          role="alert"
          aria-live="polite"
          style={{
            marginTop: '0.25rem',
            fontSize: '0.875rem',
            color: '#dc2626',
            fontWeight: '500'
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};

// 5. Live Region Component for Dynamic Content
interface LiveRegionProps {
  politeness?: 'polite' | 'assertive' | 'off';
  children?: React.ReactNode;
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  politeness = 'polite',
  children
}) => {
  const [announcement, setAnnouncement] = React.useState('');

  const announce = (message: string) => {
    setAnnouncement(message);
    // Clear after announcement
    setTimeout(() => setAnnouncement(''), 1000);
  };

  React.useEffect(() => {
    // Expose announce method globally for use in other components
    (window as any).announceToScreenReader = announce;
  }, []);

  return (
    <div
      aria-live={politeness}
      aria-atomic="true"
      style={{
        position: 'absolute',
        left: '-10000px',
        width: '1px',
        height: '1px',
        overflow: 'hidden'
      }}
    >
      {announcement || children}
    </div>
  );
};

// 6. Keyboard Navigation Hook
export const useKeyboardNavigation = (
  items: Array<{ id: string; element?: HTMLElement }>,
  onSelect?: (id: string) => void
) => {
  const [activeIndex, setActiveIndex] = React.useState(0);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex(prev => (prev + 1) % items.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex(prev => (prev - 1 + items.length) % items.length);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (items[activeIndex]) {
            onSelect?.(items[activeIndex].id);
          }
          break;
        case 'Escape':
          // Let parent handle escape
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [items, activeIndex, onSelect]);

  return activeIndex;
};

// 7. Reduced Motion Hook
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

// 8. Accessible Dropdown Component
interface AccessibleDropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  label: string;
}

export const AccessibleDropdown: React.FC<AccessibleDropdownProps> = ({
  trigger,
  children,
  isOpen,
  onToggle,
  label
}) => {
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  // Handle click outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onToggle();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onToggle]);

  // Focus management
  React.useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const firstFocusable = dropdownRef.current.querySelector(
        'button, [href], input, select, textarea'
      ) as HTMLElement;
      firstFocusable?.focus();
    }
  }, [isOpen]);

  const triggerElement = React.cloneElement(trigger as React.ReactElement, {
    ref: triggerRef,
    onClick: onToggle,
    'aria-haspopup': 'menu',
    'aria-expanded': isOpen,
    'aria-label': label
  });

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {triggerElement}
      {isOpen && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '0.5rem',
            minWidth: '200px',
            zIndex: 1000
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

// 9. CSS for accessibility improvements
export const accessibilityStyles = `
  /* Skip link styles */
  .skip-link:focus {
    top: 6px !important;
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    button:focus,
    input:focus,
    select:focus,
    textarea:focus {
      outline: 3px solid currentColor;
      outline-offset: 2px;
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }

  /* Focus styles */
  button:focus-visible,
  input:focus-visible,
  select:focus-visible,
  textarea:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }

  /* Screen reader only text */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* Ensure minimum touch target size */
  button, a, input, select, textarea {
    min-height: 44px;
    min-width: 44px;
  }

  /* Error states */
  input[aria-invalid="true"],
  textarea[aria-invalid="true"],
  select[aria-invalid="true"] {
    border-color: #dc2626;
    box-shadow: 0 0 0 1px #dc2626;
  }

  /* Required indicators */
  [aria-required="true"]::after {
    content: " *";
    color: var(--accent-primary);
  }
`;

export default {
  SkipLink,
  useFocusTrap,
  AccessibleButton,
  AccessibleFormField,
  LiveRegion,
  useKeyboardNavigation,
  useReducedMotion,
  AccessibleDropdown,
  accessibilityStyles
};