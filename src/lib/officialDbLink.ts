// 公式データベースのURL生成

/**
 * 公式データベースの検索URLを生成
 * 遊戯王公式サイトの検索ページにリダイレクト
 */
export function generateOfficialDbSearchUrl(cardName: string): string {
  // 公式DBの検索URL（実際のURLは要確認）
  // 例: https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=1&request=cardname&keyword=
  const encodedName = encodeURIComponent(cardName);
  return `https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=1&request=cardname&keyword=${encodedName}`;
}

/**
 * ニューロンの検索URLを生成（代替）
 */
export function generateNeuronSearchUrl(cardName: string): string {
  const encodedName = encodeURIComponent(cardName);
  return `https://www.yugioh-card.com/japan/products/neuron/search.php?keyword=${encodedName}`;
}
