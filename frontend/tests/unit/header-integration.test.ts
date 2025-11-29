import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../../../src/components/Header/Header';

// Mock NavigationManager
jest.mock('../../../src/components/NavigationManager/NavigationManager', () => ({
  NavigationManager: ({ isOpen, onClose }) => (
    <div data-testid="navigation-manager" data-open={isOpen}>
      NavigationManager Component
    </div>
  )
}));

describe('Header Integration', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should open navigation on logo click', () => {
    const { getByTestId } = render(<Header username="testuser" />);

    // Find logo button and click it
    const logoButton = getByTestId('logo-button');
    fireEvent.click(logoButton);

    // NavigationManager should open
    const navigationManager = screen.getByTestId('navigation-manager');
    expect(navigationManager).toBeInTheDocument();
    expect(navigationManager.getAttribute('data-open')).toBe('true');
  });

  test('should handle keyboard shortcut', () => {
    const { getByTestId } = render(<Header username="testuser" />);

    // Simulate Ctrl+K keypress
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true
    });

    document.dispatchEvent(event);

    // NavigationManager should handle the shortcut
    const navigationManager = screen.getByTestId('navigation-manager');
    expect(navigationManager).toBeInTheDocument();
  });

  test('should close navigation when requested', () => {
    const { getByTestId } = render(<Header username="testuser" />);

    // Open navigation first
    const logoButton = getByTestId('logo-button');
    fireEvent.click(logoButton);

    // Close navigation
    const navigationManager = screen.getByTestId('navigation-manager');
    fireEvent.click(navigationManager);

    // NavigationManager should close
    expect(navigationManager.getAttribute('data-open')).toBe('false');
  });
});
