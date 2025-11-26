// Constitution: Document Upload Component
import React, { useState, useRef } from 'react';
import styles from '../RAGManager.module.css';

interface Collection {
  Id: string;
  Name: string;
  Description?: string;
}

interface DocumentUploadProps {
  collection: Collection;
  onDocumentUploaded: () => void;
}

interface UploadProgress {
  filename: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  message?: string;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ collection, onDocumentUploaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [textInput, setTextInput] = useState('');
  const [textTitle, setTextTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = async (files: File[]) => {
    for (const file of files) {
      const uploadId = Math.random().toString(36).substr(2, 9);
      
      setUploads(prev => [...prev, {
        filename: file.name,
        progress: 0,
        status: 'uploading'
      }]);

      try {
        // Read file content
        const content = await readFile(file);
        
        // Update progress
        setUploads(prev => prev.map(u => 
          u.filename === file.name 
            ? { ...u, progress: 50, status: 'processing' }
            : u
        ));

        // Upload document
        const response = await fetch(`/api/plugins/rag/collections/${collection.Id}/documents`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify({
            title: file.name,
            content,
            source: file.name,
            contentType: file.type || 'text/plain',
            metadata: {
              filename: file.name,
              size: file.size,
              lastModified: file.lastModified
            }
          })
        });

        const result = await response.json();

        if (result.success) {
          setUploads(prev => prev.map(u => 
            u.filename === file.name 
              ? { ...u, progress: 100, status: 'completed' }
              : u
          ));
          
          setTimeout(() => {
            setUploads(prev => prev.filter(u => u.filename !== file.name));
          }, 3000);
          
        } else {
          throw new Error(result.error || 'Upload failed');
        }

      } catch (error) {
        setUploads(prev => prev.map(u => 
          u.filename === file.name 
            ? { ...u, status: 'error', message: error instanceof Error ? error.message : 'Upload failed' }
            : u
        ));
      }
    }

    onDocumentUploaded();
  };

  const readFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('File reading error'));
      reader.readAsText(file);
    });
  };

  const handleTextUpload = async () => {
    if (!textInput.trim() || !textTitle.trim()) {
      alert('Please provide both title and text content');
      return;
    }

    const uploadId = Math.random().toString(36).substr(2, 9);
    
    setUploads(prev => [...prev, {
      filename: textTitle,
      progress: 0,
      status: 'uploading'
    }]);

    try {
      setUploads(prev => prev.map(u => 
        u.filename === textTitle 
          ? { ...u, progress: 50, status: 'processing' }
          : u
      ));

      const response = await fetch(`/api/plugins/rag/collections/${collection.Id}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          title: textTitle,
          content: textInput,
          source: 'Manual Text Input',
          contentType: 'text/plain',
          metadata: {
            uploadedAt: new Date().toISOString()
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        setUploads(prev => prev.map(u => 
          u.filename === textTitle 
            ? { ...u, progress: 100, status: 'completed' }
            : u
        ));
        
        setTimeout(() => {
          setUploads(prev => prev.filter(u => u.filename !== textTitle));
        }, 3000);

        // Reset form
        setTextTitle('');
        setTextInput('');

      } else {
        throw new Error(result.error || 'Upload failed');
      }

    } catch (error) {
      setUploads(prev => prev.map(u => 
        u.filename === textTitle 
          ? { ...u, status: 'error', message: error instanceof Error ? error.message : 'Upload failed' }
          : u
      ));
    }

    onDocumentUploaded();
  };

  const getStatusIcon = (status: UploadProgress['status']) => {
    switch (status) {
      case 'uploading': return '⬆️';
      case 'processing': return '⚙️';
      case 'completed': return '✅';
      case 'error': return '❌';
      default: return '';
    }
  };

  return (
    <div className={`${styles.documentUpload} ${isDragging ? styles.dragging : ''}`}>
      <div className={styles.uploadHeader}>
        <h2>📤 Upload Documents to "{collection.Name}"</h2>
        <p>Support PDF, TXT, MD, and plain text files</p>
      </div>

      {/* Drag & Drop Area */}
      <div 
        className={styles.dropZone}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className={styles.dropZoneContent}>
          <div className={styles.dropZoneIcon}>📄</div>
          <h3>Drag & Drop Files Here</h3>
          <p>or click to browse</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt,.md,.pdf,.json,.csv"
            onChange={handleFileSelect}
            className={styles.fileInput}
          />
        </div>
      </div>

      {/* Text Input Area */}
      <div className={styles.textInputArea}>
        <h3>📝 Or Add Text Content</h3>
        <div className={styles.textInputForm}>
          <input
            type="text"
            placeholder="Document title..."
            value={textTitle}
            onChange={(e) => setTextTitle(e.target.value)}
            className={styles.titleInput}
          />
          <textarea
            placeholder="Paste or type your document content here..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            className={styles.textArea}
            rows={8}
          />
          <button 
            onClick={handleTextUpload}
            disabled={!textInput.trim() || !textTitle.trim()}
            className={styles.uploadButton}
          >
            📤 Upload Text
          </button>
        </div>
      </div>

      {/* Upload Progress */}
      <div className={styles.uploadProgress}>
        {uploads.map((upload) => (
          <div key={upload.filename} className={styles.uploadItem}>
            <div className={styles.uploadInfo}>
              <span className={styles.uploadStatus}>
                {getStatusIcon(upload.status)}
              </span>
              <span className={styles.uploadFilename}>
                {upload.filename}
              </span>
              <span className={styles.uploadPercent}>
                {upload.progress}%
              </span>
            </div>
            {upload.message && (
              <div className={styles.uploadMessage}>
                {upload.message}
              </div>
            )}
            <div className={styles.uploadBar}>
              <div 
                className={`${styles.uploadBarFill} ${styles[upload.status]}`}
                style={{ width: `${upload.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
