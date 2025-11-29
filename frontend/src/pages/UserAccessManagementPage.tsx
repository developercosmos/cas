/**
 * User Access Management Page
 * Standalone page for the User Access Management System
 * Follows CAS Constitution and Plugin Development Standards
 */

import React from 'react';
import UserAccessManager from '../components/UserAccessManagement/UserAccessManager';

const UserAccessManagementPage: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      padding: '0'
    }}>
      <UserAccessManager />
    </div>
  );
};

export default UserAccessManagementPage;
