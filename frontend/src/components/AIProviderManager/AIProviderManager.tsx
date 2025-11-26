// Constitution: AI Provider Manager for fallback chain configuration
import React, { useState, useEffect, useCallback } from 'react';
import styles from './AIProviderManager.module.css';

interface AIProvider {
  name: string;
  type: 'ollama' | 'openai' | 'gemini';
  status: 'testing' | 'available' | 'unavailable' | 'error';
  error?: string;
  models?: string[];
  stats?: any;
}

interface AIProviderConfig {
  ollamaBaseUrl?: string;
  openaiApiKey?: string;
  geminiApiKey?: string;
  primaryProvider: 'ollama' | 'openai' | 'gemini';
  fallbackChain: string[];
}

export const AIProviderManager: React.FC = () => {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [config, setConfig] = useState<AIProviderConfig>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Constitution: Load configuration and test providers
  useEffect(() => {
    loadConfiguration();
    testAllProviders();
  }, []);

  const loadConfiguration = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Get RAG configuration
      const statusResponse = await fetch('/api/plugins/rag/ai/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (statusResponse.ok) {
        const data = await statusResponse.json();
        setProviders(data.data.providers || []);
      }
    } catch (err) {
      setError('Failed to load AI provider configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const testAllProviders = useCallback(async () => {
    try {
      setIsTesting(true);
      setError('');

      const testPromises = providers.map(provider => testProvider(provider.name));
      const results = await Promise.allSettled(testPromises);

      setProviders(prev => prev.map(provider => ({
        ...provider,
        ...results[prev.findIndex(p => p.name === provider.name)]
      })));

    } catch (err) {
      setError('Failed to test AI providers');
    } finally {
      setIsTesting(false);
    }
  }, [providers]);

  const testProvider = async (providerName: string): Promise<Partial<AIProvider>> => {
    const providerToUpdate = providers.find(p => p.name === providerName);
    if (!providerToUpdate) {
      return providers.find(p => p.name === providerName) || {};
    }

    let result: Partial<AIProvider> = { ...providerToUpdate, status: 'testing' };

    try {
      const response = await fetch('/api/plugins/rag/ai/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ollamaUrl: config.ollamaBaseUrl,
          openaiApiKey: config.openaiApiKey,
          geminiApiKey: config.geminiApiKey
        })
      });

      if (response.ok) {
        const data = await response.json();
        result = data.results[providerName.toLowerCase().replace(/\\s+/g, '')] || {};
        result.status = result.error ? 'error' : 'available';
      } else {
        result.status = 'error';
        result.error = response.statusText;
      }
    } catch (err) {
      result.status = 'error';
      result.error = err instanceof Error ? err.message : 'Unknown error';
    }

    return result;
  };

  const handleConfigChange = (field: keyof AIProviderConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setSaveStatus('idle');
  };

  const saveConfiguration = async () => {
    try {
      setSaveStatus('saving');
      setError('');

      const response = await fetch('/api/plugins/rag/configure', {
        method: 'post',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        setSaveStatus('saved');
        // Reload configuration
        await loadConfiguration();
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Configuration save failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Configuration save failed');
      setSaveStatus('error');
    } finally {
      if (saveStatus === 'saving') {
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    }
  };

  const getProviderStatusIcon = (status: AIProvider['status']) => {
    switch (status) {
      case 'available': return '✅';
      case 'testing': return '⏳';
      case 'unavailable': return '❌';
      case 'error': return '⚠️';
      default: return '❓';
    }
  };

  const getProviderCardColor = (status: AIProvider['status']) => {
    switch (status) {
      case 'available': return 'var(--success-color)';
      case 'testing': return 'var(--warning-color)';
      case 'unavailable': return 'var(--error-color)';
      case 'error': return 'var(--error-color)';
      default: return 'var(--tertiary-color)';
    }
  };

  const getFallbackOrder = () => {
    const chain = config.fallbackChain || ['ollama', 'openai', 'gemini'];
    return chain.filter(name => 
      providers.find(p => p.name.toLowerCase().includes(name.toLowerCase()))?.available
    );
  };

  const reorderFallbackChain = (draggedIndex: number, dropIndex: number) => {
    const chain = [...config.fallbackChain || []];
    const [draggedItem] = chain.splice(draggedIndex, 1)[0];
    chain.splice(dropIndex, 0, draggedItem);
    setConfig(prev => ({ ...prev, fallbackChain: chain }));
    setSaveStatus('idle');
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Initializing AI providers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>🤖 AI Provider Configuration</h2>
        <p>Configure local and cloud AI providers with automatic fallback support</p>
        <div className={styles.quickActions}>
          <button
            onClick={testAllProviders}
            disabled={isTesting}
            className={styles.testButton}
          >
            {isTesting ? 'Testing...' : 'Test All Providers'}
          </button>
        </div>
      </div>

      {error && (
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={() => setError('')} className={styles.retryButton}>
            Retry
          </button>
        </div>
      )}

      <div className={styles.configSection}>
        <h3>Provider Configuration</h3>
        <div className={styles.configForm}>
          <div className={styles.formGroup}>
            <label>Ollama (Local)</label>
            <input
              type="url"
              placeholder="http://localhost:11434"
              value={config.ollamaBaseUrl || ''}
              onChange={(e) => handleConfigChange('ollamaBaseUrl', e.target.value)}
              className={styles.formInput}
            />
            <small>Local Ollama server for private, offline processing</small>
          </div>

          <div className={styles.formGroup}>
            <label>OpenAI</label>
            <input
              type="password"
              placeholder="sk-proj-..."
              value={config.openaiApiKey || ''}
              onChange={(e) => handleConfigChange('openaiApiKey', e.target.value)}
              className={styles.formInput}
            />
            <small>OpenAI API key for cloud processing</small>
          </div>

          <div className={styles.formGroup}>
            <label>Google Gemini</label>
            <input
              type="password"
              placeholder="API_KEY..."
              value={config.geminiApiKey || ''}
              onChange={(e) => handleConfigChange('geminiApiKey', e.target.value)}
              className={styles.formInput}
            />
            <small>Google Gemini API key for alternative cloud processing</small>
          </div>
        </div>

        <button
          onClick={saveConfiguration}
          disabled={saveStatus === 'saving'}
          className={styles.saveButton}
        >
          {saveStatus === 'saved' && '✅ ' || ''}
          {saveStatus === 'saving' && '⏳ Saving...' || 'Save Configuration'}
          {saveStatus === 'error' && '❌ Save Failed' || 'Save Configuration'}
        </button>
      </div>

      <div className={styles.statusSection}>
        <h3>Provider Status</h3>
        <div className={styles.providerList}>
          {providers.map((provider, index) => (
            <div
              key={provider.name}
              className={styles.providerCard}
              style={getProviderCardColor(provider.status)}
            >
              <div className={styles.providerHeader}>
                <div className={styles.providerInfo}>
                  <h4>{provider.name}</h4>
                  <span className={styles.statusBadge}>
                    {getProviderStatusIcon(provider.status)}
                    <span>{provider.status}</span>
                  </span>
                </div>
                <div className={styles.providerActions}>
                  <small>
                    {provider.models?.slice(0, 3).join(', ') || 'No models'}
                  </small>
                </div>
              </div>

              {provider.stats && (
                <div className={styles.providerDetails}>
                  {Object.entries(provider.stats).map(([key, value]) => (
                    <div key={key} className={styles.statLine}>
                      <span className={styles.statKey}>{key}:</span>
                      <span className={styles.statValue}>{String(value)}</span>
                    </div>
                  ))}
                </div>
              )}

              {provider.error && (
                <div className={styles.providerError}>
                  <small>{provider.error}</small>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className={styles.fallbackSection}>
          <h3>Fallback Order</h3>
          <p className={styles.fallbackDescription}>
            When a provider fails, the next available provider in the chain will be used automatically
          </p>
          <div className={styles.fallbackChain}>
            {getFallbackOrder().map((providerName, index) => (
              <div key={providerName} className={styles.fallbackItem}>
                <span className={styles.fallbackNumber}>#{index + 1}</span>
                <span className={styles.fallbackName}>{providerName}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.setupGuide}>
          <h3>📋 Quick Setup Guide</h3>
          <div className={styles.guideSteps}>
            <div className={styles.step}>
              <span className={styles.stepNumber}>1</span>
              <div className={styles.stepContent}>
                <h4>Start with Ollama</h4>
                <p>Run the setup script to start Ollama:</p>
                <code>cd ollama && ./setup.sh</code>
              </div>
            </div>
            <div className={step}>
              <span className={stepNumber">2</span>
              <div className={span className={styles.stepContent}>
                <h4>Add Cloud Providers (Optional)</h4>
                <p>Configure OpenAI or Gemini as backup providers</p>
              </div>
            </div>
            <div className={step">
              <span className={stepNumber">3</span>
              <div className={span className={styles.stepContent}>
                <h4>Test Configuration</h4>
                <p>Verify all providers are working with the test button</p>
              </div>
            </div>
          </div>
          <div className={styles.advancedConfig}>
            <h3>Advanced Configuration</h3>
            <div className={styles.configOptions}>
              <div className={styles.configOption}>
                <button 
                  className={styles.advancedButton}
                  onClick={() => {
                    navigator.open('https://github.com/ollama/ollama?tab=readme', '_blank');
                  }}
                >
                  📖 Ollama Documentation
                </button>
                <button 
                  className={styles.advancedButton}
                  onClick={() => {
                    navigator.open('https://platform.openai.com/docs', '_blank');
                  }}
                >
                  📘 OpenAI API
                </button>
                <button 
                  className={styles.advancedButton}
                  onClick={() => {
                    navigator.open('https://ai.google.dev/models', '_blank');
                  }}
                >
                  🎯 Gemini API
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIProviderManager;
