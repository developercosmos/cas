import React from 'react';
import { Button, Input, Textarea } from './styled-components';

export const ComponentDemo: React.FC = () => {
  return (
    <div style={{
      padding: '2rem',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1 style={{ marginBottom: '2rem', fontSize: '2rem' }}>Base UI Components Demo</h1>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Buttons</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="danger">Danger Button</Button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
          <span>Sizes:</span>
          <Button size="sm" variant="secondary">Small</Button>
          <Button size="md" variant="secondary">Medium</Button>
          <Button size="lg" variant="secondary">Large</Button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Button disabled>Disabled Button</Button>
        </div>
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Input Components</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Text Input</label>
            <Input placeholder="Enter text here..." fullWidth />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email Input</label>
            <Input type="email" placeholder="email@example.com" fullWidth />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password Input</label>
            <Input type="password" placeholder="Enter password" fullWidth />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Textarea</label>
            <Textarea
              placeholder="Enter multi-line text here..."
              rows={4}
              fullWidth
            />
          </div>
        </div>
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Form Controls</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ color: 'var(--text-secondary, #d1d1d1)' }}>
            Base UI Checkbox and Switch components are available for use with proper implementation.
            These components provide full accessibility support out of the box.
          </p>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <Button variant="secondary" size="sm">Ready to Implement</Button>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Interactive Example</h2>
        <div style={{
          padding: '1.5rem',
          border: '1px solid var(--border-color, #262626)',
          borderRadius: '8px',
          backgroundColor: 'var(--bg-tertiary, #141414)'
        }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Contact Form</h3>

          <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Name</label>
              <Input placeholder="Your full name" fullWidth />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
              <Input type="email" placeholder="your.email@example.com" fullWidth />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Message</label>
              <Textarea placeholder="Your message..." rows={4} fullWidth />
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary, #d1d1d1)', marginBottom: '1rem' }}>
              Note: Checkbox integration would be implemented here with proper Base UI integration
            </p>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <Button variant="primary" type="submit">Submit</Button>
              <Button variant="secondary" type="button">Cancel</Button>
            </div>
          </form>
        </div>
      </section>

      <section>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Component Features</h2>
        <ul style={{ lineHeight: '1.6' }}>
          <li>✅ Fully styled with Factory.ai design system</li>
          <li>✅ Theme-aware (supports light/dark mode)</li>
          <li>✅ Accessible by default (built on Base UI)</li>
          <li>✅ TypeScript support with proper type definitions</li>
          <li>✅ Consistent spacing and typography</li>
          <li>✅ Hover and focus states</li>
          <li>✅ Disabled states</li>
          <li>✅ Responsive design ready</li>
        </ul>
      </section>
    </div>
  );
};