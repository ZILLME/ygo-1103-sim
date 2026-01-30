import { useState } from 'react';
import { GameState, addLog } from '../lib/state';
import { Player } from '../lib/playerState';
import { ZoneRef, MoveReason } from '../lib/types';
import { moveCard } from '../lib/moveCard';
import CardPopover from './CardPopover';

interface DeckSearchModalProps {
  state: GameState;
  player: Player;
  onStateChange: (newState: GameState) => void;
  onClose: () => void;
  onNeedsShuffle?: () => void;
}

export default function DeckSearchModal({
  state,
  player,
  onStateChange,
  onClose,
  onNeedsShuffle,
}: DeckSearchModalProps) {
  const [searchText, setSearchText] = useState('');
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [targetZone, setTargetZone] = useState<ZoneRef['zone']>('hand');
  const [targetIndex, setTargetIndex] = useState<number | undefined>(undefined);
  const [moveReason, setMoveReason] = useState<MoveReason>('移動');

  const playerState = state[player];
  const playerLabel = player === 'me' ? '自分' : '相手';

  // 検索結果
  const filteredCards = playerState.deck.filter((card) =>
    card.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleCardToggle = (cardId: string) => {
    const newSelected = new Set(selectedCards);
    if (newSelected.has(cardId)) {
      newSelected.delete(cardId);
    } else {
      newSelected.add(cardId);
    }
    setSelectedCards(newSelected);
  };

  const handleMove = () => {
    if (selectedCards.size === 0) {
      alert('カードを選択してください');
      return;
    }

    let newState = state;
    const movedCards: string[] = [];
    let actualMoveReason = moveReason;

    // 移動理由を自動設定
    if (targetZone === 'hand' && moveReason === '移動') {
      actualMoveReason = 'サーチ';
    } else if (targetZone === 'mz' && moveReason === '移動') {
      actualMoveReason = '特殊召喚';
    } else if (targetZone === 'st' && moveReason === '移動') {
      actualMoveReason = 'セット';
    }

    for (const cardId of selectedCards) {
      const card = playerState.deck.find((c) => c.id === cardId);
      if (!card) continue;

      const from: ZoneRef = { player, zone: 'deck' };
      let to: ZoneRef;

      if (targetZone === 'mz') {
        // 空いているモンスターゾーンを探す
        const emptyIndex = newState[player].zones.monsterZones.findIndex((m) => m === null);
        if (emptyIndex === -1) {
          alert('モンスターゾーンに空きがありません');
          return;
        }
        to = { player, zone: 'mz', index: emptyIndex };
      } else if (targetZone === 'st') {
        // 空いている魔法罠ゾーンを探す
        const emptyIndex = newState[player].zones.spellTrapZones.findIndex((st) => st === null);
        if (emptyIndex === -1) {
          alert('魔法罠ゾーンに空きがありません');
          return;
        }
        to = { player, zone: 'st', index: emptyIndex };
      } else if (targetZone === 'deck') {
        to = { player, zone: 'deck', index: targetIndex || 0 };
      } else {
        to = { player, zone: targetZone };
      }

      newState = moveCard(newState, { from, to, cardId, reason: actualMoveReason });
      movedCards.push(card.name);
    }

    // ログに記録
    const actionLabel =
      targetZone === 'hand'
        ? 'サーチ'
        : targetZone === 'mz'
        ? '特殊召喚'
        : targetZone === 'st'
        ? 'セット'
        : targetZone === 'grave'
        ? '墓地送り'
        : targetZone === 'banish'
        ? '除外'
        : '移動';
    newState = addLog(
      newState,
      `[${playerLabel}] デッキから ${movedCards.join(', ')} を${actionLabel}`,
      player
    );

    // シャッフル要求
    if (onNeedsShuffle && (targetZone === 'hand' || targetZone === 'mz')) {
      onNeedsShuffle();
    }

    onStateChange(newState);
    onClose();
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
          maxWidth: '800px',
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
            {playerLabel}のデッキ検索
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

        {/* 検索 */}
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="カード名で検索..."
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          />
        </div>

        {/* 検索結果 */}
        <div style={{ marginBottom: '20px', maxHeight: '300px', overflowY: 'auto' }}>
          {filteredCards.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {filteredCards.map((card) => (
                <div
                  key={card.id}
                  onClick={() => handleCardToggle(card.id)}
                  style={{
                    padding: '8px',
                    background: selectedCards.has(card.id) ? '#e3f2fd' : '#f5f5f5',
                    border: selectedCards.has(card.id) ? '2px solid #2196f3' : '1px solid #ccc',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedCards.has(card.id)}
                    onChange={() => handleCardToggle(card.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <CardPopover cardName={card.name}>{card.name}</CardPopover>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#999', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
              {searchText ? '該当するカードがありません' : '検索文字を入力してください'}
            </div>
          )}
        </div>

        {/* 移動先選択 */}
        {selectedCards.size > 0 && (
          <div style={{ marginBottom: '20px', padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>
              移動先: {selectedCards.size}枚選択中
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="radio"
                  checked={targetZone === 'hand'}
                  onChange={() => setTargetZone('hand')}
                />
                <span>手札（サーチ）</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="radio"
                  checked={targetZone === 'mz'}
                  onChange={() => setTargetZone('mz')}
                />
                <span>モンスターゾーン（特殊召喚）</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="radio"
                  checked={targetZone === 'st'}
                  onChange={() => setTargetZone('st')}
                />
                <span>魔法罠ゾーン（セット）</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="radio"
                  checked={targetZone === 'grave'}
                  onChange={() => setTargetZone('grave')}
                />
                <span>墓地</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="radio"
                  checked={targetZone === 'banish'}
                  onChange={() => setTargetZone('banish')}
                />
                <span>除外</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="radio"
                  checked={targetZone === 'deck'}
                  onChange={() => setTargetZone('deck')}
                />
                <span>
                  デッキ
                  {targetZone === 'deck' && (
                    <select
                      value={targetIndex || 0}
                      onChange={(e) => setTargetIndex(Number(e.target.value))}
                      style={{ marginLeft: '8px', padding: '4px' }}
                    >
                      <option value={0}>トップ</option>
                      <option value={1}>ボトム</option>
                    </select>
                  )}
                </span>
              </label>
            </div>
            <div style={{ marginTop: '12px' }}>
              <label style={{ fontSize: '14px', marginRight: '8px' }}>移動理由:</label>
              <select
                value={moveReason}
                onChange={(e) => setMoveReason(e.target.value as MoveReason)}
                style={{ padding: '4px 8px', fontSize: '14px' }}
              >
                <option value="移動">移動</option>
                <option value="サーチ">サーチ</option>
                <option value="特殊召喚">特殊召喚</option>
                <option value="セット">セット</option>
                <option value="破壊">破壊</option>
                <option value="除外">除外</option>
                <option value="コスト">コスト</option>
              </select>
            </div>
          </div>
        )}

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
            onClick={handleMove}
            disabled={selectedCards.size === 0}
            style={{
              padding: '10px 20px',
              background: selectedCards.size === 0 ? '#ccc' : '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedCards.size === 0 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            移動 ({selectedCards.size}枚)
          </button>
        </div>
      </div>
    </div>
  );
}
