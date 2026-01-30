import { GameState, addLog } from './state';
import { ZoneRef, Card, MoveReason } from './types';
import { placeMonster, placeSpellTrap } from './zones';

// カードを移動
export interface MoveCardParams {
  from: ZoneRef;
  to: ZoneRef;
  cardId: string;
  reason?: MoveReason;
}

// ゾーンからカードを取得
function getCardFromZone(
  state: GameState,
  zoneRef: ZoneRef,
  cardId: string
): Card | null {
  const playerState = state[zoneRef.player];

  switch (zoneRef.zone) {
    case 'hand':
      const handCard = playerState.hand.find(c => c.id === cardId);
      return handCard ? { ...handCard, owner: zoneRef.player, zone: 'hand' } : null;
    case 'deck':
      const deckCard = playerState.deck.find(c => c.id === cardId);
      return deckCard ? { ...deckCard, owner: zoneRef.player, zone: 'deck' } : null;
    case 'grave':
      const graveCard = playerState.zones.graveyard.find(c => c.id === cardId);
      return graveCard ? { ...graveCard, owner: zoneRef.player, zone: 'grave' } : null;
    case 'banish':
      const banishCard = playerState.zones.banished.find(c => c.id === cardId);
      return banishCard ? { ...banishCard, owner: zoneRef.player, zone: 'banish' } : null;
    case 'mz':
      if (zoneRef.index !== undefined && zoneRef.index >= 0 && zoneRef.index < 5) {
        const card = playerState.zones.monsterZones[zoneRef.index];
        return card && card.id === cardId ? { ...card, owner: zoneRef.player, zone: 'mz', zoneIndex: zoneRef.index } : null;
      }
      return null;
    case 'st':
      if (zoneRef.index !== undefined && zoneRef.index >= 0 && zoneRef.index < 5) {
        const card = playerState.zones.spellTrapZones[zoneRef.index];
        return card && card.id === cardId ? { ...card, owner: zoneRef.player, zone: 'st', zoneIndex: zoneRef.index } : null;
      }
      return null;
    case 'extra':
      const extraCard = playerState.zones.extraDeck.find(c => c.id === cardId);
      return extraCard ? { ...extraCard, owner: zoneRef.player, zone: 'extra' } : null;
    default:
      return null;
  }
}

// ゾーンからカードを削除
function removeCardFromZone(
  state: GameState,
  zoneRef: ZoneRef,
  cardId: string
): GameState {
  const player = zoneRef.player;
  const playerState = state[player];
  let newPlayerState = { ...playerState };

  switch (zoneRef.zone) {
    case 'hand':
      newPlayerState = {
        ...playerState,
        hand: playerState.hand.filter(c => c.id !== cardId),
      };
      break;
    case 'deck':
      newPlayerState = {
        ...playerState,
        deck: playerState.deck.filter(c => c.id !== cardId),
      };
      break;
    case 'grave':
      newPlayerState = {
        ...playerState,
        zones: {
          ...playerState.zones,
          graveyard: playerState.zones.graveyard.filter(c => c.id !== cardId),
        },
      };
      break;
    case 'banish':
      newPlayerState = {
        ...playerState,
        zones: {
          ...playerState.zones,
          banished: playerState.zones.banished.filter(c => c.id !== cardId),
        },
      };
      break;
    case 'mz':
      if (zoneRef.index !== undefined) {
        const newMonsterZones = [...playerState.zones.monsterZones];
        newMonsterZones[zoneRef.index] = null;
        newPlayerState = {
          ...playerState,
          zones: {
            ...playerState.zones,
            monsterZones: newMonsterZones,
          },
        };
      }
      break;
    case 'st':
      if (zoneRef.index !== undefined) {
        const newSpellTrapZones = [...playerState.zones.spellTrapZones];
        newSpellTrapZones[zoneRef.index] = null;
        newPlayerState = {
          ...playerState,
          zones: {
            ...playerState.zones,
            spellTrapZones: newSpellTrapZones,
          },
        };
      }
      break;
    case 'extra':
      newPlayerState = {
        ...playerState,
        zones: {
          ...playerState.zones,
          extraDeck: playerState.zones.extraDeck.filter(c => c.id !== cardId),
        },
      };
      break;
  }

  return {
    ...state,
    [player]: newPlayerState,
  };
}

// ゾーンにカードを追加
function addCardToZone(
  state: GameState,
  zoneRef: ZoneRef,
  card: Card
): GameState {
  const player = zoneRef.player;
  const playerState = state[player];
  let newPlayerState = { ...playerState };

  const updatedCard: Card = {
    ...card,
    owner: zoneRef.player,
    zone: zoneRef.zone,
    zoneIndex: zoneRef.index,
  };

  switch (zoneRef.zone) {
    case 'hand':
      newPlayerState = {
        ...playerState,
        hand: [...playerState.hand, updatedCard],
      };
      break;
    case 'deck':
      // デッキトップに追加（index未指定または0）
      if (zoneRef.index === undefined || zoneRef.index === 0) {
        newPlayerState = {
          ...playerState,
          deck: [updatedCard, ...playerState.deck],
        };
      } else {
        // デッキボトムに追加
        newPlayerState = {
          ...playerState,
          deck: [...playerState.deck, updatedCard],
        };
      }
      break;
    case 'grave':
      newPlayerState = {
        ...playerState,
        zones: {
          ...playerState.zones,
          graveyard: [...playerState.zones.graveyard, updatedCard],
        },
      };
      break;
    case 'banish':
      newPlayerState = {
        ...playerState,
        zones: {
          ...playerState.zones,
          banished: [...playerState.zones.banished, updatedCard],
        },
      };
      break;
    case 'mz':
      if (zoneRef.index !== undefined && zoneRef.index >= 0 && zoneRef.index < 5) {
        if (playerState.zones.monsterZones[zoneRef.index] === null) {
          const newZones = placeMonster(playerState.zones, updatedCard, zoneRef.index);
          newPlayerState = {
            ...playerState,
            zones: newZones,
          };
        }
      }
      break;
    case 'st':
      if (zoneRef.index !== undefined && zoneRef.index >= 0 && zoneRef.index < 5) {
        if (playerState.zones.spellTrapZones[zoneRef.index] === null) {
          const isSet = card.isSet !== undefined ? card.isSet : true;
          const newZones = placeSpellTrap(
            playerState.zones,
            updatedCard,
            zoneRef.index,
            isSet,
            state.turn
          );
          newPlayerState = {
            ...playerState,
            zones: newZones,
          };
        }
      }
      break;
    case 'extra':
      newPlayerState = {
        ...playerState,
        zones: {
          ...playerState.zones,
          extraDeck: [...playerState.zones.extraDeck, updatedCard],
        },
      };
      break;
  }

  return {
    ...state,
    [player]: newPlayerState,
  };
}

// ゾーン名を日本語で取得
function getZoneName(zoneRef: ZoneRef): string {
  const playerLabel = zoneRef.player === 'me' ? '自分' : '相手';
  
  switch (zoneRef.zone) {
    case 'hand':
      return `${playerLabel} Hand`;
    case 'deck':
      return `${playerLabel} Deck`;
    case 'grave':
      return `${playerLabel} Grave`;
    case 'banish':
      return `${playerLabel} Banish`;
    case 'mz':
      return `${playerLabel} MZ${(zoneRef.index || 0) + 1}`;
    case 'st':
      return `${playerLabel} ST${(zoneRef.index || 0) + 1}`;
    case 'extra':
      return `${playerLabel} Extra`;
    default:
      return `${playerLabel} Unknown`;
  }
}

// カードを移動
export function moveCard(
  state: GameState,
  params: MoveCardParams
): GameState {
  const { from, to, cardId, reason = '移動' } = params;

  // カードを取得
  const card = getCardFromZone(state, from, cardId);
  if (!card) {
    return state; // カードが見つからない
  }

  // 移動先のチェック
  if (to.zone === 'mz' || to.zone === 'st') {
    const playerState = state[to.player];
    const zones = to.zone === 'mz' ? playerState.zones.monsterZones : playerState.zones.spellTrapZones;
    if (to.index !== undefined && zones[to.index] !== null) {
      return state; // 移動先が埋まっている
    }
  }

  // カードを削除
  let newState = removeCardFromZone(state, from, cardId);

  // カードを追加
  newState = addCardToZone(newState, to, card);

  // ログに記録
  const fromName = getZoneName(from);
  const toName = getZoneName(to);
  const playerLabel = state.activePlayer === 'me' ? '[自分]' : '[相手]';
  const logMessage = `${playerLabel} ${fromName} → ${toName} : ${card.name}（${reason}）`;

  newState = addLog(newState, logMessage, state.activePlayer);

  return newState;
}
