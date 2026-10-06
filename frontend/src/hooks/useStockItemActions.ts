import { useNetworkStatus } from './useNetworkStatus';
import {
  useConsumeStock,
  useUpdateStock,
  useDeleteStock,
} from './useStockItems';
import { remainingLevelToQuantity } from '../core/stockStatus';
import type { StockItem, RemainingLevel } from '../api/schema';

export interface UseStockItemActionsReturn {
  // Alias names
  consume: (item: StockItem, amount?: number) => void;
  addOne: (item: StockItem) => void;
  setRemainingLevel: (item: StockItem, newLevel: RemainingLevel) => void;
  remove: (id: number) => void;

  // Handler names (App.tsx compatibility)
  handleConsume: (item: StockItem, amount?: number) => void;
  handleAddOne: (item: StockItem) => void;
  handleSetRemainingLevel: (item: StockItem, newLevel: RemainingLevel) => void;
  handleDelete: (id: number) => void;

  // Status flags
  isUpdating: boolean;
  isConsuming: boolean;
  isDeleting: boolean;
}

/**
 * Custom hook encapsulating stock item manipulation operations (consume, increment, remaining level change, delete).
 * Ensures optimistic lock version propagation, remaining level to quantity conversion, and offline guards.
 */
export function useStockItemActions(): UseStockItemActionsReturn {
  const { isOffline } = useNetworkStatus();

  const consumeMutation = useConsumeStock();
  const updateMutation = useUpdateStock();
  const deleteMutation = useDeleteStock();

  const handleConsume = (item: StockItem, amount: number = 1) => {
    if (isOffline || consumeMutation.isPending) return;
    consumeMutation.mutate({ id: item.id, amount });
  };

  const handleAddOne = (item: StockItem) => {
    if (isOffline || updateMutation.isPending) return;
    updateMutation.mutate({
      id: item.id,
      data: {
        name: item.name,
        category: item.category,
        stockType: 'QUANTITY',
        quantity: item.quantity + 1,
        unit: item.unit,
        minThreshold: item.minThreshold,
        memo: item.memo,
        expiryDate: item.expiryDate,
        version: item.version,
      },
    });
  };

  const handleSetRemainingLevel = (item: StockItem, newLevel: RemainingLevel) => {
    if (isOffline || updateMutation.isPending) return;
    updateMutation.mutate({
      id: item.id,
      data: {
        name: item.name,
        category: item.category,
        stockType: 'REMAINING_LEVEL',
        remainingLevel: newLevel,
        quantity: remainingLevelToQuantity(newLevel),
        unit: item.unit,
        minThreshold: item.minThreshold,
        memo: item.memo,
        expiryDate: item.expiryDate,
        version: item.version,
      },
    });
  };

  const handleDelete = (id: number) => {
    if (isOffline || deleteMutation.isPending) return;
    if (window.confirm('この在庫アイテムを削除してもよろしいですか？')) {
      deleteMutation.mutate(id);
    }
  };

  return {
    consume: handleConsume,
    addOne: handleAddOne,
    setRemainingLevel: handleSetRemainingLevel,
    remove: handleDelete,
    handleConsume,
    handleAddOne,
    handleSetRemainingLevel,
    handleDelete,
    isUpdating: updateMutation.isPending,
    isConsuming: consumeMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
