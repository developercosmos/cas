// Constitution: Collection Manager Component
import React, { useState } from 'react';
import styles from '../RAGManager.module.css';

interface Collection {
  Id: string;
  Name: string;
  Description?: string;
  CreatedAt: string;
  UpdatedAt: string;
}

interface CollectionManagerProps {
  collections: Collection[];
  onCollectionCreated: (collection: Collection) => void;
  onCollectionSelect: (collection: Collection) => void;
}

export const CollectionManager: React.FC<CollectionManagerProps> = ({ 
  collections, 
  onCollectionCreated, 
  onCollectionSelect 
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    embeddingModel: 'text-embedding-3-small',
    chunkSize: '1000',
    chunkOverlap: '200',
    maxRetrievalCount: '5'
  });
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Collection name is required');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const response = await fetch('/api/plugins/rag/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          embeddingModel: formData.embeddingModel,
          chunkSize: parseInt(formData.chunkSize),
          chunkOverlap: parseInt(formData.chunkOverlap),
          maxRetrievalCount: parseInt(formData.maxRetrievalCount)
        })
      });

      const result = await response.json();

      if (result.success) {
        // Get the created collection
        const getResponse = await fetch('/api/plugins/rag/collections', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });

        if (getResponse.ok) {
          const getData = await getResponse.json();
          const newCollection = getData.data.find((c: Collection) => c.Id === result.collectionId);
          if (newCollection) {
            onCollectionCreated(newCollection);
            onCollectionSelect(newCollection);
          }
        }

        // Reset form
        setFormData({
          name: '',
          description: '',
          embeddingModel: 'text-embedding-3-small',
          chunkSize: '1000',
          chunkOverlap: '200',
          maxRetrievalCount: '5'
        });
        setShowCreateForm(false);
      } else {
        setError(result.error || 'Failed to create collection');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create collection');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className={styles.collectionManager}>
      <div className={styles.managerHeader}>
        <div className={styles.headerInfo}>
          <h2>📚 Document Collections</h2>
          <p>Organize your documents into collections for better organization and retrieval.</p>
        </div>
        <button 
          className={styles.createButton}
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : '+ Create Collection'}
        </button>
      </div>

      {showCreateForm && (
        <div className={styles.createForm}>
          <h3>Create New Collection</h3>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Collection Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="My Knowledge Base"
                required
                className={styles.formInput}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Optional description of this collection's purpose..."
                rows={3}
                className={styles.formTextarea}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="embeddingModel">Embedding Model</label>
                <select
                  id="embeddingModel"
                  name="embeddingModel"
                  value={formData.embeddingModel}
                  onChange={handleInputChange}
                  className={styles.formSelect}
                >
                  <option value="text-embedding-3-small">text-embedding-3-small (Fast)</option>
                  <option value="text-embedding-3-large">text-embedding-3-large (Accurate)</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="chunkSize">Chunk Size</label>
                <input
                  type="number"
                  id="chunkSize"
                  name="chunkSize"
                  value={formData.chunkSize}
                  onChange={handleInputChange}
                  min="100"
                  max="10000"
                  className={styles.formInput}
                />
                <small>Characters per document chunk (100-10000)</small>
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="chunkOverlap">Chunk Overlap</label>
                <input
                  type="number"
                  id="chunkOverlap"
                  name="chunkOverlap"
                  value={formData.chunkOverlap}
                  onChange={handleInputChange}
                  min="0"
                  max="500"
                  className={styles.formInput}
                />
                <small>Overlap between chunks (0-500)</small>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="maxRetrievalCount">Retrieval Count</label>
                <input
                  type="number"
                  id="maxRetrievalCount"
                  name="maxRetrievalCount"
                  value={formData.maxRetrievalCount}
                  onChange={handleInputChange}
                  min="1"
                  max="20"
                  className={styles.formInput}
                />
                <small>Documents to retrieve (1-20)</small>
              </div>
            </div>

            {error && (
              <div className={styles.error}>
                {error}
              </div>
            )}

            <div className={styles.formActions}>
              <button 
                type="submit" 
                disabled={isCreating || !formData.name.trim()}
                className={styles.submitButton}
              >
                {isCreating ? 'Creating...' : 'Create Collection'}
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setShowCreateForm(false);
                  setError('');
                  setFormData({
                    name: '',
                    description: '',
                    embeddingModel: 'text-embedding-3-small',
                    chunkSize: '1000',
                    chunkOverlap: '200',
                    maxRetrievalCount: '5'
                  });
                }}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className={styles.collectionsGrid}>
        {collections.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📭</div>
            <h3>No Collections Yet</h3>
            <p>Create your first collection to start organizing documents.</p>
            <button 
              className={styles.primaryButton}
              onClick={() => setShowCreateForm(true)}
            >
              + Create Collection
            </button>
          </div>
        ) : (
          <div className={styles.grid}>
            {collections.map((collection) => (
              <div 
                key={collection.Id}
                className={styles.collectionCard}
                onClick={() => onCollectionSelect(collection)}
              >
                <div className={styles.collectionHeader}>
                  <h3>{collection.Name}</h3>
                  <div className={styles.collectionActions}>
                    <span className={styles.collectionIcon}>📚</span>
                  </div>
                </div>
                
                {collection.Description && (
                  <div className={styles.collectionDescription}>
                    {collection.Description}
                  </div>
                )}
                
                <div className={styles.collectionMeta}>
                  <div className={styles.collectionStats}>
                    <span>Created</span>
                    <span>{new Date(collection.CreatedAt).toLocaleDateString()}</span>
                  </div>
                  
                  <div className={styles.collectionStatus}>
                    <span className={styles.statusDot}></span>
                    <span>Ready for documents</span>
                  </div>
                </div>
                
                <div className={styles.collectionFooter}>
                  <button className={styles.selectButton}>
                    Select & Upload Documents
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
