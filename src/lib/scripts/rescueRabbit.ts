import { GameState, addLog } from '../state';
import {
  Zones,
  searchNormalMonstersFromDeck,
  placeMonster,
  banishFromHand,
  sendMonsterToGrave,
} from '../zones';
import { DeckCard } from '../deck';

// レスキューラビットの効果発動
export interface RescueRabbitResult {
  success: boolean;
  state: GameState;
  zones: Zones;
  selectedMonsters?: DeckCard[];
  message?: string;
}

// レスキューラビットが発動可能かチェック
export function canActivateRescueRabbit(
  state: GameState,
  handCardId: string
): { canActivate: boolean; reason?: string } {
  const player = state.activePlayer;
  const playerState = state[player];
  
  // MP1でなければ発動不可
  if (state.phase !== 'MP1') {
    return { canActivate: false, reason: 'メインフェイズ1でのみ発動可能' };
  }

  // 強謙ロック中は発動不可
  if (playerState.strongHumbleLock) {
    return { canActivate: false, reason: '強欲で謙虚な壺使用ターンは特殊召喚不可' };
  }

  // 手札にレスキューラビットがあるか
  const rabbit = playerState.hand.find(c => c.id === handCardId);
  if (!rabbit || !rabbit.name.includes('レスキューラビット')) {
    return { canActivate: false, reason: 'レスキューラビットが手札にない' };
  }

  // デッキに通常モンスターが2体以上あるか
  const normalMonsters = playerState.deck.filter(card =>
    card.name.includes('セイバーザウルス') ||
    card.name.includes('ジェネティック・ワーウルフ') ||
    card.name.includes('通常モンスター') ||
    (card.name.includes('恐竜') && !card.name.includes('効果'))
  );

  if (normalMonsters.length < 2) {
    return { canActivate: false, reason: 'デッキに通常モンスターが2体以上ない' };
  }

  return { canActivate: true };
}

// レスキューラビット効果発動
export function activateRescueRabbit(
  state: GameState,
  zones: Zones,
  handCardId: string,
  selectedMonsterNames: string[] = []
): RescueRabbitResult {
  const check = canActivateRescueRabbit(state, handCardId);
  if (!check.canActivate) {
    return {
      success: false,
      state,
      zones,
      message: check.reason,
    };
  }

  const rabbit = state.hand.find(c => c.id === handCardId);
  if (!rabbit) {
    return {
      success: false,
      state,
      zones,
      message: 'レスキューラビットが見つかりません',
    };
  }

  // 1. コスト：レスキューラビットを除外
  const newZones = banishFromHand(zones, rabbit);
  let newState = {
    ...state,
    hand: state.hand.filter(c => c.id !== handCardId),
  };
  newState = addLog(newState, `レスキューラビット効果発動（コスト：${rabbit.name}を除外）`);

  // 2. デッキから通常モンスター2体を検索
  const { found, remaining } = searchNormalMonstersFromDeck(newState.deck, 2);
  
  if (found.length < 2) {
    return {
      success: false,
      state: newState,
      zones: newZones,
      message: 'デッキに通常モンスターが2体見つかりませんでした',
    };
  }

  // 選択されたモンスター名がある場合はそれを使用、なければ最初の2体を使用
  const monstersToSummon = selectedMonsterNames.length === 2
    ? found.filter(m => selectedMonsterNames.includes(m.name)).slice(0, 2)
    : found.slice(0, 2);

  if (monstersToSummon.length < 2) {
    return {
      success: false,
      state: newState,
      zones: newZones,
      message: '選択された通常モンスターが見つかりませんでした',
    };
  }

  // 3. 通常モンスター2体を特殊召喚（空いているモンスターゾーンに配置）
  let updatedZones = newZones;
  const summonedMonsters: DeckCard[] = [];

  for (let i = 0; i < 5 && summonedMonsters.length < 2; i++) {
    if (updatedZones.monsterZones[i] === null) {
      const monster = monstersToSummon[summonedMonsters.length];
      updatedZones = placeMonster(updatedZones, monster, i);
      summonedMonsters.push(monster);
      newState = addLog(newState, `デッキから${monster.name}を特殊召喚（MZ${i + 1}）`);
    }
  }

  // デッキから召喚したカードを除外
  newState = {
    ...newState,
    deck: remaining.filter(c => !summonedMonsters.some(m => m.id === c.id)),
  };

  return {
    success: true,
    state: newState,
    zones: updatedZones,
    selectedMonsters: summonedMonsters,
  };
}

// X召喚候補を取得（レベル4のモンスター2体が場にいる場合）
export function getXyzSummonCandidates(
  zones: Zones
): Array<{ name: string; rank: number; materials: number[] }> {
  const level4Monsters: Array<{ card: any; index: number }> = [];
  
  for (let i = 0; i < 5; i++) {
    const monster = zones.monsterZones[i];
    if (monster) {
      // レベル4の判定（簡易版：名前で判定）
      if (
        monster.name.includes('セイバーザウルス') ||
        monster.name.includes('ジェネティック・ワーウルフ') ||
        monster.name.includes('レベル4')
      ) {
        level4Monsters.push({ card: monster, index: i });
      }
    }
  }

  if (level4Monsters.length < 2) {
    return [];
  }

  // レベル4のモンスター2体がいる場合のX召喚候補
  const candidates = [
    { name: 'エヴォルカイザー・ラギア', rank: 4, materials: [0, 1] },
    { name: 'エヴォルカイザー・ドルカ', rank: 4, materials: [0, 1] },
    { name: 'インヴェルズ・ローチ', rank: 4, materials: [0, 1] },
    { name: 'ダイガスタ・エメラル', rank: 4, materials: [0, 1] },
  ];

  return candidates.map(c => ({
    ...c,
    materials: level4Monsters.slice(0, 2).map(m => m.index),
  }));
}

// X召喚を実行
export function performXyzSummon(
  state: GameState,
  zones: Zones,
  xyzName: string,
  materialIndices: number[],
  targetZoneIndex: number
): { state: GameState; zones: Zones } {
  // 素材を墓地へ送る
  let updatedZones = zones;
  const materials: string[] = [];

  for (const index of materialIndices) {
    const monster = updatedZones.monsterZones[index];
    if (monster) {
      materials.push(monster.name);
      const graveResult = sendMonsterToGrave(updatedZones, index);
      updatedZones = graveResult.zones;
    }
  }

  // X召喚モンスターを場に出す
  const xyzCard = {
    name: xyzName,
    id: `xyz_${Date.now()}`,
    zoneIndex: targetZoneIndex,
    faceUp: true,
  };
  updatedZones = placeMonster(updatedZones, xyzCard, targetZoneIndex);

  let newState = addLog(
    state,
    `X召喚：${xyzName}（素材：${materials.join(' + ')}）`
  );

  return { state: newState, zones: updatedZones };
}
