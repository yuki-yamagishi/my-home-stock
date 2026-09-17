import type { StockItem } from '../api/schema';
import {
  STOCK_CATEGORIES,
  normalizeCategory,
  StockCategory,
} from '../constants/categories';

export interface CategoryGroup {
  category: StockCategory;
  items: StockItem[];
  count: number;
}

/**
 * 買い物リストの不足アイテムをカテゴリごとに集計・グルーピングする純粋関数。
 * 
 * @param items 買い物リスト（不足・補充推奨）のアイテム配列
 * @param selectedCategory 選択中のカテゴリ（'all' または各カテゴリ文字列）
 * @returns カテゴリグループの配列
 */
export function groupShoppingListByCategory(
  items: StockItem[],
  selectedCategory: string = 'all'
): CategoryGroup[] {
  if (selectedCategory !== 'all') {
    // 特定カテゴリ選択時: 該当カテゴリのアイテムのみを抽出
    const targetCategory = normalizeCategory(selectedCategory);
    const matchingItems = items.filter(
      (item) => normalizeCategory(item.category) === targetCategory
    );
    return [
      {
        category: targetCategory,
        items: matchingItems,
        count: matchingItems.length,
      },
    ];
  }

  // 'all' 選択時: 標準カテゴリ順にグルーピングし、1件以上存在するカテゴリのみ返却
  const map = new Map<StockCategory, StockItem[]>();
  for (const cat of STOCK_CATEGORIES) {
    map.set(cat, []);
  }

  for (const item of items) {
    const normalized = normalizeCategory(item.category);
    const list = map.get(normalized);
    if (list) {
      list.push(item);
    } else {
      // 想定外の正規化カテゴリは 'その他' へフォールバック
      map.get('その他')?.push(item);
    }
  }

  const result: CategoryGroup[] = [];
  for (const cat of STOCK_CATEGORIES) {
    const groupItems = map.get(cat) || [];
    if (groupItems.length > 0) {
      result.push({
        category: cat,
        items: groupItems,
        count: groupItems.length,
      });
    }
  }

  return result;
}

/**
 * 買い物リストのカテゴリ別件数を集計する純粋関数。
 * 'all' および各 STOCK_CATEGORIES の件数を含むオブジェクトを返却する。
 */
export function getShoppingListCategoryCounts(
  items: StockItem[]
): Record<string, number> {
  const counts: Record<string, number> = {
    all: items.length,
  };

  for (const cat of STOCK_CATEGORIES) {
    counts[cat] = 0;
  }

  for (const item of items) {
    const normalized = normalizeCategory(item.category);
    if (normalized in counts) {
      counts[normalized] += 1;
    } else {
      counts['その他'] = (counts['その他'] || 0) + 1;
    }
  }

  return counts;
}
