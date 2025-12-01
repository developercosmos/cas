import React from 'react';
import styled from '@emotion/styled';
import { Checkbox as BaseCheckbox } from '@base-ui-components/react/checkbox';
import { Switch as BaseSwitch } from '@base-ui-components/react/switch';
import { RadioGroup } from '@base-ui-components/react/radio-group';
import { Menu } from '@base-ui-components/react/menu';
import { Dialog as Modal } from '@base-ui-components/react/dialog';
import { Tooltip } from '@base-ui-components/react/tooltip';
import { Tabs } from '@base-ui-components/react/tabs';
import { Slider } from '@base-ui-components/react/slider';

// Helper function to get CSS variable value
const getCSSVar = (varName: string): string => {
  if (typeof window !== 'undefined') {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  }
  return '';
};

// Factory.ai Design System tokens
const tokens = typeof window !== 'undefined' ? {
  colors: {
    bg: {
      primary: getCSSVar('--bg-primary'),
      secondary: getCSSVar('--bg-secondary'),
      tertiary: getCSSVar('--bg-tertiary'),
      elevated: getCSSVar('--bg-elevated'),
    },
    text: {
      primary: getCSSVar('--text-primary'),
      secondary: getCSSVar('--text-secondary'),
      tertiary: getCSSVar('--text-tertiary'),
      muted: getCSSVar('--text-muted'),
    },
    border: {
      default: getCSSVar('--border-color'),
      subtle: getCSSVar('--border-subtle'),
    },
    accent: {
      primary: getCSSVar('--accent-primary'),
      hover: getCSSVar('--accent-hover'),
      muted: getCSSVar('--accent-muted'),
    },
  },
  spacing: {
    xs: getCSSVar('--space-1'),
    sm: getCSSVar('--space-2'),
    md: getCSSVar('--space-3'),
    lg: getCSSVar('--space-4'),
    xl: getCSSVar('--space-5'),
    '2xl': getCSSVar('--space-6'),
    '3xl': getCSSVar('--space-8'),
    '4xl': getCSSVar('--space-10'),
    '5xl': getCSSVar('--space-12'),
    '6xl': getCSSVar('--space-16'),
    '7xl': getCSSVar('--space-20'),
  },
  borderRadius: {
    sm: getCSSVar('--radius-sm'),
    md: getCSSVar('--radius-md'),
    lg: getCSSVar('--radius-lg'),
    xl: getCSSVar('--radius-xl'),
    full: getCSSVar('--radius-full'),
  },
  transitions: {
    fast: getCSSVar('--transition-fast'),
    base: getCSSVar('--transition-base'),
    slow: getCSSVar('--transition-slow'),
  },
  shadows: {
    sm: getCSSVar('--shadow-sm'),
    md: getCSSVar('--shadow-md'),
    lg: getCSSVar('--shadow-lg'),
    xl: getCSSVar('--shadow-xl'),
  },
  fontFamily: {
    sans: getCSSVar('--font-family'),
    mono: getCSSVar('--font-mono'),
  },
  fontWeight: {
    normal: getCSSVar('--font-weight-normal'),
    medium: getCSSVar('--font-weight-medium'),
    semibold: getCSSVar('--font-weight-semibold'),
    bold: getCSSVar('--font-weight-bold'),
  },
  fontSize: {
    xs: getCSSVar('--font-size-xs'),
    sm: getCSSVar('--font-size-sm'),
    base: getCSSVar('--font-size-base'),
    md: getCSSVar('--font-size-md'),
    lg: getCSSVar('--font-size-lg'),
    xl: getCSSVar('--font-size-xl'),
    '2xl': getCSSVar('--font-size-2xl'),
    '3xl': getCSSVar('--font-size-3xl'),
    '4xl': getCSSVar('--font-size-4xl'),
    '5xl': getCSSVar('--font-size-5xl'),
  },
} : {
  // Fallback values for SSR
  colors: {
    bg: { primary: '#000000', secondary: '#0a0a0a', tertiary: '#141414', elevated: '#1a1a1a' },
    text: { primary: '#ffffff', secondary: '#d1d1d1', tertiary: '#737373', muted: '#9CA3AF' },
    border: { default: '#262626', subtle: '#1a1a1a' },
    accent: { primary: '#E67E22', hover: '#FF9C6E', muted: 'rgba(230, 126, 34, 0.1)' },
  },
  spacing: { xs: '4px', sm: '8px', md: '12px', lg: '16px', xl: '20px', '2xl': '24px', '3xl': '32px', '4xl': '40px', '5xl': '48px', '6xl': '64px', '7xl': '80px' },
  borderRadius: { sm: '4px', md: '6px', lg: '8px', xl: '12px', full: '9999px' },
  transitions: { fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)', base: '200ms cubic-bezier(0.4, 0, 0.2, 1)', slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)' },
  shadows: { sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)', md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)', lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)', xl: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)' },
  fontFamily: { sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Helvetica Neue", sans-serif', mono: '"Geist Mono", "SF Mono", ui-monospace, "Monaco", "Cascadia Code", "Roboto Mono", "Courier New", monospace' },
  fontWeight: { normal: '400', medium: '500', semibold: '600', bold: '700' },
  fontSize: { xs: '12px', sm: '13px', base: '14px', md: '15px', lg: '16px', xl: '18px', '2xl': '24px', '3xl': '30px', '4xl': '36px', '5xl': '48px' },
};

// Styled Button Component with Factory.ai Enterprise Design
export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// Internal styled props with $ prefix to prevent DOM forwarding
interface StyledButtonProps {
  $variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gradient';
  $size?: 'sm' | 'md' | 'lg';
  $fullWidth?: boolean;
  $loading?: boolean;
  $hasLeftIcon?: boolean;
  $hasRightIcon?: boolean;
}

const StyledButton = styled.button<StyledButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${tokens.spacing.sm};
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Helvetica Neue", sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 1.25;
  letter-spacing: -0.01em;
  border-radius: ${tokens.borderRadius.lg};
  border: 1px solid transparent;
  cursor: pointer;
  transition: all ${tokens.transitions.base};
  text-decoration: none;
  outline: none;
  position: relative;
  white-space: nowrap;
  user-select: none;
  width: ${props => props.$fullWidth ? '100%' : 'auto'};
  overflow: hidden;
  isolation: isolate;

  /* Ripple effect container */
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
    pointer-events: none;
  }

  &:active::before {
    width: 300px;
    height: 300px;
  }

  /* Loading spinner */
  &::after {
    content: '';
    position: absolute;
    width: 16px;
    height: 16px;
    border: 2px solid transparent;
    border-top-color: currentColor;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
    opacity: ${props => props.$loading ? 1 : 0};
    pointer-events: none;
    transition: opacity ${tokens.transitions.fast};
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Disabled state */
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
  }

  /* Focus ring */
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px ${tokens.colors.bg.primary}, 0 0 0 4px ${tokens.colors.accent.primary};
  }

  /* Factory.ai Primary Button - WCAG AA Compliant */
  ${props => props.$variant === 'primary' && `
    background: linear-gradient(135deg, #B45309 0%, #9A3412 100%);
    color: white;
    border-color: transparent;
    box-shadow: 0 2px 8px rgba(180, 83, 9, 0.3);
    font-weight: 600;

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #92400E 0%, #7C2D12 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(180, 83, 9, 0.4);
    }

    &:active:not(:disabled) {
      transform: translateY(0) scale(0.98);
      box-shadow: 0 2px 6px rgba(180, 83, 9, 0.3);
    }

    /* Dark mode: Factory.ai style - glass morphism with white border */
    [data-theme='dark'] & {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
      font-weight: 500;
      letter-spacing: -0.01em;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    }

    [data-theme='dark'] &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.3);
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
    }

    [data-theme='dark'] &:active:not(:disabled) {
      transform: translateY(0) scale(0.98);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }
  `}

  /* Factory.ai Secondary Button - WCAG AA Compliant */
  ${props => props.$variant === 'secondary' && `
    background: #f9fafb;
    color: #111827;
    border-color: #d1d5db;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    font-weight: 500;

    &:hover:not(:disabled) {
      background: #f3f4f6;
      border-color: #9ca3af;
      transform: translateY(-1px);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    }

    &:active:not(:disabled) {
      transform: translateY(0) scale(0.98);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    /* Dark mode: Factory.ai style - subtle glass with border */
    [data-theme='dark'] & {
      background: rgba(255, 255, 255, 0.05);
      color: rgba(255, 255, 255, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.15);
      font-weight: 500;
      letter-spacing: -0.01em;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    }

    [data-theme='dark'] &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.3);
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    }

    [data-theme='dark'] &:active:not(:disabled) {
      transform: translateY(0) scale(0.98);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }
  `}

  /* Factory.ai Ghost Button - WCAG AA Compliant */
  ${props => props.$variant === 'ghost' && `
    background: transparent;
    color: #374151;
    border-color: transparent;
    font-weight: 500;

    &:hover:not(:disabled) {
      background: #f3f4f6;
      color: #111827;
      transform: translateY(-1px);
    }

    &:active:not(:disabled) {
      transform: translateY(0) scale(0.98);
    }

    /* Dark mode: Factory.ai style - minimal glass on hover */
    [data-theme='dark'] & {
      background: transparent;
      color: rgba(255, 255, 255, 0.85);
      border-color: transparent;
      font-weight: 500;
      letter-spacing: -0.01em;
    }

    [data-theme='dark'] &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.08);
      color: white;
      border-color: transparent;
      transform: translateY(-1px);
    }

    [data-theme='dark'] &:active:not(:disabled) {
      transform: translateY(0) scale(0.98);
      background: rgba(255, 255, 255, 0.05);
    }
  `}

  /* Factory.ai Danger Button */
  ${props => props.$variant === 'danger' && `
    background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%);
    color: white;
    border-color: transparent;
    box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
    font-weight: 600;

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #B91C1C 0%, #DC2626 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
    }

    &:active:not(:disabled) {
      transform: translateY(0) scale(0.98);
      box-shadow: 0 2px 6px rgba(220, 38, 38, 0.3);
    }

    /* Dark mode: keep danger red but slightly darker */
    [data-theme='dark'] & {
      background: linear-gradient(135deg, #B91C1C 0%, #DC2626 100%);
      color: white;
      border-color: transparent;
      box-shadow: 0 2px 8px rgba(185, 28, 28, 0.4);
    }

    [data-theme='dark'] &:hover:not(:disabled) {
      background: linear-gradient(135deg, #991B1B 0%, #B91C1C 100%);
      box-shadow: 0 4px 12px rgba(185, 28, 28, 0.5);
    }

    [data-theme='dark'] &:active:not(:disabled) {
      transform: translateY(0) scale(0.98);
      box-shadow: 0 2px 6px rgba(185, 28, 28, 0.4);
    }
  `}

  /* Factory.ai Gradient Button */
  ${props => props.$variant === 'gradient' && `
    background: linear-gradient(135deg, ${tokens.colors.accent.primary} 0%, #8B5CF6 50%, #3B82F6 100%);
    color: white;
    border-color: transparent;
    box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
    font-weight: 600;
    position: relative;

    &::before {
      background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%);
    }

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, ${tokens.colors.accent.hover} 0%, #7C3AED 50%, #2563EB 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
    }

    &:active:not(:disabled) {
      transform: translateY(0) scale(0.98);
      box-shadow: 0 2px 6px rgba(139, 92, 246, 0.3);
    }

    /* Dark mode: Factory.ai style - glass morphism */
    [data-theme='dark'] & {
      background: rgba(255, 255, 255, 0.12);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
      font-weight: 500;
      letter-spacing: -0.01em;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    }

    [data-theme='dark'] &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.18);
      border-color: rgba(255, 255, 255, 0.3);
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.35);
    }

    [data-theme='dark'] &:active:not(:disabled) {
      transform: translateY(0) scale(0.98);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
    }
  `}

  /* Size variations */
  ${props => props.$size === 'sm' && `
    padding: 6px 12px;
    font-size: 13px;
    min-height: 32px;
    border-radius: ${tokens.borderRadius.md};
    gap: ${tokens.spacing.xs};
  `}

  ${props => props.$size === 'lg' && `
    padding: 12px 24px;
    font-size: 16px;
    min-height: 48px;
    border-radius: ${tokens.borderRadius.xl};
    gap: ${tokens.spacing.md};
  `}

  ${props => !props.$size && `
    padding: 8px 16px;
    font-size: 14px;
    min-height: 40px;
    gap: ${tokens.spacing.sm};
  `}

  /* Loading state */
  ${props => props.$loading && `
    color: transparent;
    pointer-events: none;
    
    &::after {
      opacity: 1;
    }
  `}

  /* Icon spacing adjustments */
  ${props => props.$hasLeftIcon && `
    padding-left: ${props.$size === 'sm' ? '8px' : props.$size === 'lg' ? '20px' : '12px'};
  `}

  ${props => props.$hasRightIcon && `
    padding-right: ${props.$size === 'sm' ? '8px' : props.$size === 'lg' ? '20px' : '12px'};
  `}
`;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'md', 
    loading = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    fullWidth,
    ...props 
  }, ref) => {
    return (
      <StyledButton
        ref={ref}
        $variant={variant}
        $size={size}
        $loading={loading}
        $hasLeftIcon={!!leftIcon}
        $hasRightIcon={!!rightIcon}
        $fullWidth={fullWidth}
        disabled={disabled || loading}
        {...props}
      >
        {leftIcon && <span style={{ display: 'flex', alignItems: 'center' }}>{leftIcon}</span>}
        {children}
        {rightIcon && <span style={{ display: 'flex', alignItems: 'center' }}>{rightIcon}</span>}
      </StyledButton>
    );
  }
);

Button.displayName = 'Button';

// Styled Input Component
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  fullWidth?: boolean;
}

const StyledInput = styled.input<InputProps>`
  display: flex;
  align-items: center;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Helvetica Neue", sans-serif;
  font-size: ${tokens.fontSize.base};
  font-weight: 500;
  letter-spacing: -0.01em;
  line-height: 1.5;
  border-radius: ${tokens.borderRadius.lg};
  border: 1px solid ${tokens.colors.border.default};
  background-color: ${tokens.colors.bg.tertiary};
  color: ${tokens.colors.text.primary};
  transition: all ${tokens.transitions.base};
  min-height: 40px;
  padding: 0 ${tokens.spacing.md};
  width: ${props => props.fullWidth ? '100%' : 'auto'};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  &:hover:not(:disabled) {
    border-color: ${tokens.colors.accent.primary};
    background-color: ${tokens.colors.bg.secondary};
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }

  &:focus {
    border-color: ${tokens.colors.accent.primary};
    background-color: ${tokens.colors.bg.secondary};
    box-shadow: 0 0 0 3px rgba(230, 126, 34, 0.1), 0 2px 6px rgba(0, 0, 0, 0.15);
    outline: none;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  &::placeholder {
    color: ${tokens.colors.text.muted};
    font-weight: 400;
  }
`;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ fullWidth = false, ...props }, ref) => (
    <StyledInput ref={ref} fullWidth={fullWidth} {...props} />
  )
);

Input.displayName = 'Input';

// Custom Textarea Component
export interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  fullWidth?: boolean;
}

const StyledTextarea = styled.textarea<TextareaProps>`
  display: flex;
  align-items: flex-start;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Helvetica Neue", sans-serif;
  font-size: ${tokens.fontSize.base};
  font-weight: 500;
  letter-spacing: -0.01em;
  line-height: 1.5;
  border-radius: ${tokens.borderRadius.lg};
  border: 1px solid ${tokens.colors.border.default};
  background-color: ${tokens.colors.bg.tertiary};
  color: ${tokens.colors.text.primary};
  transition: all ${tokens.transitions.base};
  padding: ${tokens.spacing.md};
  resize: vertical;
  min-height: 100px;
  width: ${props => props.fullWidth ? '100%' : 'auto'};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  &:hover:not(:disabled) {
    border-color: ${tokens.colors.accent.primary};
    background-color: ${tokens.colors.bg.secondary};
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }

  &:focus {
    border-color: ${tokens.colors.accent.primary};
    background-color: ${tokens.colors.bg.secondary};
    box-shadow: 0 0 0 3px rgba(230, 126, 34, 0.1), 0 2px 6px rgba(0, 0, 0, 0.15);
    outline: none;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  &::placeholder {
    color: ${tokens.colors.text.muted};
    font-weight: 400;
  }
`;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ fullWidth = false, rows = 4, ...props }, ref) => (
    <StyledTextarea ref={ref} fullWidth={fullWidth} rows={rows} {...props} />
  )
);

Textarea.displayName = 'Textarea';

// Styled Checkbox Component
interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  label?: string;
  children?: React.ReactNode;
}

const CheckboxRoot = styled(BaseCheckbox.Root)`
  display: inline-flex;
  align-items: center;
  gap: ${tokens.spacing.sm};
  font-family: ${tokens.fontFamily.sans};
  font-size: ${tokens.fontSize.base};
  color: ${tokens.colors.text.primary};
  cursor: pointer;
  user-select: none;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CheckboxIndicator = styled(BaseCheckbox.Indicator)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: ${tokens.borderRadius.sm};
  border: 2px solid ${tokens.colors.border.default};
  background-color: ${tokens.colors.bg.tertiary};
  transition: all ${tokens.transitions.fast};

  ${CheckboxRoot}:hover &:not([data-state='checked']) {
    border-color: ${tokens.colors.accent.primary};
  }

  ${CheckboxRoot}:disabled & {
    opacity: 0.5;
  }

  &[data-state='checked'] {
    background-color: ${tokens.colors.accent.primary};
    border-color: ${tokens.colors.accent.primary};
  }

  &[data-state='checked']::after {
    content: '✓';
    color: white;
    font-size: 12px;
    font-weight: bold;
  }
`;

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onCheckedChange,
  disabled = false,
  id,
  label,
  children
}) => {
  return (
    <CheckboxRoot
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      id={id}
    >
      <CheckboxIndicator />
      {label || children}
    </CheckboxRoot>
  );
};

// Styled Switch Component
interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SwitchRoot = styled(BaseSwitch.Root)<{ $size?: string }>`
  display: inline-flex;
  align-items: center;
  gap: ${tokens.spacing.sm};
  font-family: ${tokens.fontFamily.sans};
  font-size: ${tokens.fontSize.base};
  color: ${tokens.colors.text.primary};
  cursor: pointer;
  user-select: none;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  ${props => props.$size === 'sm' && `
    gap: ${tokens.spacing.xs};
  `}

  ${props => props.$size === 'lg' && `
    gap: ${tokens.spacing.md};
  `}
`;

const SwitchThumb = styled(BaseSwitch.Thumb)<{ $size?: string }>`
  width: ${props => props.$size === 'sm' ? '12px' : props.$size === 'lg' ? '20px' : '16px'};
  height: ${props => props.$size === 'sm' ? '12px' : props.$size === 'lg' ? '20px' : '16px'};
  background-color: white;
  border-radius: ${tokens.borderRadius.full};
  transition: all ${tokens.transitions.fast};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
`;

const SwitchTrack = styled.span<{ $size?: string }>`
  width: ${props => props.$size === 'sm' ? '28px' : props.$size === 'lg' ? '44px' : '36px'};
  height: ${props => props.$size === 'sm' ? '16px' : props.$size === 'lg' ? '24px' : '20px'};
  border-radius: ${tokens.borderRadius.full};
  background-color: ${tokens.colors.border.default};
  transition: all ${tokens.transitions.fast};
  position: relative;

  &[data-checked='true'] {
    background-color: ${tokens.colors.accent.primary};
  }

  &:hover {
    background-color: ${tokens.colors.border.subtle};
  }

  &:hover[data-checked='true'] {
    background-color: ${tokens.colors.accent.hover};
  }
`;

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onCheckedChange,
  disabled = false,
  id,
  label,
  size = 'md'
}) => {
  return (
    <SwitchRoot
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      id={id}
      $size={size}
    >
      <SwitchTrack $size={size} data-checked={checked ? 'true' : 'false'}>
        <SwitchThumb $size={size} />
      </SwitchTrack>
      {label}
    </SwitchRoot>
  );
};

// Simple Custom Select Component
interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  fullWidth?: boolean;
}

export const CustomSelect: React.FC<SelectProps> = ({
  options,
  value,
  onValueChange,
  placeholder = 'Select an option',
  disabled = false,
  fullWidth = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onValueChange?.(e.target.value);
  };

  return (
    <select
      value={value || ''}
      onChange={handleChange}
      disabled={disabled}
      style={{
        width: fullWidth ? '100%' : 'auto',
        minHeight: '36px',
        padding: '0 12px',
        borderRadius: '6px',
        border: '1px solid var(--border-color, #262626)',
        backgroundColor: 'var(--bg-tertiary, #141414)',
        color: 'var(--text-primary, #ffffff)',
        fontSize: '14px',
        fontFamily: 'var(--font-family, system-ui)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {placeholder && !value && (
        <option value="" disabled>{placeholder}</option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

// Export other Base UI components (can be extended with custom styling later)
export {
  BaseCheckbox,
  BaseSwitch,
  Menu,
  Modal,
  Tooltip,
  Tabs,
  Slider,
  RadioGroup,
};

// Re-export design tokens for use in other components
export { tokens as designTokens };