import { describe, it, expect } from 'vitest';
import {
  isShortage,
  getExpiryStatus,
  calculateStockSummary,
  remainingLevelToQuantity,
  getNextDecreasedLevel,
  REMAINING_LEVEL_CONFIGS,
} from '../../src/core/stockStatus';

describe('stockStatus Core Domain Logic', () => {
  describe('isShortage', () => {
    describe('QUANTITY stock type (default)', () => {
      it('returns true when quantity is equal to or less than minThreshold', () => {
        expect(isShortage(0, 1)).toBe(true);
        expect(isShortage(1, 1)).toBe(true);
        expect(isShortage(2, 5)).toBe(true);
        expect(isShortage(0, 1, 'QUANTITY')).toBe(true);
        expect(isShortage(1, 1, 'QUANTITY')).toBe(true);
      });

      it('returns false when quantity is greater than minThreshold', () => {
        expect(isShortage(2, 1)).toBe(false);
        expect(isShortage(5, 2)).toBe(false);
        expect(isShortage(2, 1, 'QUANTITY')).toBe(false);
      });
    });

    describe('REMAINING_LEVEL stock type (4 levels)', () => {
      it('returns true when remainingLevel is LOW (怪しい) or EMPTY (すっからかん)', () => {
        expect(isShortage(1, 1, 'REMAINING_LEVEL', 'LOW')).toBe(true);
        expect(isShortage(0, 1, 'REMAINING_LEVEL', 'EMPTY')).toBe(true);
      });

      it('returns false when remainingLevel is FULL (十分) or PLENTY (まだまだ)', () => {
        expect(isShortage(3, 1, 'REMAINING_LEVEL', 'FULL')).toBe(false);
        expect(isShortage(2, 1, 'REMAINING_LEVEL', 'PLENTY')).toBe(false);
      });
    });
  });

  describe('remainingLevel helpers', () => {
    it('correctly maps RemainingLevel to numeric quantity', () => {
      expect(remainingLevelToQuantity('FULL')).toBe(3);
      expect(remainingLevelToQuantity('PLENTY')).toBe(2);
      expect(remainingLevelToQuantity('LOW')).toBe(1);
      expect(remainingLevelToQuantity('EMPTY')).toBe(0);
      expect(remainingLevelToQuantity(null)).toBe(3);
    });

    it('correctly decreases remaining level sequentially', () => {
      expect(getNextDecreasedLevel('FULL')).toBe('PLENTY');
      expect(getNextDecreasedLevel('PLENTY')).toBe('LOW');
      expect(getNextDecreasedLevel('LOW')).toBe('EMPTY');
      expect(getNextDecreasedLevel('EMPTY')).toBe('EMPTY');
    });

    it('has all 4 levels properly configured in REMAINING_LEVEL_CONFIGS', () => {
      expect(REMAINING_LEVEL_CONFIGS.FULL.label).toBe('十分');
      expect(REMAINING_LEVEL_CONFIGS.PLENTY.label).toBe('まだまだ');
      expect(REMAINING_LEVEL_CONFIGS.LOW.label).toBe('怪しい');
      expect(REMAINING_LEVEL_CONFIGS.EMPTY.label).toBe('すっからかん');
    });
  });

  describe('getExpiryStatus', () => {
    const referenceDate = new Date('2026-09-05T00:00:00Z');

    it('returns "none" when no date is provided', () => {
      expect(getExpiryStatus(null, referenceDate).status).toBe('none');
      expect(getExpiryStatus(undefined, referenceDate).status).toBe('none');
    });

    it('returns "expired" for past dates', () => {
      const res = getExpiryStatus('2026-09-01', referenceDate);
      expect(res.status).toBe('expired');
      expect(res.daysRemaining).toBeLessThan(0);
    });

    it('returns "warning" for today or dates within 3 days', () => {
      const today = getExpiryStatus('2026-09-05', referenceDate);
      expect(today.status).toBe('warning');
      expect(today.daysRemaining).toBe(0);

      const in2Days = getExpiryStatus('2026-09-07', referenceDate);
      expect(in2Days.status).toBe('warning');
      expect(in2Days.daysRemaining).toBe(2);
    });

    it('returns "ok" for dates more than 3 days in future', () => {
      const in10Days = getExpiryStatus('2026-09-15', referenceDate);
      expect(in10Days.status).toBe('ok');
      expect(in10Days.daysRemaining).toBe(10);
    });
  });

  describe('calculateStockSummary', () => {
    const referenceDate = new Date('2026-09-05T00:00:00Z');

    it('correctly aggregates counts with both QUANTITY and REMAINING_LEVEL items', () => {
      const items = [
        { quantity: 0, minThreshold: 1, expiryDate: '2026-09-01' }, // quantity shortage & expired
        { quantity: 1, minThreshold: 1, expiryDate: '2026-09-06' }, // quantity shortage & warning
        { quantity: 5, minThreshold: 2, expiryDate: '2026-09-20' }, // quantity normal & ok
        {
          quantity: 1,
          minThreshold: 1,
          stockType: 'REMAINING_LEVEL' as const,
          remainingLevel: 'LOW' as const,
          expiryDate: null,
        }, // level shortage (怪しい)
        {
          quantity: 3,
          minThreshold: 1,
          stockType: 'REMAINING_LEVEL' as const,
          remainingLevel: 'FULL' as const,
          expiryDate: null,
        }, // level normal (十分)
      ];

      const summary = calculateStockSummary(items, referenceDate);
      expect(summary.totalItems).toBe(5);
      expect(summary.shortageCount).toBe(3); // 2 quantity + 1 remaining level (LOW)
      expect(summary.expiredCount).toBe(1);
      expect(summary.expiringCount).toBe(1);
    });
  });
});
