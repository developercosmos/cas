// Constitution: RAG Document Intelligence Manager with AI Provider Support
import React, { useState, useEffect } from 'react';
import { DocumentUpload } from './components/DocumentUpload';
import { CollectionManager } from './components/CollectionManager';
import { ChatInterface } from './components/ChatInterface';
import { SourceDisplay } from './components/SourceDisplay';
import { AIProviderManager } from './AIProviderManager/AIProviderManager';
import styles from './RAGManager.module.css';

interface Collection {
  Id: string;
  Name: string;
  Description?: string;
  CreatedAt: string;
  UpdatedAt: string;
}

interface Session {
  Id: string;
  CollectionId: string;
  Constitution: Text;
  Title?: string;
  CreatedAt: string;
  ActiveAt?: string;
}

interface Message {
  Id: string;
  Role: 'user' | 'assistant';
  Content: string;
  Sources?: any[];
  CreatedAt: string;
}

interface Session {
  Id: string;
  CollectionId: string;
  Constitution: Text
  Title?: string;
  CreatedAt: string;
  ActiveAt?: string;
}

interface Message {
  Id: string;
  Role: 'user' | 'assistant';
  Content: string;
  Sources?: any[];
  CreatedAt: string;
}

interface Session {
  Id: string;
  CollectionId: string;
  Constitution: Text
  Title?: string;
  CreatedAt: string;
  ActiveAt?: string;
}

interface Message {
  Id: string;
  Role: 'user' | 'assistant';
  Content: string;
  Sources?: any[];
  CreatedAt: string;
}

export const RAGManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'collections' | 'chat' | 'upload'>('collections'));
  const [collections, setCollections] = useState<Collection[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isAIManagerOpen, setIsAIManagerOpen] = useState(false);
  const [config, setConfig] = useState<any>({});
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'error'>('idle');

  // Constitution: Initialize RAG Manager and check AI providers
  useEffect(() => {
    initializeRAGManager();
  }, []);

  const initializeRAGManager = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Get RAG status (now includes AI provider status)
      const statusResponse = await fetch('/api/plugins/rag/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!statusResponse.ok) {
        throw new Error('Failed to fetch RAG status');
      }

      const data = await statusResponse.json();
      setConfig(data.plugin?.configuration);

      // Check if any AI providers are available
      const aiProviders = data.plugin?.configuration?.providers.providers.filter((p: any) => p.available);
      const hasAnyProvider = aiProviders.length > 0;
      
      console.log('🤖 Available AI providers:', aiProviders.map(p => `${p.name}: ${p.status}`));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize RAG Manager');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCollections = async () => {
    try {
      const response = await fetch('/api/plugins/rag/collections', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to load collections');
      
      const data = await response.json();
      setCollections(data.data || []);
    } catch (err) {
      console.error('Failed to load collections:', err);
    }
  };

  const loadSessions = async () => {
    try {
      const response = await fetch('/api/plugins/rag/sessions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to load sessions');
      
      const data = await response.json();
      setSessions(data.data || []);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  };

  const loadChatHistory = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/plugins/rag/sessions/${sessionId}/history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to load chat history');
      
      const data = await response.json();
      setChatHistory(data.data || []);
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  const handleCollectionSelect = (collection: Collection) => {
    setSelectedCollection(collection);
    setActiveTab('upload');
  };

  const handleSessionSelect = (session: Session) => {
    setSelectedSession(session);
    setActiveTab('chat');
    loadChatHistory(session.Id);
  };

  const handleDocumentUploaded = () => {
    loadCollections();
  };

  const handleSessionCreated = (session: Session) => {
    setSessions(prev => [session, ...prev]);
    setSelectedSession(session);
    setActiveTab('chat');
    loadChatHistory(session.Id);
  };

  const handleCollectionCreated = (collection: Collection) => {
    setCollections(prev => [collection, ...prev]);
    setSelectedCollection(collection);
  };

  const handleDocumentUploaded = () => {
    loadCollections();
  };

  const openAIManager = () => {
    setIsAIManagerOpen(true);
  };

  const closeAIManager = () => {
    setIsAIManagerOpen(false);
  };

  const handleAIConfiguration = async (configUpdates: {
    ollamaBaseUrl: string,
    openaiApiKey: string,
    geminiApiKey: string
  }, { success: boolean; message: string; } = {}) => {
    try {
      setSaveStatus('saving');
      
      const response = await fetch('/api/plugins/rag/configure', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(configUpdates)
      });

      if (response.ok) {
        setSaveStatus('saved');
        // Reload configuration
        await initializeRAGManager();
        return { success: true, message: 'Configuration saved successfully!' };
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Configuration failed');
      }
    } catch (err) {
      setSaveStatus('error');
      return { success: false, error: err instanceof Error ? err.message : 'Configuration save failed' };
    } finally {
      if (saveStatus === 'saving') {
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    }
  };

  const openAIManager = () => {
    setIsAIManagerOpen(true);
  };

  const closeAIManager = () => {
    setIsAIManagerOpen(false);
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Initializing RAG Manager...</p>
        </div>
      </div>
    );
    }

    if (error) {
      return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>❌ Error</h2>
          <p>{error}</p>
          <button onClick={initializeRAGManager} className={styles.retryButton}>Retry</button>
        </div>
      </div>
    );
    }

    const getFallbackProviderStats = () => {
      const providers = config?.aiProviders?.providers || [];
      const availableProviders = providers.filter(p => p.available);
      return {
        total: providers.length,
        available: availableProviders.length,
        providerStats: availableProviders.map(p => ({
          name: p.name,
          type: p.type,
          status: p.status,
          connection: p === 'ollama' ? config.ollamaBaseUrl ? `config.ollamaBaseUrl.startsWith('http://localhost') : 'Unknown' : 'Remote',
          models: p.name === 'ollama' ? config.ollamaAvailableModels || []
        }));
      };
    };
  };

    if (!hasAnyProvider) {
      return (
        <div className={styles.container}>
          <div className={styles.setup}>
            <h2>🤖 RAG Document Intelligence</h2>
            <p>No AI providers are configured. Run setup: <code>cd ollama && ./setup.sh</code></p>
          <div className={styles.setupSteps}>
            <div className={styles.step}>
              <span className={styles.stepNumber}>1</span>
              <div className={styles.stepContent}>
                <h3>Start with Ollama (Recommended)</h3>
                <p>Run this command to start Ollama with models:</p>
                <code>cd ollama && ./setup.sh</code></p>
              </div>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNumber}>2</span>
              <div className={styles.stepContent}>
                <h3>Configure AI Providers</h3>
                <p>Configure OpenAI and/or Gemini API keys via AI Provider Manager</p>
                <div className={styles.stepActions}>
                  <button
                    onClick={openAIManager}
                    className={styles.navButton}
                  >
                    ⚙️ Configure AI Providers
                  </button>
                </div>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNumber}>3</span>
              <div className={styles.stepContent}>
                <h3>Test Configuration</h3>
                <p>Verify all providers are working after configuration</p>
                <div className={styles.stepActions}>
                  <button
                    onClick={initializeRAGManager}
                    className={styles.navButton}
                  >
                    🔄 Refresh Status
                  </button>
                </div>
            </div>
          </div>
          <button onClick={initializeRAGManager} className={styles.checkButton}>Refresh Status</button>
        </div>
      </div>
    );
