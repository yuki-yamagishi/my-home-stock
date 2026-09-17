/**
 * Pure Domain Business Logic: Stock Item Sorting
 * Independent of React, DOM, or external APIs (100% unit-testable)
 */

import type { StockItem } from '../api/schema';
import { isShortage, remainingLevelToQuantity } from './stockStatus';

export type StockSortKey =
  | 'category'     // カテゴリ順 (標準: カテゴリ昇順 -> 品名昇順)
  | 'expiryAsc'    // 期限が近い順 (期限あり昇順 -> 期限なし末尾 -> 品名昇順)
  | 'expiryDesc'   // 期限が遠い順 (期限あり降順 -> 期限なし末尾 -> 品名昇順)
  | 'quantityAsc'  // 残量が少ない順 (要補充アイテム最優先 -> 残量/数量昇順 -> 品名昇順)
  | 'quantityDesc' // 残量が多い順 (残量/数量降順 -> 品名昇順)
  | 'nameAsc'      // 品名順 (五十音順 localeCompare('ja'))
  | 'updatedDesc'; // 更新が新しい順 (updatedAt降順 -> ID降順)

export interface StockSortOption {
  key: StockSortKey;
  label: string;
}

export const STOCK_SORT_OPTIONS: StockSortOption[] = [
  { key: 'category', label: 'カテゴリ順 (標準)' },
  { key: 'expiryAsc', label: '期限が近い順' },
  { key: 'expiryDesc', label: '期限が遠い順' },
  { key: 'quantityAsc', label: '残量が少ない順' },
  { key: 'quantityDesc', label: '残量が多い順' },
  { key: 'nameAsc', label: '名前順 (五十音)' },
  { key: 'updatedDesc', label: '更新が新しい順' },
];

/**
 * Normalizes an item's remaining level or numeric quantity into a comparable numeric score.
 * - REMAINING_LEVEL: EMPTY=0, LOW=1, PLENTY=2, FULL=3
 * - QUANTITY: item.quantity
 */
function getNormalizedStockScore(item: StockItem): number {
  if (item.stockType === 'REMAINING_LEVEL') {
    return remainingLevelToQuantity(item.remainingLevel);
  }
  return item.quantity ?? 0;
}

/**
 * Sorts stock items based on the selected sort key.
 * Non-mutating: returns a newly sorted shallow copy of the array.
 */
export function sortStockItems(items: StockItem[], sortKey: StockSortKey): StockItem[] {
  return [...items].sort((a, b) => {
    switch (sortKey) {
      case 'category': {
        const catCompare = (a.category || '').localeCompare(b.category || '', 'ja');
        if (catCompare !== 0) return catCompare;
        return a.name.localeCompare(b.name, 'ja');
      }

      case 'expiryAsc': {
        const hasA = Boolean(a.expiryDate);
        const hasB = Boolean(b.expiryDate);
        // NULLS LAST
        if (hasA && !hasB) return -1;
        if (!hasA && hasB) return 1;
        if (hasA && hasB) {
          const timeA = new Date(a.expiryDate!).getTime();
          const timeB = new Date(b.expiryDate!).getTime();
          if (timeA !== timeB) return timeA - timeB;
        }
        return a.name.localeCompare(b.name, 'ja');
      }

      case 'expiryDesc': {
        const hasA = Boolean(a.expiryDate);
        const hasB = Boolean(b.expiryDate);
        // NULLS LAST
        if (hasA && !hasB) return -1;
        if (!hasA && hasB) return 1;
        if (hasA && hasB) {
          const timeA = new Date(a.expiryDate!).getTime();
          const timeB = new Date(b.expiryDate!).getTime();
          if (timeA !== timeB) return timeB - timeA;
        }
        return a.name.localeCompare(b.name, 'ja');
      }

      case 'quantityAsc': {
        const shortageA = isShortage(a.quantity, a.minThreshold, a.stockType, a.remainingLevel);
        const shortageB = isShortage(b.quantity, b.minThreshold, b.stockType, b.remainingLevel);

        // 1. 要補充アイテムを優先
        if (shortageA && !shortageB) return -1;
        if (!shortageA && shortageB) return 1;

        // 2. 正規化残量/数量昇順
        const scoreA = getNormalizedStockScore(a);
        const scoreB = getNormalizedStockScore(b);
        if (scoreA !== scoreB) return scoreA - scoreB;

        return a.name.localeCompare(b.name, 'ja');
      }

      case 'quantityDesc': {
        // 正規化残量/数量降順
        const scoreA = getNormalizedStockScore(a);
        const scoreB = getNormalizedStockScore(b);
        if (scoreA !== scoreB) return scoreB - scoreA;

        return a.name.localeCompare(b.name, 'ja');
      }

      case 'nameAsc': {
        return a.name.localeCompare(b.name, 'ja');
      }

      case 'updatedDesc': {
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        if (timeA !== timeB) return timeB - timeA;
        return b.id - a.id;
      }

      default:
        return 0;
    }
  });
}
