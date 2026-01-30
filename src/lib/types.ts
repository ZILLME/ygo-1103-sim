import { DeckCard } from './deck';

export type Player = 'me' | 'opp';
export type ZoneType = 'hand' | 'deck' | 'grave' | 'banish' | 'mz' | 'st' | 'extra';

// ゾーン参照
export interface ZoneRef {
  player: Player;
  zone: ZoneType;
  index?: number; // mz/st用（0-4）、deck用（top/bottom）
}

// カード（統一型）
export interface Card extends DeckCard {
  owner?: Player; // 所有者
  zone?: ZoneType; // 現在のゾーン
  zoneIndex?: number; // ゾーン内の位置
  isSet?: boolean; // セット状態
  faceUp?: boolean; // 表側表示
  setTurn?: number; // セットしたターン
  used?: boolean; // 使用済み
  revealed?: boolean; // 公開
  selected?: boolean; // 選択中
}

// 移動理由
export type MoveReason =
  | '通常召喚'
  | '特殊召喚'
  | 'セット'
  | '発動'
  | '破壊'
  | '除外'
  | 'バウンス'
  | 'コスト'
  | '解決'
  | '移動';
