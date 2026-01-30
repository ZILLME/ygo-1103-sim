import { GameState, addLog } from './state';
import { Player, PlayerState } from './playerState';
import { HandCard } from './state';
import { drawCards } from './deck';

// プレイヤーの状態を取得
export function getPlayerState(state: GameState, player: Player): PlayerState {
  return state[player];
}

// プレイヤーの状態を設定
export function setPlayerState(
  state: GameState,
  player: Player,
  playerState: PlayerState
): GameState {
  return {
    ...state,
    [player]: playerState,
  };
}

// 指定プレイヤーにカードをドロー
export function drawCard(
  state: GameState,
  player: Player,
  count: number = 1
): { state: GameState; drawn: HandCard[] } {
  const playerState = getPlayerState(state, player);
  
  if (playerState.deck.length === 0) {
    return { state, drawn: [] };
  }

  const { drawn, remaining } = drawCards(playerState.deck, count);
  const handCards: HandCard[] = drawn.map(card => ({
    ...card,
    used: false,
    revealed: false,
  }));

  const newPlayerState: PlayerState = {
    ...playerState,
    deck: remaining,
    hand: [...playerState.hand, ...handCards],
  };

  const newState = setPlayerState(state, player, newPlayerState);
  const playerLabel = player === 'me' ? '自分' : '相手';
  const logMessage = count === 1 
    ? `${playerLabel}が1枚ドロー`
    : `${playerLabel}が${count}枚ドロー`;
  
  return {
    state: addLog(newState, logMessage, player),
    drawn: handCards,
  };
}
