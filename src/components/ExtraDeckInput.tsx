import { useState, useEffect } from 'react';
import { parseDeck, createDeck, DeckCard } from '../lib/deck';

interface ExtraDeckInputProps {
  player: 'me' | 'opp';
  onDeckChange: (cards: DeckCard[]) => void;
  initialDeck?: DeckCard[];
}

const STORAGE_KEY_ME = 'yu-gioh-extra-deck-input';
const STORAGE_KEY_OPP = 'yu-gioh-opponent-extra-deck-input';

export default function ExtraDeckInput({ player, onDeckChange, initialDeck = [] }: ExtraDeckInputProps) {
  const storageKey = player === 'me' ? STORAGE_KEY_ME : STORAGE_KEY_OPP;
  const [input, setInput] = useState('');
  const [cards, setCards] = useState<DeckCard[]>(initialDeck);

  // localStorageから復元
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setInput(saved);
      const parsed = parseDeck(saved);
      const deckCards = createDeck(parsed);
      setCards(deckCards);
      onDeckChange(deckCards);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setInput(value);
    localStorage.setItem(storageKey, value);
    const parsed = parseDeck(value);
    const deckCards = createDeck(parsed);
    setCards(deckCards);
    onDeckChange(deckCards);
  };

  // カード名ごとの枚数を集計
  const cardCountMap = new Map<string, number>();
  for (const card of cards) {
    cardCountMap.set(card.name, (cardCountMap.get(card.name) || 0) + 1);
  }
  const totalCount = Array.from(cardCountMap.values()).reduce((sum, count) => sum + count, 0);
  const playerLabel = player === 'me' ? '自分' : '相手';

  return (
    <div style={{ padding: '16px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
      <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 'bold' }}>
        {playerLabel}のエクストラデッキ入力
      </h3>
      <textarea
        value={input}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder="1行1カード名&#10;例:&#10;エヴォルカイザー・ラギア x2&#10;エヴォルカイザー・ドルカ x1"
        style={{
          width: '100%',
          height: '150px',
          padding: '8px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          fontSize: '14px',
          fontFamily: 'monospace',
          marginBottom: '8px',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '14px', color: '#666' }}>
          合計: {totalCount}枚
          {totalCount > 15 && (
            <span style={{ color: '#f44336', marginLeft: '8px' }}>⚠️ 15枚を超過しています</span>
          )}
        </div>
        {totalCount === 15 && (
          <div style={{ fontSize: '12px', color: '#4caf50' }}>✓ 推奨枚数</div>
        )}
      </div>
    </div>
  );
}
