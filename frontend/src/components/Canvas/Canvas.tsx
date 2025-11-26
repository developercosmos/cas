import React, { useState } from 'react';
import type { Block } from '@/types';
import styles from './Canvas.module.css';

export const Canvas: React.FC = () => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const addBlock = () => {
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      type: 'text',
      content: { text: 'New block - Click to edit' },
      position: { x: 100, y: 100 + blocks.length * 80 },
      size: { width: 400, height: 100 },
    };
    setBlocks([...blocks, newBlock]);
  };

  const handleBlockClick = (blockId: string) => {
    setSelectedBlockId(blockId);
  };

  return (
    <div className={styles.canvas}>
      <div className={styles.toolbar}>
        <button className={styles.addButton} onClick={addBlock}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M8 3.33334V12.6667M3.33333 8H12.6667"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Add Block
        </button>
      </div>

      <div className={styles.content}>
        {blocks.length === 0 ? (
          <div className={styles.emptyState}>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="8" y="8" width="48" height="48" rx="4" stroke="var(--text-tertiary)" strokeWidth="2" strokeDasharray="4 4" />
              <path
                d="M32 24V40M24 32H40"
                stroke="var(--text-tertiary)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <h2>Start building your CAS Platform</h2>
            <p>Add blocks to create a personalized workspace, similar to Notion</p>
            <button className={styles.primaryButton} onClick={addBlock}>
              Add your first block
            </button>
          </div>
        ) : (
          <div className={styles.blocks}>
            {blocks.map((block) => (
              <div
                key={block.id}
                className={`${styles.block} ${selectedBlockId === block.id ? styles.selected : ''}`}
                onClick={() => handleBlockClick(block.id)}
                style={{
                  left: block.position.x,
                  top: block.position.y,
                  width: block.size.width,
                  minHeight: block.size.height,
                }}
              >
                <div className={styles.blockContent}>
                  {block.content.text || 'Empty block'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
