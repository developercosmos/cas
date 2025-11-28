import React, { useState, useEffect } from 'react';
import {
  Button,
  Input,
  Textarea,
  Modal,
  Tabs,
  Tooltip
} from '@cas/ui-components';
import {
  PluginContext,
  User,
  ButtonProps
} from '@cas/types';
import { MyPluginService } from '../services/MyPluginService';
import styles from '../styles/styles.css';

interface MyPluginComponentProps {
  context?: PluginContext;
  className?: string;
}

interface PluginData {
  message: string;
  timestamp: string;
  userCount: number;
}

export const MyPluginComponent: React.FC<MyPluginComponentProps> = ({
  context,
  className
}) => {
  const [data, setData] = useState<PluginData>({
    message: 'Hello from CAS Plugin Template!',
    timestamp: new Date().toISOString(),
    userCount: 0
  });

  const [showModal, setShowModal] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [plugins, setPlugins] = useState<any[]>([]);

  // Initialize plugin data
  useEffect(() => {
    if (context) {
      initializePluginData();
    }
  }, [context]);

  const initializePluginData = async () => {
    try {
      // Load stored data
      const storedData = await context.storage.get('pluginData');
      if (storedData) {
        setData(storedData);
      }

      // Load plugins from core API
      setLoading(true);
      const pluginList = await MyPluginService.getAvailablePlugins();
      setPlugins(pluginList);

      // Emit initialization event
      context.events.emit('plugin-template:initialized', {
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });

    } catch (error) {
      console.error('Failed to initialize plugin data:', error);
      if (context) {
        context.ui.showNotification('Failed to load plugin data', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setData(prev => ({
      ...prev,
      message: value || 'Hello from CAS Plugin Template!'
    }));
  };

  const handleSave = async () => {
    try {
      if (!context) return;

      const newData = {
        ...data,
        timestamp: new Date().toISOString()
      };

      await context.storage.set('pluginData', newData);
      setData(newData);

      context.ui.showNotification('Plugin data saved successfully!', 'success');

    } catch (error) {
      console.error('Failed to save data:', error);
      if (context) {
        context.ui.showNotification('Failed to save data', 'error');
      }
    }
  };

  const handleTestAPI = async () => {
    try {
      if (!context) return;

      setLoading(true);
      const result = await MyPluginService.testConnection();

      context.ui.showNotification(
        `API test successful: ${result.message}`,
        'success'
      );

    } catch (error) {
      console.error('API test failed:', error);
      if (context) {
        context.ui.showNotification('API test failed', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    if (!context) return;

    context.confirm('Are you sure you want to clear all plugin data?', async () => {
      try {
        await context.storage.clear();

        const defaultData = {
          message: 'Hello from CAS Plugin Template!',
          timestamp: new Date().toISOString(),
          userCount: 0
        };

        setData(defaultData);
        setInputValue('');

        context.ui.showNotification('Plugin data cleared successfully', 'info');

      } catch (error) {
        console.error('Failed to clear data:', error);
        context.ui.showNotification('Failed to clear data', 'error');
      }
    });
  };

  const tabs = [
    {
      label: 'Overview',
      content: (
        <div className={styles.tabContent}>
          <h3>Plugin Overview</h3>
          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <h4>Status</h4>
              <p className={styles.statusActive}>Active</p>
            </div>
            <div className={styles.infoCard}>
              <h4>Version</h4>
              <p>1.0.0</p>
            </div>
            <div className={styles.infoCard}>
              <h4>Last Updated</h4>
              <p>{new Date(data.timestamp).toLocaleString()}</p>
            </div>
            <div className={styles.infoCard}>
              <h4>CAS Version</h4>
              <p>1.0.0+</p>
            </div>
          </div>
        </div>
      )
    },
    {
      label: 'Configuration',
      content: (
        <div className={styles.tabContent}>
          <h3>Plugin Configuration</h3>
          <div className={styles.formGroup}>
            <label htmlFor="message-input">Custom Message:</label>
            <Input
              id="message-input"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Enter a custom message"
              fullWidth
            />
          </div>

          <div className={styles.formActions}>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Configuration'}
            </Button>

            <Button
              variant="secondary"
              onClick={handleTestAPI}
              disabled={loading}
            >
              {loading ? 'Testing...' : 'Test API'}
            </Button>

            <Button
              variant="danger"
              onClick={handleClearData}
            >
              Clear Data
            </Button>
          </div>
        </div>
      )
    },
    {
      label: 'Dependencies',
      content: (
        <div className={styles.tabContent}>
          <h3>Plugin Dependencies</h3>
          <div className={styles.dependencyList}>
            <div className={styles.dependencyItem}>
              <h4>@cas/types</h4>
              <p>Type definitions and interfaces</p>
              <span className={styles.versionTag}>^1.0.0</span>
            </div>
            <div className={styles.dependencyItem}>
              <h4>@cas/ui-components</h4>
              <p>Reusable UI components</p>
              <span className={styles.versionTag}>^1.0.0</span>
            </div>
            <div className={styles.dependencyItem}>
              <h4>@cas/core-api</h4>
              <p>Core services and utilities</p>
              <span className={styles.versionTag}>^1.0.0</span>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className={`${styles.pluginContainer} ${className || ''}`}>
      <div className={styles.pluginHeader}>
        <h2>CAS Plugin Template</h2>
        <div className={styles.pluginActions}>
          <Tooltip content="Show plugin details">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowModal(true)}
            >
              ℹ️ Details
            </Button>
          </Tooltip>
        </div>
      </div>

      <div className={styles.pluginContent}>
        <div className={styles.messageCard}>
          <h3>{data.message}</h3>
          <p className={styles.timestamp}>
            Last updated: {new Date(data.timestamp).toLocaleString()}
          </p>
        </div>

        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* Details Modal */}
      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <div className={styles.modalContent}>
            <h2>Plugin Details</h2>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <strong>Plugin ID:</strong>
                <span>cas-plugin-template</span>
              </div>
              <div className={styles.detailItem}>
                <strong>Version:</strong>
                <span>1.0.0</span>
              </div>
              <div className={styles.detailItem}>
                <strong>Author:</strong>
                <span>CAS Platform Team</span>
              </div>
              <div className={styles.detailItem}>
                <strong>Dependencies:</strong>
                <span>3 core packages</span>
              </div>
              <div className={styles.detailItem}>
                <strong>Permissions:</strong>
                <span>storage, api, dom, events</span>
              </div>
            </div>

            <div className={styles.modalActions}>
              <Button variant="primary" onClick={() => setShowModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MyPluginComponent;