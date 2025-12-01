import React, { useState, useEffect } from 'react';
import styles from './LdapUserManagerInline.module.css';

interface LdapUser {
  dn: string;
  username: string;
  email: string;
  displayName?: string;
  department?: string;
  title?: string;
  photo?: string;
  imported?: boolean;
  userId?: string;
}

interface LdapUserManagerInlineProps {
  configId: string;
}

const getApiBaseUrl = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:4000';
  }
  return `${window.location.protocol}//${window.location.hostname}:4000`;
};

const API_BASE = getApiBaseUrl();

const LdapUserManagerInline: React.FC<LdapUserManagerInlineProps> = ({ configId }) => {
  const [ldapUsers, setLdapUsers] = useState<LdapUser[]>([]);
  const [importedUsers, setImportedUsers] = useState<LdapUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'available' | 'imported'>('available');

  useEffect(() => {
    if (configId) {
      loadUsers();
    }
  }, [configId]);

  const getAuthToken = () => {
    return localStorage.getItem('auth_token');
  };

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      // Fetch LDAP users and imported users in parallel
      const [ldapResponse, importedResponse] = await Promise.all([
        fetch(`${API_BASE}/api/ldap/users?configId=${configId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/api/ldap/imported-users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (ldapResponse.ok) {
        const ldapData = await ldapResponse.json();
        if (ldapData.success) {
          console.log('📋 LDAP Users received:', ldapData.users?.length, 'users');
          if (ldapData.users && ldapData.users.length > 0) {
            console.log('📸 Sample user photo data:', {
              username: ldapData.users[0].username,
              hasPhoto: !!ldapData.users[0].photo,
              photoType: typeof ldapData.users[0].photo,
              photoStart: ldapData.users[0].photo?.substring(0, 50)
            });
          }
          setLdapUsers(ldapData.users || []);
        } else {
          console.warn('LDAP users fetch returned success:false', ldapData);
          setError(ldapData.message || 'Failed to fetch LDAP users');
        }
      } else {
        const errorData = await ldapResponse.json().catch(() => ({ message: 'Failed to fetch LDAP users' }));
        console.error('LDAP users fetch failed:', errorData);
        setError(errorData.message || 'Failed to fetch LDAP users. LDAP server may be unreachable.');
      }

      if (importedResponse.ok) {
        const importedData = await importedResponse.json();
        if (importedData.success) {
          setImportedUsers(importedData.users || []);
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (username: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(username)) {
      newSelected.delete(username);
    } else {
      newSelected.add(username);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = () => {
    const filtered = getFilteredUsers();
    if (selectedUsers.size === filtered.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filtered.map(u => u.username)));
    }
  };

  const handleImportSelected = async () => {
    if (selectedUsers.size === 0) {
      alert('Please select at least one user to import');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) throw new Error('Authentication required');

      const response = await fetch(`${API_BASE}/api/ldap/import-selected`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          configId,
          usernames: Array.from(selectedUsers)
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert(`✅ Successfully imported ${result.importedCount} users!`);
        setSelectedUsers(new Set());
        await loadUsers();
      } else {
        throw new Error(result.message || 'Import failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import users');
      alert(`❌ Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to remove user "${username}" from the application?\n\nThis will delete their account and all associated data.`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) throw new Error('Authentication required');

      const response = await fetch(`${API_BASE}/api/ldap/remove-user/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert(`✅ User "${username}" removed successfully!`);
        await loadUsers();
      } else {
        throw new Error(result.message || 'Remove failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove user');
      alert(`❌ Remove failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredUsers = () => {
    const users = activeTab === 'available' ? ldapUsers : importedUsers;
    if (!searchTerm) return users;

    const term = searchTerm.toLowerCase();
    return users.filter(u => 
      u.username.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.displayName?.toLowerCase().includes(term)
    );
  };

  const filteredUsers = getFilteredUsers();

  if (!configId) {
    return (
      <div className={styles.emptyState}>
        <p style={{ color: 'var(--error, #dc2626)' }}>
          Please configure an LDAP connection first in the Configuration tab.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {error && (
        <div className={styles.error}>
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'available' ? styles.active : ''}`}
          onClick={() => setActiveTab('available')}
        >
          📋 Available Users ({ldapUsers.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'imported' ? styles.active : ''}`}
          onClick={() => setActiveTab('imported')}
        >
          ✅ Imported Users ({importedUsers.length})
        </button>
      </div>

      <div className={styles.controls}>
        <input
          type="text"
          placeholder="🔍 Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />

        {activeTab === 'available' && (
          <div className={styles.actions}>
            <button
              onClick={handleSelectAll}
              disabled={loading || filteredUsers.length === 0}
              className={styles.secondaryButton}
            >
              {selectedUsers.size === filteredUsers.length ? 'Deselect All' : 'Select All'}
            </button>
            <button
              onClick={handleImportSelected}
              disabled={loading || selectedUsers.size === 0}
              className={styles.primaryButton}
            >
              {loading ? 'Importing...' : `Import Selected (${selectedUsers.size})`}
            </button>
          </div>
        )}

        <button
          onClick={loadUsers}
          disabled={loading}
          className={styles.refreshButton}
        >
          🔄 Refresh
        </button>
      </div>

      <div className={styles.userList}>
        {loading && <div className={styles.loading}>Loading users...</div>}

        {!loading && filteredUsers.length === 0 && (
          <div className={styles.empty}>
            {activeTab === 'available' 
              ? 'No LDAP users found. Check LDAP server connection.'
              : 'No users imported yet. Import users from the Available Users tab.'}
          </div>
        )}

        {!loading && filteredUsers.map((user) => {
          // Generate initials for placeholder
          const getInitials = (name: string) => {
            const parts = name.split(' ');
            if (parts.length >= 2) {
              return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
            }
            return name.substring(0, 2).toUpperCase();
          };

          const displayInitials = user.displayName 
            ? getInitials(user.displayName)
            : user.username.substring(0, 2).toUpperCase();

          return (
            <div key={user.username} className={styles.userCard}>
              {activeTab === 'available' && (
                <input
                  type="checkbox"
                  checked={selectedUsers.has(user.username)}
                  onChange={() => handleSelectUser(user.username)}
                  className={styles.checkbox}
                />
              )}

              <div className={styles.userPhotoContainer}>
                <div className={styles.userPhoto}>
                  {user.photo ? (
                    <img 
                      src={user.photo} 
                      alt={user.displayName || user.username}
                      onError={(e) => {
                        console.error('Image failed to load for user:', user.username, 'Photo data:', user.photo?.substring(0, 100));
                        // Hide broken image and show placeholder
                        e.currentTarget.style.display = 'none';
                        const placeholder = e.currentTarget.nextElementSibling;
                        if (placeholder) {
                          (placeholder as HTMLElement).style.display = 'flex';
                        }
                      }}
                      onLoad={() => {
                        console.log('✅ Image loaded successfully for user:', user.username);
                      }}
                    />
                  ) : null}
                  <div 
                    className={styles.userPhotoPlaceholder}
                    style={{ display: user.photo ? 'none' : 'flex' }}
                  >
                    {displayInitials}
                  </div>
                </div>
              </div>

              <div className={styles.userInfo}>
                <div className={styles.userHeader}>
                  <span className={styles.username}>{user.username}</span>
                  {user.displayName && (
                    <span className={styles.displayName}>{user.displayName}</span>
                  )}
                </div>
                
                {(user.title || user.department) && (
                  <div className={styles.userDetails}>
                    {user.title && (
                      <span className={styles.title}>💼 {user.title}</span>
                    )}
                    {user.department && (
                      <span className={styles.department}>🏢 {user.department}</span>
                    )}
                  </div>
                )}

                <div className={styles.userDetails}>
                  <span className={styles.email}>📧 {user.email}</span>
                </div>
              </div>

              {activeTab === 'imported' && user.userId && (
                <button
                  onClick={() => handleRemoveUser(user.userId!, user.username)}
                  disabled={loading}
                  className={styles.removeButton}
                  title="Remove user from application"
                >
                  🗑️ Remove
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className={styles.stats}>
        {activeTab === 'available' ? (
          <>
            <span>📊 Showing {filteredUsers.length} of {ldapUsers.length} LDAP users</span>
            {selectedUsers.size > 0 && (
              <span className={styles.selectedCount}>
                ✓ {selectedUsers.size} selected
              </span>
            )}
          </>
        ) : (
          <span>📊 Total imported: {importedUsers.length} users</span>
        )}
      </div>
    </div>
  );
};

export default LdapUserManagerInline;
