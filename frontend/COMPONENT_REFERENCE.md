# Base UI Component Reference

## Quick Reference

This document provides a quick reference for all Base UI components and their props.

## Core Components

### Button
```tsx
import { Button } from '@/components/base-ui/styled-components';

<Button
  variant="primary"      // 'primary' | 'secondary' | 'ghost' | 'danger'
  size="md"             // 'sm' | 'md' | 'lg'
  onClick={handleClick}
  disabled={false}
>
  Button Text
</Button>
```

### Input
```tsx
import { Input } from '@/components/base-ui/styled-components';

<Input
  type="text"           // HTML input types
  placeholder="Enter text"
  value={value}
  onChange={handleChange}
  fullWidth={false}
  disabled={false}
  required={false}
/>
```

### Textarea
```tsx
import { Textarea } from '@/components/base-ui/styled-components';

<Textarea
  placeholder="Enter message"
  value={value}
  onChange={handleChange}
  rows={4}
  fullWidth={false}
  disabled={false}
  required={false}
/>
```

### Checkbox
```tsx
import { Checkbox } from '@/components/base-ui/styled-components';

<Checkbox
  checked={isChecked}
  onCheckedChange={setIsChecked}
  disabled={false}
  id="checkbox-id"
  label="Checkbox label"
/>
```

### Switch
```tsx
import { Switch } from '@/components/base-ui/styled-components';

<Switch
  checked={isOn}
  onCheckedChange={setIsOn}
  disabled={false}
  id="switch-id"
  label="Switch label"
  size="md"             // 'sm' | 'md' | 'lg'
/>
```

### CustomSelect
```tsx
import { CustomSelect } from '@/components/base-ui/styled-components';

<CustomSelect
  options={[
    { value: 'opt1', label: 'Option 1' },
    { value: 'opt2', label: 'Option 2' }
  ]}
  value={selectedValue}
  onValueChange={setSelectedValue}
  placeholder="Select option"
  disabled={false}
  fullWidth={false}
/>
```

## Layout Components

Import all layout components from:
```tsx
import {
  Grid, GridItem,
  Stack, VStack, HStack,
  Card, CardHeader, CardContent, CardFooter,
  Container, Spacer
} from '@/components/base-ui/layout';
```

### Grid
```tsx
<Grid
  columns={{ xs: 1, sm: 2, md: 3, lg: 4 }}  // Responsive columns
  gap={4}                                        // Spacing unit (4px base)
>
  <GridItem xs={12} md={6} lg={4}>
    Content
  </GridItem>
</Grid>
```

### Stack
```tsx
<VStack spacing={4} align="stretch">           // Vertical stack
  <div>Item 1</div>
  <div>Item 2</div>
</VStack>

<HStack spacing={2} justify="space-between">  // Horizontal stack
  <div>Left</div>
  <div>Right</div>
</HStack>
```

### Card
```tsx
Card variants:
- "default"    // Basic card
- "elevated"   // With shadow
- "outlined"   // With border
- "ghost"      // Minimal styling

<Card variant="elevated" interactive={true}>
  <CardHeader>
    <h3>Card Title</h3>
  </CardHeader>
  <CardContent>
    <p>Card content</p>
  </CardContent>
  <CardFooter>
    <Button variant="primary">Action</Button>
  </CardFooter>
</Card>
```

### Container
```tsx
Container sizes:
- "xs"  - 480px max-width
- "sm"  - 640px max-width
- "md"  - 768px max-width
- "lg"  - 1024px max-width
- "xl"  - 1280px max-width
- "fluid" - 100% width

<Container size="md" center={true}>
  <div>Centered content</div>
</Container>
```

### Spacer
```tsx
<Spacer size="md" vertical={true} />  // vertical spacer
<Spacer size="lg" vertical={false} /> // horizontal spacer

// Pre-defined spacers:
// XS, SM, MD, LG, XL, XXL
```

## Common Patterns

### Form with Validation
```tsx
import { Input, Button, Checkbox } from '@/components/base-ui/styled-components';
import { VStack, HStack } from '@/components/base-ui/layout';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);

  return (
    <VStack spacing={4}>
      <Input
        type="email"
        placeholder="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        fullWidth
        required
      />

      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        fullWidth
        required
      />

      <Checkbox
        checked={remember}
        onCheckedChange={setRemember}
        label="Remember me"
      />

      <HStack justify="flex-end" spacing={2}>
        <Button variant="ghost">Cancel</Button>
        <Button variant="primary">Login</Button>
      </HStack>
    </VStack>
  );
}
```

### Settings Page Layout
```tsx
import { Card, CardHeader, CardContent } from '@/components/base-ui/layout';
import { Switch, Input, CustomSelect } from '@/components/base-ui/styled-components';

function SettingsPage() {
  return (
    <VStack spacing={6}>
      <Card variant="outlined">
        <CardHeader>
          <h3>General Settings</h3>
        </CardHeader>
        <CardContent>
          <VStack spacing={4}>
            <div>
              <label>Display Name</label>
              <Input placeholder="Your name" fullWidth />
            </div>

            <Switch
              checked={darkMode}
              onCheckedChange={setDarkMode}
              label="Dark Mode"
            />
          </VStack>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader>
          <h3>Advanced Settings</h3>
        </CardHeader>
        <CardContent>
          <VStack spacing={4}>
            <CustomSelect
              options={timezones}
              value={timezone}
              onValueChange={setTimezone}
              placeholder="Select timezone"
              fullWidth
            />
          </VStack>
        </CardContent>
      </Card>
    </VStack>
  );
}
```

### Data Table with Actions
```tsx
import { Grid, Card, Button } from '@/components/base-ui/layout';

function DataTable({ data }) {
  return (
    <Card variant="elevated">
      <CardHeader>
        <h3>Data Table</h3>
      </CardHeader>
      <CardContent>
        <Grid columns={{ xs: 1, lg: 4 }} gap={3}>
          {data.map(item => (
            <GridItem key={item.id}>
              <VStack spacing={2}>
                <h4>{item.name}</h4>
                <p>{item.description}</p>
                <HStack spacing={1}>
                  <Button size="sm" variant="ghost">Edit</Button>
                  <Button size="sm" variant="danger">Delete</Button>
                </HStack>
              </VStack>
            </GridItem>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}
```

## Design Tokens

### Colors
```css
--bg-primary:     #000000
--bg-secondary:   #0a0a0a
--bg-tertiary:    #141414
--bg-elevated:    #1a1a1a

--text-primary:   #ffffff
--text-secondary: #d1d1d1
--text-tertiary:  #737373
--text-muted:     #525252

--border-color:   #262626
--border-subtle:  #1a1a1a

--accent-primary: #F27B2F
--accent-hover:   #FF9C6E
--accent-muted:   #d97706
```

### Spacing
```css
--space-1:  4px   --space-8:  32px
--space-2:  8px   --space-10: 40px
--space-3:  12px  --space-12: 48px
--space-4:  16px  --space-16: 64px
--space-5:  20px  --space-20: 80px
--space-6:  24px
```

### Typography
```css
--font-size-xs:  12px
--font-size-sm:  13px
--font-size-base: 14px
--font-size-md:  15px
--font-size-lg:  16px
--font-size-xl:  18px
--font-size-2xl: 24px
```

## CSS Integration

### Using Design Tokens
```css
.my-component {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}
```

### Responsive Patterns
```css
.responsive-component {
  /* Mobile first */
  padding: var(--space-3);

  /* Tablet */
  @media (min-width: 768px) {
    padding: var(--space-6);
  }

  /* Desktop */
  @media (min-width: 1024px) {
    padding: var(--space-8);
  }
}
```

---

This reference provides quick access to component props, common patterns, and design tokens for rapid development with the Base UI component system.