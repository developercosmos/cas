import React, { useState, useEffect, useCallback } from 'react';
import { NavigationModal } from './NavigationModal';
import { LdapDialog } from '@/components/LdapDialog';

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
  const [ldapDialogOpen, setLdapDialogOpen] = useState(false);
  const [ldapInitialTab, setLdapInitialTab] = useState<'config' | 'test' | 'users'>('config');

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const onClose = controlledClose || (() => setInternalOpen(false));

  // Handle direct menu execution without opening modal
  const handleDirectMenu = async (moduleId: string) => {
    try {
      // Load modules first to get the direct module info
      const token = localStorage.getItem('auth_token') || 'test-token';
      
      const response = await fetch('/api/plugins/menu-navigation/modules', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const directModule = data.data.find((m: any) => m.id === moduleId);
        
        if (directModule) {
          // Handle LDAP modules specially
          if (directModule.pluginId === 'ldap-auth') {
            let initialTab: 'config' | 'test' | 'users' = 'config';
            
            if (directModule.route?.includes('/test')) {
              initialTab = 'test';
            } else if (directModule.route?.includes('/users')) {
              initialTab = 'users';
            }
            
            // Dispatch custom event to open LDAP dialog
            setLdapInitialTab(initialTab);
            setLdapDialogOpen(true);
            return;
          }

          // Handle regular modules
          if (directModule.route) {
            window.location.href = directModule.route;
          } else if (directModule.externalUrl) {
            window.open(directModule.externalUrl, '_blank');
          }
        }
      }
    } catch (error) {
      console.error('Error handling direct menu:', error);
    }
  };

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
