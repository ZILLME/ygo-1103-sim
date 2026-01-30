import { useState } from 'react';

interface Interrupt {
  name: string;
  checked: boolean;
}

interface DeckInterrupts {
  [deckName: string]: Interrupt[];
}

const deckInterrupts: DeckInterrupts = {
  六武: [
    { name: '神の警告', checked: false },
    { name: '神の宣告', checked: false },
    { name: '奈落の落とし穴', checked: false },
    { name: '次元幽閉', checked: false },
    { name: '六武衆の影－紫炎', checked: false },
  ],
  カラクリ: [
    { name: '神の警告', checked: false },
    { name: '奈落の落とし穴', checked: false },
    { name: '次元幽閉', checked: false },
    { name: 'カラクリ無双 壱八', checked: false },
  ],
  ジャンド: [
    { name: '神の警告', checked: false },
    { name: '奈落の落とし穴', checked: false },
    { name: 'ジャンド・リボーン', checked: false },
    { name: 'ジャンド・カウンター', checked: false },
  ],
  HERO: [
    { name: '神の警告', checked: false },
    { name: '奈落の落とし穴', checked: false },
    { name: 'E・HERO エアー・ネオス', checked: false },
    { name: 'マスク・チェンジ', checked: false },
  ],
  ミラー: [
    { name: '神の警告', checked: false },
    { name: '神の宣告', checked: false },
    { name: '奈落の落とし穴', checked: false },
    { name: '次元幽閉', checked: false },
    { name: 'ヴェーラーの呪詛', checked: false },
    { name: '黒角笛', checked: false },
  ],
};

export default function InterruptPanel() {
  const [selectedDeck, setSelectedDeck] = useState<string>('');
  const [interrupts, setInterrupts] = useState<Interrupt[]>([]);

  const handleDeckSelect = (deckName: string) => {
    setSelectedDeck(deckName);
    setInterrupts(deckInterrupts[deckName].map(i => ({ ...i })));
  };

  const toggleInterrupt = (index: number) => {
    const newInterrupts = [...interrupts];
    newInterrupts[index].checked = !newInterrupts[index].checked;
    setInterrupts(newInterrupts);
  };

  return (
    <div style={{ padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>割り込み（相手反応）</h3>
      
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '14px', marginBottom: '8px', fontWeight: 'bold' }}>対面デッキ選択:</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {Object.keys(deckInterrupts).map((deckName) => (
            <button
              key={deckName}
              onClick={() => handleDeckSelect(deckName)}
              style={{
                padding: '6px 12px',
                background: selectedDeck === deckName ? '#2196f3' : '#f0f0f0',
                color: selectedDeck === deckName ? 'white' : '#333',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              {deckName}
            </button>
          ))}
        </div>
      </div>

      {selectedDeck && (
        <div>
          <div style={{ fontSize: '14px', marginBottom: '8px', fontWeight: 'bold' }}>
            {selectedDeck}の割り込み候補:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {interrupts.map((interrupt, index) => (
              <label
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  background: interrupt.checked ? '#e3f2fd' : 'transparent',
                }}
              >
                <input
                  type="checkbox"
                  checked={interrupt.checked}
                  onChange={() => toggleInterrupt(index)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px' }}>{interrupt.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
