import { DeckCard } from './deck';
import { Zones, createEmptyZones } from './zones';
import { Player, PlayerState, createEmptyPlayerState, resetTurnFlags } from './playerState';

export type Phase = 'DP' | 'SP' | 'MP1' | 'BP' | 'MP2' | 'EP';

export interface HandCard extends DeckCard {
  used?: boolean;
  revealed?: boolean;
  selected?: boolean;
  setTurn?: number; // セットしたターン（罠用）
}

export interface LogEntry {
  turn: number;
  phase: Phase;
  action: string;
  timestamp: number;
  player?: Player; // 行動したプレイヤー
}

export interface GameState {
  // 後方互換性のため残す（非推奨）
  deck: DeckCard[];
  hand: HandCard[];
  field: DeckCard[];
  grave: DeckCard[];
  zones: Zones;
  strongHumbleLock: boolean;
  
  // 新しい構造
  me: PlayerState;
  opp: PlayerState;
  activePlayer: Player; // 現在の手番プレイヤー
  firstPlayer?: Player; // 先攻プレイヤー（Setupで設定）
  isSetupComplete?: boolean; // Setup完了フラグ
  phase: Phase;
  turn: number;
  logs: LogEntry[];
  seed: number;
}

export function createInitialState(deck: DeckCard[], seed: number = Date.now(), opponentDeck?: DeckCard[]): GameState {
  return {
    // 後方互換性
    deck: [...deck],
    hand: [],
    field: [],
    grave: [],
    zones: createEmptyZones(),
    strongHumbleLock: false,
    
    // 新しい構造
    me: createEmptyPlayerState(deck),
    opp: createEmptyPlayerState(opponentDeck || []),
    activePlayer: 'me',
    phase: 'DP',
    turn: 1,
    logs: [],
    seed,
    isSetupComplete: false, // Setup未完了
  };
}

export function addLog(state: GameState, action: string, player?: Player): GameState {
  return {
    ...state,
    logs: [
      ...state.logs,
      {
        turn: state.turn,
        phase: state.phase,
        action,
        timestamp: Date.now(),
        player: player || state.activePlayer,
      },
    ],
  };
}

export function activateStrongHumble(state: GameState, player: Player): GameState {
  const playerState = state[player];
  const updatedPlayerState = {
    ...playerState,
    strongHumbleLock: true,
  };
  
  return addLog(
    {
      ...state,
      [player]: updatedPlayerState,
    },
    '強欲で謙虚な壺を使用（このターンは特殊召喚不可）',
    player
  );
}

import { drawCard } from './move';

export function endTurn(state: GameState): GameState {
  const currentPlayer = state.activePlayer;
  const nextPlayer: Player = currentPlayer === 'me' ? 'opp' : 'me';
  
  // 現在のプレイヤーのターン限定フラグをリセット
  const currentPlayerState = resetTurnFlags(state[currentPlayer]);
  
  // ターン終了ログ
  let newState = addLog(
    {
      ...state,
      [currentPlayer]: currentPlayerState,
    },
    `ターン終了（${currentPlayer === 'me' ? '自分' : '相手'}）`,
    currentPlayer
  );
  
  // ターン交代
  newState = {
    ...newState,
    activePlayer: nextPlayer,
    phase: 'DP',
    turn: state.turn + 1,
  };
  
  // 次のプレイヤーがDPで1枚ドロー（共通関数を使用）
  const drawResult = drawCard(newState, nextPlayer, 1);
  newState = drawResult.state;
  
  return newState;
}

export function changePhase(state: GameState, phase: Phase): GameState {
  return {
    ...state,
    phase,
  };
}

export function toggleCardUsed(hand: HandCard[], cardId: string): HandCard[] {
  return hand.map((card) =>
    card.id === cardId ? { ...card, used: !card.used } : card
  );
}

export function toggleCardRevealed(hand: HandCard[], cardId: string): HandCard[] {
  return hand.map((card) =>
    card.id === cardId ? { ...card, revealed: !card.revealed } : card
  );
}

export function toggleCardSelected(hand: HandCard[], cardId: string): HandCard[] {
  return hand.map((card) =>
    card.id === cardId ? { ...card, selected: !card.selected } : { ...card, selected: false }
  );
}

export function moveCardToField(state: GameState, cardId: string): GameState {
  const cardIndex = state.hand.findIndex((card) => card.id === cardId);
  if (cardIndex === -1) return state;

  const card = state.hand[cardIndex];
  const newHand = state.hand.filter((_, index) => index !== cardIndex);
  const newField = [...state.field, { name: card.name, id: card.id }];

  return {
    ...state,
    hand: newHand,
    field: newField,
  };
}

export function moveSelectedCardToField(state: GameState): GameState {
  const selectedCard = state.hand.find((card) => card.selected);
  if (!selectedCard) return state;

  return moveCardToField(state, selectedCard.id);
}

export function exportState(state: GameState): string {
  return JSON.stringify(state, null, 2);
}

export function importState(json: string): GameState | null {
  try {
    const parsed = JSON.parse(json);
    // バリデーション
    if (
      Array.isArray(parsed.deck) &&
      Array.isArray(parsed.hand) &&
      Array.isArray(parsed.field) &&
      Array.isArray(parsed.grave) &&
      typeof parsed.phase === 'string' &&
      typeof parsed.turn === 'number' &&
      typeof parsed.strongHumbleLock === 'boolean'
    ) {
      return parsed as GameState;
    }
    return null;
  } catch {
    return null;
  }
}

export function generateMarkdownLog(state: GameState): string {
  const lines: string[] = [];
  lines.push('# デュエルログ\n');
  lines.push(`**現在ターン**: ${state.turn}\n`);
  lines.push(`**現在フェイズ**: ${state.phase}\n`);
  lines.push(`**現在の手番**: ${state.activePlayer === 'me' ? '自分' : '相手'}\n`);

  if (state.me.strongHumbleLock) {
    lines.push('⚠️ **自分：強謙ロック中（特殊召喚不可）**\n');
  }
  if (state.opp.strongHumbleLock) {
    lines.push('⚠️ **相手：強謙ロック中（特殊召喚不可）**\n');
  }

  lines.push('\n## 行動ログ\n');

  let currentTurn = 0;
  for (const log of state.logs) {
    if (log.turn !== currentTurn) {
      currentTurn = log.turn;
      lines.push(`\n### T${currentTurn} - ${log.phase}\n`);
    }
    lines.push(`- ${log.action}`);
  }

  lines.push('\n## 現在の状態\n');
  
  // 自分の状態
  lines.push(`### 自分`);
  lines.push(`- **手札**: ${state.me.hand.length}枚`);
  if (state.me.hand.length > 0) {
    state.me.hand.forEach((card) => {
      const markers: string[] = [];
      if (card.used) markers.push('使用済み');
      if (card.revealed) markers.push('公開');
      const markerStr = markers.length > 0 ? ` [${markers.join(', ')}]` : '';
      lines.push(`  - ${card.name}${markerStr}`);
    });
  }
  lines.push(`- **モンスターゾーン**: ${state.me.zones.monsterZones.filter(m => m !== null).length}枚`);
  lines.push(`- **魔法罠ゾーン**: ${state.me.zones.spellTrapZones.filter(st => st !== null).length}枚`);
  lines.push(`- **墓地**: ${state.me.zones.graveyard.length}枚`);
  lines.push(`- **除外**: ${state.me.zones.banished.length}枚`);
  lines.push(`- **デッキ**: ${state.me.deck.length}枚`);
  
  // 相手の状態
  lines.push(`### 相手`);
  lines.push(`- **手札**: ${state.opp.hand.length}枚`);
  lines.push(`- **モンスターゾーン**: ${state.opp.zones.monsterZones.filter(m => m !== null).length}枚`);
  lines.push(`- **魔法罠ゾーン**: ${state.opp.zones.spellTrapZones.filter(st => st !== null).length}枚`);
  lines.push(`- **墓地**: ${state.opp.zones.graveyard.length}枚`);
  lines.push(`- **除外**: ${state.opp.zones.banished.length}枚`);
  lines.push(`- **デッキ**: ${state.opp.deck.length}枚`);

  return lines.join('\n');
}
