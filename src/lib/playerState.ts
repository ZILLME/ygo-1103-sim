import { DeckCard } from './deck';
import { Zones, createEmptyZones } from './zones';

export type Player = 'me' | 'opp';

export interface HandCard extends DeckCard {
  used?: boolean;
  revealed?: boolean;
  selected?: boolean;
}

// プレイヤーごとの状態
export interface PlayerState {
  deck: DeckCard[];
  hand: HandCard[];
  extraDeck: DeckCard[]; // エクストラデッキ
  zones: Zones;
  strongHumbleLock: boolean; // 強謙ロック
  summonUsed: boolean; // 通常召喚使用済み
}

// 空のプレイヤー状態を作成
export function createEmptyPlayerState(deck: DeckCard[] = [], extraDeck: DeckCard[] = []): PlayerState {
  return {
    deck: [...deck],
    hand: [],
    extraDeck: [...extraDeck],
    zones: createEmptyZones(),
    strongHumbleLock: false,
    summonUsed: false,
  };
}

// プレイヤー状態をリセット（ターン終了時）
export function resetTurnFlags(state: PlayerState): PlayerState {
  return {
    ...state,
    strongHumbleLock: false,
    summonUsed: false,
  };
}
