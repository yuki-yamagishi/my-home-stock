import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../api/client';
import type { AuthUser } from '../api/schema';

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

  const isAuthenticated = query.isSuccess && !!query.data;
  const user = query.data;

  const loginWithGoogle = () => {
    window.location.href = '/oauth2/authorization/google';
  };

  return {
    ...query,
    user,
    isAuthenticated,
    loginWithGoogle,
  };
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.logout(),
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'me'], null);
      queryClient.clear();
      window.location.reload();
    },
  });
}
