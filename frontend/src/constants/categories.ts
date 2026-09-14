export const STOCK_CATEGORIES = [
  '食品',
  '飲料',
  '日用品・消耗品',
  '医薬品',
  'その他',
] as const;

export type StockCategory = (typeof STOCK_CATEGORIES)[number];

export const DEFAULT_CATEGORY: StockCategory = '食品';

const LEGACY_CATEGORY_MAP: Record<string, StockCategory> = {
  日用品: '日用品・消耗品',
  消耗品: '日用品・消耗品',
};

/**
 * カテゴリ文字列を正規化し、安全な標準カテゴリを返却する。
 * 旧カテゴリ「日用品」「消耗品」は「日用品・消耗品」へマッピング。
 * 空文字や null の場合は DEFAULT_CATEGORY（食品）を返却。
 * 未知のカテゴリは「その他」へフォールバック。
 */
export function normalizeCategory(category?: string | null): StockCategory {
  if (!category || category.trim() === '') {
    return DEFAULT_CATEGORY;
  }

  const trimmed = category.trim();

  if (trimmed in LEGACY_CATEGORY_MAP) {
    return LEGACY_CATEGORY_MAP[trimmed];
  }

  if (STOCK_CATEGORIES.includes(trimmed as StockCategory)) {
    return trimmed as StockCategory;
  }

  return 'その他';
}
