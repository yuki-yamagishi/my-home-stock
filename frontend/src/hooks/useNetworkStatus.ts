import { useState, useEffect, useCallback } from 'react';

/**
 * 現在のブラウザのオンライン状態を安全に取得します。
 * SSR やテスト環境で navigator が未定義の場合は true（オンライン）を返します。
 */
export function getNetworkOnlineState(): boolean {
  if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
    return navigator.onLine;
  }
  return true;
}

export interface NetworkStatus {
  isOnline: boolean;
  isOffline: boolean;
  lastChangedAt: Date | null;
}

/**
 * ブラウザのネットワーク接続状態（オンライン/オフライン）を監視するカスタムフック。
 * navigator.onLine および window の 'online' / 'offline' イベントをリッスンします。
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(getNetworkOnlineState);
  const [lastChangedAt, setLastChangedAt] = useState<Date | null>(null);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setLastChangedAt(new Date());
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setLastChangedAt(new Date());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return {
    isOnline,
    isOffline: !isOnline,
    lastChangedAt,
  };
}
