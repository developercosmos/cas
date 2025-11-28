# Base UI Components Migration Guide

## Overview

This document provides a comprehensive guide to the Base UI components system implemented in the Factory.ai application. The migration to Base UI provides improved accessibility, better developer experience, and consistent design patterns.

## Table of Contents

- [Quick Start](#quick-start)
- [Component Library](#component-library)
- [Migration Guide](#migration-guide)
- [Development Guidelines](#development-guidelines)
- [Performance Considerations](#performance-considerations)
- [Accessibility Features](#accessibility-features)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Installation

The Base UI components are already installed and configured. The main packages used are:

```bash
npm install @base-ui-components/react @emotion/react @emotion/styled @mui/utils
```

### Basic Usage

```tsx
import { Button, Input, Checkbox } from '@/components/base-ui/styled-components';

function ExampleComponent() {
  return (
    <div>
      <Button variant="primary" onClick={() => console.log('clicked')}>
        Click me
      </Button>

      <Input placeholder="Enter text" fullWidth />

      <Checkbox
        checked={isChecked}
        onCheckedChange={setIsChecked}
        label="Accept terms"
      />
    </div>
  );
}
```

## Component Library

### Core Components

#### Button

Accessible button with multiple variants and sizes.

```tsx
interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}
```

**Usage Examples:**
```tsx
<Button variant="primary">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="ghost" size="sm">Small Ghost</Button>
<Button variant="danger" disabled>Danger Action</Button>
```

#### Input & Textarea

Styled form inputs with full theme integration.

```tsx
interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  fullWidth?: boolean;
}

interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  fullWidth?: boolean;
  rows?: number;
}
```

**Usage Examples:**
```tsx
<Input
  type="email"
  placeholder="Email address"
  fullWidth
  onChange={handleChange}
/>

<Textarea
  placeholder="Enter message"
  rows={4}
  fullWidth
/>
```

#### Checkbox

Accessible checkbox with proper keyboard navigation.

```tsx
interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  label?: string;
  children?: React.ReactNode;
}
```

**Usage Examples:**
```tsx
<Checkbox
  checked={termsAccepted}
  onCheckedChange={setTermsAccepted}
  label="I accept the terms and conditions"
/>

<Checkbox
  checked={newsletter}
  onCheckedChange={setNewsletter}
  id="newsletter"
>
  Subscribe to newsletter updates
</Checkbox>
```

#### Switch

Toggle switch with multiple size options.

```tsx
interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}
```

**Usage Examples:**
```tsx
<Switch
  checked={darkMode}
  onCheckedChange={setDarkMode}
  label="Dark mode"
/>

<Switch
  checked={notifications}
  onCheckedChange={setNotifications}
  size="sm"
  label="Push notifications"
/>
```

#### CustomSelect

Styled select component for consistent theming.

```tsx
interface SelectProps {
  options: { value: string; label: string }[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  fullWidth?: boolean;
}
```

**Usage Examples:**
```tsx
<CustomSelect
  options={[
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' }
  ]}
  value={selectedOption}
  onValueChange={setSelectedOption}
  placeholder="Select an option"
  fullWidth
/>
```

### Layout Components

Import from `@/components/base-ui/layout`:

#### Grid

Responsive 12-column grid system.

```tsx
<Grid columns={{ xs: 1, md: 2, lg: 3 }} gap={4}>
  <GridItem xs={12} md={6}>Responsive content</GridItem>
</Grid>
```

#### Stack

Flexbox-based layout components.

```tsx
<VStack spacing={4}>
  <h2>Title</h2>
  <p>Content</p>
  <HStack justify="flex-end">
    <Button variant="ghost">Cancel</Button>
    <Button variant="primary">Submit</Button>
  </HStack>
</VStack>
```

#### Card

Content container with multiple variants.

```tsx
<Card variant="elevated" interactive>
  <CardHeader>
    <h3>Card Title</h3>
  </CardHeader>
  <CardContent>
    <p>Card content</p>
  </CardContent>
</Card>
```

## Migration Guide

### From Native HTML Elements

**Before:**
```tsx
<button className="btn-primary" onClick={handleClick}>
  Click me
</button>
```

**After:**
```tsx
<Button variant="primary" onClick={handleClick}>
  Click me
</Button>
```

### From Custom Components

**Before:**
```tsx
<div className={styles.customInput}>
  <input
    type="text"
    className={styles.inputField}
    onChange={handleChange}
  />
</div>
```

**After:**
```tsx
<Input
  type="text"
  onChange={handleChange}
  fullWidth
/>
```

### CSS Migration

Remove component-specific CSS and use the built-in variants:

**Remove:**
```css
.btn-primary {
  background-color: var(--accent-primary);
  color: white;
  /* ... other styles */
}
```

**Use:**
```tsx
<Button variant="primary">Button</Button>
```

## Development Guidelines

### Component Creation

When creating new components:

1. **Use TypeScript interfaces** for all props
2. **Extend HTML attributes** when appropriate
3. **Use forwardRef** for ref forwarding
4. **Implement proper accessibility**
5. **Follow naming conventions**

```tsx
interface NewComponentProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'size'> {
  variant?: 'default' | 'special';
  size?: 'sm' | 'md' | 'lg';
}

export const NewComponent = React.forwardRef<HTMLDivElement, NewComponentProps>(
  ({ variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={styles.component}
        data-variant={variant}
        data-size={size}
        {...props}
      />
    );
  }
);

NewComponent.displayName = 'NewComponent';
```

### Styling Guidelines

1. **Use design tokens** from CSS variables
2. **Follow variant patterns** for consistency
3. **Implement responsive design**
4. **Handle dark/light themes**
5. **Include focus states**

```css
.component {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  transition: all var(--transition-fast);

  &:hover {
    background-color: var(--bg-tertiary);
  }

  &:focus-visible {
    outline: 2px solid var(--accent-primary);
  }

  &[data-variant="special"] {
    background-color: var(--accent-primary);
    color: white;
  }
}
```

### Testing Guidelines

1. **Test all variants and sizes**
2. **Verify keyboard navigation**
3. **Test with screen readers**
4. **Check color contrast**
5. **Test responsive behavior**

## Performance Considerations

### Bundle Size

- **Tree-shaking**: Only import used components
- **Code splitting**: Lazy load heavy components
- **Optimization**: Use dynamic imports for optional features

```tsx
// Good - tree-shakable
import { Button } from '@/components/base-ui/styled-components';

// Better - code splitting
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));
```

### Runtime Performance

- **Memoization**: Use React.memo for expensive components
- **Callback optimization**: Use useCallback for event handlers
- **State management**: Minimize unnecessary re-renders

```tsx
const OptimizedComponent = React.memo(({ data }) => {
  const handleClick = useCallback(() => {
    // handler logic
  }, []);

  return <Button onClick={handleClick}>Click</Button>;
});
```

## Accessibility Features

### Built-in Accessibility

All Base UI components include:

- **Keyboard navigation** support
- **Screen reader** compatibility
- **Focus management**
- **ARIA attributes**
- **Color contrast** compliance

### Custom Accessibility

For custom components, follow these patterns:

```tsx
const AccessibleComponent = ({ children, ...props }) => {
  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          // handle activation
        }
      }}
      aria-label="Custom action"
      {...props}
    >
      {children}
    </div>
  );
};
```

## Troubleshooting

### Common Issues

#### TypeScript Errors

**Problem**: `Property 'variant' does not exist on type 'IntrinsicAttributes'`

**Solution**: Ensure proper prop interfaces and exports:

```tsx
// Check that interfaces extend proper HTML attributes
interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  variant?: 'primary' | 'secondary';
}
```

#### Styling Issues

**Problem**: Styles not applying to Base UI components

**Solution**: Check CSS variable values and component structure:

```tsx
// Ensure CSS variables are available
console.log(getComputedStyle(document.documentElement).getPropertyValue('--accent-primary'));
```

#### Performance Issues

**Problem**: Slow component rendering

**Solution**: Implement proper memoization and optimization:

```tsx
// Add React.memo for expensive renders
const OptimizedComponent = React.memo(Component);

// Use useCallback for stable references
const handleClick = useCallback(() => {
  // handler logic
}, [dependency]);
```

### Debug Mode

Enable debug mode to see component state and performance:

```tsx
// Add to development builds
if (process.env.NODE_ENV === 'development') {
  // Enable debug logging
  window.DEBUG_BASE_UI = true;
}
```

## Support

### Getting Help

1. **Check this documentation** first
2. **Review component examples** in the codebase
3. **Test with the demo page** at `/components/base-ui/demo`
4. **Check browser console** for errors
5. **Refer to Base UI documentation**: https://base-ui.com

### Contributing

When contributing to the component system:

1. **Follow existing patterns**
2. **Add TypeScript types**
3. **Include accessibility features**
4. **Write tests for new components**
5. **Update documentation**

---

This Base UI component system provides a solid foundation for building consistent, accessible, and maintainable user interfaces that align with the Factory.ai design system.