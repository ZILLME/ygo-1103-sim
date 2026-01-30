import { Zones } from '../lib/zones';

interface ZoneDisplayProps {
  zones: Zones;
  title: string;
}

export default function ZoneDisplay({ zones, title }: ZoneDisplayProps) {
  return (
    <div style={{ padding: '16px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 'bold' }}>{title}</h3>
      
      {/* モンスターゾーン */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>モンスターゾーン</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
          {zones.monsterZones.map((monster, index) => (
            <div
              key={index}
              style={{
                minHeight: '60px',
                padding: '8px',
                background: monster ? '#e3f2fd' : '#f5f5f5',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {monster ? (
                <div>
                  <div style={{ fontWeight: 'bold' }}>{monster.name}</div>
                  {monster.faceUp === false && <div style={{ fontSize: '10px', color: '#666' }}>裏側</div>}
                </div>
              ) : (
                <div style={{ color: '#999' }}>MZ{index + 1}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 魔法罠ゾーン */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>魔法・罠ゾーン</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
          {zones.spellTrapZones.map((card, index) => (
            <div
              key={index}
              style={{
                minHeight: '60px',
                padding: '8px',
                background: card ? '#fff3cd' : '#f5f5f5',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {card ? (
                <div>
                  <div style={{ fontWeight: 'bold' }}>{card.name}</div>
                  {card.isSet && <div style={{ fontSize: '10px', color: '#666' }}>セット</div>}
                </div>
              ) : (
                <div style={{ color: '#999' }}>ST{index + 1}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 墓地・除外 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>墓地 ({zones.graveyard.length})</div>
          <div style={{ maxHeight: '100px', overflowY: 'auto', fontSize: '12px', background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
            {zones.graveyard.length > 0 ? (
              zones.graveyard.map((card, index) => (
                <div key={index}>{card.name}</div>
              ))
            ) : (
              <div style={{ color: '#999' }}>なし</div>
            )}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>除外 ({zones.banished.length})</div>
          <div style={{ maxHeight: '100px', overflowY: 'auto', fontSize: '12px', background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
            {zones.banished.length > 0 ? (
              zones.banished.map((card, index) => (
                <div key={index}>{card.name}</div>
              ))
            ) : (
              <div style={{ color: '#999' }}>なし</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
