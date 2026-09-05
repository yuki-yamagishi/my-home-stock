import { describe, it, expect } from 'vitest';
import { isShortage, getExpiryStatus, calculateStockSummary } from '../../src/core/stockStatus';

describe('stockStatus Core Domain Logic', () => {
  describe('isShortage', () => {
    it('returns true when quantity is equal to or less than minThreshold', () => {
      expect(isShortage(0, 1)).toBe(true);
      expect(isShortage(1, 1)).toBe(true);
      expect(isShortage(2, 5)).toBe(true);
    });

    it('returns false when quantity is greater than minThreshold', () => {
      expect(isShortage(2, 1)).toBe(false);
      expect(isShortage(5, 2)).toBe(false);
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

    it('correctly aggregates counts', () => {
      const items = [
        { quantity: 0, minThreshold: 1, expiryDate: '2026-09-01' }, // shortage & expired
        { quantity: 1, minThreshold: 1, expiryDate: '2026-09-06' }, // shortage & warning
        { quantity: 5, minThreshold: 2, expiryDate: '2026-09-20' }, // normal & ok
        { quantity: 3, minThreshold: 1, expiryDate: null },         // normal & none
      ];

      const summary = calculateStockSummary(items, referenceDate);
      expect(summary.totalItems).toBe(4);
      expect(summary.shortageCount).toBe(2);
      expect(summary.expiredCount).toBe(1);
      expect(summary.expiringCount).toBe(1);
    });
  });
});
