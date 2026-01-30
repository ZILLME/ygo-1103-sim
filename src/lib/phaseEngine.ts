import { Phase } from './state';

// 行動タイプ
export type ActionType =
  | 'drawInitial'
  | 'drawFirst'
  | 'normalSummon'
  | 'specialSummon'
  | 'spellActivate'
  | 'trapActivate'
  | 'attackDeclare'
  | 'damageStep'
  | 'endTurn'
  | 'phaseChange';

// フェイズ遷移ルール
const phaseTransitionRules: Record<
  Phase,
  Record<ActionType, Phase | null>
> = {
  DP: {
    drawInitial: 'SP', // 初手ドロー後はSPへ
    drawFirst: 'SP', // 先攻ドロー後もSPへ
    normalSummon: 'DP', // DP中は通常召喚不可（MP1へ手動遷移が必要）
    specialSummon: 'DP',
    spellActivate: 'DP',
    trapActivate: 'DP',
    attackDeclare: null, // DP中は攻撃不可
    damageStep: null,
    endTurn: 'DP', // DP中にターン終了は不可
    phaseChange: null, // 手動遷移は許可
  },
  SP: {
    drawInitial: 'SP',
    drawFirst: 'SP',
    normalSummon: 'MP1', // SP中に通常召喚 → MP1へ自動遷移
    specialSummon: 'MP1', // SP中に特殊召喚 → MP1へ自動遷移
    spellActivate: 'MP1', // SP中に魔法発動 → MP1へ自動遷移
    trapActivate: 'SP', // 罠はSP中でも発動可能
    attackDeclare: null,
    damageStep: null,
    endTurn: 'EP', // SP中にターン終了 → EPへ
    phaseChange: null,
  },
  MP1: {
    drawInitial: 'MP1',
    drawFirst: 'MP1',
    normalSummon: 'MP1', // MP1中は継続
    specialSummon: 'MP1', // MP1中は継続
    spellActivate: 'MP1', // MP1中は継続
    trapActivate: 'MP1', // MP1中は継続
    attackDeclare: 'BP', // 攻撃宣言 → BPへ自動遷移
    damageStep: null, // ダメステはBP中のみ
    endTurn: 'EP', // MP1中にターン終了 → EPへ
    phaseChange: null,
  },
  BP: {
    drawInitial: null,
    drawFirst: null,
    normalSummon: null, // BP中は通常召喚不可
    specialSummon: null, // BP中は特殊召喚不可（一部例外あり）
    spellActivate: 'BP', // 速攻魔法は発動可能
    trapActivate: 'BP', // 罠は発動可能
    attackDeclare: 'BP', // BP中は継続（複数回攻撃）
    damageStep: 'BP', // ダメステ後はBP継続
    endTurn: 'MP2', // BP中にターン終了 → MP2へ（通常は手動でMP2へ）
    phaseChange: null,
  },
  MP2: {
    drawInitial: null,
    drawFirst: null,
    normalSummon: 'MP2', // MP2中は継続
    specialSummon: 'MP2', // MP2中は継続
    spellActivate: 'MP2', // MP2中は継続
    trapActivate: 'MP2', // MP2中は継続
    attackDeclare: null, // MP2中は攻撃不可
    damageStep: null,
    endTurn: 'EP', // MP2中にターン終了 → EPへ
    phaseChange: null,
  },
  EP: {
    drawInitial: null,
    drawFirst: null,
    normalSummon: null,
    specialSummon: null,
    spellActivate: null,
    trapActivate: 'EP', // EP中も罠は発動可能
    attackDeclare: null,
    damageStep: null,
    endTurn: 'DP', // EP終了後は次のターンのDPへ
    phaseChange: null,
  },
};

// 次のフェイズを取得
export function getNextPhase(
  currentPhase: Phase,
  action: ActionType
): Phase | null {
  const rule = phaseTransitionRules[currentPhase]?.[action];
  return rule || null;
}

// フェイズが自動遷移するかどうか
export function shouldAutoTransition(
  currentPhase: Phase,
  action: ActionType
): boolean {
  const nextPhase = getNextPhase(currentPhase, action);
  return nextPhase !== null && nextPhase !== currentPhase;
}

// フェイズ遷移の説明を取得
export function getPhaseTransitionDescription(
  currentPhase: Phase,
  action: ActionType
): string | null {
  const nextPhase = getNextPhase(currentPhase, action);
  if (!nextPhase || nextPhase === currentPhase) {
    return null;
  }

  const phaseNames: Record<Phase, string> = {
    DP: 'ドローフェイズ',
    SP: 'スタンバイフェイズ',
    MP1: 'メインフェイズ1',
    BP: 'バトルフェイズ',
    MP2: 'メインフェイズ2',
    EP: 'エンドフェイズ',
  };

  return `${phaseNames[currentPhase]} → ${phaseNames[nextPhase]}`;
}

// フェイズ順序（次のフェイズを取得）
export function getPhaseOrder(): Phase[] {
  return ['DP', 'SP', 'MP1', 'BP', 'MP2', 'EP'];
}

// 次のフェイズ（順序ベース）
export function getNextPhaseInOrder(currentPhase: Phase): Phase {
  const order = getPhaseOrder();
  const currentIndex = order.indexOf(currentPhase);
  if (currentIndex === -1 || currentIndex === order.length - 1) {
    return 'DP'; // 最後のフェイズの次はDP（次のターン）
  }
  return order[currentIndex + 1];
}

// 前のフェイズ（順序ベース）
export function getPreviousPhaseInOrder(currentPhase: Phase): Phase {
  const order = getPhaseOrder();
  const currentIndex = order.indexOf(currentPhase);
  if (currentIndex <= 0) {
    return 'EP'; // 最初のフェイズの前はEP（前のターン）
  }
  return order[currentIndex - 1];
}
