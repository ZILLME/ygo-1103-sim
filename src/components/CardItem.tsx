import { useDraggable } from '@dnd-kit/core';
import { Card } from '../lib/types';

interface CardItemProps {
  card: Card;
  player: 'me' | 'opp';
  onContextMenu?: (e: React.MouseEvent, card: Card) => void;
  onClick?: (card: Card) => void;
}

export default function CardItem({ card, player, onContextMenu, onClick }: CardItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `card-${player}-${card.id}`,
    data: {
      card,
      player,
    },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : {};

  const badges: string[] = [];
  if (card.isSet) badges.push('セット');
  if (card.faceUp === false) badges.push('裏');
  if (card.used) badges.push('使用済み');
  if (card.revealed) badges.push('公開');
  if (card.selected) badges.push('選択');

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        padding: '8px',
        background: card.selected
          ? '#e3f2fd'
          : card.used
          ? '#e0e0e0'
          : card.revealed
          ? '#fff3cd'
          : '#f5f5f5',
        border: card.selected ? '3px solid #2196f3' : '1px solid #ccc',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px',
        position: 'relative',
        zIndex: isDragging ? 1000 : 1,
      }}
      {...listeners}
      {...attributes}
      onClick={() => onClick?.(card)}
      onContextMenu={(e) => onContextMenu?.(e, card)}
    >
      <div style={{ fontWeight: card.selected ? 'bold' : 'normal' }}>{card.name}</div>
      {badges.length > 0 && (
        <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
          {badges.join(' / ')}
        </div>
      )}
      <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>
        {player === 'me' ? '自分' : '相手'}
      </div>
    </div>
  );
}
