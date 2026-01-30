import { GameState, addLog } from '../lib/state';
import { Player } from '../lib/playerState';
import { drawCard } from '../lib/move';

interface SetupPanelProps {
  state: GameState;
  onSetupComplete: (newState: GameState) => void;
}

export default function SetupPanel({ state, onSetupComplete }: SetupPanelProps) {
  const handleSelectFirstPlayer = (firstPlayer: Player) => {
    // 両者に初手5枚を配る
    let newState = { ...state };
    
    // 自分に5枚
    const meDrawResult = drawCard(newState, 'me', 5);
    newState = meDrawResult.state;
    
    // 相手に5枚
    const oppDrawResult = drawCard(newState, 'opp', 5);
    newState = oppDrawResult.state;
    
    // 先攻プレイヤーを設定
    newState = {
      ...newState,
      firstPlayer,
      activePlayer: firstPlayer,
      phase: 'DP',
      turn: 1,
      isSetupComplete: false, // Start Turn待ち
    };
    
    newState = addLog(newState, `Setup: 先攻 = ${firstPlayer === 'me' ? '自分' : '相手'}`, firstPlayer);
    newState = addLog(newState, 'Setup: 両者初手5枚をドロー', firstPlayer);
    
    onSetupComplete(newState);
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
    >
      <div
        style={{
          background: 'white',
          padding: '32px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          maxWidth: '500px',
          width: '90%',
        }}
      >
        <h2 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 'bold', textAlign: 'center' }}>
          ゲームセットアップ
        </h2>
        
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
            先攻プレイヤーを選択してください
          </div>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button
              onClick={() => handleSelectFirstPlayer('me')}
              style={{
                padding: '16px 32px',
                background: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
              }}
            >
              自分が先攻
            </button>
            <button
              onClick={() => handleSelectFirstPlayer('opp')}
              style={{
                padding: '16px 32px',
                background: '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
              }}
            >
              相手が先攻
            </button>
          </div>
        </div>

        <div style={{ fontSize: '14px', color: '#666', textAlign: 'center' }}>
          ※ 両者に初手5枚を配布します
          <br />
          「Start Turn」ボタンで先攻プレイヤーのみDPドロー(+1)を実行します
        </div>
      </div>
    </div>
  );
}
