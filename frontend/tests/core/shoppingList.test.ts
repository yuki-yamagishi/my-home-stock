import { describe, it, expect } from 'vitest';
import {
  groupShoppingListByCategory,
  getShoppingListCategoryCounts,
} from '../../src/core/shoppingList';
import type { StockItem } from '../../src/api/schema';

// テスト用モックアイテム作成ヘルパー
function createMockItem(
  id: number,
  name: string,
  category: string | null | undefined,
  quantity = 0,
  minThreshold = 1
): StockItem {
  return {
    id,
    householdId: 'hh-1',
    name,
    category: category as any,
    stockType: 'QUANTITY',
    quantity,
    unit: '個',
    minThreshold,
    memo: undefined,
    expiryDate: undefined,
    version: 1,
    createdAt: '2026-09-17T00:00:00Z',
    updatedAt: '2026-09-17T00:00:00Z',
  };
}

describe('shoppingList Core Domain Logic', () => {
  const items: StockItem[] = [
    createMockItem(1, '牛乳', '食品'),
    createMockItem(2, 'トイレットペーパー', '日用品・消耗品'),
    createMockItem(3, '納豆', '食品'),
    createMockItem(4, '風邪薬', '医薬品'),
    createMockItem(5, 'レガシー日用品', '日用品'), // normalizeCategory により '日用品・消耗品' へ
    createMockItem(6, '未知のアイテム', '文房具'), // normalizeCategory により 'その他' へ
  ];

  describe('groupShoppingListByCategory', () => {
    describe('when selectedCategory is "all"', () => {
      it('groups items by normalized category and returns only categories with at least 1 item', () => {
        const groups = groupShoppingListByCategory(items, 'all');

        // 標準順序: 食品, 飲料, 日用品・消耗品, 医薬品, その他
        // itemsに「飲料」はないため除外される
        expect(groups.map((g) => g.category)).toEqual([
          '食品',
          '日用品・消耗品',
          '医薬品',
          'その他',
        ]);

        const foodGroup = groups.find((g) => g.category === '食品');
        expect(foodGroup?.items.map((i) => i.name)).toEqual(['牛乳', '納豆']);
        expect(foodGroup?.count).toBe(2);

        const dailyGroup = groups.find((g) => g.category === '日用品・消耗品');
        expect(dailyGroup?.items.map((i) => i.name)).toEqual(['トイレットペーパー', 'レガシー日用品']);
        expect(dailyGroup?.count).toBe(2);

        const medGroup = groups.find((g) => g.category === '医薬品');
        expect(medGroup?.items.map((i) => i.name)).toEqual(['風邪薬']);
        expect(medGroup?.count).toBe(1);

        const otherGroup = groups.find((g) => g.category === 'その他');
        expect(otherGroup?.items.map((i) => i.name)).toEqual(['未知のアイテム']);
        expect(otherGroup?.count).toBe(1);
      });

      it('returns empty array when items is empty', () => {
        const groups = groupShoppingListByCategory([], 'all');
        expect(groups).toEqual([]);
      });

      it('handles items with null or empty category by normalizing to DEFAULT_CATEGORY (食品)', () => {
        const nullCatItems = [createMockItem(10, '名無し食品', null)];
        const groups = groupShoppingListByCategory(nullCatItems, 'all');
        expect(groups).toHaveLength(1);
        expect(groups[0].category).toBe('食品');
        expect(groups[0].count).toBe(1);
      });
    });

    describe('when selectedCategory is a specific category', () => {
      it('returns group with matching items for existing category', () => {
        const groups = groupShoppingListByCategory(items, '食品');
        expect(groups).toHaveLength(1);
        expect(groups[0].category).toBe('食品');
        expect(groups[0].count).toBe(2);
        expect(groups[0].items.map((i) => i.name)).toEqual(['牛乳', '納豆']);
      });

      it('returns group with count 0 and empty items when category has no matching items', () => {
        const groups = groupShoppingListByCategory(items, '飲料');
        expect(groups).toHaveLength(1);
        expect(groups[0].category).toBe('飲料');
        expect(groups[0].count).toBe(0);
        expect(groups[0].items).toEqual([]);
      });

      it('matches normalized legacy categories properly', () => {
        const groups = groupShoppingListByCategory(items, '日用品・消耗品');
        expect(groups).toHaveLength(1);
        expect(groups[0].category).toBe('日用品・消耗品');
        expect(groups[0].count).toBe(2);
        expect(groups[0].items.map((i) => i.name)).toEqual(['トイレットペーパー', 'レガシー日用品']);
      });
    });
  });

  describe('getShoppingListCategoryCounts', () => {
    it('calculates total and per-category counts accurately', () => {
      const counts = getShoppingListCategoryCounts(items);
      expect(counts['all']).toBe(6);
      expect(counts['食品']).toBe(2);
      expect(counts['日用品・消耗品']).toBe(2);
      expect(counts['医薬品']).toBe(1);
      expect(counts['その他']).toBe(1);
      expect(counts['飲料']).toBe(0);
    });

    it('returns all zeros when item list is empty', () => {
      const counts = getShoppingListCategoryCounts([]);
      expect(counts['all']).toBe(0);
      expect(counts['食品']).toBe(0);
      expect(counts['飲料']).toBe(0);
      expect(counts['日用品・消耗品']).toBe(0);
      expect(counts['医薬品']).toBe(0);
      expect(counts['その他']).toBe(0);
    });
  });
});
