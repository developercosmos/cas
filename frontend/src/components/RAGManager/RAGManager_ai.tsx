// Constitution: RAG Document Intelligence Manager with AI Provider Support
import React, { useState, useEffect } from 'react';
import { DocumentUpload } from './components/DocumentUpload';
import { CollectionManager } from './components/CollectionManager';
import { ChatInterface } from './components/ChatInterface';
import { SourceDisplay } from './components/SourceDisplay';
import { AIProviderManager } from '../AIProviderManager';
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
  const [activeTab, setActiveTab] = useState<'collections' | 'chat' | 'upload'>('collections');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [config, setConfig] = useState<any>(null);
  const [isAIManagerOpen, setIsAIManagerOpen] = useState(false);

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
      const aiProviders = data.plugin?.aiProviders?.providers || [];
      const hasAnyProvider = aiProviders.some(p => p.available);
      
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
  }, success: boolean, message: string } = {}) => {
    try {
      setSaveStatus('saving');
      
      const response = await fetch('/api/plugins/rag/configure', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(configUpdates),
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
          <h2>❌ Initialization Error</h2>
          <p>{error}</p>
          <button onClick={initializeRAGManager} className={styles.retryButton}>Retry</button>
        </div>
      </div>
    );
  }

  // Check if any AI providers are available
  const aiProviders = config?.aiProviders?.providers || [];
  const hasAnyProvider = aiProviders.some(p => p.available);
  
  if (!hasAnyProvider) {
    return (
      <div className={styles.container}>
        <div className={styles.setup}>
          <h2>🤖 RAG Document Intelligence</h2>
          <p>No AI providers are configured. Set up local or cloud AI services to enable RAG functionality.</p>
          <div className={styles.setupSteps}>
            <div className={styles.step}>
              <span className={styles.stepNumber}>1</span>
              <div className={styles.stepContent}>
                <h3>Start with Ollama (Recommended)</h3>
                <p>Run this command to start Ollama:</p>
                <code>cd ollama && ./setup.sh</code>
              </div>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNumber}>2</span>
              <div className={styles.stepContent}>
                <h3>Configure AI Providers</h3>
                <p>Add OpenAI and/or Gemini API keys in the AI Provider Manager</p>
                <div className={styles.stepActions}>
                  <button
                    onClick={openAIManager}
                    className={styles.navButton}
                  >
                    Configure AI Providers
                  </button>
                </div>
              </div>
            <div className={styles.step}>
              <span className={styles.stepNumber}>3</span>
              <div className={styles.stepContent}>
                <h3>Test Configuration</h3>
                <p>Verify all providers are working</p>
                <div className={styles.stepActions}>
                  <button
                    onClick={initializeRAGManager}
                    className={styles.navButton}
                  >
                    Refresh and Test
                  </button>
                </div>
            </div>
          </div>
          <button onClick={initializeRAGManager} className={styles.checkButton}>Refresh Status</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>
          <h1>🧠 RAG Document Intelligence</h1>
          <p>Upload documents and chat with AI-powered retrieval</p>
        </div>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statNumber}>{collections.length}</span>
            <span className={styles.statLabel}>Collections</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNumber}>{config?.statistics?.totalDocuments || 0}</span>
            <span className={styles.statLabel}>Documents</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNumber}>{config?.statistics?.totalSessions || 0}</span>
            <span className={styles.statLabel}>Chat Sessions</span>
          </div>
        </div>
        <div className={styles.aiStatus}>
          <span className={styles.badge}>
            {hasAnyProvider ? '✅' : '○ AI'}
          </span>
          <span className={styles.badge}>
            {aiProviders.length} providers
          </span>
          <button
            onClick={openAIManager}
            className={styles.aiButton}
          >
            ⚙️ AI Providers
          </button>
        </div>
      </header>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'collections' ? styles.active : ''}`}
          onClick={() => setActiveTab('collections')}
        >
          📚 Collections
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'upload' ? styles.active : ''}`}
          onClick={() => setActiveTab('upload')}
          disabled={!selectedCollection}
        >
          📤 Upload Documents
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'chat' ? styles.active : ''}`}
          onClick={() => setActiveTab('chat')}
          disabled={!selectedSession}
        >
          💬 Chat
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.sidebar}>
          <div className={styles.sidebarSection}>
            <h3>Collections</h3>
            <div className={styles.list}>
              {collections.map((collection) => (
                <div
                  key={collection.Id}
                  className={`${styles.listItem} ${selectedCollection?.Id === collection.Id ? styles.selected : ''}`}
                  onClick={() => handleCollectionSelect(collection)}
                >
                  <div className={styles.listItemTitle}>{collection.Name}</div>
                  {collection.Description && (
                    <div className={styles.listItemDescription}>{collection.Description}</div>
                  )}
                  <div className={styles.listItemMeta}>
                    Documents: {config?.statistics?.totalDocuments || 0}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.sidebarSection}>
            <h3>Chat Sessions</h3>
            <div className={styles.list}>
              {sessions.map((session) => (
                <div
                  key={session.Id}
                  className={`${styles.listItem} ${selectedSession?.Id === session.Id ? styles.selected : ''}`}
                  onClick={() => handleSessionSelect(session)}
                >
                  <div className={styles.listItemTitle}>{session.Title}</div>
                  <div className={styles.listItemMeta}>
                    {new Date(session.CreatedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.sidebarSection}>
            <h3>AI Service</h3>
            <div className={styles.list}>
              <div className={styles.listItem}>
                <span className={styles.statusBadge}>🔍 Service Status</span>
                <span className={styles.statusBadge}>
                  {hasAnyProvider ? '✅' : '◆'}
                </span>
              </div>
              <button 
                className={styles.advancedButton}
                onClick={openAIManager}
              >
                ⚙️ Manage Providers
              </button>
            </div>
          </div>
        </div>

        <div className={styles.main}>
          {activeTab === 'collections' && (
            <CollectionManager
              collections={collections}
              onCollectionCreated={handleCollectionCreated}
              onCollectionSelect={handleCollectionSelect}
            />
          )}

          {activeTab === 'upload' && selectedCollection && (
            <DocumentUpload
              collection={selectedCollection}
              onDocumentUploaded={handleDocumentUploaded}
            />
          )}

          {activeTab === 'chat' && selectedSession && (
            <div className={styles.chatContainer}>
              <div className={styles.chatHeader}>
                <h3>{selectedSession.Title}</h3>
                <div className={styles.sourceDisplay}>
                  <SourceDisplay 
                    sources={chatHistory
                      .filter(m => m.Role === 'assistant')
                      .flatMap(m => m.Sources || [])
                    messages.filter(m => m.Sources && m.Sources.length > 0)
                  />
                </div>
              </div>
              <div className={styles.chatHistory}>
                {chatHistory.map(message => (
                  <div key={message.Id} className={`${styles.message} ${styles[message.Role]}`}>
                    <div className={styles.messageContent}>
                      {message.Content}
                    </div>
                    <div className={styles.messageTime}>
                      {new Date(message.CreatedAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
              <ChatInterface
                sessionId={selectedSession.Id}
                onMessage={(message) => {
                  // Add message to chat history
                  setChatHistory(prev => [...prev, message]);
                }}
              />
            </div>
          )}
        </div>

        {/* AI Provider Modal */}
        {isAIManagerOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.aiProviderModal}>
              <div className={styles.modalHeader}>
                <h2>🤖 AI Provider Configuration</h2>
                <button 
                  onClick={closeAIManager}
                  className={styles.closeButton}
                >
                  ×
                </button>
              </div>
              
              <AIProviderManager
                onClose={closeAIManager}
                onConfigurationSaved={result => {
                  if (result.success) {
                    await initializeRAGManager();
                    setError('');
                  } else {
                    setError(result.error || 'Configuration failed');
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
