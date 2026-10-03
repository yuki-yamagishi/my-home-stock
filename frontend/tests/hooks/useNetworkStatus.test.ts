import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getNetworkOnlineState } from '../../src/hooks/useNetworkStatus';

describe('useNetworkStatus and getNetworkOnlineState', () => {
  const originalNavigator = global.navigator;
  const originalWindow = global.window;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.navigator = originalNavigator;
    global.window = originalWindow;
  });

  describe('getNetworkOnlineState', () => {
    it('returns true when navigator.onLine is true', () => {
      Object.defineProperty(global, 'navigator', {
        value: { onLine: true },
        writable: true,
        configurable: true,
      });
      expect(getNetworkOnlineState()).toBe(true);
    });

    it('returns false when navigator.onLine is false', () => {
      Object.defineProperty(global, 'navigator', {
        value: { onLine: false },
        writable: true,
        configurable: true,
      });
      expect(getNetworkOnlineState()).toBe(false);
    });

    it('returns true as default when navigator is undefined', () => {
      Object.defineProperty(global, 'navigator', {
        value: undefined,
        writable: true,
        configurable: true,
      });
      expect(getNetworkOnlineState()).toBe(true);
    });
  });
});
