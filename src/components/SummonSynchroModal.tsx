import { useState } from 'react';
import { GameState } from '../lib/state';
import { Player } from '../lib/playerState';
import { performSynchroSummon } from '../lib/summon';
import CardPopover from './CardPopover';

interface SummonSynchroModalProps {
  state: GameState;
  player: Player;
  onStateChange: (newState: GameState) => void;
  onClose: () => void;
}

export default function SummonSynchroModal({ state, player, onStateChange, onClose }: SummonSynchroModalProps) {
  const [selectedMaterials, setSelectedMaterials] = useState<Set<number>>(new Set());
  const [selectedExtraCardId, setSelectedExtraCardId] = useState<string | null>(null);

  const playerState = state[player];
  const playerLabel = player === 'me' ? '自分' : '相手';

  const handleMaterialToggle = (mzIndex: number) => {
    const newSelected = new Set(selectedMaterials);
    if (newSelected.has(mzIndex)) {
      newSelected.delete(mzIndex);
    } else {
      newSelected.add(mzIndex);
    }
    setSelectedMaterials(newSelected);
  };

  const handleSummon = () => {
    if (selectedMaterials.size < 2) {
      alert('素材を2体以上選択してください');
      return;
    }

    if (!selectedExtraCardId) {
      alert('エクストラデッキからカードを選択してください');
      return;
    }

    // 空いているMZを探す
    const emptyZoneIndex = playerState.zones.monsterZones.findIndex((m, i) => m === null && !selectedMaterials.has(i));
    if (emptyZoneIndex === -1) {
      alert('モンスターゾーンに空きがありません');
      return;
    }

    const result = performSynchroSummon(
      state,
      player,
      Array.from(selectedMaterials),
      selectedExtraCardId,
      emptyZoneIndex
    );

    if (result.success) {
      onStateChange(result.state);
      onClose();
    } else {
      alert(result.message || '召喚に失敗しました');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
            {playerLabel}のシンクロ召喚
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#999',
            }}
          >
            ×
          </button>
        </div>

        {/* 素材選択 */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 'bold' }}>
            素材モンスターを選択（2体以上）
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
            {playerState.zones.monsterZones.map((monster, index) => (
              <div
                key={index}
                onClick={() => monster && handleMaterialToggle(index)}
                style={{
                  padding: '12px',
                  background: selectedMaterials.has(index)
                    ? '#e3f2fd'
                    : monster
                    ? '#f5f5f5'
                    : '#e0e0e0',
                  border: selectedMaterials.has(index) ? '2px solid #2196f3' : '1px solid #ccc',
                  borderRadius: '4px',
                  cursor: monster ? 'pointer' : 'not-allowed',
                  fontSize: '12px',
                  textAlign: 'center',
                  minHeight: '60px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {monster ? (
                  <>
                    <input
                      type="checkbox"
                      checked={selectedMaterials.has(index)}
                      onChange={() => handleMaterialToggle(index)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ marginBottom: '4px' }}
                    />
                    <CardPopover cardName={monster.name}>
                      <div style={{ fontSize: '11px', fontWeight: 'bold' }}>{monster.name}</div>
                    </CardPopover>
                  </>
                ) : (
                  <div style={{ color: '#999' }}>MZ{index + 1}</div>
                )}
              </div>
            ))}
          </div>
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
            選択中: {selectedMaterials.size}体
          </div>
        </div>

        {/* EXからカード選択 */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 'bold' }}>
            エクストラデッキから選択
          </h3>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {playerState.extraDeck.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {playerState.extraDeck.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => setSelectedExtraCardId(card.id)}
                    style={{
                      padding: '8px',
                      background: selectedExtraCardId === card.id ? '#e3f2fd' : '#f5f5f5',
                      border: selectedExtraCardId === card.id ? '2px solid #2196f3' : '1px solid #ccc',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    <CardPopover cardName={card.name}>{card.name}</CardPopover>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: '#999', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
                エクストラデッキが空です
              </div>
            )}
          </div>
        </div>

        {/* 操作ボタン */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: '#999',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            キャンセル
          </button>
          <button
            onClick={handleSummon}
            disabled={selectedMaterials.size < 2 || !selectedExtraCardId}
            style={{
              padding: '10px 20px',
              background: selectedMaterials.size < 2 || !selectedExtraCardId ? '#ccc' : '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedMaterials.size < 2 || !selectedExtraCardId ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            シンクロ召喚
          </button>
        </div>
      </div>
    </div>
  );
}
