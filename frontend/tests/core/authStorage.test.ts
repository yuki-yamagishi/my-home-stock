import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  saveCachedAuthProfile,
  getCachedAuthProfile,
  clearAllLocalPersistence,
  AUTH_STORAGE_KEY,
  QUERY_CACHE_STORAGE_KEY,
  AUTH_CACHE_TTL_MS,
} from '../../src/core/authStorage';
import type { AuthUser } from '../../src/api/schema';

describe('authStorage - Local Auth Profile & Cache Purge', () => {
  let mockStorage: Record<string, string> = {};

  const mockUser: AuthUser = {
    userId: 1,
    email: 'user@example.com',
    displayName: 'テストユーザー',
    pictureUrl: 'https://example.com/pic.png',
    householdId: 10,
    householdName: 'テスト世帯',
    role: 'OWNER',
  };

  beforeEach(() => {
    mockStorage = {};
    const storageMock = {
      getItem: (key: string) => mockStorage[key] ?? null,
      setItem: (key: string, val: string) => {
        mockStorage[key] = val;
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
      clear: () => {
        mockStorage = {};
      },
    };
    Object.defineProperty(global, 'localStorage', {
      value: storageMock,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('saveCachedAuthProfile & getCachedAuthProfile', () => {
    it('saves user with current timestamp and retrieves it within TTL', () => {
      const baseTime = 1000000000000;
      saveCachedAuthProfile(mockUser, baseTime);

      const cached = getCachedAuthProfile(baseTime + 1000); // 1 second later
      expect(cached).toEqual(mockUser);
    });

    it('returns null if profile is not saved', () => {
      expect(getCachedAuthProfile()).toBeNull();
    });

    it('returns null and purges expired profile when TTL (24h) is exceeded', () => {
      const baseTime = 1000000000000;
      saveCachedAuthProfile(mockUser, baseTime);

      // 24 hours + 1 ms later
      const expiredTime = baseTime + AUTH_CACHE_TTL_MS + 1;
      const cached = getCachedAuthProfile(expiredTime);

      expect(cached).toBeNull();
      // Should have purged the expired profile
      expect(mockStorage[AUTH_STORAGE_KEY]).toBeUndefined();
    });

    it('handles corrupted JSON gracefully without crashing', () => {
      mockStorage[AUTH_STORAGE_KEY] = 'invalid json {';
      expect(getCachedAuthProfile()).toBeNull();
      expect(mockStorage[AUTH_STORAGE_KEY]).toBeUndefined();
    });
  });

  describe('clearAllLocalPersistence', () => {
    it('completely purges auth profile and query cache from storage', () => {
      mockStorage[AUTH_STORAGE_KEY] = JSON.stringify({ user: mockUser, cachedAt: Date.now() });
      mockStorage[QUERY_CACHE_STORAGE_KEY] = JSON.stringify({ state: { queries: [] } });
      mockStorage['unrelated_key'] = 'keep_me';

      clearAllLocalPersistence();

      expect(mockStorage[AUTH_STORAGE_KEY]).toBeUndefined();
      expect(mockStorage[QUERY_CACHE_STORAGE_KEY]).toBeUndefined();
      expect(mockStorage['unrelated_key']).toBe('keep_me');
    });
  });
});
