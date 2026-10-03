import { useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../api/client';
import type { AuthUser } from '../api/schema';
import {
  saveCachedAuthProfile,
  getCachedAuthProfile,
  clearAllLocalPersistence,
} from '../core/authStorage';

export function useAuth() {
  const query = useQuery<AuthUser, ApiError>({
    queryKey: ['auth', 'me'],
    queryFn: () => api.getCurrentUser(),
    retry: (failureCount, error) => {
      // 401 未認証の場合は即時確定（リトライ不要）
      if (error?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000,
  });

  // 成功時は直前認証プロファイルをストレージへミラーリング保存
  useEffect(() => {
    if (query.data) {
      saveCachedAuthProfile(query.data);
    }
  }, [query.data]);

  // 401 Unauthorized 検知時はローカルストレージを完全消去 (ガードレール 1)
  useEffect(() => {
    if (query.error instanceof ApiError && query.error.status === 401) {
      clearAllLocalPersistence();
    }
  }, [query.error]);

  // オフライン時（ネットワークエラー時）の直前認証プロファイルフォールバック
  const cachedProfile = useMemo(() => {
    // 401 の場合はフォールバックさせない
    if (query.error instanceof ApiError && query.error.status === 401) {
      return null;
    }
    // 通信エラー時、またはローディング中でデータ未取得時にローカルキャッシュを参照
    if (!query.data) {
      return getCachedAuthProfile();
    }
    return null;
  }, [query.data, query.error]);

  const user = query.data || cachedProfile;
  const isAuthenticated = !!user;
  const isOfflineAuth = !query.data && !!cachedProfile;

  const loginWithGoogle = () => {
    window.location.href = '/oauth2/authorization/google';
  };

  return {
    ...query,
    user,
    isAuthenticated,
    isOfflineAuth,
    loginWithGoogle,
  };
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.logout(),
    onSettled: () => {
      // 成功・失敗に関わらず端末の全ローカルキャッシュを完全物理破棄
      clearAllLocalPersistence();
      queryClient.setQueryData(['auth', 'me'], null);
      queryClient.clear();
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    },
  });
}
