import { DeckCard } from '../lib/deck';

interface OpponentHandProps {
  hand: DeckCard[];
  mode: 'practice' | 'real';
}

export default function OpponentHand({ hand, mode }: OpponentHandProps) {
  if (mode === 'real') {
    return (
      <div style={{ padding: '16px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 'bold' }}>相手の手札</h3>
        <div style={{ padding: '20px', textAlign: 'center', color: '#999', fontSize: '14px' }}>
          本番モード：相手の手札は非表示
          <div style={{ marginTop: '8px', fontSize: '12px' }}>
            {hand.length > 0 ? `（推定${hand.length}枚）` : ''}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', background: '#fff3cd', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 'bold' }}>相手の手札（練習モード）</h3>
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
        {hand.length}枚
      </div>
      {hand.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {hand.map((card) => (
            <div
              key={card.id}
              style={{
                padding: '8px',
                background: '#fff',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            >
              {card.name}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: '#999', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
          （手札なし）
        </div>
      )}
    </div>
  );
}
