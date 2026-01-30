import { GameState, addLog } from './state';
import { Player } from './playerState';
import { Zones, ZoneCard, placeMonster, sendMonsterToGrave } from './zones';
import { getCardInfo } from './glossaryStore';

// エクシーズ召喚の結果
export interface XyzSummonResult {
  success: boolean;
  state: GameState;
  zones: Zones;
  message?: string;
}

// シンクロ召喚の結果
export interface SynchroSummonResult {
  success: boolean;
  state: GameState;
  zones: Zones;
  message?: string;
}

// エクシーズ召喚を実行
export function performXyzSummon(
  state: GameState,
  player: Player,
  materialZoneIndices: number[], // 素材のMZインデックス
  extraDeckCardId: string, // EXから出すカードID
  targetZoneIndex: number, // 配置先MZ
  keepMaterials: boolean = true // 素材を保持するか（falseなら墓地へ）
): XyzSummonResult {
  const playerState = state[player];
  const playerLabel = player === 'me' ? '自分' : '相手';

  // バリデーション
  if (materialZoneIndices.length < 2) {
    return {
      success: false,
      state,
      zones: playerState.zones,
      message: '素材は2体以上必要です',
    };
  }

  // 素材カードを取得
  const materials: ZoneCard[] = [];
  for (const mzIndex of materialZoneIndices) {
    const card = playerState.zones.monsterZones[mzIndex];
    if (!card) {
      return {
        success: false,
        state,
        zones: playerState.zones,
        message: `MZ${mzIndex + 1}にカードがありません`,
      };
    }
    materials.push(card);
  }

  // EXからカードを取得
  const extraCard = playerState.extraDeck.find((c) => c.id === extraDeckCardId);
  if (!extraCard) {
    return {
      success: false,
      state,
      zones: playerState.zones,
      message: 'エクストラデッキにそのカードがありません',
    };
  }

  // 配置先が空いているか確認
  if (playerState.zones.monsterZones[targetZoneIndex] !== null) {
    return {
      success: false,
      state,
      zones: playerState.zones,
      message: `MZ${targetZoneIndex + 1}は埋まっています`,
    };
  }

  // レベルチェック（辞書に情報がある場合のみ）
  const extraCardInfo = getCardInfo(extraCard.name);
  if (extraCardInfo?.monster?.level) {
    const requiredLevel = extraCardInfo.monster.level;
    for (const material of materials) {
      const materialInfo = getCardInfo(material.name);
      if (materialInfo?.monster?.level && materialInfo.monster.level !== requiredLevel) {
        // 警告のみ（練習用なので続行）
        console.warn(`素材のレベルが一致しません: ${material.name} (Lv${materialInfo.monster.level})`);
      }
    }
  }

  let newZones = { ...playerState.zones };
  let newState = { ...state };

  // 素材を処理
  const materialNames: string[] = [];
  if (keepMaterials) {
    // 素材をxyzMaterialsに保持
    newZones.xyzMaterials = {
      ...newZones.xyzMaterials,
      [targetZoneIndex]: [...materials],
    };
    // 素材はMZから削除（ただし保持）
    for (const mzIndex of materialZoneIndices) {
      newZones.monsterZones = [...newZones.monsterZones];
      newZones.monsterZones[mzIndex] = null;
    }
    materialNames.push(...materials.map((m) => m.name));
  } else {
    // 素材を墓地へ送る
    for (const mzIndex of materialZoneIndices) {
      const result = sendMonsterToGrave(newZones, mzIndex);
      newZones = result.zones;
      if (result.card) {
        materialNames.push(result.card.name);
      }
    }
  }

  // EXからカードを削除
  const newExtraDeck = playerState.extraDeck.filter((c) => c.id !== extraDeckCardId);

  // エクシーズモンスターをMZに配置
  const xyzCard: ZoneCard = {
    ...extraCard,
    zoneIndex: targetZoneIndex,
    faceUp: true,
  };
  newZones = placeMonster(newZones, xyzCard, targetZoneIndex);

  // 状態を更新
  newState = {
    ...newState,
    [player]: {
      ...playerState,
      extraDeck: newExtraDeck,
      zones: newZones,
    },
  };

  // ログに記録
  const materialStatus = keepMaterials ? '素材保持' : '墓地へ';
  newState = addLog(
    newState,
    `[${playerLabel}] X召喚：${extraCard.name}（素材：${materialNames.join(', ')} → ${materialStatus}）`,
    player
  );

  return {
    success: true,
    state: newState,
    zones: newZones,
  };
}

// シンクロ召喚を実行
export function performSynchroSummon(
  state: GameState,
  player: Player,
  materialZoneIndices: number[], // 素材のMZインデックス
  extraDeckCardId: string, // EXから出すカードID
  targetZoneIndex: number // 配置先MZ
): SynchroSummonResult {
  const playerState = state[player];
  const playerLabel = player === 'me' ? '自分' : '相手';

  // バリデーション
  if (materialZoneIndices.length < 2) {
    return {
      success: false,
      state,
      zones: playerState.zones,
      message: '素材は2体以上必要です',
    };
  }

  // 素材カードを取得
  const materials: ZoneCard[] = [];
  for (const mzIndex of materialZoneIndices) {
    const card = playerState.zones.monsterZones[mzIndex];
    if (!card) {
      return {
        success: false,
        state,
        zones: playerState.zones,
        message: `MZ${mzIndex + 1}にカードがありません`,
      };
    }
    materials.push(card);
  }

  // EXからカードを取得
  const extraCard = playerState.extraDeck.find((c) => c.id === extraDeckCardId);
  if (!extraCard) {
    return {
      success: false,
      state,
      zones: playerState.zones,
      message: 'エクストラデッキにそのカードがありません',
    };
  }

  // 配置先が空いているか確認
  if (playerState.zones.monsterZones[targetZoneIndex] !== null) {
    return {
      success: false,
      state,
      zones: playerState.zones,
      message: `MZ${targetZoneIndex + 1}は埋まっています`,
    };
  }

  // レベルチェック（辞書に情報がある場合のみ）
  const extraCardInfo = getCardInfo(extraCard.name);
  if (extraCardInfo?.monster?.level) {
    const requiredLevel = extraCardInfo.monster.level;
    let totalLevel = 0;
    for (const material of materials) {
      const materialInfo = getCardInfo(material.name);
      if (materialInfo?.monster?.level) {
        totalLevel += materialInfo.monster.level;
      }
    }
    if (totalLevel > 0 && totalLevel !== requiredLevel) {
      // 警告のみ（練習用なので続行）
      console.warn(`素材の合計レベルが一致しません: 合計${totalLevel}, 必要${requiredLevel}`);
    }
  }

  let newZones = { ...playerState.zones };
  let newState = { ...state };

  // 素材を墓地へ送る
  const materialNames: string[] = [];
  for (const mzIndex of materialZoneIndices) {
    const result = sendMonsterToGrave(newZones, mzIndex);
    newZones = result.zones;
    if (result.card) {
      materialNames.push(result.card.name);
    }
  }

  // EXからカードを削除
  const newExtraDeck = playerState.extraDeck.filter((c) => c.id !== extraDeckCardId);

  // シンクロモンスターをMZに配置
  const synchroCard: ZoneCard = {
    ...extraCard,
    zoneIndex: targetZoneIndex,
    faceUp: true,
  };
  newZones = placeMonster(newZones, synchroCard, targetZoneIndex);

  // 状態を更新
  newState = {
    ...newState,
    [player]: {
      ...playerState,
      extraDeck: newExtraDeck,
      zones: newZones,
    },
  };

  // ログに記録
  newState = addLog(
    newState,
    `[${playerLabel}] S召喚：${extraCard.name}（素材：${materialNames.join(' + ')}）`,
    player
  );

  return {
    success: true,
    state: newState,
    zones: newZones,
  };
}

// エクシーズ素材を1枚取り除く
export function removeXyzMaterial(
  state: GameState,
  player: Player,
  monsterZoneIndex: number,
  materialIndex: number
): GameState {
  const playerState = state[player];
  const playerLabel = player === 'me' ? '自分' : '相手';
  const materials = playerState.zones.xyzMaterials[monsterZoneIndex];

  if (!materials || materialIndex >= materials.length) {
    return state;
  }

  const removedMaterial = materials[materialIndex];
  const newMaterials = materials.filter((_, i) => i !== materialIndex);

  const newZones = {
    ...playerState.zones,
    xyzMaterials: {
      ...playerState.zones.xyzMaterials,
      [monsterZoneIndex]: newMaterials.length > 0 ? newMaterials : undefined,
    },
  };

  // 素材を墓地へ送る
  newZones.graveyard = [...newZones.graveyard, removedMaterial];

  let newState = {
    ...state,
    [player]: {
      ...playerState,
      zones: newZones,
    },
  };

  const monster = playerState.zones.monsterZones[monsterZoneIndex];
  const monsterName = monster?.name || 'エクシーズモンスター';

  newState = addLog(
    newState,
    `[${playerLabel}] ${monsterName}の素材取り除き：${removedMaterial.name}（墓地へ）`,
    player
  );

  return newState;
}
