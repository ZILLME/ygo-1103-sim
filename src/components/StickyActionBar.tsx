import { GameState, endTurn } from '../lib/state';
import { Card, ZoneRef, MoveReason } from '../lib/types';
import { moveCard } from '../lib/moveCard';
import { drawCard } from '../lib/move';

interface StickyActionBarProps {
  state: GameState;
  onStateChange: (newState: GameState) => void;
  onAction: (action: string) => void;
}

export default function StickyActionBar({ state, onStateChange, onAction }: StickyActionBarProps) {
  const player = state.activePlayer;
  const playerState = state[player];
  
  // 選択中のカードを取得（手札のみ）
  const selectedHandCard = playerState.hand.find(c => c.selected);
  const selectedCard: Card | null = selectedHandCard 
    ? { ...selectedHandCard, owner: player, zone: 'hand' as const }
    : null;

  const handleQuickMove = (toZone: ZoneRef['zone'], reason: MoveReason) => {
    if (!selectedCard) return;

    // ドラッグ元のゾーンを特定
    let fromZone: ZoneRef;
    if (selectedCard.zone === 'hand') {
      fromZone = { player, zone: 'hand' };
    } else if (selectedCard.zone === 'mz' && selectedCard.zoneIndex !== undefined) {
      fromZone = { player, zone: 'mz', index: selectedCard.zoneIndex };
    } else if (selectedCard.zone === 'st' && selectedCard.zoneIndex !== undefined) {
      fromZone = { player, zone: 'st', index: selectedCard.zoneIndex };
    } else {
      return;
    }

    // 移動先を決定
    let to: ZoneRef;
    if (toZone === 'grave') {
      to = { player, zone: 'grave' };
    } else if (toZone === 'banish') {
      to = { player, zone: 'banish' };
    } else if (toZone === 'hand') {
      to = { player, zone: 'hand' };
    } else {
      return;
    }

    const newState = moveCard(state, { from: fromZone, to, cardId: selectedCard.id, reason });
    onStateChange(newState);
  };

  const handleDraw = () => {
    const drawResult = drawCard(state, player, 1);
    onStateChange(drawResult.state);
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'white',
        borderTop: '2px solid #2196f3',
        padding: '12px 16px',
        boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'wrap',
        maxHeight: '120px',
        overflowY: 'auto',
      }}
    >
      {/* 選択中カード表示 */}
      {selectedCard && (
        <div
          style={{
            padding: '8px 12px',
            background: '#e3f2fd',
            border: '2px solid #2196f3',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: 'bold',
            marginRight: '8px',
          }}
        >
          選択: {selectedCard.name}
        </div>
      )}

      {/* ドロー */}
      <button
        onClick={handleDraw}
        disabled={playerState.deck.length === 0}
        style={{
          padding: '8px 12px',
          background: playerState.deck.length === 0 ? '#ccc' : '#2196f3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: playerState.deck.length === 0 ? 'not-allowed' : 'pointer',
          fontSize: '13px',
          fontWeight: 'bold',
        }}
      >
        ドロー(+1)
      </button>

      {/* 通常召喚 */}
      <button
        onClick={() => onAction('通常召喚')}
        disabled={!selectedCard || selectedCard.zone !== 'hand' || playerState.summonUsed}
        style={{
          padding: '8px 12px',
          background: !selectedCard || selectedCard.zone !== 'hand' || playerState.summonUsed ? '#ccc' : '#4caf50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: !selectedCard || selectedCard.zone !== 'hand' || playerState.summonUsed ? 'not-allowed' : 'pointer',
          fontSize: '13px',
          fontWeight: 'bold',
        }}
      >
        通常召喚
      </button>

      {/* 特殊召喚 */}
      <button
        onClick={() => onAction('特殊召喚')}
        disabled={!selectedCard || selectedCard.zone !== 'hand' || playerState.strongHumbleLock}
        style={{
          padding: '8px 12px',
          background: !selectedCard || selectedCard.zone !== 'hand' || playerState.strongHumbleLock ? '#ccc' : '#f44336',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: !selectedCard || selectedCard.zone !== 'hand' || playerState.strongHumbleLock ? 'not-allowed' : 'pointer',
          fontSize: '13px',
          fontWeight: 'bold',
        }}
      >
        特殊召喚
      </button>

      {/* セット */}
      <button
        onClick={() => {
          if (!selectedCard || selectedCard.zone !== 'hand') return;
          const emptyZoneIndex = playerState.zones.spellTrapZones.findIndex(st => st === null);
          if (emptyZoneIndex === -1) {
            alert('魔法罠ゾーンに空きがありません');
            return;
          }
          const from: ZoneRef = { player, zone: 'hand' };
          const to: ZoneRef = { player, zone: 'st', index: emptyZoneIndex };
          const newState = moveCard(state, { from, to, cardId: selectedCard.id, reason: 'セット' });
          onStateChange(newState);
        }}
        disabled={!selectedCard || selectedCard.zone !== 'hand'}
        style={{
          padding: '8px 12px',
          background: !selectedCard || selectedCard.zone !== 'hand' ? '#ccc' : '#9c27b0',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: !selectedCard || selectedCard.zone !== 'hand' ? 'not-allowed' : 'pointer',
          fontSize: '13px',
          fontWeight: 'bold',
        }}
      >
        セット
      </button>

      {/* 発動 */}
      <button
        onClick={() => onAction('罠発動')}
        disabled={!selectedCard || selectedCard.zone !== 'st'}
        style={{
          padding: '8px 12px',
          background: !selectedCard || selectedCard.zone !== 'st' ? '#ccc' : '#9c27b0',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: !selectedCard || selectedCard.zone !== 'st' ? 'not-allowed' : 'pointer',
          fontSize: '13px',
          fontWeight: 'bold',
        }}
      >
        発動
      </button>

      {/* 墓地へ */}
      {selectedCard && (selectedCard.zone === 'mz' || selectedCard.zone === 'st') && (
        <button
          onClick={() => handleQuickMove('grave', '破壊')}
          style={{
            padding: '8px 12px',
            background: '#607d8b',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 'bold',
          }}
        >
          墓地へ
        </button>
      )}

      {/* 除外へ */}
      {selectedCard && (selectedCard.zone === 'mz' || selectedCard.zone === 'st') && (
        <button
          onClick={() => handleQuickMove('banish', '除外')}
          style={{
            padding: '8px 12px',
            background: '#ff9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 'bold',
          }}
        >
          除外へ
        </button>
      )}

      {/* 手札へ戻す */}
      {selectedCard && (selectedCard.zone === 'mz' || selectedCard.zone === 'st' || selectedCard.zone === 'grave' || selectedCard.zone === 'banish') && (
        <button
          onClick={() => handleQuickMove('hand', 'バウンス')}
          style={{
            padding: '8px 12px',
            background: '#00bcd4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 'bold',
          }}
        >
          手札へ
        </button>
      )}

      {/* ターン終了 */}
      <button
        onClick={() => {
          const newState = endTurn(state);
          onStateChange(newState);
        }}
        style={{
          padding: '8px 16px',
          background: '#9c27b0',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          marginLeft: 'auto',
        }}
      >
        ターン終了
      </button>
    </div>
  );
}
