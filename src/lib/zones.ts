import { DeckCard } from './deck';

// カードの位置情報
export interface ZoneCard extends DeckCard {
  zoneIndex?: number; // ゾーン内の位置（Monster/SpellTrap用）
  isSet?: boolean; // セット状態
  faceUp?: boolean; // 表側表示
  setTurn?: number; // セットしたターン（罠用）
}

// エクシーズ素材（MZインデックスに紐付く）
export interface XyzMaterials {
  [monsterZoneIndex: number]: ZoneCard[]; // そのMZのエクシーズモンスターの素材
}

// ゾーン定義
export interface Zones {
  monsterZones: (ZoneCard | null)[]; // 5つのモンスターゾーン
  spellTrapZones: (ZoneCard | null)[]; // 5つの魔法罠ゾーン
  graveyard: ZoneCard[];
  banished: ZoneCard[];
  extraDeck: ZoneCard[]; // エクストラデッキ（非推奨、PlayerState.extraDeckを使用）
  xyzMaterials: XyzMaterials; // エクシーズ素材
}

// 空のゾーンを作成
export function createEmptyZones(): Zones {
  return {
    monsterZones: [null, null, null, null, null],
    spellTrapZones: [null, null, null, null, null],
    graveyard: [],
    banished: [],
    extraDeck: [],
    xyzMaterials: {},
  };
}

// モンスターゾーンにカードを配置
export function placeMonster(
  zones: Zones,
  card: ZoneCard,
  zoneIndex: number
): Zones {
  if (zoneIndex < 0 || zoneIndex >= 5) return zones;
  if (zones.monsterZones[zoneIndex] !== null) return zones; // 既にカードがある

  const newZones = { ...zones };
  newZones.monsterZones = [...zones.monsterZones];
  newZones.monsterZones[zoneIndex] = { ...card, zoneIndex, faceUp: true };
  return newZones;
}

// 魔法罠ゾーンにカードを配置
export function placeSpellTrap(
  zones: Zones,
  card: ZoneCard,
  zoneIndex: number,
  isSet: boolean = false,
  setTurn?: number
): Zones {
  if (zoneIndex < 0 || zoneIndex >= 5) return zones;
  if (zones.spellTrapZones[zoneIndex] !== null) return zones;

  const newZones = { ...zones };
  newZones.spellTrapZones = [...zones.spellTrapZones];
  newZones.spellTrapZones[zoneIndex] = {
    ...card,
    zoneIndex,
    isSet,
    faceUp: !isSet,
    setTurn: isSet ? setTurn : undefined,
  };
  return newZones;
}

// 罠が発動可能かチェック（セットターン発動不可）
export function canActivateTrap(
  card: ZoneCard,
  currentTurn: number
): { canActivate: boolean; reason?: string } {
  if (!card.isSet) {
    return { canActivate: true }; // 表側なら発動可能
  }
  
  if (card.setTurn !== undefined && card.setTurn === currentTurn) {
    return { canActivate: false, reason: 'セットしたターンは発動できない' };
  }
  
  return { canActivate: true };
}

// モンスターゾーンからカードを墓地へ送る
export function sendMonsterToGrave(
  zones: Zones,
  zoneIndex: number
): { zones: Zones; card: ZoneCard | null } {
  if (zoneIndex < 0 || zoneIndex >= 5) return { zones, card: null };
  const card = zones.monsterZones[zoneIndex];
  if (!card) return { zones, card: null };

  const newZones = { ...zones };
  newZones.monsterZones = [...zones.monsterZones];
  newZones.monsterZones[zoneIndex] = null;
  newZones.graveyard = [...zones.graveyard, { ...card, zoneIndex: undefined }];
  return { zones: newZones, card };
}

// 魔法罠ゾーンからカードを墓地へ送る
export function sendSpellTrapToGrave(
  zones: Zones,
  zoneIndex: number
): { zones: Zones; card: ZoneCard | null } {
  if (zoneIndex < 0 || zoneIndex >= 5) return { zones, card: null };
  const card = zones.spellTrapZones[zoneIndex];
  if (!card) return { zones, card: null };

  const newZones = { ...zones };
  newZones.spellTrapZones = [...zones.spellTrapZones];
  newZones.spellTrapZones[zoneIndex] = null;
  newZones.graveyard = [...zones.graveyard, { ...card, zoneIndex: undefined }];
  return { zones: newZones, card };
}

// 手札から除外
export function banishFromHand(
  zones: Zones,
  card: ZoneCard
): Zones {
  return {
    ...zones,
    banished: [...zones.banished, card],
  };
}

// モンスターゾーンから除外
export function banishMonster(
  zones: Zones,
  zoneIndex: number
): { zones: Zones; card: ZoneCard | null } {
  if (zoneIndex < 0 || zoneIndex >= 5) return { zones, card: null };
  const card = zones.monsterZones[zoneIndex];
  if (!card) return { zones, card: null };

  const newZones = { ...zones };
  newZones.monsterZones = [...zones.monsterZones];
  newZones.monsterZones[zoneIndex] = null;
  newZones.banished = [...zones.banished, { ...card, zoneIndex: undefined }];
  return { zones: newZones, card };
}

// デッキからカードを検索（通常モンスター）
export function searchNormalMonstersFromDeck(
  deck: DeckCard[],
  count: number
): { found: DeckCard[]; remaining: DeckCard[] } {
  const normalMonsters: DeckCard[] = [];
  const remaining: DeckCard[] = [];

  for (const card of deck) {
    // 通常モンスターの判定（簡易版：名前で判定）
    if (
      card.name.includes('セイバーザウルス') ||
      card.name.includes('ジェネティック・ワーウルフ') ||
      card.name.includes('通常モンスター') ||
      (card.name.includes('恐竜') && !card.name.includes('効果'))
    ) {
      if (normalMonsters.length < count) {
        normalMonsters.push(card);
      } else {
        remaining.push(card);
      }
    } else {
      remaining.push(card);
    }
  }

  return { found: normalMonsters, remaining };
}

// エクストラデッキからカードを特殊召喚
export function summonFromExtraDeck(
  zones: Zones,
  extraCard: ZoneCard,
  materialIndices: number[],
  monsterZoneIndex: number
): { zones: Zones; materials: ZoneCard[] } {
  // 素材を墓地へ送る
  const materials: ZoneCard[] = [];
  let newZones = { ...zones };
  
  for (const index of materialIndices) {
    const result = sendMonsterToGrave(newZones, index);
    if (result.card) {
      materials.push(result.card);
      newZones = result.zones;
    }
  }

  // エクストラデッキから場へ
  newZones = placeMonster(newZones, extraCard, monsterZoneIndex);
  newZones.extraDeck = newZones.extraDeck.filter(c => c.id !== extraCard.id);

  return { zones: newZones, materials };
}
