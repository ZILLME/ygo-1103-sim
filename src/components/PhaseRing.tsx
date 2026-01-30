import { Phase } from '../lib/state';

interface PhaseRingProps {
  currentPhase: Phase;
  onPhaseChange: (phase: Phase) => void;
}

const phases: Phase[] = ['DP', 'SP', 'MP1', 'BP', 'MP2', 'EP'];

const phaseColors: Record<Phase, string> = {
  DP: '#4caf50', // 緑
  SP: '#4caf50', // 緑
  MP1: '#4caf50', // 緑
  BP: '#2196f3', // 青
  MP2: '#4caf50', // 緑
  EP: '#9c27b0', // 紫
};

const phaseNames: Record<Phase, string> = {
  DP: 'ドローフェイズ',
  SP: 'スタンバイフェイズ',
  MP1: 'メインフェイズ1',
  BP: 'バトルフェイズ',
  MP2: 'メインフェイズ2',
  EP: 'エンドフェイズ',
};

export default function PhaseRing({ currentPhase, onPhaseChange }: PhaseRingProps) {
  const currentIndex = phases.indexOf(currentPhase);

  const nextPhase = () => {
    const nextIndex = (currentIndex + 1) % phases.length;
    onPhaseChange(phases[nextIndex]);
  };

  const prevPhase = () => {
    const prevIndex = (currentIndex - 1 + phases.length) % phases.length;
    onPhaseChange(phases[prevIndex]);
  };

  return (
    <div style={{ padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>フェイズリング</h3>
      
      <div style={{ position: 'relative', width: '300px', height: '300px', margin: '0 auto' }}>
        {/* リング */}
        <svg width="300" height="300" style={{ position: 'absolute', top: 0, left: 0 }}>
          <circle
            cx="150"
            cy="150"
            r="120"
            fill="none"
            stroke="#e0e0e0"
            strokeWidth="3"
          />
          
          {/* 各フェイズの点 */}
          {phases.map((phase, index) => {
            const angle = (index * 2 * Math.PI) / phases.length - Math.PI / 2;
            const x = 150 + 120 * Math.cos(angle);
            const y = 150 + 120 * Math.sin(angle);
            const isCurrent = phase === currentPhase;
            
            return (
              <g key={phase}>
                <circle
                  cx={x}
                  cy={y}
                  r={isCurrent ? 12 : 8}
                  fill={phaseColors[phase]}
                  stroke={isCurrent ? '#000' : 'none'}
                  strokeWidth={isCurrent ? 2 : 0}
                  style={{ transition: 'all 0.3s ease' }}
                />
                <text
                  x={x}
                  y={y - 20}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight={isCurrent ? 'bold' : 'normal'}
                  fill={isCurrent ? '#000' : '#666'}
                >
                  {phase}
                </text>
              </g>
            );
          })}
          
          {/* カーソル（現在のフェイズへの線） */}
          {(() => {
            const angle = (currentIndex * 2 * Math.PI) / phases.length - Math.PI / 2;
            const x = 150 + 120 * Math.cos(angle);
            const y = 150 + 120 * Math.sin(angle);
            return (
              <line
                x1="150"
                y1="150"
                x2={x}
                y2={y}
                stroke={phaseColors[currentPhase]}
                strokeWidth="4"
                style={{ transition: 'all 0.3s ease' }}
              />
            );
          })()}
        </svg>
        
        {/* 中央の現在フェイズ表示 */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            background: phaseColors[currentPhase],
            color: 'white',
            padding: '16px 24px',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '20px',
            minWidth: '120px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          }}
        >
          <div>{currentPhase}</div>
          <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.9 }}>
            {phaseNames[currentPhase]}
          </div>
        </div>
      </div>
      
      {/* フェイズ操作ボタン */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '16px' }}>
        <button
          onClick={prevPhase}
          style={{
            padding: '8px 16px',
            background: '#f0f0f0',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          ← 前
        </button>
        <button
          onClick={nextPhase}
          style={{
            padding: '8px 16px',
            background: '#f0f0f0',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          次 →
        </button>
      </div>
    </div>
  );
}
