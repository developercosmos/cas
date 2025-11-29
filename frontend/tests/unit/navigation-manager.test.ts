import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import { NavigationManager } from '../../../src/components/NavigationManager/NavigationManager';

// Mock React hooks
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useState: jest.fn(),
  useEffect: jest.fn(),
  useCallback: jest.fn()
}));

describe('NavigationManager', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up event listeners
    document.removeEventListener('keydown', jest.fn());
  });

  test('should render navigation modal when isOpen is true', () => {
    const onClose = jest.fn();
    render(<NavigationManager isOpen={true} onClose={onClose} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  test('should handle keyboard shortcut Ctrl+K', () => {
    const onClose = jest.fn();
    render(<NavigationManager isOpen={false} onClose={onClose} />);

    // Simulate Ctrl+K keypress
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true
    });

    document.dispatchEvent(event);

    // Should trigger navigation open (test will fail initially)
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('should handle Escape key to close modal', () => {
    const onClose = jest.fn();
    render(<NavigationManager isOpen={true} onClose={onClose} />);

    // Simulate Escape keypress
    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true
    });

    document.dispatchEvent(event);

    expect(onClose).toHaveBeenCalled();
  });

  test('should load modules from API', async () => {
    // This test will fail until API integration is implemented
    const onClose = jest.fn();
    render(<NavigationManager isOpen={true} onClose={onClose} />);

    // Should show loading state initially
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // Should eventually show modules
    // This will fail until API integration is implemented
    await expect(screen.findByText(/plugin manager/i)).toBeInTheDocument();
  });
});
