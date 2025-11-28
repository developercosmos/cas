import React, { useState, useEffect } from 'react';
import styles from './RAGConfiguration.module.css';

// Constitution: TypeScript interfaces following CAS standards
interface RAGProviderConfig {
  name: string;
  enabled: boolean;
  apiKey?: string;
  endpoint?: string;
  model?: string;
}

interface RAGConfigState {
  openaiConfig: RAGProviderConfig;
  geminiConfig: RAGProviderConfig;
  ollamaConfig: RAGProviderConfig;
  primaryProvider: 'openai' | 'gemini' | 'ollama';
  fallbackChain: string[];
  embeddingModel: string;
  chatModel: string;
  maxChunkSize: number;
  chunkOverlap: number;
  contextWindow: number;
  temperature: number;
  retrievalCount: number;
}

interface RAGConfigurationProps {
  configId: string;
  onClose: () => void;
  onSave: (config: RAGConfigState) => void;
}

const RAGConfiguration: React.FC<RAGConfigurationProps> = ({ configId, onClose, onSave }) => {
  const [config, setConfig] = useState<RAGConfigState>({
    openaiConfig: { name: 'OpenAI', enabled: false, apiKey: '' },
    geminiConfig: { name: 'Gemini', enabled: false, apiKey: '' },
    ollamaConfig: { name: 'Ollama', enabled: true, endpoint: 'http://localhost:11434' },
    primaryProvider: 'ollama',
    fallbackChain: ['openai', 'gemini'],
    embeddingModel: 'text-embedding-3-small',
    chatModel: 'gpt-3.5-turbo',
    maxChunkSize: 1000,
    chunkOverlap: 200,
    contextWindow: 4000,
    temperature: 0.7,
    retrievalCount: 5
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Constitution: Load existing configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        const response = await fetch(`/api/plugins/rag-retrieval/configure`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.configuration) {
            setConfig(data.configuration);
          }
        }
      } catch (err) {
        console.error('Failed to load RAG configuration:', err);
      }
    };

    loadConfig();
  }, [configId]);

  // Constitution: Save configuration
  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate configuration
      if (!config.openaiConfig.enabled && !config.geminiConfig.enabled && !config.ollamaConfig.enabled) {
        setError('At least one AI provider must be enabled');
        return;
      }

      if (config.openaiConfig.enabled && !config.openaiConfig.apiKey) {
        setError('OpenAI API key is required when OpenAI is enabled');
        return;
      }

      if (config.geminiConfig.enabled && !config.geminiConfig.apiKey) {
        setError('Gemini API key is required when Gemini is enabled');
        return;
      }

      if (config.ollamaConfig.enabled && !config.ollamaConfig.endpoint) {
        setError('Ollama endpoint is required when Ollama is enabled');
        return;
      }

      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Authentication token not found');
        return;
      }

      // Prepare configuration payload
      const payload = {
        openaiApiKey: config.openaiConfig.enabled ? config.openaiConfig.apiKey : undefined,
        geminiApiKey: config.geminiConfig.enabled ? config.geminiConfig.apiKey : undefined,
        ollamaUrl: config.ollamaConfig.enabled ? config.ollamaConfig.endpoint : undefined,
        primaryProvider: config.primaryProvider,
        fallbackChain: config.fallbackChain,
        embeddingModel: config.embeddingModel,
        chatModel: config.chatModel,
        maxChunkSize: config.maxChunkSize,
        chunkOverlap: config.chunkOverlap,
        contextWindow: config.contextWindow,
        temperature: config.temperature,
        retrievalCount: config.retrievalCount
      };

      const response = await fetch(`/api/plugins/rag-retrieval/configure`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        onSave(result.configuration);
        onClose();
      } else {
        setError(result.message || 'Configuration save failed');
      }
    } catch (err) {
      console.error('Configuration save error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  // Constitution: Helper functions for provider management
  const toggleProvider = (provider: 'openai' | 'gemini' | 'ollama') => {
    setConfig(prev => ({
      ...prev,
      openaiConfig: provider === 'openai' ? { ...prev.openaiConfig, enabled: !prev.openaiConfig.enabled } : prev.openaiConfig,
      geminiConfig: provider === 'gemini' ? { ...prev.geminiConfig, enabled: !prev.geminiConfig.enabled } : prev.geminiConfig,
      ollamaConfig: provider === 'ollama' ? { ...prev.ollamaConfig, enabled: !prev.ollamaConfig.enabled } : prev.ollamaConfig,
      primaryProvider: prev.primaryProvider === provider && !prev[`${provider}Config`].enabled ? 'ollama' : prev.primaryProvider
    }));
  };

  const moveProviderUp = (provider: string) => {
    const currentOrder = config.fallbackChain;
    const currentIndex = currentOrder.indexOf(provider);
    if (currentIndex > 0) {
      const newOrder = [...currentOrder];
      [newOrder[currentIndex - 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex - 1]];
      setConfig(prev => ({ ...prev, fallbackChain: newOrder }));
    }
  };

  const moveProviderDown = (provider: string) => {
    const currentOrder = config.fallbackChain;
    const currentIndex = currentOrder.indexOf(provider);
    if (currentIndex < currentOrder.length - 1) {
      const newOrder = [...currentOrder];
      [newOrder[currentIndex + 1], newOrder[currentIndex]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
      setConfig(prev => ({ ...prev, fallbackChain: newOrder }));
    }
  };

  return (
    <div className={styles.configurationModal}>
      <div className={styles.modalHeader}>
        <h2>RAG Plugin Configuration</h2>
        <button onClick={onClose} className={styles.closeButton}>✕</button>
      </div>

      <div className={styles.configContent}>
        {error && (
          <div className={styles.error}>
            {error}
            <button onClick={() => setError(null)} className={styles.clearError}>×</button>
          </div>
        )}

        {/* AI Providers Configuration */}
        <section className={styles.configSection}>
          <h3>🤖 AI Providers Configuration</h3>
          <p className={styles.sectionDescription}>
            Configure one or more AI providers. RAG will use them in the order of fallback chain.
          </p>

          <div className={styles.providersGrid}>
            {/* OpenAI Configuration */}
            <div className={`${styles.providerCard} ${config.openaiConfig.enabled ? styles.providerEnabled : ''}`}>
              <div className={styles.providerHeader}>
                <h4>OpenAI</h4>
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    checked={config.openaiConfig.enabled}
                    onChange={() => toggleProvider('openai')}
                  />
                  <span className={styles.switch}></span>
                </label>
              </div>
              <div className={styles.providerSettings}>
                <div className={styles.settingGroup}>
                  <label>API Key</label>
                  <input
                    type="password"
                    value={config.openaiConfig.apiKey || ''}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      openaiConfig: { ...prev.openaiConfig, apiKey: e.target.value }
                    }))}
                    placeholder="sk-..."
                    disabled={!config.openaiConfig.enabled}
                    className={styles.apiKeyInput}
                  />
                </div>
              </div>
            </div>

            {/* Gemini Configuration */}
            <div className={`${styles.providerCard} ${config.geminiConfig.enabled ? styles.providerEnabled : ''}`}>
              <div className={styles.providerHeader}>
                <h4>Gemini</h4>
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    checked={config.geminiConfig.enabled}
                    onChange={() => toggleProvider('gemini')}
                  />
                  <span className={styles.switch}></span>
                </label>
              </div>
              <div className={styles.providerSettings}>
                <div className={styles.settingGroup}>
                  <label>API Key</label>
                  <input
                    type="password"
                    value={config.geminiConfig.apiKey || ''}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      geminiConfig: { ...prev.geminiConfig, apiKey: e.target.value }
                    }))}
                    placeholder="AIza..."
                    disabled={!config.geminiConfig.enabled}
                    className={styles.apiKeyInput}
                  />
                </div>
              </div>
            </div>

            {/* Ollama Configuration */}
            <div className={`${styles.providerCard} ${config.ollamaConfig.enabled ? styles.providerEnabled : ''}`}>
              <div className={styles.providerHeader}>
                <h4>Ollama (Local)</h4>
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    checked={config.ollamaConfig.enabled}
                    onChange={() => toggleProvider('ollama')}
                  />
                  <span className={styles.switch}></span>
                </label>
              </div>
              <div className={styles.providerSettings}>
                <div className={styles.settingGroup}>
                  <label>Endpoint URL</label>
                  <input
                    type="text"
                    value={config.ollamaConfig.endpoint || ''}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      ollamaConfig: { ...prev.ollamaConfig, endpoint: e.target.value }
                    }))}
                    placeholder="http://localhost:11434"
                    disabled={!config.ollamaConfig.enabled}
                    className={styles.endpointInput}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Fallback Chain Configuration */}
        <section className={styles.configSection}>
          <h3>🔄 Fallback Chain Order</h3>
          <p className={styles.sectionDescription}>
            Drag and drop to reorder providers. RAG will try them in this order.
          </p>
          <div className={styles.fallbackChain}>
            {config.fallbackChain.map((provider, index) => (
              <div key={provider} className={styles.chainItem}>
                <span className={styles.providerName}>
                  {provider === 'openai' ? 'OpenAI' : 
                   provider === 'gemini' ? 'Gemini' : 'Ollama'}
                </span>
                <div className={styles.chainControls}>
                  <button
                    onClick={() => moveProviderUp(provider)}
                    disabled={index === 0}
                    className={styles.chainButton}
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveProviderDown(provider)}
                    disabled={index === config.fallbackChain.length - 1}
                    className={styles.chainButton}
                  >
                    ↓
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Model Configuration */}
        <section className={styles.configSection}>
          <h3>🧠 Model Configuration</h3>
          
          <div className={styles.settingRow}>
            <div className={styles.settingGroup}>
              <label>Embedding Model</label>
              <select
                value={config.embeddingModel}
                onChange={(e) => setConfig(prev => ({ ...prev, embeddingModel: e.target.value }))}
                className={styles.modelSelect}
              >
                <option value="text-embedding-3-small">text-embedding-3-small (1536 dimensions)</option>
                <option value="text-embedding-3-large">text-embedding-3-large (3072 dimensions)</option>
              </select>
            </div>

            <div className={styles.settingGroup}>
              <label>Chat Model</label>
              <select
                value={config.chatModel}
                onChange={(e) => setConfig(prev => ({ ...prev, chatModel: e.target.value }))}
                className={styles.modelSelect}
              >
                <option value="gpt-3.5-turbo">gpt-3.5-turbo (Fast, Cost-effective)</option>
                <option value="gpt-4">gpt-4 (Advanced, Higher quality)</option>
                <option value="gpt-4-turbo">gpt-4-turbo (Fast, Advanced)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Processing Configuration */}
        <section className={styles.configSection}>
          <h3>⚙️ Processing Configuration</h3>
          
          <div className={styles.settingRow}>
            <div className={styles.settingGroup}>
              <label>Max Chunk Size</label>
              <input
                type="number"
                value={config.maxChunkSize}
                onChange={(e) => setConfig(prev => ({ ...prev, maxChunkSize: parseInt(e.target.value) || 1000 }))}
                min="100"
                max="10000"
                className={styles.numberInput}
              />
              <span className={styles.settingHint}>Tokens per chunk (100-10000)</span>
            </div>

            <div className={styles.settingGroup}>
              <label>Chunk Overlap</label>
              <input
                type="number"
                value={config.chunkOverlap}
                onChange={(e) => setConfig(prev => ({ ...prev, chunkOverlap: parseInt(e.target.value) || 200 }))}
                min="0"
                max="500"
                className={styles.numberInput}
              />
              <span className={styles.settingHint}>Token overlap between chunks (0-500)</span>
            </div>
          </div>

          <div className={styles.settingRow}>
            <div className={styles.settingGroup}>
              <label>Context Window</label>
              <input
                type="number"
                value={config.contextWindow}
                onChange={(e) => setConfig(prev => ({ ...prev, contextWindow: parseInt(e.target.value) || 4000 }))}
                min="1000"
                max="128000"
                className={styles.numberInput}
              />
              <span className={styles.settingHint}>Total context tokens (1000-128000)</span>
            </div>

            <div className={styles.settingGroup}>
              <label>Retrieval Count</label>
              <input
                type="number"
                value={config.retrievalCount}
                onChange={(e) => setConfig(prev => ({ ...prev, retrievalCount: parseInt(e.target.value) || 5 }))}
                min="1"
                max="20"
                className={styles.numberInput}
              />
              <span className={styles.settingHint}>Document chunks to retrieve (1-20)</span>
            </div>
          </div>

          <div className={styles.settingRow}>
            <div className={styles.settingGroup}>
              <label>Temperature</label>
              <input
                type="range"
                value={config.temperature}
                onChange={(e) => setConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) || 0.7 }))}
                min="0"
                max="2"
                step="0.1"
                className={styles.rangeInput}
              />
              <span className={styles.temperatureValue}>{config.temperature.toFixed(1)}</span>
              <span className={styles.settingHint}>
                {config.temperature < 0.3 ? 'Very deterministic' :
                 config.temperature < 0.7 ? 'Balanced' :
                 config.temperature < 1.2 ? 'Creative' : 'Very creative'}
              </span>
            </div>
          </div>
        </section>

        {/* Configuration Summary */}
        <section className={styles.configSection}>
          <h3>📋 Configuration Summary</h3>
          <div className={styles.configSummary}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Primary Provider:</span>
              <span className={styles.summaryValue}>
                {config.primaryProvider === 'openai' ? 'OpenAI' :
                 config.primaryProvider === 'gemini' ? 'Gemini' : 'Ollama'}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Enabled Providers:</span>
              <span className={styles.summaryValue}>
                {[
                  config.openaiConfig.enabled ? 'OpenAI' : null,
                  config.geminiConfig.enabled ? 'Gemini' : null,
                  config.ollamaConfig.enabled ? 'Ollama' : null
                ].filter(Boolean).join(', ') || 'None'}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Fallback Order:</span>
              <span className={styles.summaryValue}>
                {config.fallbackChain.map(p => 
                  p === 'openai' ? 'OpenAI' :
                  p === 'gemini' ? 'Gemini' : 'Ollama'
                ).join(' → ')}
              </span>
            </div>
          </div>
        </section>
      </div>

      <div className={styles.modalFooter}>
        <button 
          onClick={handleSave}
          disabled={loading}
          className={styles.saveButton}
        >
          {loading ? 'Saving...' : 'Save Configuration'}
        </button>
        <button onClick={onClose} className={styles.cancelButton}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default RAGConfiguration;
