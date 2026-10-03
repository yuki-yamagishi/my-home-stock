import { describe, it, expect } from 'vitest';
import { formatOfflineBannerText } from '../../src/components/layout/OfflineBanner';

describe('OfflineBanner formatOfflineBannerText', () => {
  it('formats banner text without timestamp when lastSyncedAt is null or undefined', () => {
    expect(formatOfflineBannerText(null)).toBe(
      '⚠️ オフライン表示中 - 電波復帰時に自動更新されます'
    );
    expect(formatOfflineBannerText(undefined)).toBe(
      '⚠️ オフライン表示中 - 電波復帰時に自動更新されます'
    );
  });

  it('formats banner text with zero-padded hours and minutes when date is given', () => {
    const date = new Date(2026, 9, 3, 9, 5); // 09:05
    expect(formatOfflineBannerText(date)).toBe(
      '⚠️ オフライン表示中 (最終同期: 09:05) - 電波復帰時に自動更新されます'
    );
  });

  it('formats banner text correctly in the afternoon', () => {
    const date = new Date(2026, 9, 3, 18, 30); // 18:30
    expect(formatOfflineBannerText(date)).toBe(
      '⚠️ オフライン表示中 (最終同期: 18:30) - 電波復帰時に自動更新されます'
    );
  });
});
