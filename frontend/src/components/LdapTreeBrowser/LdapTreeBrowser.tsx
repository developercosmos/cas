import React, { useState, useEffect } from 'react';
import styles from './LdapTreeBrowser.module.css';

interface LdapTreeNode {
  dn: string;
  name: string;
  type: string;
  hasChildren: boolean;
  children?: LdapTreeNode[];
  expanded?: boolean;
}

interface LdapTreeBrowserProps {
  onClose: () => void;
  onSelect: (dn: string) => void;
  currentBaseDn?: string;
  serverConfig: {
    serverurl: string;
    basedn: string;
    binddn: string;
    bindpassword: string;
    issecure: boolean;
    port: number;
  };
}

const getApiBaseUrl = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:4000';
  }
  return `${window.location.protocol}//${window.location.hostname}:4000`;
};

const API_BASE = getApiBaseUrl();

const LdapTreeBrowser: React.FC<LdapTreeBrowserProps> = ({ 
  onClose, 
  onSelect, 
  currentBaseDn,
  serverConfig 
}) => {
  const [tree, setTree] = useState<LdapTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDn, setSelectedDn] = useState<string>(currentBaseDn || serverConfig.basedn);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadRootNodes();
  }, []);

  const getAuthToken = () => {
    return localStorage.getItem('auth_token');
  };

  const loadRootNodes = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE}/api/ldap/tree`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          config: serverConfig,
          baseDn: serverConfig.basedn
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to load LDAP tree');
      }

      const result = await response.json();
      if (result.success) {
        setTree(result.nodes || []);
      } else {
        throw new Error(result.message || 'Failed to load LDAP tree');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load LDAP tree');
    } finally {
      setLoading(false);
    }
  };

  const loadChildren = async (node: LdapTreeNode) => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${API_BASE}/api/ldap/tree`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          config: serverConfig,
          baseDn: node.dn
        })
      });

      if (!response.ok) return;

      const result = await response.json();
      if (result.success) {
        return result.nodes || [];
      }
    } catch (err) {
      console.error('Failed to load children:', err);
    }
    return [];
  };

  const toggleNode = async (node: LdapTreeNode, path: number[]) => {
    if (!node.hasChildren) return;

    const isExpanded = expandedNodes.has(node.dn);

    if (isExpanded) {
      // Collapse
      const newExpanded = new Set(expandedNodes);
      newExpanded.delete(node.dn);
      setExpandedNodes(newExpanded);
    } else {
      // Expand - load children if not loaded
      if (!node.children || node.children.length === 0) {
        const children = await loadChildren(node);
        updateNodeChildren(path, children);
      }

      const newExpanded = new Set(expandedNodes);
      newExpanded.add(node.dn);
      setExpandedNodes(newExpanded);
    }
  };

  const updateNodeChildren = (path: number[], children: LdapTreeNode[]) => {
    const updateTree = (nodes: LdapTreeNode[], currentPath: number[]): LdapTreeNode[] => {
      if (currentPath.length === 0) return nodes;

      const [index, ...rest] = currentPath;
      return nodes.map((node, i) => {
        if (i === index) {
          if (rest.length === 0) {
            return { ...node, children };
          }
          return {
            ...node,
            children: node.children ? updateTree(node.children, rest) : []
          };
        }
        return node;
      });
    };

    setTree(updateTree(tree, path));
  };

  const handleSelect = (dn: string) => {
    setSelectedDn(dn);
  };

  const handleConfirm = () => {
    onSelect(selectedDn);
    onClose();
  };

  const renderNode = (node: LdapTreeNode, path: number[] = [], level: number = 0) => {
    const isExpanded = expandedNodes.has(node.dn);
    const isSelected = selectedDn === node.dn;

    const getIcon = () => {
      if (node.hasChildren) {
        return isExpanded ? '📂' : '📁';
      }
      switch (node.type) {
        case 'organizationalUnit':
          return '🏢';
        case 'container':
          return '📦';
        case 'domain':
          return '🌐';
        default:
          return '📄';
      }
    };

    return (
      <div key={node.dn} className={styles.nodeContainer}>
        <div
          className={`${styles.node} ${isSelected ? styles.selected : ''}`}
          style={{ paddingLeft: `${level * 20 + 10}px` }}
          onClick={() => handleSelect(node.dn)}
        >
          {node.hasChildren && (
            <span
              className={styles.expandIcon}
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node, path);
              }}
            >
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
          {!node.hasChildren && <span className={styles.expandIcon}>&nbsp;&nbsp;</span>}
          <span className={styles.icon}>{getIcon()}</span>
          <span className={styles.name}>{node.name}</span>
          <span className={styles.type}>({node.type})</span>
        </div>
        {isExpanded && node.children && (
          <div className={styles.children}>
            {node.children.map((child, index) =>
              renderNode(child, [...path, index], level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>🌳 Select LDAP Base DN</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        {error && (
          <div className={styles.error}>
            <span>{error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        <div className={styles.info}>
          <p>Navigate the LDAP directory tree and select the base DN for user searches.</p>
          <p className={styles.currentDn}>
            <strong>Current:</strong> {currentBaseDn || serverConfig.basedn}
          </p>
        </div>

        <div className={styles.treeContainer}>
          {loading && <div className={styles.loading}>Loading directory tree...</div>}

          {!loading && tree.length === 0 && !error && (
            <div className={styles.empty}>
              No organizational units found. Check your LDAP connection.
            </div>
          )}

          {!loading && tree.length > 0 && (
            <div className={styles.tree}>
              {tree.map((node, index) => renderNode(node, [index], 0))}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.selectedInfo}>
            <strong>Selected:</strong>
            <div className={styles.selectedDn}>{selectedDn}</div>
          </div>
          <div className={styles.actions}>
            <button onClick={onClose} className={styles.cancelButton}>
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className={styles.confirmButton}
              disabled={!selectedDn}
            >
              Select Base DN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LdapTreeBrowser;
