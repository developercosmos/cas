import React, { useState, useEffect } from 'react';
import styles from './RAGConfiguration.module.css';
import { Button, Input, Switch, CustomSelect } from '../base-ui/styled-components';

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
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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

  // Constitution: Validate configuration before save
  const validateConfiguration = (): boolean => {
    const errors: Record<string, string> = {};

    if (!config.openaiConfig.enabled && !config.geminiConfig.enabled && !config.ollamaConfig.enabled) {
      errors.general = 'At least one AI provider must be enabled';
    }

    if (config.openaiConfig.enabled && !config.openaiConfig.apiKey?.trim()) {
      errors.openaiApiKey = 'OpenAI API key is required when OpenAI is enabled';
    }

    if (config.geminiConfig.enabled && !config.geminiConfig.apiKey?.trim()) {
      errors.geminiApiKey = 'Gemini API key is required when Gemini is enabled';
    }

    if (config.ollamaConfig.enabled && !config.ollamaConfig.endpoint?.trim()) {
      errors.ollamaEndpoint = 'Ollama endpoint is required when Ollama is enabled';
    }

    if (config.maxChunkSize < 100 || config.maxChunkSize > 10000) {
      errors.maxChunkSize = 'Max chunk size must be between 100 and 10000';
    }

    if (config.chunkOverlap < 0 || config.chunkOverlap > 500) {
      errors.chunkOverlap = 'Chunk overlap must be between 0 and 500';
    }

    if (config.contextWindow < 1000 || config.contextWindow > 128000) {
      errors.contextWindow = 'Context window must be between 1000 and 128000';
    }

    if (config.retrievalCount < 1 || config.retrievalCount > 20) {
      errors.retrievalCount = 'Retrieval count must be between 1 and 20';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Constitution: Save configuration
  const handleSave = async () => {
    if (!validateConfiguration()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

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

    // Clear related errors when provider is toggled
    if (formErrors[`${provider}ApiKey`] || formErrors[`${provider}Endpoint`]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`${provider}ApiKey`];
        delete newErrors[`${provider}Endpoint`];
        return newErrors;
      });
    }
  };

  const handleProviderInputChange = (provider: 'openai' | 'gemini' | 'ollama', field: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      [`${provider}Config`]: { ...prev[`${provider}Config`], [field]: value }
    }));

    // Clear related error when user starts typing
    if (formErrors[`${provider}${field.charAt(0).toUpperCase() + field.slice(1)}`]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`${provider}${field.charAt(0).toUpperCase() + field.slice(1)}`];
        return newErrors;
      });
    }
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

  const handleConfigChange = (field: keyof RAGConfigState, value: string | number) => {
    setConfig(prev => ({ ...prev, [field]: value }));

    // Clear related error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const embeddingModelOptions = [
    { value: 'text-embedding-3-small', label: 'text-embedding-3-small (1536 dimensions)' },
    { value: 'text-embedding-3-large', label: 'text-embedding-3-large (3072 dimensions)' }
  ];

  const chatModelOptions = [
    { value: 'gpt-3.5-turbo', label: 'gpt-3.5-turbo (Fast, Cost-effective)' },
    { value: 'gpt-4', label: 'gpt-4 (Advanced, Higher quality)' },
    { value: 'gpt-4-turbo', label: 'gpt-4-turbo (Fast, Advanced)' }
  ];

  return (
    <div className={styles.configurationModal}>
      <div className={styles.modalHeader}>
        <h2>RAG Plugin Configuration</h2>
        <Button onClick={onClose} variant="ghost" size="sm">
          ✕
        </Button>
      </div>

      <div className={styles.configContent}>
        {formErrors.general && (
          <div className={styles.error}>
            {formErrors.general}
            <Button onClick={() => setFormErrors(prev => ({ ...prev, general: '' }))} variant="ghost" size="sm">
              ×
            </Button>
          </div>
        )}

        {error && (
          <div className={styles.error}>
            {error}
            <Button onClick={() => setError(null)} variant="ghost" size="sm">
              ×
            </Button>
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
                <Switch
                  checked={config.openaiConfig.enabled}
                  onCheckedChange={() => toggleProvider('openai')}
                  id="openai-enabled"
                />
              </div>
              <div className={styles.providerSettings}>
                <div className={styles.settingGroup}>
                  <label>API Key</label>
                  <Input
                    type="password"
                    value={config.openaiConfig.apiKey || ''}
                    onChange={(e) => handleProviderInputChange('openai', 'apiKey', e.target.value)}
                    placeholder="sk-..."
                    disabled={!config.openaiConfig.enabled}
                    fullWidth
                  />
                  {formErrors.openaiApiKey && (
                    <span className={styles.errorText}>{formErrors.openaiApiKey}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Gemini Configuration */}
            <div className={`${styles.providerCard} ${config.geminiConfig.enabled ? styles.providerEnabled : ''}`}>
              <div className={styles.providerHeader}>
                <h4>Gemini</h4>
                <Switch
                  checked={config.geminiConfig.enabled}
                  onCheckedChange={() => toggleProvider('gemini')}
                  id="gemini-enabled"
                />
              </div>
              <div className={styles.providerSettings}>
                <div className={styles.settingGroup}>
                  <label>API Key</label>
                  <Input
                    type="password"
                    value={config.geminiConfig.apiKey || ''}
                    onChange={(e) => handleProviderInputChange('gemini', 'apiKey', e.target.value)}
                    placeholder="AIza..."
                    disabled={!config.geminiConfig.enabled}
                    fullWidth
                  />
                  {formErrors.geminiApiKey && (
                    <span className={styles.errorText}>{formErrors.geminiApiKey}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Ollama Configuration */}
            <div className={`${styles.providerCard} ${config.ollamaConfig.enabled ? styles.providerEnabled : ''}`}>
              <div className={styles.providerHeader}>
                <h4>Ollama (Local)</h4>
                <Switch
                  checked={config.ollamaConfig.enabled}
                  onCheckedChange={() => toggleProvider('ollama')}
                  id="ollama-enabled"
                />
              </div>
              <div className={styles.providerSettings}>
                <div className={styles.settingGroup}>
                  <label>Endpoint URL</label>
                  <Input
                    type="text"
                    value={config.ollamaConfig.endpoint || ''}
                    onChange={(e) => handleProviderInputChange('ollama', 'endpoint', e.target.value)}
                    placeholder="http://localhost:11434"
                    disabled={!config.ollamaConfig.enabled}
                    fullWidth
                  />
                  {formErrors.ollamaEndpoint && (
                    <span className={styles.errorText}>{formErrors.ollamaEndpoint}</span>
                  )}
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
                  <Button
                    onClick={() => moveProviderUp(provider)}
                    disabled={index === 0}
                    variant="ghost"
                    size="sm"
                  >
                    ↑
                  </Button>
                  <Button
                    onClick={() => moveProviderDown(provider)}
                    disabled={index === config.fallbackChain.length - 1}
                    variant="ghost"
                    size="sm"
                  >
                    ↓
                  </Button>
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
              <CustomSelect
                options={embeddingModelOptions}
                value={config.embeddingModel}
                onValueChange={(value) => handleConfigChange('embeddingModel', value)}
                fullWidth
              />
            </div>

            <div className={styles.settingGroup}>
              <label>Chat Model</label>
              <CustomSelect
                options={chatModelOptions}
                value={config.chatModel}
                onValueChange={(value) => handleConfigChange('chatModel', value)}
                fullWidth
              />
            </div>
          </div>
        </section>

        {/* Processing Configuration */}
        <section className={styles.configSection}>
          <h3>⚙️ Processing Configuration</h3>

          <div className={styles.settingRow}>
            <div className={styles.settingGroup}>
              <label>Max Chunk Size</label>
              <Input
                type="number"
                value={config.maxChunkSize.toString()}
                onChange={(e) => handleConfigChange('maxChunkSize', parseInt(e.target.value) || 1000)}
                min="100"
                max="10000"
                fullWidth
              />
              <span className={styles.settingHint}>Tokens per chunk (100-10000)</span>
              {formErrors.maxChunkSize && (
                <span className={styles.errorText}>{formErrors.maxChunkSize}</span>
              )}
            </div>

            <div className={styles.settingGroup}>
              <label>Chunk Overlap</label>
              <Input
                type="number"
                value={config.chunkOverlap.toString()}
                onChange={(e) => handleConfigChange('chunkOverlap', parseInt(e.target.value) || 200)}
                min="0"
                max="500"
                fullWidth
              />
              <span className={styles.settingHint}>Token overlap between chunks (0-500)</span>
              {formErrors.chunkOverlap && (
                <span className={styles.errorText}>{formErrors.chunkOverlap}</span>
              )}
            </div>
          </div>

          <div className={styles.settingRow}>
            <div className={styles.settingGroup}>
              <label>Context Window</label>
              <Input
                type="number"
                value={config.contextWindow.toString()}
                onChange={(e) => handleConfigChange('contextWindow', parseInt(e.target.value) || 4000)}
                min="1000"
                max="128000"
                fullWidth
              />
              <span className={styles.settingHint}>Total context tokens (1000-128000)</span>
              {formErrors.contextWindow && (
                <span className={styles.errorText}>{formErrors.contextWindow}</span>
              )}
            </div>

            <div className={styles.settingGroup}>
              <label>Retrieval Count</label>
              <Input
                type="number"
                value={config.retrievalCount.toString()}
                onChange={(e) => handleConfigChange('retrievalCount', parseInt(e.target.value) || 5)}
                min="1"
                max="20"
                fullWidth
              />
              <span className={styles.settingHint}>Document chunks to retrieve (1-20)</span>
              {formErrors.retrievalCount && (
                <span className={styles.errorText}>{formErrors.retrievalCount}</span>
              )}
            </div>
          </div>

          <div className={styles.settingRow}>
            <div className={styles.settingGroup}>
              <label>Temperature</label>
              <div className={styles.rangeContainer}>
                <input
                  type="range"
                  value={config.temperature}
                  onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value) || 0.7)}
                  min="0"
                  max="2"
                  step="0.1"
                  className={styles.rangeInput}
                />
                <span className={styles.temperatureValue}>{config.temperature.toFixed(1)}</span>
              </div>
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
        <Button
          onClick={handleSave}
          disabled={loading}
          variant="primary"
        >
          {loading ? 'Saving...' : 'Save Configuration'}
        </Button>
        <Button onClick={onClose} variant="secondary">
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default RAGConfiguration;