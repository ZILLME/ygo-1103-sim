// シード付き乱数生成器（Xorshift32）
export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed ^= this.seed << 13;
    this.seed ^= this.seed >>> 17;
    this.seed ^= this.seed << 5;
    return (this.seed >>> 0) / 0xffffffff;
  }
}

export interface Card {
  name: string;
  count: number;
}

export interface DeckCard {
  name: string;
  id: string; // 同一カードでも区別するためのID
}

// デッキ文字列をパース
export function parseDeck(input: string): Card[] {
  const lines = input.trim().split('\n');
  const cardMap = new Map<string, number>();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // "x3" や "3" を検出
    const match = trimmed.match(/^(.+?)\s*(?:x|×)?\s*(\d+)$/);
    if (match) {
      const name = match[1].trim();
      const count = parseInt(match[2], 10);
      cardMap.set(name, (cardMap.get(name) || 0) + count);
    } else {
      // 枚数指定なしの場合は1枚
      cardMap.set(trimmed, (cardMap.get(trimmed) || 0) + 1);
    }
  }

  return Array.from(cardMap.entries()).map(([name, count]) => ({ name, count }));
}

// デッキをシャッフル（Fisher-Yates + シード付き乱数）
export function shuffleDeck(deck: DeckCard[], seed: number): DeckCard[] {
  const shuffled = [...deck];
  const rng = new SeededRandom(seed);

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

// カードリストからデッキ配列を生成
export function createDeck(cards: Card[]): DeckCard[] {
  const deck: DeckCard[] = [];
  for (const card of cards) {
    for (let i = 0; i < card.count; i++) {
      deck.push({
        name: card.name,
        id: `${card.name}_${i}`,
      });
    }
  }
  return deck;
}

// デッキから指定枚数をドロー
export function drawCards(deck: DeckCard[], count: number): { drawn: DeckCard[]; remaining: DeckCard[] } {
  const drawn = deck.slice(0, count);
  const remaining = deck.slice(count);
  return { drawn, remaining };
}

// 統計計算（超幾何分布の近似）
export function calculateProbability(total: number, target: number, draw: number, need: number): number {
  if (need > target || need > draw) return 0;
  if (draw > total) return 0;

  // 超幾何分布の累積確率（簡易版）
  let prob = 0;
  for (let k = need; k <= Math.min(draw, target); k++) {
    // C(target, k) * C(total - target, draw - k) / C(total, draw)
    const comb1 = combination(target, k);
    const comb2 = combination(total - target, draw - k);
    const comb3 = combination(total, draw);
    if (comb3 > 0) {
      prob += (comb1 * comb2) / comb3;
    }
  }
  return prob * 100;
}

function combination(n: number, k: number): number {
  if (k > n || k < 0) return 0;
  if (k === 0 || k === n) return 1;
  k = Math.min(k, n - k);
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = result * (n - i) / (i + 1);
  }
  return result;
}
