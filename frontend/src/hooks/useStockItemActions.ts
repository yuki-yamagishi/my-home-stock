import { useNetworkStatus } from './useNetworkStatus';
import {
  useConsumeStock,
  useUpdateStock,
  useDeleteStock,
} from './useStockItems';
import { remainingLevelToQuantity } from '../core/stockStatus';
import type { StockItem, RemainingLevel } from '../api/schema';

export interface UseStockItemActionsOptions {
  confirmDelete?: (message: string) => boolean;
}

export interface UseStockItemActionsReturn {
  // Alias names
  consume: (item: StockItem, amount?: number) => void;
  addOne: (item: StockItem) => void;
  setRemainingLevel: (item: StockItem, newLevel: RemainingLevel) => void;
  remove: (itemOrId: StockItem | number) => void;

  // Handler names (App.tsx compatibility)
  handleConsume: (item: StockItem, amount?: number) => void;
  handleAddOne: (item: StockItem) => void;
  handleSetRemainingLevel: (item: StockItem, newLevel: RemainingLevel) => void;
  handleDelete: (itemOrId: StockItem | number) => void;

  // Status flags
  isUpdating: boolean;
  isConsuming: boolean;
  isDeleting: boolean;
  isPending: boolean;
}

/**
 * Custom hook encapsulating stock item manipulation operations (consume, increment, remaining level change, delete).
 * Ensures optimistic lock version propagation, remaining level to quantity conversion, and offline guards.
 */
export function useStockItemActions(
  options: UseStockItemActionsOptions = {}
): UseStockItemActionsReturn {
  const { confirmDelete = (msg: string) => window.confirm(msg) } = options;
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

  const handleDelete = (itemOrId: StockItem | number) => {
    if (isOffline || deleteMutation.isPending) return;
    const id = typeof itemOrId === 'number' ? itemOrId : itemOrId.id;
    if (confirmDelete('この在庫アイテムを削除してもよろしいですか？')) {
      deleteMutation.mutate(id);
    }
  };

  const isUpdating = updateMutation.isPending;
  const isConsuming = consumeMutation.isPending;
  const isDeleting = deleteMutation.isPending;
  const isPending = isUpdating || isConsuming || isDeleting;

  return {
    consume: handleConsume,
    addOne: handleAddOne,
    setRemainingLevel: handleSetRemainingLevel,
    remove: handleDelete,
    handleConsume,
    handleAddOne,
    handleSetRemainingLevel,
    handleDelete,
    isUpdating,
    isConsuming,
    isDeleting,
    isPending,
  };
}
