// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNetworkStatus, getNetworkOnlineState } from '../../src/hooks/useNetworkStatus';

describe('useNetworkStatus and getNetworkOnlineState', () => {
  describe('getNetworkOnlineState', () => {
    it('returns true when navigator.onLine is true', () => {
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
      expect(getNetworkOnlineState()).toBe(true);
    });

    it('returns false when navigator.onLine is false', () => {
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
      expect(getNetworkOnlineState()).toBe(false);
    });
  });

  describe('useNetworkStatus hook', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('returns initial online state correctly', () => {
      const { result } = renderHook(() => useNetworkStatus());

      expect(result.current.isOnline).toBe(true);
      expect(result.current.isOffline).toBe(false);
      expect(result.current.lastChangedAt).toBeNull();
    });

    it('updates state to offline when offline event is dispatched', () => {
      const { result } = renderHook(() => useNetworkStatus());

      expect(result.current.isOnline).toBe(true);
      expect(result.current.isOffline).toBe(false);

      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      expect(result.current.isOnline).toBe(false);
      expect(result.current.isOffline).toBe(true);
      expect(result.current.lastChangedAt).toBeInstanceOf(Date);
    });

    it('updates state back to online when online event is dispatched', () => {
      const { result } = renderHook(() => useNetworkStatus());

      // First go offline
      act(() => {
        window.dispatchEvent(new Event('offline'));
      });
      expect(result.current.isOffline).toBe(true);

      // Then go online
      act(() => {
        window.dispatchEvent(new Event('online'));
      });

      expect(result.current.isOnline).toBe(true);
      expect(result.current.isOffline).toBe(false);
      expect(result.current.lastChangedAt).toBeInstanceOf(Date);
    });

    it('removes event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useNetworkStatus());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    });
  });
});
