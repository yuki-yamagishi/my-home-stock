import type { AuthUser } from '../api/schema';

export const AUTH_STORAGE_KEY = 'myhomestock:auth_profile';
export const QUERY_CACHE_STORAGE_KEY = 'myhomestock:query_cache';
export const AUTH_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface CachedAuthProfile {
  user: AuthUser;
  cachedAt: number;
}

function getStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  if (typeof localStorage !== 'undefined') {
    return localStorage;
  }
  return null;
}

/**
 * 認証プロファイルをタイムスタンプ付きでローカルストレージに安全に永続化します。
 */
export function saveCachedAuthProfile(user: AuthUser, now: number = Date.now()): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    const payload: CachedAuthProfile = {
      user,
      cachedAt: now,
    };
    storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn('Failed to save cached auth profile to localStorage:', e);
  }
}

/**
 * ローカルストレージから直前の認証プロファイルを取得します。
 * TTL（24時間）を超過している場合、または破損している場合は自動的に破棄して null を返します。
 */
export function getCachedAuthProfile(now: number = Date.now()): AuthUser | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;

    const parsed: CachedAuthProfile = JSON.parse(raw);
    if (!parsed || !parsed.user || typeof parsed.cachedAt !== 'number') {
      storage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    if (now - parsed.cachedAt > AUTH_CACHE_TTL_MS) {
      // TTL 切れのため安全に破棄
      storage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    return parsed.user;
  } catch {
    storage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

/**
 * ログアウト時または 401 確定時に、端末ローカルに保存された全永続化データ（認証情報 + クエリキャッシュ）を物理消去します。
 */
export function clearAllLocalPersistence(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(AUTH_STORAGE_KEY);
    storage.removeItem(QUERY_CACHE_STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear local persistence storage:', e);
  }
}
