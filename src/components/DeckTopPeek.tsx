import { useState } from 'react';
import { GameState, addLog } from '../lib/state';
import { Player } from '../lib/playerState';
import CardPopover from './CardPopover';

interface DeckTopPeekProps {
  state: GameState;
  player: Player;
  onStateChange: (newState: GameState) => void;
}

export default function DeckTopPeek({ state, player, onStateChange }: DeckTopPeekProps) {
  const [peekCount, setPeekCount] = useState<number>(5);
  const [isPeeking, setIsPeeking] = useState(false);

  const playerState = state[player];
  const topCards = playerState.deck.slice(0, peekCount);
  const playerLabel = player === 'me' ? '自分' : '相手';

  const handlePeek = () => {
    if (topCards.length === 0) return;
    const cardNames = topCards.map(c => c.name).join(', ');
    const newState = addLog(
      state,
      `[${playerLabel}] Deck Top(${peekCount}): ${cardNames}`,
      player
    );
    onStateChange(newState);
    setIsPeeking(true);
  };

  return (
    <div style={{ padding: '16px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
          {playerLabel}のデッキトップ
        </h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px' }}>表示枚数:</span>
          <select
            value={peekCount}
            onChange={(e) => {
              setPeekCount(Number(e.target.value));
              setIsPeeking(false);
            }}
            style={{
              padding: '4px 8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          >
            <option value={3}>3枚</option>
            <option value={5}>5枚</option>
            <option value={10}>10枚</option>
          </select>
        </div>
      </div>

      {topCards.length > 0 ? (
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
            {topCards.map((card, index) => (
              <div
                key={card.id}
                style={{
                  padding: '6px 10px',
                  background: '#f5f5f5',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '13px',
                }}
              >
                <CardPopover cardName={card.name}>
                  {index + 1}. {card.name}
                </CardPopover>
              </div>
            ))}
          </div>
          {!isPeeking && (
            <button
              onClick={handlePeek}
              style={{
                padding: '6px 12px',
                background: '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              ログに記録
            </button>
          )}
          {isPeeking && (
            <div style={{ fontSize: '12px', color: '#4caf50' }}>
              ✓ ログに記録しました
            </div>
          )}
        </div>
      ) : (
        <div style={{ color: '#999', fontSize: '14px' }}>デッキが空です</div>
      )}
    </div>
  );
}
