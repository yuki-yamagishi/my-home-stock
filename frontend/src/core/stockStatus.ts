/**
 * Pure Domain Business Logic: Stock & Expiry Calculation
 * Independent of React, DOM, or external APIs (100% unit-testable)
 */

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

/**
 * Determines if an item is short on stock (needs to be added to shopping list)
 */
export function isShortage(quantity: number, minThreshold: number): boolean {
  return quantity <= minThreshold;
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
  items: Array<{ quantity: number; minThreshold: number; expiryDate?: string | null }>,
  referenceDate: Date = new Date()
): StockSummary {
  let shortageCount = 0;
  let expiringCount = 0;
  let expiredCount = 0;

  for (const item of items) {
    if (isShortage(item.quantity, item.minThreshold)) {
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
