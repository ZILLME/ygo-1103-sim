import React, { useState, useEffect } from 'react';
import { parseDeck, createDeck, shuffleDeck, DeckCard, calculateProbability, SeededRandom } from './lib/deck';
import { drawCard } from './lib/move';
import {
  GameState,
  Phase,
  createInitialState,
  addLog,
  activateStrongHumble,
  endTurn,
  changePhase,
  toggleCardUsed,
  toggleCardRevealed,
  toggleCardSelected,
  exportState,
  importState,
} from './lib/state';
import { Player } from './lib/playerState';
import { analyzeOpponentDeck, checkInterrupt, OpponentDeckAnalysis, ActionType as InterruptActionType } from './lib/opponentAI';
import { getNextPhase, ActionType as PhaseActionType, getPhaseTransitionDescription } from './lib/phaseEngine';
import { placeMonster, placeSpellTrap, sendSpellTrapToGrave, canActivateTrap, ZoneCard } from './lib/zones';
import PhaseRing from './components/PhaseRing';
import LogPanel from './components/LogPanel';
import BoardDnD from './components/BoardDnD';
import OpponentHand from './components/OpponentHand';
import SetupPanel from './components/SetupPanel';
import StickyActionBar from './components/StickyActionBar';
import GlossaryImportExport from './components/GlossaryImportExport';
import DeckTopPeek from './components/DeckTopPeek';
import DeckSearchModal from './components/DeckSearchModal';
import ExtraDeckInput from './components/ExtraDeckInput';
import ExtraDeckPanel from './components/ExtraDeckPanel';
import SummonXyzModal from './components/SummonXyzModal';
import SummonSynchroModal from './components/SummonSynchroModal';
import { moveCard } from './lib/moveCard';
import {
  canActivateRescueRabbit,
  activateRescueRabbit,
  getXyzSummonCandidates,
  performXyzSummon,
} from './lib/scripts/rescueRabbit';

const STORAGE_KEY = 'yu-gioh-deck-input';
const STORAGE_KEY_OPPONENT = 'yu-gioh-opponent-deck-input';

export default function App() {
  const [deckInput, setDeckInput] = useState('');
  const [opponentDeckInput, setOpponentDeckInput] = useState('');
  const [state, setState] = useState<GameState | null>(null);
  const [deckCards, setDeckCards] = useState<DeckCard[]>([]);
  const [opponentDeckCards, setOpponentDeckCards] = useState<DeckCard[]>([]);
  const [opponentAnalysis, setOpponentAnalysis] = useState<OpponentDeckAnalysis | null>(null);
  const [totalCards, setTotalCards] = useState(0);
  const [strongHumbleCount, setStrongHumbleCount] = useState(0);
  const [trapCount, setTrapCount] = useState(0);
  const [interruptPopup, setInterruptPopup] = useState<{ cardName: string; category: string } | null>(null);
  const [xyzCandidates, setXyzCandidates] = useState<Array<{ name: string; rank: number; materials: number[] }>>([]);
  const [opponentHandMode, setOpponentHandMode] = useState<'practice' | 'real'>('practice');
  const [opponentHand, setOpponentHand] = useState<DeckCard[]>([]);
  const [drawCount, setDrawCount] = useState<number>(1);
  const [showDeckSearch, setShowDeckSearch] = useState<{ player: Player } | null>(null);
  const [needsShuffle, setNeedsShuffle] = useState<{ player: Player } | null>(null);
  const [myExtraDeckCards, setMyExtraDeckCards] = useState<DeckCard[]>([]);
  const [opponentExtraDeckCards, setOpponentExtraDeckCards] = useState<DeckCard[]>([]);
  const [showXyzModal, setShowXyzModal] = useState<{ player: Player } | null>(null);
  const [showSynchroModal, setShowSynchroModal] = useState<{ player: Player } | null>(null);

  // localStorageからデッキ入力を復元
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setDeckInput(saved);
    }
    const savedOpponent = localStorage.getItem(STORAGE_KEY_OPPONENT);
    if (savedOpponent) {
      setOpponentDeckInput(savedOpponent);
    }
  }, []);

  // デッキ入力の解析
  useEffect(() => {
    if (!deckInput.trim()) {
      setDeckCards([]);
      setTotalCards(0);
      setStrongHumbleCount(0);
      setTrapCount(0);
      return;
    }

    const parsed = parseDeck(deckInput);
    const deck = createDeck(parsed);
    setDeckCards(deck);
    setTotalCards(deck.length);

    // 強謙と罠の枚数をカウント
    const strongHumble = parsed.find(c => c.name.includes('強欲で謙虚な壺'))?.count || 0;
    const traps = parsed.filter(c => c.name.includes('罠') || c.name.includes('トラップ')).reduce((sum, c) => sum + c.count, 0);
    setStrongHumbleCount(strongHumble);
    setTrapCount(traps);

    localStorage.setItem(STORAGE_KEY, deckInput);
  }, [deckInput]);

  // 相手デッキ入力の解析
  useEffect(() => {
    if (!opponentDeckInput.trim()) {
      setOpponentDeckCards([]);
      setOpponentAnalysis(null);
      return;
    }

    const parsed = parseDeck(opponentDeckInput);
    const deck = createDeck(parsed);
    setOpponentDeckCards(deck);
    
    const analysis = analyzeOpponentDeck(parsed);
    setOpponentAnalysis(analysis);

    localStorage.setItem(STORAGE_KEY_OPPONENT, opponentDeckInput);
  }, [opponentDeckInput]);

  const handleShuffle = () => {
    if (deckCards.length === 0) return;
    const seed = Date.now();
    const shuffled = shuffleDeck([...deckCards], seed);
    const opponentShuffled = opponentDeckCards.length > 0 
      ? shuffleDeck([...opponentDeckCards], seed + 1) 
      : undefined;
    const myExtraShuffled = myExtraDeckCards.length > 0
      ? shuffleDeck([...myExtraDeckCards], seed + 2)
      : undefined;
    const oppExtraShuffled = opponentExtraDeckCards.length > 0
      ? shuffleDeck([...opponentExtraDeckCards], seed + 3)
      : undefined;
    const newState = createInitialState(shuffled, seed, opponentShuffled, myExtraShuffled, oppExtraShuffled);
    
    // Setup未完了状態にする（SetupPanelを表示）
    setState(newState);
  };

  const handleStartTurn = () => {
    if (!state || !state.firstPlayer) return;
    
    // 先攻プレイヤーのみDPドロー(+1)
    const drawResult = drawCard(state, state.firstPlayer, 1);
    let newState = drawResult.state;
    
    newState = {
      ...newState,
      isSetupComplete: true,
      activePlayer: state.firstPlayer,
    };
    
    newState = addLog(newState, `${state.firstPlayer === 'me' ? '自分' : '相手'}DP：1枚ドロー（先攻）`, state.firstPlayer);
    
    setState(newState);
  };

  const handleDrawInitial = () => {
    if (!state) return;
    const player = state.activePlayer;
    
    // 共通関数を使用してドロー
    const drawResult = drawCard(state, player, 5);
    let newState = drawResult.state;
    
    // 相手も初手ドロー（練習モード用、最初のプレイヤーのみ）
    if (player === 'me' && state.opp.deck.length > 0 && opponentHandMode === 'practice') {
      const oppDrawResult = drawCard(newState, 'opp', 5);
      newState = oppDrawResult.state;
      setOpponentHand(oppDrawResult.drawn);
    }
    
    // フェイズ自動遷移（DP → SP）
    const nextPhase = getNextPhase(state.phase, 'drawInitial');
    if (nextPhase) {
      newState = changePhase(newState, nextPhase);
    }
    
    setState(newState);
  };

  const handleDrawFirst = () => {
    if (!state) return;
    const player = state.activePlayer;
    
    // 共通関数を使用してドロー
    const drawResult = drawCard(state, player, 1);
    let newState = drawResult.state;
    
    // 相手も先攻ドロー（練習モード用）
    if (player === 'me' && state.opp.deck.length > 0 && opponentHandMode === 'practice') {
      const oppDrawResult = drawCard(newState, 'opp', 1);
      newState = oppDrawResult.state;
      setOpponentHand([...opponentHand, ...oppDrawResult.drawn]);
    }
    
    // フェイズ自動遷移（DP → SP）
    const nextPhase = getNextPhase(state.phase, 'drawFirst');
    if (nextPhase) {
      newState = changePhase(newState, nextPhase);
    }
    
    setState(newState);
  };

  const handleUseStrongHumble = () => {
    if (!state) return;
    setState(activateStrongHumble(state, state.activePlayer));
  };

  const handleCardClick = (cardId: string, player: Player) => {
    if (!state) return;
    const playerState = state[player];
    setState({
      ...state,
      [player]: {
        ...playerState,
        hand: toggleCardSelected(playerState.hand, cardId),
      },
    });
  };

  const handleCardRightClick = (e: React.MouseEvent, cardId: string, player: Player) => {
    e.preventDefault();
    if (!state) return;
    const playerState = state[player];
    setState({
      ...state,
      [player]: {
        ...playerState,
        hand: toggleCardRevealed(playerState.hand, cardId),
      },
    });
  };

  const handleCardDoubleClick = (cardId: string, player: Player) => {
    if (!state) return;
    const playerState = state[player];
    setState({
      ...state,
      [player]: {
        ...playerState,
        hand: toggleCardUsed(playerState.hand, cardId),
      },
    });
  };

  const handlePhaseChange = (phase: Phase) => {
    if (!state) return;
    setState(changePhase(state, phase));
  };

  const handleEndTurn = () => {
    if (!state) return;
    let newState = endTurn(state);
    
    // フェイズ自動遷移（EP → 次のターンのDP）
    const nextPhase = getNextPhase(state.phase, 'endTurn');
    if (nextPhase) {
      newState = changePhase(newState, nextPhase);
    }
    
    newState = addLog(newState, 'ターン終了');
    setState(newState);
  };

  const handleExport = () => {
    if (!state) return;
    const json = exportState(state);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yu-gioh-state-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const imported = importState(text);
      if (imported) {
        setState(imported);
        alert('状態をインポートしました');
      } else {
        alert('インポートに失敗しました');
      }
    };
    reader.readAsText(file);
  };

  // 行動タイプのマッピング
  const actionTypeMap: Record<string, { phaseAction: PhaseActionType; interruptAction: InterruptActionType }> = {
    '通常召喚': { phaseAction: 'normalSummon', interruptAction: 'normalSummon' },
    '特殊召喚': { phaseAction: 'specialSummon', interruptAction: 'specialSummon' },
    '魔法発動': { phaseAction: 'spellActivate', interruptAction: 'spellActivate' },
    '罠発動': { phaseAction: 'trapActivate', interruptAction: 'trapActivate' },
    '攻撃宣言': { phaseAction: 'attackDeclare', interruptAction: 'attackDeclare' },
    'ダメージステップ': { phaseAction: 'damageStep', interruptAction: 'damageStep' },
  };

  const handleAction = (action: string) => {
    if (!state) return;
    
    const player = state.activePlayer;
    const playerState = state[player];
    let newState = { ...state };
    const actionTypes = actionTypeMap[action];
    
    // 通常召喚・特殊召喚の場合は選択されたカードを場に移動
    if (action === '通常召喚' || action === '特殊召喚') {
      const selectedCard = playerState.hand.find((card) => card.selected);
      if (selectedCard) {
        // 空いているモンスターゾーンを探す
        const emptyZoneIndex = playerState.zones.monsterZones.findIndex(m => m === null);
        if (emptyZoneIndex === -1) {
          alert('モンスターゾーンに空きがありません');
          return;
        }

        // 手札から除外
        const newHand = playerState.hand.filter(c => c.id !== selectedCard.id);
        
        // モンスターゾーンに配置
        const zoneCard: ZoneCard = {
          ...selectedCard,
          zoneIndex: emptyZoneIndex,
          faceUp: true,
        };
        const newZones = placeMonster(playerState.zones, zoneCard, emptyZoneIndex);

        newState = {
          ...newState,
          [player]: {
            ...playerState,
            hand: newHand,
            zones: newZones,
            summonUsed: action === '通常召喚',
          },
        };
        newState = addLog(newState, `${action}: ${selectedCard.name}（MZ${emptyZoneIndex + 1}）`, player);
      } else {
        alert('手札からカードを選択してから召喚してください');
        return;
      }
    } else if (action === '魔法発動') {
      const selectedCard = playerState.hand.find((card) => card.selected);
      if (selectedCard) {
        // 手札から墓地へ
        const newHand = playerState.hand.filter(c => c.id !== selectedCard.id);
        const newGrave = [...playerState.zones.graveyard, selectedCard];
        
        newState = {
          ...newState,
          [player]: {
            ...playerState,
            hand: newHand,
            zones: {
              ...playerState.zones,
              graveyard: newGrave,
            },
          },
        };
        newState = addLog(newState, `魔法発動: ${selectedCard.name}`, player);
      } else {
        alert('手札からカードを選択してください');
        return;
      }
    } else if (action === '罠発動') {
      // 魔法罠ゾーンから選択されたカードを発動
      const selectedZoneIndex = playerState.zones.spellTrapZones.findIndex(
        (card) => card !== null
      );
      
      if (selectedZoneIndex === -1) {
        alert('発動する罠を選択してください');
        return;
      }
      
      const trapCard = playerState.zones.spellTrapZones[selectedZoneIndex];
      if (!trapCard) return;
      
      // セットターン発動不可チェック
      const check = canActivateTrap(trapCard, state.turn);
      if (!check.canActivate) {
        alert(check.reason || '発動できません');
        newState = addLog(newState, `罠発動不可: ${trapCard.name}（${check.reason}）`, player);
        setState(newState);
        return;
      }
      
      // 墓地へ送る
      const result = sendSpellTrapToGrave(playerState.zones, selectedZoneIndex);
      
      newState = {
        ...newState,
        [player]: {
          ...playerState,
          zones: result.zones,
        },
      };
      newState = addLog(newState, `罠発動: ${trapCard.name}`, player);
    } else {
      newState = addLog(newState, action, player);
    }

    // 自動割り込み判定（相手ターン時のみ、簡易版）
    if (actionTypes && opponentAnalysis && player === 'me') {
      const opponentHandSize = state.opp.hand.length;
      const rng = new SeededRandom(state.seed + newState.logs.length);
      const interruptResult = checkInterrupt(
        opponentAnalysis,
        state.phase,
        actionTypes.interruptAction,
        opponentHandSize,
        rng
      );

      if (interruptResult.triggered && interruptResult.cardName) {
        // 妨害発生
        const categoryNames: Record<string, string> = {
          normalSummonMeta: '通常召喚メタ',
          specialSummonMeta: '特殊召喚メタ',
          effectNegate: '効果無効',
          battleMeta: '戦闘メタ',
          spellTrapMeta: '魔法罠メタ',
        };
        newState = addLog(newState, `相手：${interruptResult.cardName}を発動`, 'opp');
        setInterruptPopup({
          cardName: interruptResult.cardName,
          category: categoryNames[interruptResult.category || ''] || '',
        });
        // 3秒後にポップアップを閉じる
        setTimeout(() => setInterruptPopup(null), 3000);
      } else {
        // 妨害なし
        newState = addLog(newState, '相手は反応なし', 'opp');
      }
    }

    // フェイズ自動遷移
    if (actionTypes) {
      const nextPhase = getNextPhase(state.phase, actionTypes.phaseAction);
      if (nextPhase && nextPhase !== state.phase) {
        const description = getPhaseTransitionDescription(state.phase, actionTypes.phaseAction);
        if (description) {
          newState = addLog(changePhase(newState, nextPhase), `フェイズ遷移: ${description}`, player);
        } else {
          newState = changePhase(newState, nextPhase);
        }
      }
    }

    setState(newState);
  };

  // 統計計算
  const probStrongHumble5 = totalCards > 0 && strongHumbleCount > 0
    ? calculateProbability(totalCards, strongHumbleCount, 5, 1).toFixed(2)
    : '0.00';
  const probStrongHumble6 = totalCards > 0 && strongHumbleCount > 0
    ? calculateProbability(totalCards, strongHumbleCount, 6, 1).toFixed(2)
    : '0.00';
  const probTrap1 = totalCards > 0 && trapCount > 0
    ? calculateProbability(totalCards, trapCount, 5, 1).toFixed(2)
    : '0.00';
  const probTrap2 = totalCards > 0 && trapCount > 0
    ? calculateProbability(totalCards, trapCount, 5, 2).toFixed(2)
    : '0.00';

  return (
    <div style={{ minHeight: '100vh', padding: '20px', paddingBottom: '140px' }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: 'bold' }}>
          兎ラギア 1103 シミュレーター
        </h1>

        {/* Setup Panel（初回） */}
        {state && !state.firstPlayer && (
          <SetupPanel
            state={state}
            onSetupComplete={(newState) => setState(newState)}
          />
        )}

        {/* Setup完了待ち */}
        {state && !state.isSetupComplete && state.firstPlayer && (
          <div style={{ marginBottom: '20px', padding: '20px', background: '#fff3cd', borderRadius: '8px', border: '2px solid #ff9800' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>
              セットアップ完了：先攻 = {state.firstPlayer === 'me' ? '自分' : '相手'}
            </div>
            <div style={{ marginBottom: '12px' }}>
              両者に初手5枚を配布しました。先攻プレイヤーのみDPドロー(+1)を実行してください。
            </div>
            <button
              onClick={handleStartTurn}
              style={{
                padding: '12px 24px',
                background: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
              }}
            >
              Start Turn（先攻DPドロー+1）
            </button>
          </div>
        )}

        {/* 現在の手番表示 */}
        {state && (
          <div style={{
            padding: '12px',
            background: state.activePlayer === 'me' ? '#e3f2fd' : '#fff3cd',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '16px',
            fontWeight: 'bold',
            textAlign: 'center',
          }}>
            {state.activePlayer === 'me' ? '自分のターン' : '相手のターン'} (T{state.turn})
          </div>
        )}

        {/* 統計表示 */}
        {totalCards > 0 && (
          <div style={{
            background: '#fff3cd',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>デッキ統計（参考値）</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              <div>P(初手5に強謙≥1) = {probStrongHumble5}%</div>
              <div>P(6枚に強謙≥1) = {probStrongHumble6}%</div>
              <div>P(初手5に罠≥1) = {probTrap1}%</div>
              <div>P(初手5に罠≥2) = {probTrap2}%</div>
            </div>
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
              デッキ: {totalCards}枚 / 強謙: {strongHumbleCount}枚 / 罠: {trapCount}枚
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
          {/* 左: デッキ入力/管理 */}
          <div>
            <div style={{ padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
              <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>自分のデッキ入力</h2>
              <textarea
                value={deckInput}
                onChange={(e) => setDeckInput(e.target.value)}
                placeholder="1行1カード名&#10;例:&#10;レスキューラビット x3&#10;強欲で謙虚な壺 x3"
                style={{
                  width: '100%',
                  height: '200px',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  resize: 'vertical',
                }}
              />
              <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                合計: {totalCards}枚
              </div>
            </div>

            <div style={{ padding: '20px', background: '#f0f8ff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
              <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>相手デッキ入力（自動割り込み用）</h2>
              <textarea
                value={opponentDeckInput}
                onChange={(e) => setOpponentDeckInput(e.target.value)}
                placeholder="1行1カード名&#10;例:&#10;神の警告 x2&#10;奈落の落とし穴 x2&#10;次元幽閉 x2"
                style={{
                  width: '100%',
                  height: '200px',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  resize: 'vertical',
                }}
              />
              <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                合計: {opponentDeckCards.length}枚
                {opponentAnalysis && (
                  <div style={{ marginTop: '4px', fontSize: '12px' }}>
                    通常召喚メタ: {opponentAnalysis.categories.normalSummonMeta}枚 / 
                    特殊召喚メタ: {opponentAnalysis.categories.specialSummonMeta}枚 / 
                    戦闘メタ: {opponentAnalysis.categories.battleMeta}枚
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
              <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>操作</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={handleShuffle}
                  disabled={deckCards.length === 0}
                  style={{
                    padding: '10px',
                    background: deckCards.length === 0 ? '#ccc' : '#4caf50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: deckCards.length === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                  }}
                >
                  シャッフル
                </button>
                <button
                  onClick={handleDrawInitial}
                  disabled={!state || state[state.activePlayer].deck.length === 0}
                  style={{
                    padding: '10px',
                    background: !state || state[state.activePlayer].deck.length === 0 ? '#ccc' : '#2196f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: !state || state[state.activePlayer].deck.length === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                  }}
                >
                  初手5枚ドロー
                </button>
                <button
                  onClick={handleDrawFirst}
                  disabled={!state || state[state.activePlayer].deck.length === 0}
                  style={{
                    padding: '10px',
                    background: !state || state[state.activePlayer].deck.length === 0 ? '#ccc' : '#2196f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: !state || state[state.activePlayer].deck.length === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                  }}
                >
                  先攻ドロー（+1）
                </button>
                <button
                  onClick={handleUseStrongHumble}
                  disabled={!state || state[state.activePlayer].strongHumbleLock}
                  style={{
                    padding: '10px',
                    background: !state || state[state.activePlayer].strongHumbleLock ? '#ccc' : '#ff9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: !state || state[state.activePlayer].strongHumbleLock ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                  }}
                >
                  強欲で謙虚な壺を使用
                </button>
                {state?.me.strongHumbleLock && state.activePlayer === 'me' && (
                  <div style={{
                    padding: '8px',
                    background: '#ffebee',
                    border: '2px solid #f44336',
                    borderRadius: '4px',
                    color: '#c62828',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                  }}>
                    ⚠️ 特殊召喚不可（強謙ロック中）
                  </div>
                )}
                {state?.opp.strongHumbleLock && state.activePlayer === 'opp' && (
                  <div style={{
                    padding: '8px',
                    background: '#ffebee',
                    border: '2px solid #f44336',
                    borderRadius: '4px',
                    color: '#c62828',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                  }}>
                    ⚠️ 特殊召喚不可（強謙ロック中）
                  </div>
                )}
                <button
                  onClick={handleEndTurn}
                  disabled={!state}
                  style={{
                    padding: '10px',
                    background: !state ? '#ccc' : '#9c27b0',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: !state ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                  }}
                >
                  ターン終了
                </button>
                
                {/* ドロー（任意） */}
                <div style={{ marginTop: '12px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>ドロー（任意）</div>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginBottom: '8px' }}>
                    <button
                      onClick={() => setDrawCount(Math.max(1, drawCount - 1))}
                      disabled={drawCount <= 1}
                      style={{
                        padding: '4px 8px',
                        background: drawCount <= 1 ? '#ccc' : '#999',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: drawCount <= 1 ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      -1
                    </button>
                    <span style={{ minWidth: '40px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold' }}>
                      {drawCount}枚
                    </span>
                    <button
                      onClick={() => setDrawCount(Math.min(10, drawCount + 1))}
                      disabled={drawCount >= 10}
                      style={{
                        padding: '4px 8px',
                        background: drawCount >= 10 ? '#ccc' : '#999',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: drawCount >= 10 ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      +1
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      if (!state) return;
                      const player = state.activePlayer;
                      const drawResult = drawCard(state, player, drawCount);
                      setState(drawResult.state);
                    }}
                    disabled={!state || state[state.activePlayer].deck.length === 0}
                    style={{
                      padding: '10px',
                      background: !state || state[state.activePlayer].deck.length === 0 ? '#ccc' : '#2196f3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: !state || state[state.activePlayer].deck.length === 0 ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      width: '100%',
                    }}
                  >
                    ドロー（{drawCount}枚）
                  </button>
                </div>
              </div>
            </div>

            {/* 辞書管理 */}
            <div style={{ padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
              <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>カード辞書</h2>
              <GlossaryImportExport />
            </div>

            {/* デッキ検索 */}
            {state && (
              <div style={{ padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
                <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>デッキ検索</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setShowDeckSearch({ player: 'me' })}
                    disabled={state.me.deck.length === 0}
                    style={{
                      padding: '10px 20px',
                      background: state.me.deck.length === 0 ? '#ccc' : '#2196f3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: state.me.deck.length === 0 ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    自分のデッキ検索
                  </button>
                  <button
                    onClick={() => setShowDeckSearch({ player: 'opp' })}
                    disabled={state.opp.deck.length === 0}
                    style={{
                      padding: '10px 20px',
                      background: state.opp.deck.length === 0 ? '#ccc' : '#2196f3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: state.opp.deck.length === 0 ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    相手のデッキ検索
                  </button>
                </div>
                {needsShuffle && (
                  <div style={{ marginTop: '12px', padding: '12px', background: '#fff3cd', borderRadius: '4px', border: '2px solid #ff9800' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                      ⚠️ {needsShuffle.player === 'me' ? '自分' : '相手'}のデッキ要シャッフル
                    </div>
                    <button
                      onClick={() => {
                        if (!state) return;
                        const player = needsShuffle.player;
                        const playerState = state[player];
                        const seed = Date.now();
                        const shuffled = shuffleDeck([...playerState.deck], seed);
                        const newState = {
                          ...state,
                          [player]: {
                            ...playerState,
                            deck: shuffled,
                          },
                        };
                        setState(addLog(newState, `[${player === 'me' ? '自分' : '相手'}] デッキをシャッフル`, player));
                        setNeedsShuffle(null);
                      }}
                      style={{
                        padding: '8px 16px',
                        background: '#4caf50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                      }}
                    >
                      シャッフル実行
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* エクスポート/インポート */}
            <div style={{ padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>保存/読み込み</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={handleExport}
                  disabled={!state}
                  style={{
                    padding: '10px',
                    background: !state ? '#ccc' : '#607d8b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: !state ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                  }}
                >
                  エクスポート
                </button>
                <label style={{
                  padding: '10px',
                  background: '#607d8b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  textAlign: 'center',
                  display: 'block',
                }}>
                  インポート
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* 中央: 手札・場・墓地 */}
          <div>
            {/* 現在の手番プレイヤーの手札 */}
            {state && (
              <div style={{ padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
                <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>
                  {state.activePlayer === 'me' ? '自分の' : '相手の'}手札 ({state[state.activePlayer].hand.length}枚)
                </h2>
                {state[state.activePlayer].hand.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {state[state.activePlayer].hand.map((card) => (
                      <div
                        key={card.id}
                        onClick={() => handleCardClick(card.id, state.activePlayer)}
                        onDoubleClick={() => handleCardDoubleClick(card.id, state.activePlayer)}
                        onContextMenu={(e) => handleCardRightClick(e, card.id, state.activePlayer)}
                        style={{
                          padding: '8px',
                          background: card.used ? '#e0e0e0' : card.revealed ? '#fff3cd' : '#f5f5f5',
                          border: card.selected ? '3px solid #2196f3' : '1px solid #ccc',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontWeight: card.selected ? 'bold' : 'normal',
                        }}
                      >
                        <span>{card.name}</span>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {card.selected && '✓選択 '}
                          {card.used && '使用済み '}
                          {card.revealed && '公開'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: '#999', fontSize: '14px' }}>(手札なし)</div>
                )}
                <div style={{ marginTop: '12px', fontSize: '12px', color: '#666' }}>
                  左クリック: 選択（召喚用）<br />
                  ダブルクリック: 使用済み/未使用 トグル<br />
                  右クリック: 公開/非公開 トグル
                </div>
              </div>
            )}

            {/* デッキトップ可視化（練習モード） */}
            {state && opponentHandMode === 'practice' && (
              <>
                <DeckTopPeek
                  state={state}
                  player="me"
                  onStateChange={setState}
                />
                <DeckTopPeek
                  state={state}
                  player="opp"
                  onStateChange={setState}
                />
              </>
            )}

            {/* 自分の盤面（DnD対応） */}
            {state && (
              <div style={{ marginBottom: '20px' }}>
                <BoardDnD
                  state={state}
                  player="me"
                  showHand={true}
                  onMoveCard={(from, to, cardId, reason) => {
                    const newState = moveCard(state, { from, to, cardId, reason });
                    setState(newState);
                  }}
                  onCardClick={(card) => {
                    // 手札のカード選択
                    if (card.zone === 'hand') {
                      const player = card.owner || 'me';
                      const playerState = state[player];
                      const newHand = playerState.hand.map(c =>
                        c.id === card.id ? { ...c, selected: !c.selected } : { ...c, selected: false }
                      );
                      setState({
                        ...state,
                        [player]: {
                          ...playerState,
                          hand: newHand,
                        },
                      });
                    }
                  }}
                  onCardContextMenu={(e) => {
                    e.preventDefault();
                    // 右クリックメニュー（将来拡張用）
                  }}
                />
              </div>
            )}

            {/* 相手の盤面（DnD対応） */}
            {state && (
              <div style={{ marginBottom: '20px' }}>
                <BoardDnD
                  state={state}
                  player="opp"
                  showHand={opponentHandMode === 'practice'}
                  onMoveCard={(from, to, cardId, reason) => {
                    const newState = moveCard(state, { from, to, cardId, reason });
                    setState(newState);
                  }}
                  onCardClick={(clickedCard) => {
                    // 手札のカード選択
                    if (clickedCard.zone === 'hand') {
                      const cardPlayer = clickedCard.owner || 'opp';
                      const playerState = state[cardPlayer];
                      const newHand = playerState.hand.map(c =>
                        c.id === clickedCard.id ? { ...c, selected: !c.selected } : { ...c, selected: false }
                      );
                      setState({
                        ...state,
                        [cardPlayer]: {
                          ...playerState,
                          hand: newHand,
                        },
                      });
                    }
                  }}
                />
              </div>
            )}

            {/* レスキューラビット効果発動 */}
            {state && state[state.activePlayer].hand.some(c => c.name.includes('レスキューラビット')) && (
              <div style={{ padding: '20px', background: '#e8f5e9', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
                <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>レスキューラビット効果</h2>
                {state[state.activePlayer].hand
                  .filter(c => c.name.includes('レスキューラビット'))
                  .map((rabbit) => {
                    const check = canActivateRescueRabbit(state, rabbit.id);
                    return (
                      <div key={rabbit.id} style={{ marginBottom: '12px' }}>
                        <button
                          onClick={() => {
                            const player = state.activePlayer;
                            const playerState = state[player];
                            const result = activateRescueRabbit(state, playerState.zones, rabbit.id);
                            if (result.success) {
                              setState({
                                ...result.state,
                                [player]: {
                                  ...result.state[player],
                                  zones: result.zones,
                                },
                              });
                              setXyzCandidates(getXyzSummonCandidates(result.zones));
                            } else {
                              alert(result.message || '発動に失敗しました');
                            }
                          }}
                          disabled={!check.canActivate}
                          style={{
                            padding: '10px 16px',
                            background: check.canActivate ? '#4caf50' : '#ccc',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: check.canActivate ? 'pointer' : 'not-allowed',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            width: '100%',
                          }}
                        >
                          {rabbit.name}効果発動
                          {!check.canActivate && check.reason && ` (${check.reason})`}
                        </button>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* X召喚候補 */}
            {xyzCandidates.length > 0 && state && (
              <div style={{ padding: '20px', background: '#fff3cd', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
                <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>X召喚候補</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {xyzCandidates.map((candidate, index) => {
                    // 空いているモンスターゾーンを探す
                    const player = state.activePlayer;
                    const playerState = state[player];
                    const emptyZoneIndex = playerState.zones.monsterZones.findIndex((m, i) => m === null && i !== candidate.materials[0] && i !== candidate.materials[1]);
                    const targetZone = emptyZoneIndex >= 0 ? emptyZoneIndex : candidate.materials[0];
                    
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          const result = performXyzSummon(state, playerState.zones, candidate.name, candidate.materials, targetZone);
                          setState({
                            ...result.state,
                            [player]: {
                              ...result.state[player],
                              zones: result.zones,
                            },
                          });
                          setXyzCandidates([]);
                        }}
                        style={{
                          padding: '10px',
                          background: '#ff9800',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          textAlign: 'left',
                        }}
                      >
                        <div style={{ fontWeight: 'bold' }}>{candidate.name} (ランク{candidate.rank})</div>
                        <div style={{ fontSize: '12px', opacity: 0.9 }}>
                          素材: MZ{candidate.materials[0] + 1} + MZ{candidate.materials[1] + 1}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setXyzCandidates([])}
                  style={{
                    marginTop: '8px',
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
            )}

            {/* 簡易行動ログ */}
            <div style={{ padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginTop: '20px' }}>
              <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>簡易行動</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <button
                  onClick={() => handleAction('通常召喚')}
                  disabled={!state || state[state.activePlayer].summonUsed}
                  style={{
                    padding: '8px',
                    background: !state || state[state.activePlayer].summonUsed ? '#ccc' : '#4caf50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: !state || state[state.activePlayer].summonUsed ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                  }}
                >
                  通常召喚
                </button>
                <button
                  onClick={() => handleAction('特殊召喚')}
                  disabled={!state || state[state.activePlayer].strongHumbleLock}
                  style={{
                    padding: '8px',
                    background: !state || state[state.activePlayer].strongHumbleLock ? '#ccc' : '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: !state || state[state.activePlayer].strongHumbleLock ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                  }}
                >
                  特殊召喚 {state?.[state.activePlayer].strongHumbleLock ? '(ロック中)' : ''}
                </button>
                <button
                  onClick={() => handleAction('魔法発動')}
                  disabled={!state}
                  style={{
                    padding: '8px',
                    background: !state ? '#ccc' : '#2196f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: !state ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                  }}
                >
                  魔法発動
                </button>
                <button
                  onClick={() => {
                    if (!state) return;
                    const player = state.activePlayer;
                    const playerState = state[player];
                    const selectedCard = playerState.hand.find((card) => card.selected);
                    if (!selectedCard) {
                      alert('手札から罠を選択してください');
                      return;
                    }
                    
                    // 空いている魔法罠ゾーンを探す
                    const emptyZoneIndex = playerState.zones.spellTrapZones.findIndex(st => st === null);
                    if (emptyZoneIndex === -1) {
                      alert('魔法罠ゾーンに空きがありません');
                      return;
                    }
                    
                    // 手札から除外
                    const newHand = playerState.hand.filter(c => c.id !== selectedCard.id);
                    
                    // 魔法罠ゾーンにセット
                    const zoneCard: ZoneCard = {
                      ...selectedCard,
                      zoneIndex: emptyZoneIndex,
                      isSet: true,
                      faceUp: false,
                      setTurn: state.turn,
                    };
                    const newZones = placeSpellTrap(playerState.zones, zoneCard, emptyZoneIndex, true, state.turn);
                    
                    let newState = {
                      ...state,
                      [player]: {
                        ...playerState,
                        hand: newHand,
                        zones: newZones,
                      },
                    };
                    newState = addLog(newState, `罠セット: ${selectedCard.name}（ST${emptyZoneIndex + 1}）`, player);
                    setState(newState);
                  }}
                  disabled={!state}
                  style={{
                    padding: '8px',
                    background: !state ? '#ccc' : '#9c27b0',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: !state ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                  }}
                >
                  罠セット
                </button>
                <button
                  onClick={() => handleAction('罠発動')}
                  disabled={!state}
                  style={{
                    padding: '8px',
                    background: !state ? '#ccc' : '#9c27b0',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: !state ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                  }}
                >
                  罠発動
                </button>
                <button
                  onClick={() => handleAction('攻撃宣言')}
                  disabled={!state}
                  style={{
                    padding: '8px',
                    background: !state ? '#ccc' : '#ff5722',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: !state ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                  }}
                >
                  攻撃宣言
                </button>
                <button
                  onClick={() => handleAction('ダメージステップ')}
                  disabled={!state}
                  style={{
                    padding: '8px',
                    background: !state ? '#ccc' : '#ff9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: !state ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                  }}
                >
                  ダメージステップ
                </button>
              </div>
            </div>
          </div>

          {/* 右: フェイズリング + 割り込み + ログ */}
          <div>
            <div style={{ marginBottom: '20px' }}>
              {state && (
                <PhaseRing
                  currentPhase={state.phase}
                  onPhaseChange={handlePhaseChange}
                />
              )}
            </div>

            {/* 相手手札モード切替 */}
            <div style={{ padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>相手手札モード</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setOpponentHandMode('practice')}
                  style={{
                    padding: '8px 16px',
                    background: opponentHandMode === 'practice' ? '#4caf50' : '#f0f0f0',
                    color: opponentHandMode === 'practice' ? 'white' : '#333',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  練習（表示）
                </button>
                <button
                  onClick={() => setOpponentHandMode('real')}
                  style={{
                    padding: '8px 16px',
                    background: opponentHandMode === 'real' ? '#4caf50' : '#f0f0f0',
                    color: opponentHandMode === 'real' ? 'white' : '#333',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  本番（非表示）
                </button>
              </div>
            </div>

            {/* 相手手札表示 */}
            <div style={{ marginBottom: '20px' }}>
              <OpponentHand hand={opponentHand} mode={opponentHandMode} />
            </div>

            {opponentAnalysis && (
              <div style={{ padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
                <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>相手デッキ解析</h3>
                <div style={{ fontSize: '14px' }}>
                  <div>通常召喚メタ: {opponentAnalysis.categories.normalSummonMeta}枚</div>
                  <div>特殊召喚メタ: {opponentAnalysis.categories.specialSummonMeta}枚</div>
                  <div>効果無効: {opponentAnalysis.categories.effectNegate}枚</div>
                  <div>戦闘メタ: {opponentAnalysis.categories.battleMeta}枚</div>
                  <div>魔法罠メタ: {opponentAnalysis.categories.spellTrapMeta}枚</div>
                </div>
              </div>
            )}

            {state && (
              <LogPanel state={state} />
            )}

            {/* エクストラデッキ入力 */}
            <ExtraDeckInput
              player="me"
              onDeckChange={setMyExtraDeckCards}
              initialDeck={myExtraDeckCards}
            />
            <ExtraDeckInput
              player="opp"
              onDeckChange={setOpponentExtraDeckCards}
              initialDeck={opponentExtraDeckCards}
            />

            {/* エクストラデッキ表示 */}
            {state && (
              <>
                <ExtraDeckPanel state={state} player="me" />
                <ExtraDeckPanel state={state} player="opp" />
              </>
            )}
          </div>
        </div>

        {/* 割り込みポップアップ */}
        {interruptPopup && (
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: '#f44336',
              color: 'white',
              padding: '24px 32px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              zIndex: 1000,
              fontSize: '18px',
              fontWeight: 'bold',
              textAlign: 'center',
              animation: 'fadeIn 0.3s ease-in',
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️ 相手の妨害！</div>
            <div>{interruptPopup.cardName}</div>
            <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.9 }}>
              {interruptPopup.category}
            </div>
          </div>
        )}
      </div>

      {/* 固定アクションバー */}
      {state && state.isSetupComplete && (
        <StickyActionBar
          state={state}
          onStateChange={setState}
          onAction={handleAction}
          onShowXyzModal={(player) => setShowXyzModal({ player })}
          onShowSynchroModal={(player) => setShowSynchroModal({ player })}
        />
      )}

      {/* エクシーズ召喚モーダル */}
      {showXyzModal && state && (
        <SummonXyzModal
          state={state}
          player={showXyzModal.player}
          onStateChange={setState}
          onClose={() => setShowXyzModal(null)}
        />
      )}

      {/* シンクロ召喚モーダル */}
      {showSynchroModal && state && (
        <SummonSynchroModal
          state={state}
          player={showSynchroModal.player}
          onStateChange={setState}
          onClose={() => setShowSynchroModal(null)}
        />
      )}

      {/* デッキ検索モーダル */}
      {state && showDeckSearch && (
        <DeckSearchModal
          state={state}
          player={showDeckSearch.player}
          onStateChange={setState}
          onClose={() => setShowDeckSearch(null)}
          onNeedsShuffle={() => setNeedsShuffle(showDeckSearch)}
        />
      )}
    </div>
  );
}
