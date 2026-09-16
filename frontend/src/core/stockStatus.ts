/**
 * Pure Domain Business Logic: Stock, Expiry & Remaining Level Calculation
 * Independent of React, DOM, or external APIs (100% unit-testable)
 */

import type { StockType, RemainingLevel } from '../api/schema';

export type ExpiryAlertLevel = 'expired' | 'warning' | 'ok' | 'none';

export interface ExpiryStatus {
  status: ExpiryAlertLevel;
  daysRemaining: number | null;
  label: string;
}

export interface StockSummary {
  totalItems: number;
  shortageCount: number;
  expiringCount: number;
  expiredCount: number;
}

export interface RemainingLevelConfig {
  level: RemainingLevel;
  label: string;
  shortLabel: string;
  subtext: string;
  numericValue: number;
  colorClasses: {
    badge: string;
    activeButton: string;
    dot: string;
    bar: string;
  };
}

export const REMAINING_LEVEL_ORDER: RemainingLevel[] = ['EMPTY', 'LOW', 'PLENTY', 'FULL'];

export const REMAINING_LEVEL_CONFIGS: Record<RemainingLevel, RemainingLevelConfig> = {
  FULL: {
    level: 'FULL',
    label: '十分',
    shortLabel: '十分',
    subtext: 'たっぷり (7割以上)',
    numericValue: 3,
    colorClasses: {
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      activeButton: 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600 ring-offset-1',
      dot: 'bg-emerald-500',
      bar: 'bg-emerald-500',
    },
  },
  PLENTY: {
    level: 'PLENTY',
    label: 'まだまだ',
    shortLabel: 'まだまだ',
    subtext: '余裕あり (半分程度)',
    numericValue: 2,
    colorClasses: {
      badge: 'bg-blue-100 text-blue-800 border-blue-200',
      activeButton: 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600 ring-offset-1',
      dot: 'bg-blue-500',
      bar: 'bg-blue-500',
    },
  },
  LOW: {
    level: 'LOW',
    label: '怪しい',
    shortLabel: '怪しい',
    subtext: '残りわずか (買い足し推奨)',
    numericValue: 1,
    colorClasses: {
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
      activeButton: 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-600 ring-offset-1',
      dot: 'bg-amber-500',
      bar: 'bg-amber-500',
    },
  },
  EMPTY: {
    level: 'EMPTY',
    label: 'すっからかん',
    shortLabel: 'すっからかん',
    subtext: 'なし (要購入)',
    numericValue: 0,
    colorClasses: {
      badge: 'bg-rose-100 text-rose-800 border-rose-200',
      activeButton: 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-600 ring-offset-1',
      dot: 'bg-rose-500',
      bar: 'bg-rose-500',
    },
  },
};

/**
 * Determines if an item is short on stock (needs to be added to shopping list).
 * For REMAINING_LEVEL, LOW or EMPTY triggers shortage.
 * For QUANTITY, quantity <= minThreshold triggers shortage.
 */
export function isShortage(
  quantity: number,
  minThreshold: number,
  stockType: StockType = 'QUANTITY',
  remainingLevel?: RemainingLevel | null
): boolean {
  if (stockType === 'REMAINING_LEVEL') {
    return remainingLevel === 'LOW' || remainingLevel === 'EMPTY';
  }
  return quantity <= minThreshold;
}

/**
 * Maps RemainingLevel to numeric quantity (0 to 3)
 */
export function remainingLevelToQuantity(level: RemainingLevel | null | undefined): number {
  if (!level) return 3;
  return REMAINING_LEVEL_CONFIGS[level]?.numericValue ?? 3;
}

/**
 * Calculates next decreased remaining level (FULL -> PLENTY -> LOW -> EMPTY)
 */
export function getNextDecreasedLevel(level: RemainingLevel | null | undefined): RemainingLevel {
  switch (level) {
    case 'FULL':
      return 'PLENTY';
    case 'PLENTY':
      return 'LOW';
    case 'LOW':
    case 'EMPTY':
    default:
      return 'EMPTY';
  }
}

/**
 * Calculates expiry urgency relative to a reference date (default: today)
 * warning threshold: within 3 days
 */
export function getExpiryStatus(
  expiryDateStr: string | null | undefined,
  referenceDate: Date = new Date()
): ExpiryStatus {
  if (!expiryDateStr) {
    return { status: 'none', daysRemaining: null, label: '期限なし' };
  }

  const expiry = new Date(expiryDateStr);
  if (isNaN(expiry.getTime())) {
    return { status: 'none', daysRemaining: null, label: '無効な日付' };
  }

  // Normalize dates to midnight for calendar day calculation
  const expDay = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
  const refDay = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());

  const diffTime = expDay.getTime() - refDay.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return { status: 'expired', daysRemaining, label: `期限切れ (${Math.abs(daysRemaining)}日超過)` };
  } else if (daysRemaining === 0) {
    return { status: 'warning', daysRemaining: 0, label: '本日が期限' };
  } else if (daysRemaining <= 3) {
    return { status: 'warning', daysRemaining, label: `残り ${daysRemaining} 日` };
  } else {
    return { status: 'ok', daysRemaining, label: `残り ${daysRemaining} 日` };
  }
}

/**
 * Computes aggregated dashboard metrics for all stock items
 */
export function calculateStockSummary(
  items: Array<{
    quantity: number;
    minThreshold: number;
    stockType?: StockType | null;
    remainingLevel?: RemainingLevel | null;
    expiryDate?: string | null;
  }>,
  referenceDate: Date = new Date()
): StockSummary {
  let shortageCount = 0;
  let expiringCount = 0;
  let expiredCount = 0;

  for (const item of items) {
    if (isShortage(item.quantity, item.minThreshold, item.stockType || 'QUANTITY', item.remainingLevel)) {
      shortageCount++;
    }

    const exp = getExpiryStatus(item.expiryDate, referenceDate);
    if (exp.status === 'expired') {
      expiredCount++;
    } else if (exp.status === 'warning') {
      expiringCount++;
    }
  }

  return {
    totalItems: items.length,
    shortageCount,
    expiringCount,
    expiredCount,
  };
}
