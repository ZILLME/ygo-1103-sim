import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDroppable } from '@dnd-kit/core';
import { Card, ZoneRef, MoveReason } from '../lib/types';
import { GameState } from '../lib/state';
import { Player } from '../lib/playerState';
import CardItem from './CardItem';
import { useState } from 'react';

interface BoardDnDProps {
  state: GameState;
  player: Player;
  onMoveCard: (from: ZoneRef, to: ZoneRef, cardId: string, reason?: MoveReason) => void;
  onCardClick?: (card: Card) => void;
  onCardContextMenu?: (e: React.MouseEvent, card: Card) => void;
  showHand?: boolean; // 手札を表示するか（学習モード用）
}

// ドロップゾーンコンポーネント
function DropZone({
  id,
  children,
  style,
}: {
  id: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: isOver ? '#e3f2fd' : 'transparent',
        border: isOver ? '2px dashed #2196f3' : '1px solid #ccc',
        borderRadius: '4px',
        minHeight: '60px',
        padding: '8px',
        transition: 'all 0.2s',
      }}
    >
      {children}
    </div>
  );
}

export default function BoardDnD({
  state,
  player,
  onMoveCard,
  onCardClick,
  onCardContextMenu,
  showHand = true,
}: BoardDnDProps) {
  const [activeCard, setActiveCard] = useState<{ card: Card; player: Player } | null>(null);
  const [showReasonModal, setShowReasonModal] = useState<{
    from: ZoneRef;
    to: ZoneRef;
    cardId: string;
  } | null>(null);

  const playerState = state[player];
  const playerLabel = player === 'me' ? '自分' : '相手';

  const reasons: MoveReason[] = [
    '通常召喚',
    '特殊召喚',
    'セット',
    '発動',
    '破壊',
    '除外',
    'バウンス',
    'コスト',
    '解決',
    '移動',
  ];

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as { card?: Card; player?: Player } | null;
    if (data?.card && data?.player) {
      setActiveCard({ card: data.card, player: data.player });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCard(null);

    const { active, over } = event;
    if (!over) return;
    
    const activeData = active.data.current as { card?: Card; player?: Player } | null;
    if (!activeData?.card || !activeData?.player) return;

    const draggedCard = activeData.card;
    const draggedPlayer = activeData.player;

    // ドロップ先のIDを解析
    const dropId = over.id as string;
    const dropMatch = dropId.match(/^(hand|deck|grave|banish|mz|st|extra)-(me|opp)(?:-(\d+))?$/);
    if (!dropMatch) return;

    const [, toZone, toPlayer, indexStr] = dropMatch;
    const toIndex = indexStr ? parseInt(indexStr, 10) : undefined;

    // ドラッグ元のゾーンを特定
    let fromZone: ZoneRef;
    const cardZone = draggedCard.zone || 'hand';
    const cardOwner = draggedCard.owner || draggedPlayer;
    
    if (cardZone === 'hand') {
      fromZone = { player: cardOwner, zone: 'hand' };
    } else if (cardZone === 'mz' && draggedCard.zoneIndex !== undefined) {
      fromZone = { player: cardOwner, zone: 'mz', index: draggedCard.zoneIndex };
    } else if (cardZone === 'st' && draggedCard.zoneIndex !== undefined) {
      fromZone = { player: cardOwner, zone: 'st', index: draggedCard.zoneIndex };
    } else if (cardZone === 'grave') {
      fromZone = { player: cardOwner, zone: 'grave' };
    } else if (cardZone === 'banish') {
      fromZone = { player: cardOwner, zone: 'banish' };
    } else if (cardZone === 'deck') {
      fromZone = { player: cardOwner, zone: 'deck' };
    } else {
      return; // 不明なゾーン
    }

    const to: ZoneRef = {
      player: toPlayer as Player,
      zone: toZone as ZoneRef['zone'],
      index: toIndex,
    };

    // 理由選択モーダルを表示
    setShowReasonModal({ from: fromZone, to, cardId: draggedCard.id });
  };

  const handleReasonSelect = (reason: MoveReason) => {
    if (showReasonModal) {
      onMoveCard(showReasonModal.from, showReasonModal.to, showReasonModal.cardId, reason);
      setShowReasonModal(null);
    }
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div style={{ padding: '16px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>
          {playerLabel}の盤面
        </h3>

        {/* 手札 */}
        {showHand && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
              手札 ({playerState.hand.length}枚)
            </div>
            <DropZone id={`hand-${player}`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {playerState.hand.map((card) => {
                  const cardWithMeta: Card = {
                    ...card,
                    owner: player,
                    zone: 'hand',
                  };
                  return (
                    <CardItem
                      key={card.id}
                      card={cardWithMeta}
                      player={player}
                      onClick={onCardClick}
                      onContextMenu={onCardContextMenu}
                    />
                  );
                })}
                {playerState.hand.length === 0 && (
                  <div style={{ color: '#999', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
                    (手札なし)
                  </div>
                )}
              </div>
            </DropZone>
          </div>
        )}

        {/* モンスターゾーン */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>モンスターゾーン</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
            {playerState.zones.monsterZones.map((monster, index) => (
              <DropZone key={index} id={`mz-${player}-${index}`}>
                {monster ? (
                  <CardItem
                    card={{ ...monster, owner: player, zone: 'mz', zoneIndex: index }}
                    player={player}
                    onClick={onCardClick}
                    onContextMenu={onCardContextMenu}
                  />
                ) : (
                  <div style={{ color: '#999', fontSize: '12px', textAlign: 'center' }}>MZ{index + 1}</div>
                )}
              </DropZone>
            ))}
          </div>
        </div>

        {/* 魔法罠ゾーン */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>魔法・罠ゾーン</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
            {playerState.zones.spellTrapZones.map((card, index) => (
              <DropZone key={index} id={`st-${player}-${index}`}>
                {card ? (
                  <CardItem
                    card={{ ...card, owner: player, zone: 'st', zoneIndex: index }}
                    player={player}
                    onClick={onCardClick}
                    onContextMenu={onCardContextMenu}
                  />
                ) : (
                  <div style={{ color: '#999', fontSize: '12px', textAlign: 'center' }}>ST{index + 1}</div>
                )}
              </DropZone>
            ))}
          </div>
        </div>

        {/* 墓地・除外 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
              墓地 ({playerState.zones.graveyard.length})
            </div>
            <DropZone id={`grave-${player}`} style={{ maxHeight: '150px', overflowY: 'auto' }}>
              {playerState.zones.graveyard.length > 0 ? (
                playerState.zones.graveyard.map((card) => (
                  <CardItem
                    key={card.id}
                    card={{ ...card, owner: player, zone: 'grave' }}
                    player={player}
                    onClick={onCardClick}
                    onContextMenu={onCardContextMenu}
                  />
                ))
              ) : (
                <div style={{ color: '#999', fontSize: '12px', textAlign: 'center' }}>なし</div>
              )}
            </DropZone>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
              除外 ({playerState.zones.banished.length})
            </div>
            <DropZone id={`banish-${player}`} style={{ maxHeight: '150px', overflowY: 'auto' }}>
              {playerState.zones.banished.length > 0 ? (
                playerState.zones.banished.map((card) => (
                  <CardItem
                    key={card.id}
                    card={{ ...card, owner: player, zone: 'banish' }}
                    player={player}
                    onClick={onCardClick}
                    onContextMenu={onCardContextMenu}
                  />
                ))
              ) : (
                <div style={{ color: '#999', fontSize: '12px', textAlign: 'center' }}>なし</div>
              )}
            </DropZone>
          </div>
        </div>

        {/* デッキ */}
        <div style={{ marginTop: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
            デッキ ({playerState.deck.length})
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <DropZone id={`deck-${player}-0`} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ color: '#999', fontSize: '12px' }}>デッキトップ</div>
            </DropZone>
            <DropZone id={`deck-${player}-1`} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ color: '#999', fontSize: '12px' }}>デッキボトム</div>
            </DropZone>
          </div>
        </div>
      </div>

      {/* ドラッグ中のオーバーレイ */}
      <DragOverlay>
        {activeCard && (
          <div
            style={{
              padding: '8px',
              background: '#fff',
              border: '2px solid #2196f3',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: 'bold',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
            }}
          >
            {activeCard.card.name}
          </div>
        )}
      </DragOverlay>

      {/* 理由選択モーダル */}
      {showReasonModal && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 2000,
            minWidth: '300px',
          }}
        >
          <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>移動理由を選択</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {reasons.map((reason) => (
              <button
                key={reason}
                onClick={() => handleReasonSelect(reason)}
                style={{
                  padding: '10px',
                  background: '#2196f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                {reason}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              if (showReasonModal) {
                handleReasonSelect('移動');
              }
            }}
            style={{
              marginTop: '12px',
              padding: '8px',
              background: '#999',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              width: '100%',
            }}
          >
            キャンセル（移動として記録）
          </button>
        </div>
      )}
    </DndContext>
  );
}
