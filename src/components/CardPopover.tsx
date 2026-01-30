import { useState, useRef, useEffect } from 'react';
import { getCardInfo, updateCardNotes } from '../lib/glossaryStore';
import { generateOfficialDbSearchUrl } from '../lib/officialDbLink';

interface CardPopoverProps {
  cardName: string;
  children: React.ReactNode;
}

export default function CardPopover({ cardName, children }: CardPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const cardInfo = getCardInfo(cardName);
  const [notes, setNotes] = useState<string>(cardInfo?.notes || '');
  const [isEditing, setIsEditing] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const hasInfo = cardInfo !== null;

  // cardInfoが変更されたらnotesを更新
  useEffect(() => {
    if (cardInfo) {
      setNotes(cardInfo.notes || '');
    }
  }, [cardInfo]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsEditing(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSaveMemo = () => {
    updateCardNotes(cardName, notes);
    setIsEditing(false);
    // 再読み込みして最新の情報を取得
    const updatedInfo = getCardInfo(cardName);
    if (updatedInfo) {
      setNotes(updatedInfo.notes || '');
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        style={{ cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted' }}
      >
        {children}
      </div>

      {isOpen && (
        <div
          ref={popoverRef}
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '8px',
            background: 'white',
            border: '2px solid #2196f3',
            borderRadius: '8px',
            padding: '16px',
            minWidth: '300px',
            maxWidth: '400px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 10000,
          }}
          onMouseLeave={() => !isEditing && setIsOpen(false)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>{cardName}</h4>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {/* 公式DBリンク */}
              <a
                href={cardInfo?.url || generateOfficialDbSearchUrl(cardName)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{
                  padding: '4px 8px',
                  background: '#2196f3',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                公式DB
              </a>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#999',
                }}
              >
                ×
              </button>
            </div>
          </div>

          {/* カード種別とモンスター情報 */}
          {cardInfo && (
            <div style={{ marginBottom: '12px', padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
              {cardInfo.typeCategory && (
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                  種別: {cardInfo.typeCategory === 'monster' ? 'モンスター' : cardInfo.typeCategory === 'spell' ? '魔法' : '罠'}
                </div>
              )}
              {cardInfo.monster && (
                <div style={{ fontSize: '13px', fontFamily: 'monospace' }}>
                  {cardInfo.monster.attribute && <span>{cardInfo.monster.attribute}</span>}
                  {cardInfo.monster.level && <span> Lv{cardInfo.monster.level}</span>}
                  {cardInfo.monster.race && <span> {cardInfo.monster.race}</span>}
                  {cardInfo.monster.type && <span> {cardInfo.monster.type}</span>}
                  {(cardInfo.monster.atk !== undefined || cardInfo.monster.def !== undefined) && (
                    <span>
                      {' '}
                      ATK{cardInfo.monster.atk !== undefined ? cardInfo.monster.atk : '?'} / DEF
                      {cardInfo.monster.def !== undefined ? cardInfo.monster.def : '?'}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {hasInfo ? (
            <div>
              {cardInfo.summary && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>効果要約</div>
                  <div style={{ fontSize: '14px' }}>{cardInfo.summary}</div>
                </div>
              )}
              {cardInfo.timing && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>発動タイミング</div>
                  <div style={{ fontSize: '14px' }}>{cardInfo.timing}</div>
                </div>
              )}
              {cardInfo.notes && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>メモ</div>
                  <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>{cardInfo.notes}</div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ marginBottom: '12px', color: '#999', fontSize: '14px' }}>
              辞書に未登録のカードです
            </div>
          )}

          <div style={{ borderTop: '1px solid #eee', paddingTop: '12px', marginTop: '12px' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>メモ（編集可能）</div>
            {isEditing ? (
              <div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="カードのメモを入力..."
                  style={{
                    width: '100%',
                    minHeight: '60px',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                  }}
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button
                    onClick={handleSaveMemo}
                    style={{
                      padding: '6px 12px',
                      background: '#4caf50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    保存
                  </button>
                  <button
                    onClick={() => {
                      setNotes(cardInfo?.notes || '');
                      setIsEditing(false);
                    }}
                    style={{
                      padding: '6px 12px',
                      background: '#999',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {notes ? (
                  <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap', marginBottom: '8px' }}>{notes}</div>
                ) : (
                  <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>メモなし</div>
                )}
                <button
                  onClick={() => setIsEditing(true)}
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
                  {notes ? '編集' : 'メモを追加'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
