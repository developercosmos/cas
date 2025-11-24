import React, { useState } from 'react';
import type { Plugin, PluginContext } from '@/types';

interface TextBlockProps {
  content?: string;
  onChange?: (content: string) => void;
}

const TextBlock: React.FC<TextBlockProps> = ({ content = '', onChange }) => {
  const [text, setText] = useState(content);
  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    onChange?.(e.target.value);
  };

  return (
    <div
      style={{
        padding: '12px',
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        backgroundColor: 'var(--bg-secondary)',
        minHeight: '100px',
      }}
      onClick={() => setIsEditing(true)}
    >
      {isEditing ? (
        <textarea
          value={text}
          onChange={handleChange}
          onBlur={() => setIsEditing(false)}
          autoFocus
          style={{
            width: '100%',
            minHeight: '80px',
            padding: '8px',
            border: 'none',
            backgroundColor: 'transparent',
            color: 'var(--text-primary)',
            fontSize: 'var(--font-size-base)',
            fontFamily: 'var(--font-family)',
            resize: 'vertical',
            outline: 'none',
          }}
        />
      ) : (
        <div style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
          {text || 'Click to edit...'}
        </div>
      )}
    </div>
  );
};

export const createTextBlockPlugin = (): Plugin => {
  return {
    id: 'core.text-block',
    name: 'Text Block',
    version: '1.0.0',
    manifest: {
      id: 'core.text-block',
      name: 'Text Block',
      version: '1.0.0',
      description: 'A simple text editing block',
      author: 'Dashboard Team',
      permissions: ['storage.read', 'storage.write'],
      entry: 'TextBlock',
    },
    initialize: async (context: PluginContext) => {
      context.registerComponent('TextBlock', TextBlock);
      console.log('Text Block plugin initialized');
    },
    render: (props: any) => <TextBlock {...props} />,
    dispose: async () => {
      console.log('Text Block plugin disposed');
    },
  };
};
