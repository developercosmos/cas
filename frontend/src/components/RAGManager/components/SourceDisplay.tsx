// Constitution: Source Display Component
import React, { useState } from 'react';
import styles from '../RAGManager.module.css';

interface RAGSource {
  Id: string;
  Title?: string;
  Content: string;
  Score: number;
  Metadata?: Record<string, any>;
}

interface SourceDisplayProps {
  sources: RAGSource[];
}

export const SourceDisplay: React.FC<SourceDisplayProps> = ({ sources }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());

  if (!sources || sources.length === 0) {
    return null;
  }

  const toggleSource = (sourceId: string) => {
    const newExpanded = new Set(expandedSources);
    if (newExpanded.has(sourceId)) {
      newExpanded.delete(sourceId);
    } else {
      newExpanded.add(sourceId);
    }
    setExpandedSources(newExpanded);
  };

  const formatScore = (score: number) => {
    return Math.round(score * 100);
  };

  const truncateContent = (content: string, maxLength: number = 200) => {
    return content.length > maxLength 
      ? content.substring(0, maxLength) + '...' 
      : content;
  };

  return (
    <div className={styles.sourceDisplay}>
      <div className={styles.sourceHeader}>
        <h4>📎 Sources ({sources.length})</h4>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className={styles.toggleButton}
        >
          {isExpanded ? 'Hide' : 'Show'}
        </button>
      </div>

      {isExpanded && (
        <div className={styles.sourceList}>
          {sources.map((source, index) => {
            const isSourceExpanded = expandedSources.has(source.Id);
            
            return (
              <div key={source.Id} className={styles.sourceItem}>
                <div className={styles.sourceItemHeader}>
                  <div className={styles.sourceItemInfo}>
                    <span className={styles.sourceIndex}>{index + 1}</span>
                    <h5>{source.Title || 'Untitled Document'}</h5>
                    <span className={styles.sourceScore}>
                      {formatScore(source.Score)}% match
                    </span>
                  </div>
                  <button 
                    onClick={() => toggleSource(source.Id)}
                    className={styles.sourceToggle}
                  >
                    {isSourceExpanded ? '▼' : '▶'}
                  </button>
                </div>

                <div className={styles.sourceContent}>
                  {isSourceExpanded ? (
                    <div className={styles.sourceFullContent}>
                      <p>{source.Content}</p>
                      
                      {source.Metadata && Object.keys(source.Metadata).length > 0 && (
                        <div className={styles.sourceMeta}>
                          <h6>Metadata:</h6>
                          <ul>
                            {Object.entries(source.Metadata).map(([key, value]) => (
                              <li key={key}>
                                <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={styles.sourcePreview}>
                      <p>{truncateContent(source.Content)}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className={styles.sourceFooter}>
        <small>
          These are the most relevant documents used to generate the response.
        </small>
      </div>
    </div>
  );
};
