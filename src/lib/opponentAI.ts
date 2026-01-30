import { Card, calculateProbability, SeededRandom } from './deck';
import { Phase } from './state';

// 妨害カテゴリの定義
export type InterruptCategory =
  | 'normalSummonMeta' // 通常召喚メタ（神の警告、奈落の落とし穴）
  | 'specialSummonMeta' // 特殊召喚メタ（昇天の黒角笛、神の警告）
  | 'effectNegate' // 効果無効（エフェクト・ヴェーラー、禁じられた聖杯）
  | 'battleMeta' // 戦闘メタ（次元幽閉、ミラーフォース）
  | 'spellTrapMeta'; // 魔法罠メタ（サイクロン、砂塵）

// カード名からカテゴリを判定
const cardCategoryMap: Record<string, InterruptCategory[]> = {
  // 通常召喚メタ
  神の警告: ['normalSummonMeta', 'specialSummonMeta'],
  奈落の落とし穴: ['normalSummonMeta'],
  強制脱出装置: ['normalSummonMeta'],
  
  // 特殊召喚メタ
  昇天の黒角笛: ['specialSummonMeta'],
  黒角笛: ['specialSummonMeta'],
  神の宣告: ['specialSummonMeta', 'normalSummonMeta'],
  
  // 効果無効
  エフェクト・ヴェーラー: ['effectNegate'],
  ヴェーラーの呪詛: ['effectNegate'],
  禁じられた聖杯: ['effectNegate'],
  
  // 戦闘メタ
  次元幽閉: ['battleMeta'],
  聖なるバリア: ['battleMeta'],
  ミラーフォース: ['battleMeta'],
  激流葬: ['normalSummonMeta', 'specialSummonMeta'],
  
  // 魔法罠メタ
  サイクロン: ['spellTrapMeta'],
  ハーピィの羽根帚: ['spellTrapMeta'],
  砂塵の大竜巻: ['spellTrapMeta'],
  盗賊の七つ道具: ['spellTrapMeta'],
};

// フェイズごとの反応可能カテゴリ
const phaseInterruptMap: Record<Phase, InterruptCategory[]> = {
  DP: [], // ドローフェイズでは通常反応なし
  SP: [], // スタンバイフェイズでは通常反応なし
  MP1: ['normalSummonMeta', 'specialSummonMeta', 'effectNegate', 'spellTrapMeta'],
  BP: ['battleMeta', 'effectNegate'],
  MP2: ['normalSummonMeta', 'specialSummonMeta', 'effectNegate', 'spellTrapMeta'],
  EP: [],
};

// 行動タイプごとの反応可能カテゴリ
export type ActionType =
  | 'normalSummon'
  | 'specialSummon'
  | 'spellActivate'
  | 'trapActivate'
  | 'attackDeclare'
  | 'damageStep';

const actionInterruptMap: Record<ActionType, InterruptCategory[]> = {
  normalSummon: ['normalSummonMeta', 'specialSummonMeta'],
  specialSummon: ['specialSummonMeta'],
  spellActivate: ['spellTrapMeta', 'effectNegate'],
  trapActivate: ['spellTrapMeta', 'effectNegate'],
  attackDeclare: ['battleMeta'],
  damageStep: ['battleMeta'], // ダメステ対応カードのみ
};

// 相手デッキの解析結果
export interface OpponentDeckAnalysis {
  totalCards: number;
  categories: Record<InterruptCategory, number>; // 各カテゴリの枚数
  categoryCards: Record<InterruptCategory, string[]>; // 各カテゴリに属するカード名
}

// 相手デッキを解析
export function analyzeOpponentDeck(cards: Card[]): OpponentDeckAnalysis {
  const categories: Record<InterruptCategory, number> = {
    normalSummonMeta: 0,
    specialSummonMeta: 0,
    effectNegate: 0,
    battleMeta: 0,
    spellTrapMeta: 0,
  };

  const categoryCards: Record<InterruptCategory, string[]> = {
    normalSummonMeta: [],
    specialSummonMeta: [],
    effectNegate: [],
    battleMeta: [],
    spellTrapMeta: [],
  };

  let totalCards = 0;

  for (const card of cards) {
    totalCards += card.count;
    const cardCategories = cardCategoryMap[card.name] || [];

    for (const category of cardCategories) {
      categories[category] += card.count;
      if (!categoryCards[category].includes(card.name)) {
        categoryCards[category].push(card.name);
      }
    }
  }

  return {
    totalCards,
    categories,
    categoryCards,
  };
}

// 妨害判定結果
export interface InterruptResult {
  triggered: boolean;
  cardName?: string;
  category?: InterruptCategory;
}

// 妨害を判定（超幾何分布ベースの確率判定）
export function checkInterrupt(
  analysis: OpponentDeckAnalysis,
  phase: Phase,
  actionType: ActionType,
  opponentHandSize: number, // 相手の手札枚数（推定）
  rng: SeededRandom
): InterruptResult {
  // フェイズと行動タイプから反応可能なカテゴリを抽出
  const phaseCategories = phaseInterruptMap[phase];
  const actionCategories = actionInterruptMap[actionType];
  
  // 両方に含まれるカテゴリのみが反応可能
  const possibleCategories = phaseCategories.filter(cat => 
    actionCategories.includes(cat)
  ) as InterruptCategory[];

  if (possibleCategories.length === 0) {
    return { triggered: false };
  }

  // 各カテゴリについて確率判定
  for (const category of possibleCategories) {
    const categoryCount = analysis.categories[category];
    if (categoryCount === 0) continue;

    // 超幾何分布で「相手の手札に1枚以上ある確率」を計算
    const probability = calculateProbability(
      analysis.totalCards,
      categoryCount,
      opponentHandSize,
      1
    );

    // 確率に基づいて判定（乱数で抽選）
    const roll = rng.next() * 100;
    if (roll < probability) {
      // 妨害発生！該当カテゴリのカードから1枚選ぶ
      const availableCards = analysis.categoryCards[category];
      if (availableCards.length > 0) {
        const cardIndex = Math.floor(rng.next() * availableCards.length);
        return {
          triggered: true,
          cardName: availableCards[cardIndex],
          category,
        };
      }
    }
  }

  return { triggered: false };
}

// カード名からカテゴリを取得（部分一致対応）
export function getCardCategories(cardName: string): InterruptCategory[] {
  // 完全一致を優先
  if (cardCategoryMap[cardName]) {
    return cardCategoryMap[cardName];
  }

  // 部分一致で検索
  for (const [key, categories] of Object.entries(cardCategoryMap)) {
    if (cardName.includes(key) || key.includes(cardName)) {
      return categories;
    }
  }

  return [];
}

// カード名をカテゴリマップに追加（拡張用）
export function addCardToCategory(
  cardName: string,
  categories: InterruptCategory[]
): void {
  cardCategoryMap[cardName] = categories;
}
