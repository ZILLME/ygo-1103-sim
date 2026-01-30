import { useState } from 'react';
import { GameState, generateMarkdownLog } from '../lib/state';

interface LogPanelProps {
  state: GameState;
}

export default function LogPanel({ state }: LogPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const markdown = generateMarkdownLog(state);
    navigator.clipboard.writeText(markdown).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const markdown = generateMarkdownLog(state);

  return (
    <div style={{ padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Notion用ログ</h3>
        <button
          onClick={handleCopy}
          style={{
            padding: '6px 12px',
            background: copied ? '#4caf50' : '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          {copied ? '✓ コピー済み' : 'コピー'}
        </button>
      </div>
      
      <div
        style={{
          background: '#f5f5f5',
          padding: '12px',
          borderRadius: '4px',
          maxHeight: '400px',
          overflowY: 'auto',
          fontSize: '12px',
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {markdown || '(ログなし)'}
      </div>
    </div>
  );
}
