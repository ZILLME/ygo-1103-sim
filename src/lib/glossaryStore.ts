// カード辞書の永続化ストア（localStorage使用）

export interface MonsterInfo {
  attribute?: string; // 属性（闇/光/炎/水/地/風）
  level?: number; // レベル
  race?: string; // 種族（戦士族/魔法使い族など）
  type?: string; // タイプ（効果/通常/儀式/融合/シンクロ/エクシーズ/リンク）
  atk?: number; // 攻撃力
  def?: number; // 守備力
}

export interface GlossaryEntry {
  summary: string; // 効果要約
  timing?: string; // 発動タイミング
  notes?: string; // その他メモ
  tags?: string[]; // タグ（検索用）
  typeCategory?: 'monster' | 'spell' | 'trap'; // カード種別
  url?: string; // 公式DB/ニューロンのURL
  monster?: MonsterInfo; // モンスター情報
}

export type Glossary = Record<string, GlossaryEntry>;

const STORAGE_KEY = 'yu-gioh-glossary';

// デフォルト辞書（組み込み）
const defaultGlossary: Glossary = {
  'レスキューラビット': {
    summary: '自身を除外してデッキから通常モンスター2体を特殊召喚',
    timing: 'MP1 起動効果（チェーン）',
    notes: 'ヴェーラー/聖杯で無効可（コスト除外は戻らない）',
    tags: ['通常モンスター', '特殊召喚'],
    typeCategory: 'monster',
    monster: {
      attribute: '地',
      level: 4,
      race: '獣族',
      type: '効果',
      atk: 300,
      def: 100,
    },
  },
  '強欲で謙虚な壺': {
    summary: 'デッキから3枚ドロー。このターンは特殊召喚不可',
    timing: 'メインフェイズ 起動効果',
    notes: 'サイクロン/砂塵で破壊可',
    tags: ['ドロー', '制約'],
    typeCategory: 'spell',
  },
  '神の警告': {
    summary: 'LP2000払って召喚・特殊召喚・反転召喚を無効化',
    timing: '召喚時 カウンター罠',
    notes: '魔法の筒/天罰で無効可',
    tags: ['召喚無効', 'カウンター罠'],
    typeCategory: 'trap',
  },
  '奈落の落とし穴': {
    summary: '攻撃力1500以上の召喚・反転召喚・特殊召喚を破壊して除外',
    timing: '召喚成功時 通常罠',
    notes: 'サイクロン/砂塵で破壊可',
    tags: ['召喚メタ', '通常罠'],
    typeCategory: 'trap',
  },
  '次元幽閉': {
    summary: '攻撃宣言時に攻撃モンスターを除外',
    timing: '攻撃宣言時 通常罠',
    notes: 'サイクロン/砂塵で破壊可',
    tags: ['戦闘メタ', '通常罠'],
    typeCategory: 'trap',
  },
  'サイクロン': {
    summary: '魔法・罠カード1枚を破壊',
    timing: 'メインフェイズ 速攻魔法',
    notes: '魔法の筒/天罰で無効可',
    tags: ['魔法メタ', '速攻魔法'],
    typeCategory: 'spell',
  },
  'エフェクト・ヴェーラー': {
    summary: 'モンスターの効果発動を無効化',
    timing: '効果発動時 カウンター罠',
    notes: '魔法の筒/天罰で無効可',
    tags: ['効果無効', 'カウンター罠'],
    typeCategory: 'trap',
  },
  'エヴォルカイザー・ラギア': {
    summary: '1ターン1度、魔法・罠・モンスター効果の発動を無効化して破壊',
    timing: '効果発動時 誘発即時効果',
    notes: 'ヴェーラー/聖杯で無効可',
    tags: ['効果無効', 'Xモンスター'],
    typeCategory: 'monster',
    monster: {
      attribute: '炎',
      level: 4,
      race: '恐竜族',
      type: 'エクシーズ',
      atk: 2400,
      def: 2000,
    },
  },
  'エヴォルカイザー・ドルカ': {
    summary: '1ターン2度まで、モンスター効果の発動を無効化して破壊',
    timing: '効果発動時 誘発即時効果',
    notes: 'ヴェーラー/聖杯で無効可',
    tags: ['効果無効', 'Xモンスター'],
    typeCategory: 'monster',
    monster: {
      attribute: '炎',
      level: 4,
      race: '恐竜族',
      type: 'エクシーズ',
      atk: 2300,
      def: 1700,
    },
  },
};

// 辞書を読み込む（localStorage + デフォルト）
export function loadGlossary(): Glossary {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Glossary;
      // デフォルトとマージ（ユーザー追加を優先）
      return { ...defaultGlossary, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load glossary:', e);
  }
  return { ...defaultGlossary };
}

// 辞書を保存する
export function saveGlossary(glossary: Glossary): void {
  try {
    // デフォルト辞書のキーを除外して保存（デフォルトは常に最新版を使用）
    const userEntries: Glossary = {};
    for (const [key, value] of Object.entries(glossary)) {
      if (!defaultGlossary[key]) {
        userEntries[key] = value;
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userEntries));
  } catch (e) {
    console.error('Failed to save glossary:', e);
  }
}

// カード情報を取得
export function getCardInfo(cardName: string): GlossaryEntry | null {
  const glossary = loadGlossary();
  
  // 完全一致
  if (glossary[cardName]) {
    return glossary[cardName];
  }
  
  // 部分一致
  for (const [key, value] of Object.entries(glossary)) {
    if (cardName.includes(key) || key.includes(cardName)) {
      return value;
    }
  }
  
  return null;
}

// カード情報を追加/更新
export function setCardInfo(cardName: string, entry: GlossaryEntry): void {
  const glossary = loadGlossary();
  glossary[cardName] = entry;
  saveGlossary(glossary);
}

// カード情報を削除（ユーザー追加分のみ）
export function deleteCardInfo(cardName: string): void {
  if (defaultGlossary[cardName]) {
    // デフォルト辞書のエントリは削除できない
    return;
  }
  const glossary = loadGlossary();
  delete glossary[cardName];
  saveGlossary(glossary);
}

// 辞書をエクスポート（JSON文字列）
export function exportGlossary(): string {
  const glossary = loadGlossary();
  return JSON.stringify(glossary, null, 2);
}

// 辞書をインポート（JSON文字列）
export function importGlossary(json: string): { success: boolean; error?: string } {
  try {
    const imported = JSON.parse(json) as Glossary;
    
    // バリデーション
    if (typeof imported !== 'object' || imported === null) {
      return { success: false, error: 'Invalid JSON format' };
    }
    
    for (const [key, value] of Object.entries(imported)) {
      if (typeof key !== 'string' || typeof value !== 'object' || value === null) {
        return { success: false, error: `Invalid entry for "${key}"` };
      }
      if (typeof value.summary !== 'string') {
        return { success: false, error: `Missing "summary" for "${key}"` };
      }
    }
    
    // 既存辞書とマージ（インポートを優先）
    const current = loadGlossary();
    const merged = { ...current, ...imported };
    saveGlossary(merged);
    
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

// メモを更新（notesフィールドのみ）
export function updateCardNotes(cardName: string, notes: string): void {
  const current = getCardInfo(cardName);
  const entry: GlossaryEntry = current
    ? { ...current, notes }
    : { summary: '', notes };
  setCardInfo(cardName, entry);
}
