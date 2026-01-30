// カード効果の簡易辞書
export interface CardInfo {
  summary: string; // 効果要約
  timing?: string; // 発動タイミング
  counterBy?: string; // 対策カード
  notes?: string; // その他メモ
}

export const cardGlossary: Record<string, CardInfo> = {
  'レスキューラビット': {
    summary: '自身を除外してデッキから通常モンスター2体を特殊召喚',
    timing: 'MP1 起動効果（チェーン）',
    counterBy: 'ヴェーラー/聖杯で無効可（コスト除外は戻らない）',
  },
  '強欲で謙虚な壺': {
    summary: 'デッキから3枚ドロー。このターンは特殊召喚不可',
    timing: 'メインフェイズ 起動効果',
    counterBy: 'サイクロン/砂塵で破壊可',
  },
  '神の警告': {
    summary: 'LP2000払って召喚・特殊召喚・反転召喚を無効化',
    timing: '召喚時 カウンター罠',
    counterBy: '魔法の筒/天罰で無効可',
  },
  '奈落の落とし穴': {
    summary: '攻撃力1500以上の召喚・反転召喚・特殊召喚を破壊して除外',
    timing: '召喚成功時 通常罠',
    counterBy: 'サイクロン/砂塵で破壊可',
  },
  '次元幽閉': {
    summary: '攻撃宣言時に攻撃モンスターを除外',
    timing: '攻撃宣言時 通常罠',
    counterBy: 'サイクロン/砂塵で破壊可',
  },
  'サイクロン': {
    summary: '魔法・罠カード1枚を破壊',
    timing: 'メインフェイズ 速攻魔法',
    counterBy: '魔法の筒/天罰で無効可',
  },
  'エフェクト・ヴェーラー': {
    summary: 'モンスターの効果発動を無効化',
    timing: '効果発動時 カウンター罠',
    counterBy: '魔法の筒/天罰で無効可',
  },
  'エヴォルカイザー・ラギア': {
    summary: '1ターン1度、魔法・罠・モンスター効果の発動を無効化して破壊',
    timing: '効果発動時 誘発即時効果',
    counterBy: 'ヴェーラー/聖杯で無効可',
  },
  'エヴォルカイザー・ドルカ': {
    summary: '1ターン2度まで、モンスター効果の発動を無効化して破壊',
    timing: '効果発動時 誘発即時効果',
    counterBy: 'ヴェーラー/聖杯で無効可',
  },
};

// ユーザーカスタムメモ（localStorage）
const CUSTOM_MEMO_KEY = 'yu-gioh-card-memos';

export function getCustomMemo(cardName: string): string | null {
  try {
    const memos = JSON.parse(localStorage.getItem(CUSTOM_MEMO_KEY) || '{}');
    return memos[cardName] || null;
  } catch {
    return null;
  }
}

export function setCustomMemo(cardName: string, memo: string): void {
  try {
    const memos = JSON.parse(localStorage.getItem(CUSTOM_MEMO_KEY) || '{}');
    memos[cardName] = memo;
    localStorage.setItem(CUSTOM_MEMO_KEY, JSON.stringify(memos));
  } catch {
    // エラー時は無視
  }
}

export function getCardInfo(cardName: string): CardInfo | null {
  // 辞書から検索（部分一致）
  const exactMatch = cardGlossary[cardName];
  if (exactMatch) return exactMatch;

  // 部分一致で検索
  for (const [key, value] of Object.entries(cardGlossary)) {
    if (cardName.includes(key) || key.includes(cardName)) {
      return value;
    }
  }

  return null;
}
