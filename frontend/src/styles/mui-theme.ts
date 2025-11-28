// MUI Base UI theme configuration
// Note: Base UI provides unstyled components, so we create our own theme structure

// Interface for our custom design system
interface DesignTokens {
  colors: {
    bg: {
      primary: string;
      secondary: string;
      tertiary: string;
      elevated: string;
    };
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
      muted: string;
    };
    border: {
      default: string;
      subtle: string;
    };
    accent: {
      primary: string;
      hover: string;
      muted: string;
    };
  };
  spacing: Record<string, string>;
  typography: {
    fontFamily: {
      sans: string;
      mono: string;
    };
    fontSize: Record<string, string>;
    fontWeight: Record<string, number>;
    lineHeight: Record<string, number>;
  };
  shadows: Record<string, string>;
  borderRadius: Record<string, string>;
  transitions: Record<string, string>;
}

// Helper function to get CSS variable value
const getCSSVar = (varName: string): string => {
  if (typeof window !== 'undefined') {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  }
  return '';
};

// Factory.ai Design System mapping
export const createDesignTokens = (): DesignTokens => {
  // For server-side rendering, provide default dark theme values
  const isClient = typeof window !== 'undefined';

  return {
    colors: {
      bg: {
        primary: isClient ? getCSSVar('--bg-primary') : '#000000',
        secondary: isClient ? getCSSVar('--bg-secondary') : '#0a0a0a',
        tertiary: isClient ? getCSSVar('--bg-tertiary') : '#141414',
        elevated: isClient ? getCSSVar('--bg-elevated') : '#1a1a1a',
      },
      text: {
        primary: isClient ? getCSSVar('--text-primary') : '#ffffff',
        secondary: isClient ? getCSSVar('--text-secondary') : '#d1d1d1',
        tertiary: isClient ? getCSSVar('--text-tertiary') : '#737373',
        muted: isClient ? getCSSVar('--text-muted') : '#9CA3AF',
      },
      border: {
        default: isClient ? getCSSVar('--border-color') : '#262626',
        subtle: isClient ? getCSSVar('--border-subtle') : '#1a1a1a',
      },
      accent: {
        primary: isClient ? getCSSVar('--accent-primary') : '#E67E22',
        hover: isClient ? getCSSVar('--accent-hover') : '#FF9C6E',
        muted: isClient ? getCSSVar('--accent-muted') : '#ffedd5',
      },
    },
    spacing: {
      xs: isClient ? getCSSVar('--space-1') : '4px',
      sm: isClient ? getCSSVar('--space-2') : '8px',
      md: isClient ? getCSSVar('--space-3') : '12px',
      lg: isClient ? getCSSVar('--space-4') : '16px',
      xl: isClient ? getCSSVar('--space-5') : '20px',
      '2xl': isClient ? getCSSVar('--space-6') : '24px',
      '3xl': isClient ? getCSSVar('--space-8') : '32px',
      '4xl': isClient ? getCSSVar('--space-10') : '40px',
      '5xl': isClient ? getCSSVar('--space-12') : '48px',
      '6xl': isClient ? getCSSVar('--space-16') : '64px',
      '7xl': isClient ? getCSSVar('--space-20') : '80px',
    },
    typography: {
      fontFamily: {
        sans: isClient ? getCSSVar('--font-family') : '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Helvetica Neue", sans-serif',
        mono: isClient ? getCSSVar('--font-mono') : '"Geist Mono", "SF Mono", ui-monospace, "Monaco", "Cascadia Code", "Roboto Mono", "Courier New", monospace',
      },
      fontSize: {
        xs: isClient ? getCSSVar('--font-size-xs') : '12px',
        sm: isClient ? getCSSVar('--font-size-sm') : '13px',
        base: isClient ? getCSSVar('--font-size-base') : '14px',
        md: isClient ? getCSSVar('--font-size-md') : '15px',
        lg: isClient ? getCSSVar('--font-size-lg') : '16px',
        xl: isClient ? getCSSVar('--font-size-xl') : '18px',
        '2xl': isClient ? getCSSVar('--font-size-2xl') : '24px',
        '3xl': isClient ? getCSSVar('--font-size-3xl') : '30px',
        '4xl': isClient ? getCSSVar('--font-size-4xl') : '36px',
        '5xl': isClient ? getCSSVar('--font-size-5xl') : '48px',
      },
      fontWeight: {
        normal: isClient ? Number(getCSSVar('--font-weight-normal')) : 400,
        medium: isClient ? Number(getCSSVar('--font-weight-medium')) : 500,
        semibold: isClient ? Number(getCSSVar('--font-weight-semibold')) : 600,
        bold: isClient ? Number(getCSSVar('--font-weight-bold')) : 700,
      },
      lineHeight: {
        tight: isClient ? Number(getCSSVar('--line-height-tight')) : 1.25,
        snug: isClient ? Number(getCSSVar('--line-height-snug')) : 1.375,
        normal: isClient ? Number(getCSSVar('--line-height-normal')) : 1.5,
        relaxed: isClient ? Number(getCSSVar('--line-height-relaxed')) : 1.625,
      },
    },
    shadows: {
      sm: isClient ? getCSSVar('--shadow-sm') : '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
      md: isClient ? getCSSVar('--shadow-md') : '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
      lg: isClient ? getCSSVar('--shadow-lg') : '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
      xl: isClient ? getCSSVar('--shadow-xl') : '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
    },
    borderRadius: {
      sm: isClient ? getCSSVar('--radius-sm') : '4px',
      md: isClient ? getCSSVar('--radius-md') : '6px',
      lg: isClient ? getCSSVar('--radius-lg') : '8px',
      xl: isClient ? getCSSVar('--radius-xl') : '12px',
      full: isClient ? getCSSVar('--radius-full') : '9999px',
    },
    transitions: {
      fast: isClient ? getCSSVar('--transition-fast') : '150ms cubic-bezier(0.4, 0, 0.2, 1)',
      base: isClient ? getCSSVar('--transition-base') : '200ms cubic-bezier(0.4, 0, 0.2, 1)',
      slow: isClient ? getCSSVar('--transition-slow') : '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    },
  };
};

// Create theme configuration for Base UI components (simplified)
export const muiTheme = {
  // Basic theme configuration - Base UI components are unstyled
  // so styling is handled by our styled components
};