import { describe, it, expect } from 'vitest';
import { sortStockItems, STOCK_SORT_OPTIONS } from '../../src/core/stockSort';
import type { StockItem } from '../../src/api/schema';

// テスト用モックアイテム作成ヘルパー
function createMockItem(overrides: Partial<StockItem> & { id: number; name: string }): StockItem {
  return {
    householdId: 'hh-1',
    category: '食品',
    stockType: 'QUANTITY',
    quantity: 1,
    unit: '個',
    minThreshold: 1,
    memo: undefined,
    expiryDate: undefined,
    remainingLevel: undefined,
    version: 1,
    createdAt: '2026-09-17T00:00:00Z',
    updatedAt: '2026-09-17T00:00:00Z',
    ...overrides,
  };
}

describe('stockSort Core Domain Logic', () => {
  describe('STOCK_SORT_OPTIONS', () => {
    it('defines 7 supported sort options with Japanese labels', () => {
      expect(STOCK_SORT_OPTIONS.length).toBe(7);
      const keys = STOCK_SORT_OPTIONS.map((opt) => opt.key);
      expect(keys).toContain('category');
      expect(keys).toContain('expiryAsc');
      expect(keys).toContain('expiryDesc');
      expect(keys).toContain('quantityAsc');
      expect(keys).toContain('quantityDesc');
      expect(keys).toContain('nameAsc');
      expect(keys).toContain('updatedDesc');
    });
  });

  describe('sortStockItems: category (カテゴリ順 / 標準)', () => {
    it('sorts by category ascending, then by name ascending', () => {
      const items: StockItem[] = [
        createMockItem({ id: 1, name: '醤油', category: '調味料' }),
        createMockItem({ id: 2, name: 'バナナ', category: '果物' }),
        createMockItem({ id: 3, name: '砂糖', category: '調味料' }),
        createMockItem({ id: 4, name: 'りんご', category: '果物' }),
      ];

      const sorted = sortStockItems(items, 'category');
      expect(sorted.map((i) => i.name)).toEqual(['バナナ', 'りんご', '砂糖', '醤油']);
    });
  });

  describe('sortStockItems: expiryAsc & expiryDesc (賞味期限順)', () => {
    const items: StockItem[] = [
      createMockItem({ id: 1, name: '期限なしアイテム', expiryDate: undefined }),
      createMockItem({ id: 2, name: '来週の牛乳', expiryDate: '2026-09-24' }),
      createMockItem({ id: 3, name: '明日のヨーグルト', expiryDate: '2026-09-18' }),
      createMockItem({ id: 4, name: '未設定のパン', expiryDate: null as any }),
      createMockItem({ id: 5, name: '再来月の缶詰', expiryDate: '2026-11-15' }),
      createMockItem({ id: 6, name: '明日のプリン', expiryDate: '2026-09-18' }),
    ];

    it('sorts by expiry date ascending with nulls last (expiryAsc)', () => {
      const sorted = sortStockItems(items, 'expiryAsc');
      // 2026-09-18 (プリン, ヨーグルト: 同日付は名前順) -> 2026-09-24 -> 2026-11-15 -> 期限なし (期限なしアイテム, 未設定のパン: 名前順)
      expect(sorted.map((i) => i.name)).toEqual([
        '明日のプリン',
        '明日のヨーグルト',
        '来週の牛乳',
        '再来月の缶詰',
        '期限なしアイテム',
        '未設定のパン',
      ]);
    });

    it('sorts by expiry date descending with nulls last (expiryDesc)', () => {
      const sorted = sortStockItems(items, 'expiryDesc');
      // 2026-11-15 -> 2026-09-24 -> 2026-09-18 (プリン, ヨーグルト) -> 期限なし
      expect(sorted.map((i) => i.name)).toEqual([
        '再来月の缶詰',
        '来週の牛乳',
        '明日のプリン',
        '明日のヨーグルト',
        '期限なしアイテム',
        '未設定のパン',
      ]);
    });
  });

  describe('sortStockItems: quantityAsc & quantityDesc (残量・在庫数順)', () => {
    const items: StockItem[] = [
      // 数量管理: 余裕あり (5個, 閾値1)
      createMockItem({ id: 1, name: '卵', stockType: 'QUANTITY', quantity: 5, minThreshold: 1 }),
      // 残量管理: EMPTY (要補充)
      createMockItem({ id: 2, name: 'シャンプー', stockType: 'REMAINING_LEVEL', remainingLevel: 'EMPTY', quantity: 0 }),
      // 数量管理: 0個 (要補充, 閾値2)
      createMockItem({ id: 3, name: 'ティッシュ', stockType: 'QUANTITY', quantity: 0, minThreshold: 2 }),
      // 残量管理: FULL (十分)
      createMockItem({ id: 4, name: 'ボディーソープ', stockType: 'REMAINING_LEVEL', remainingLevel: 'FULL', quantity: 3 }),
      // 残量管理: LOW (要補充)
      createMockItem({ id: 5, name: 'ハンドソープ', stockType: 'REMAINING_LEVEL', remainingLevel: 'LOW', quantity: 1 }),
      // 数量管理: 1個 (要補充, 閾値1)
      createMockItem({ id: 6, name: '食パン', stockType: 'QUANTITY', quantity: 1, minThreshold: 1 }),
    ];

    it('sorts by quantity ascending prioritizing shortage items (quantityAsc)', () => {
      const sorted = sortStockItems(items, 'quantityAsc');
      // 要補充 (shortage):
      // - シャンプー (EMPTY: score 0)
      // - ティッシュ (qty: 0)
      // - 食パン (qty: 1)
      // - ハンドソープ (LOW: score 1)
      // 非要補充:
      // - ボディーソープ (FULL: score 3)
      // - 卵 (qty: 5)
      const shortageNames = sorted.slice(0, 4).map((i) => i.name);
      expect(shortageNames).toContain('シャンプー');
      expect(shortageNames).toContain('ティッシュ');
      expect(shortageNames).toContain('食パン');
      expect(shortageNames).toContain('ハンドソープ');

      // スコア0のものが最初
      expect(sorted[0].name === 'シャンプー' || sorted[0].name === 'ティッシュ').toBe(true);
      expect(sorted[1].name === 'シャンプー' || sorted[1].name === 'ティッシュ').toBe(true);

      // 非要補充の末尾
      expect(sorted[4].name).toBe('ボディーソープ');
      expect(sorted[5].name).toBe('卵');
    });

    it('sorts by normalized quantity descending (quantityDesc)', () => {
      const sorted = sortStockItems(items, 'quantityDesc');
      // 卵 (5) -> ボディーソープ (FULL: 3) -> 食パン (1) or ハンドソープ (LOW: 1) -> シャンプー (0) or ティッシュ (0)
      expect(sorted[0].name).toBe('卵');
      expect(sorted[1].name).toBe('ボディーソープ');
      expect(sorted[sorted.length - 1].quantity).toBe(0);
      expect(sorted[sorted.length - 2].quantity).toBe(0);
    });
  });

  describe('sortStockItems: nameAsc (品名順)', () => {
    it('sorts alphabetically in Japanese locale', () => {
      const items: StockItem[] = [
        createMockItem({ id: 1, name: 'わかめ' }),
        createMockItem({ id: 2, name: 'あめ' }),
        createMockItem({ id: 3, name: 'みかん' }),
        createMockItem({ id: 4, name: 'かき' }),
      ];

      const sorted = sortStockItems(items, 'nameAsc');
      expect(sorted.map((i) => i.name)).toEqual(['あめ', 'かき', 'みかん', 'わかめ']);
    });
  });

  describe('sortStockItems: updatedDesc (更新日時順)', () => {
    it('sorts by updatedAt descending', () => {
      const items: StockItem[] = [
        createMockItem({ id: 1, name: '古いアイテム', updatedAt: '2026-09-01T10:00:00Z' }),
        createMockItem({ id: 2, name: '最新アイテム', updatedAt: '2026-09-17T12:00:00Z' }),
        createMockItem({ id: 3, name: '昨日のアイテム', updatedAt: '2026-09-16T08:00:00Z' }),
      ];

      const sorted = sortStockItems(items, 'updatedDesc');
      expect(sorted.map((i) => i.name)).toEqual(['最新アイテム', '昨日のアイテム', '古いアイテム']);
    });
  });

  describe('Immutability (非破壊性)', () => {
    it('does not mutate the original items array', () => {
      const items: StockItem[] = [
        createMockItem({ id: 2, name: 'B' }),
        createMockItem({ id: 1, name: 'A' }),
      ];
      const copy = [...items];

      const sorted = sortStockItems(items, 'nameAsc');
      expect(items).toEqual(copy);
      expect(sorted).not.toBe(items);
    });
  });
});
