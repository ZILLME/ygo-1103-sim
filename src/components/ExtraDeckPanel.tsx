import { useState } from 'react';
import { GameState } from '../lib/state';
import { Player } from '../lib/playerState';
import CardPopover from './CardPopover';

interface ExtraDeckPanelProps {
  state: GameState;
  player: Player;
  selectedCardId?: string;
  onCardSelect?: (cardId: string) => void;
}

export default function ExtraDeckPanel({ state, player, selectedCardId, onCardSelect }: ExtraDeckPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const playerState = state[player];
  const playerLabel = player === 'me' ? '自分' : '相手';

  return (
    <div style={{ padding: '16px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          cursor: 'pointer',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
          {playerLabel}のエクストラデッキ ({playerState.extraDeck.length}枚)
        </h3>
        <span style={{ fontSize: '14px', color: '#666' }}>{isExpanded ? '▼' : '▶'}</span>
      </div>

      {isExpanded && (
        <div>
          {playerState.extraDeck.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {playerState.extraDeck.map((card) => (
                <div
                  key={card.id}
                  onClick={() => onCardSelect?.(card.id)}
                  style={{
                    padding: '8px',
                    background: selectedCardId === card.id ? '#e3f2fd' : '#f5f5f5',
                    border: selectedCardId === card.id ? '2px solid #2196f3' : '1px solid #ccc',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <CardPopover cardName={card.name}>
                    {card.name}
                  </CardPopover>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#999', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
              エクストラデッキが空です
            </div>
          )}
        </div>
      )}
    </div>
  );
}
