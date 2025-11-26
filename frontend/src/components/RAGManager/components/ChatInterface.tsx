// Constitution: Chat Interface Component
import React, { useState, useRef, useEffect } from 'react';
import styles from '../RAGManager.module.css';

interface ChatMessage {
  Id: string;
  Role: 'user' | 'assistant';
  Content: string;
  Sources?: any[];
  CreatedAt: string;
}

interface ChatInterfaceProps {
  sessionId: string;
  onMessage: (message: ChatMessage) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ sessionId, onMessage }) => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/plugins/rag/sessions/${sessionId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          message: userMessage
        })
      });

      const result = await response.json();

      if (result.success) {
        // Add user message
        onMessage({
          Id: Math.random().toString(36).substr(2, 9),
          Role: 'user',
          Content: userMessage,
          CreatedAt: new Date().toISOString()
        });

        // Add assistant response
        onMessage({
          Id: Math.random().toString(36).substr(2, 9),
          Role: 'assistant',
          Content: result.response,
          Sources: result.sources || [],
          CreatedAt: new Date().toISOString()
        });
      } else {
        setError(result.error || 'Failed to send message');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className={styles.chatInterface}>
      <div className={styles.chatInputArea}>
        {error && (
          <div className={styles.chatError}>
            {error}
            <button 
              className={styles.errorClose}
              onClick={() => setError('')}
            >
              ×
            </button>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className={styles.chatForm}>
          <div className={styles.inputContainer}>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your documents... (Shift+Enter for new line)"
              className={styles.messageInput}
              rows={1}
              disabled={isLoading}
            />
            <button 
              type="submit" 
              disabled={!message.trim() || isLoading}
              className={styles.sendButton}
            >
              {isLoading ? (
                <div className={styles.loadingSpinner}></div>
              ) : (
                'Send →'
              )}
            </button>
          </div>
          
          <div className={styles.inputFooter}>
            <div className={styles.inputHints}>
              <span>💡 Tips:</span>
              <span>Ask specific questions about document content</span>
              <span>Reference documents by names or topics</span>
            </div>
            
            {isLoading && (
              <div className={styles.typingIndicator}>
                <span>AI is typing</span>
                <div className={styles.typingDots}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
      
      <div ref={messagesEndRef} />
    </div>
  );
};
