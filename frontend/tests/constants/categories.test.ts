import { describe, it, expect } from 'vitest';
import {
  STOCK_CATEGORIES,
  DEFAULT_CATEGORY,
  normalizeCategory,
} from '../../src/constants/categories';

describe('categories constant and normalization', () => {
  it('should define unified standard categories including 日用品・消耗品', () => {
    expect(STOCK_CATEGORIES).toEqual([
      '食品',
      '飲料',
      '日用品・消耗品',
      '医薬品',
      'その他',
    ]);
    expect(DEFAULT_CATEGORY).toBe('食品');
  });

  it('should normalize legacy categories (日用品, 消耗品) to 日用品・消耗品', () => {
    expect(normalizeCategory('日用品')).toBe('日用品・消耗品');
    expect(normalizeCategory('消耗品')).toBe('日用品・消耗品');
  });

  it('should keep standard categories as is', () => {
    expect(normalizeCategory('食品')).toBe('食品');
    expect(normalizeCategory('飲料')).toBe('飲料');
    expect(normalizeCategory('日用品・消耗品')).toBe('日用品・消耗品');
    expect(normalizeCategory('医薬品')).toBe('医薬品');
    expect(normalizeCategory('その他')).toBe('その他');
  });

  it('should fallback to その他 for unknown custom categories', () => {
    expect(normalizeCategory('文房具')).toBe('その他');
  });

  it('should fallback to DEFAULT_CATEGORY for null, undefined, or empty string', () => {
    expect(normalizeCategory(null)).toBe('食品');
    expect(normalizeCategory(undefined)).toBe('食品');
    expect(normalizeCategory('')).toBe('食品');
    expect(normalizeCategory('   ')).toBe('食品');
  });
});
