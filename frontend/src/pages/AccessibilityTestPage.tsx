import React, { useState } from 'react';
import {
  Button,
  Input,
  Textarea,
  Checkbox,
  Switch,
  CustomSelect,
} from '@/components/base-ui';
import { AccessibilityTestRunner } from '@/components/accessibility/AccessibilityTestRunner';

const AccessibilityTestPage: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [textareaValue, setTextareaValue] = useState('');
  const [checked, setChecked] = useState(false);
  const [switched, setSwitched] = useState(false);
  const [selectValue, setSelectValue] = useState('');
  const [activeTab, setActiveTab] = useState('forms');

  const selectOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
    { value: 'option4', label: 'Option 4' },
  ];

  return (
    <div style={{ padding: '2rem', color: 'var(--text-primary)', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <AccessibilityTestRunner />

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1>Base UI Components Accessibility Test</h1>

        {/* Tab Navigation for Component Categories */}
        <div style={{ marginBottom: '2rem' }}>
          <nav role="tablist" aria-label="Component categories">
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)' }}>
              <button
                onClick={() => setActiveTab('forms')}
                style={{
                  padding: '1rem 1.5rem',
                  background: activeTab === 'forms' ? 'var(--accent-primary)' : 'transparent',
                  color: activeTab === 'forms' ? 'white' : 'var(--text-primary)',
                  border: 'none',
                  borderBottom: activeTab === 'forms' ? '2px solid var(--accent-primary)' : 'none',
                  cursor: 'pointer'
                }}
                role="tab"
                aria-selected={activeTab === 'forms'}
                aria-controls="forms-panel"
                id="forms-tab"
              >
                Form Elements
              </button>
              <button
                onClick={() => setActiveTab('buttons')}
                style={{
                  padding: '1rem 1.5rem',
                  background: activeTab === 'buttons' ? 'var(--accent-primary)' : 'transparent',
                  color: activeTab === 'buttons' ? 'white' : 'var(--text-primary)',
                  border: 'none',
                  borderBottom: activeTab === 'buttons' ? '2px solid var(--accent-primary)' : 'none',
                  cursor: 'pointer'
                }}
                role="tab"
                aria-selected={activeTab === 'buttons'}
                aria-controls="buttons-panel"
                id="buttons-tab"
              >
                Buttons
              </button>
              <button
                onClick={() => setActiveTab('interactive')}
                style={{
                  padding: '1rem 1.5rem',
                  background: activeTab === 'interactive' ? 'var(--accent-primary)' : 'transparent',
                  color: activeTab === 'interactive' ? 'white' : 'var(--text-primary)',
                  border: 'none',
                  borderBottom: activeTab === 'interactive' ? '2px solid var(--accent-primary)' : 'none',
                  cursor: 'pointer'
                }}
                role="tab"
                aria-selected={activeTab === 'interactive'}
                aria-controls="interactive-panel"
                id="interactive-tab"
              >
                Interactive Elements
              </button>
            </div>
          </nav>
        </div>

        {/* Forms Panel */}
        {activeTab === 'forms' && (
          <div id="forms-panel" role="tabpanel" aria-labelledby="forms-tab">
            <h2>Form Elements</h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '2rem'
            }}>
              <div style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '1.5rem'
              }}>
                <h3>Input Fields</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label htmlFor="text-input" style={{ display: 'block', marginBottom: '0.5rem' }}>Text Input</label>
                    <Input
                      id="text-input"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Enter text here"
                      aria-describedby="input-help"
                    />
                    <small id="input-help" style={{ color: 'var(--text-secondary)' }}>Enter your name or email address</small>
                  </div>

                  <div>
                    <label htmlFor="disabled-input" style={{ display: 'block', marginBottom: '0.5rem' }}>Disabled Input</label>
                    <Input
                      id="disabled-input"
                      value="Disabled field"
                      disabled
                      aria-describedby="disabled-help"
                    />
                    <small id="disabled-help" style={{ color: 'var(--text-secondary)' }}>This field is currently disabled</small>
                  </div>

                  <div>
                    <label htmlFor="required-input" style={{ display: 'block', marginBottom: '0.5rem' }}>Required Input *</label>
                    <Input
                      id="required-input"
                      placeholder="This field is required"
                      required
                      aria-describedby="required-help"
                    />
                    <small id="required-help" style={{ color: 'var(--accent-primary)' }}>This field is required</small>
                  </div>
                </div>
              </div>

              <div style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '1.5rem'
              }}>
                <h3>Text Areas</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label htmlFor="textarea" style={{ display: 'block', marginBottom: '0.5rem' }}>Text Area</label>
                    <Textarea
                      id="textarea"
                      value={textareaValue}
                      onChange={(e) => setTextareaValue(e.target.value)}
                      placeholder="Enter multiple lines of text"
                      rows={4}
                      aria-describedby="textarea-help"
                    />
                    <small id="textarea-help" style={{ color: 'var(--text-secondary)' }}>Use this for longer text entries</small>
                  </div>

                  <div>
                    <label htmlFor="disabled-textarea" style={{ display: 'block', marginBottom: '0.5rem' }}>Disabled Text Area</label>
                    <Textarea
                      id="disabled-textarea"
                      value="Disabled textarea"
                      disabled
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '1.5rem'
              }}>
                <h3>Checkboxes & Switches</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <Checkbox
                    id="checkbox-1"
                    checked={checked}
                    onCheckedChange={setChecked}
                    label="I agree to the terms and conditions"
                  />

                  <Checkbox
                    id="checkbox-2"
                    checked={true}
                    onCheckedChange={() => {}}
                    disabled
                    label="Disabled checked checkbox"
                  />

                  <Checkbox
                    id="checkbox-3"
                    checked={false}
                    onCheckedChange={() => {}}
                    disabled
                    label="Disabled unchecked checkbox"
                  />

                  <Switch
                    id="switch-1"
                    checked={switched}
                    onCheckedChange={setSwitched}
                    label="Enable notifications"
                  />

                  <Switch
                    id="switch-2"
                    checked={true}
                    onCheckedChange={() => {}}
                    disabled
                    label="Disabled switch"
                    size="lg"
                  />
                </div>
              </div>

              <div style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '1.5rem'
              }}>
                <h3>Select Dropdowns</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label htmlFor="select-1" style={{ display: 'block', marginBottom: '0.5rem' }}>Choose an option</label>
                    <CustomSelect
                      options={selectOptions}
                      value={selectValue}
                      onValueChange={setSelectValue}
                      placeholder="Select from options"
                      aria-describedby="select-help"
                    />
                    <small id="select-help" style={{ color: 'var(--text-secondary)' }}>Choose from the available options</small>
                  </div>

                  <div>
                    <label htmlFor="select-2" style={{ display: 'block', marginBottom: '0.5rem' }}>Disabled Select</label>
                    <CustomSelect
                      options={selectOptions}
                      value="option1"
                      disabled
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Buttons Panel */}
        {activeTab === 'buttons' && (
          <div id="buttons-panel" role="tabpanel" aria-labelledby="buttons-tab">
            <h2>Button Variants and Sizes</h2>

            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '2rem'
            }}>
              <h3>Button Variants</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <span style={{ minWidth: '100px' }}>Primary:</span>
                  <Button variant="primary" size="sm">Small Primary</Button>
                  <Button variant="primary" size="md">Medium Primary</Button>
                  <Button variant="primary" size="lg">Large Primary</Button>
                  <Button variant="primary" size="md" disabled>Disabled</Button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <span style={{ minWidth: '100px' }}>Secondary:</span>
                  <Button variant="secondary" size="sm">Small Secondary</Button>
                  <Button variant="secondary" size="md">Medium Secondary</Button>
                  <Button variant="secondary" size="lg">Large Secondary</Button>
                  <Button variant="secondary" size="md" disabled>Disabled</Button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <span style={{ minWidth: '100px' }}>Ghost:</span>
                  <Button variant="ghost" size="sm">Small Ghost</Button>
                  <Button variant="ghost" size="md">Medium Ghost</Button>
                  <Button variant="ghost" size="lg">Large Ghost</Button>
                  <Button variant="ghost" size="md" disabled>Disabled</Button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <span style={{ minWidth: '100px' }}>Danger:</span>
                  <Button variant="danger" size="sm">Small Danger</Button>
                  <Button variant="danger" size="md">Medium Danger</Button>
                  <Button variant="danger" size="lg">Large Danger</Button>
                  <Button variant="danger" size="md" disabled>Disabled</Button>
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '1.5rem'
            }}>
              <h3>Buttons with Icons</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <Button variant="primary" aria-label="Add new item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginRight: '0.5rem' }}>
                      <path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Add Item
                  </Button>

                  <Button variant="secondary" aria-label="Edit current item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginRight: '0.5rem' }}>
                      <path d="M11 2L13 4L4 13L2 14L3 12L11 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Edit
                  </Button>

                  <Button variant="danger" aria-label="Delete item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginRight: '0.5rem' }}>
                      <path d="M2 4H3H14M6 6V11M10 6V11M5 4V3C5 2.44772 5.44772 2 6 2H10C10.5523 2 11 2.44772 11 3V4M4 4L5 13C5 13.5523 5.44772 14 6 14H10C10.5523 14 11 13.5523 11 13L12 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </Button>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <Button variant="ghost" aria-label="Settings">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 1C8 1 6.5 5 4 5C4 5 5 7 5 9C5 11 4 13 4 13C6.5 13 8 15 8 15C8 15 9.5 13 12 13C12 13 11 11 11 9C11 7 12 5 12 5C9.5 5 8 1 8 1Z" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                  </Button>

                  <Button variant="ghost" aria-label="Search">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Interactive Elements Panel */}
        {activeTab === 'interactive' && (
          <div id="interactive-panel" role="tabpanel" aria-labelledby="interactive-tab">
            <h2>Interactive Elements</h2>

            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '2rem'
            }}>
              <h3>Focus Management and Keyboard Navigation</h3>
              <p style={{ marginBottom: '1rem' }}>
                Test keyboard navigation using Tab, Shift+Tab, Enter, Space, and Escape keys.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Button variant="secondary">Tab to me first</Button>
                <Input placeholder="Tab to me next" />
                <Checkbox label="Check me with Space bar" />
                <Switch label="Toggle me with Space bar" />
                <Button variant="primary">Final tabbable element</Button>
              </div>

              <div style={{
                marginTop: '2rem',
                padding: '1rem',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: '6px'
              }}>
                <h4>Keyboard Navigation Instructions:</h4>
                <ul style={{ marginLeft: '1.5rem' }}>
                  <li>Use <kbd>Tab</kbd> to move forward through interactive elements</li>
                  <li>Use <kbd>Shift+Tab</kbd> to move backward</li>
                  <li>Use <kbd>Enter</kbd> or <kbd>Space</kbd> to activate buttons, checkboxes, and switches</li>
                  <li>Use <kbd>Escape</kbd> to close modals and dropdowns</li>
                  <li>Use arrow keys for keyboard navigation in complex components</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccessibilityTestPage;