import React, { useState, useEffect, useCallback } from 'react';
import { NavigationModal } from './NavigationModal';

export interface NavigationManagerProps {
  isOpen?: boolean;
  onClose?: () => void;
  directMenuId?: string; // ID of directly selected menu item
}

export const NavigationManager: React.FC<NavigationManagerProps> = ({
  isOpen: controlledOpen,
  onClose: controlledClose,
  directMenuId
}) => {
  const [internalOpen, setInternalOpen] = useState(false);

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const onClose = controlledClose || (() => setInternalOpen(false));

  // Handle keyboard shortcut
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ctrl+K or Cmd+K to open
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      setInternalOpen(true);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return <NavigationModal isOpen={isOpen} onClose={onClose} directMenuId={directMenuId} />;
};

export default NavigationManager;
