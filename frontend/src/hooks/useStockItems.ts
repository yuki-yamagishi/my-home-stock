import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../api/client';
import type { StockItemInput } from '../api/schema';

export const STOCK_KEYS = {
  all: ['stocks'] as const,
  list: (category?: string) => ['stocks', 'list', category] as const,
  shoppingList: ['stocks', 'shopping-list'] as const,
  expiring: (daysAhead: number) => ['stocks', 'expiring', daysAhead] as const,
  health: ['health'] as const,
};

export function useHealth() {
  return useQuery({
    queryKey: STOCK_KEYS.health,
    queryFn: api.getHealth,
    refetchInterval: 30000,
  });
}

export function useStockList(category?: string) {
  return useQuery({
    queryKey: STOCK_KEYS.list(category),
    queryFn: () => api.getStocks(category),
  });
}

export function useShoppingList() {
  return useQuery({
    queryKey: STOCK_KEYS.shoppingList,
    queryFn: api.getShoppingList,
  });
}

export function useExpiringItems(daysAhead: number = 7) {
  return useQuery({
    queryKey: STOCK_KEYS.expiring(daysAhead),
    queryFn: () => api.getExpiringItems(daysAhead),
  });
}

export function useCreateStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: StockItemInput) => api.createStock(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STOCK_KEYS.all });
    },
  });
}

export function useUpdateStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: StockItemInput }) => api.updateStock(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STOCK_KEYS.all });
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.status === 409) {
        alert('【排他制御警告】他の端末によって既にデータが更新されています。最新情報を再取得しました。');
        queryClient.invalidateQueries({ queryKey: STOCK_KEYS.all });
      }
    },
  });
}

export function useConsumeStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount }: { id: number; amount?: number }) => api.consumeStock(id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STOCK_KEYS.all });
    },
  });
}

export function useDeleteStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteStock(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STOCK_KEYS.all });
    },
  });
}
