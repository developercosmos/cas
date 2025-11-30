import React, { useState, useEffect, useCallback } from 'react';
import { NavigationModal } from './NavigationModal';
import { LdapDialog } from '@/components/LdapDialog';

export interface NavigationManagerProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const NavigationManager: React.FC<NavigationManagerProps> = ({
  isOpen: controlledOpen,
  onClose: controlledClose
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [ldapDialogOpen, setLdapDialogOpen] = useState(false);
  const [ldapInitialTab, setLdapInitialTab] = useState<'config' | 'test' | 'users'>('config');

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const onClose = controlledClose || (() => setInternalOpen(false));

  // Handle keyboard shortcut for regular navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ctrl+K or Cmd+K to open
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      setInternalOpen(true);
    }
  }, []);

  // Listen for keyboard shortcuts
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Handle opening LDAP dialog from NavigationModal
  const handleOpenLdapDialog = (tab: 'config' | 'test' | 'users') => {
    setLdapInitialTab(tab);
    setLdapDialogOpen(true);
  };

  // Handle closing LDAP dialog
  const handleCloseLdapDialog = () => {
    setLdapDialogOpen(false);
  };

  return (
    <>
      {/* Navigation Modal */}
      <NavigationModal 
        isOpen={isOpen} 
        onClose={onClose} 
        onOpenLdapDialog={handleOpenLdapDialog}
      />
      
      {/* LDAP Dialog - renders independently */}
      <LdapDialog 
        isOpen={ldapDialogOpen}
        onClose={handleCloseLdapDialog}
        initialTab={ldapInitialTab}
      />
    </>
  );
};

export default NavigationManager;
