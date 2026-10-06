// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStockItemActions } from '../../src/hooks/useStockItemActions';
import type { StockItem } from '../../src/api/schema';
import * as networkHook from '../../src/hooks/useNetworkStatus';
import * as stockHook from '../../src/hooks/useStockItems';

describe('useStockItemActions hook (ISSUE-034)', () => {
  const mockConsumeMutate = vi.fn();
  const mockUpdateMutate = vi.fn();
  const mockDeleteMutate = vi.fn();

  const baseQuantityItem: StockItem = {
    id: 1,
    name: '牛乳',
    category: '食品',
    stockType: 'QUANTITY',
    quantity: 2,
    unit: '本',
    minThreshold: 1,
    expiryDate: '2026-10-10',
    memo: '低温殺菌牛乳',
    householdId: 'test-household',
    version: 3,
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  };

  const baseRemainingLevelItem: StockItem = {
    id: 2,
    name: '醤油',
    category: '調味料',
    stockType: 'REMAINING_LEVEL',
    remainingLevel: 'LOW',
    quantity: 25,
    unit: '本',
    minThreshold: 1,
    expiryDate: '2026-12-31',
    memo: '濃口醤油',
    householdId: 'test-household',
    version: 5,
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(networkHook, 'useNetworkStatus').mockReturnValue({
      isOnline: true,
      isOffline: false,
      lastChangedAt: null,
    });

    vi.spyOn(stockHook, 'useConsumeStock').mockReturnValue({
      mutate: mockConsumeMutate,
      isPending: false,
    } as any);

    vi.spyOn(stockHook, 'useUpdateStock').mockReturnValue({
      mutate: mockUpdateMutate,
      isPending: false,
    } as any);

    vi.spyOn(stockHook, 'useDeleteStock').mockReturnValue({
      mutate: mockDeleteMutate,
      isPending: false,
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Scenario 1: handleConsume / consume', () => {
    it('calls consumeMutation with default amount 1', () => {
      const { result } = renderHook(() => useStockItemActions());

      act(() => {
        result.current.handleConsume(baseQuantityItem);
      });

      expect(mockConsumeMutate).toHaveBeenCalledTimes(1);
      expect(mockConsumeMutate).toHaveBeenCalledWith({ id: 1, amount: 1 });
    });

    it('calls consumeMutation with specified amount via consume alias', () => {
      const { result } = renderHook(() => useStockItemActions());

      act(() => {
        result.current.consume(baseQuantityItem, 2);
      });

      expect(mockConsumeMutate).toHaveBeenCalledTimes(1);
      expect(mockConsumeMutate).toHaveBeenCalledWith({ id: 1, amount: 2 });
    });
  });

  describe('Scenario 2: handleAddOne / addOne (with optimistic lock version)', () => {
    it('increments quantity and propagates version and QUANTITY stockType', () => {
      const { result } = renderHook(() => useStockItemActions());

      act(() => {
        result.current.handleAddOne(baseQuantityItem);
      });

      expect(mockUpdateMutate).toHaveBeenCalledTimes(1);
      expect(mockUpdateMutate).toHaveBeenCalledWith({
        id: 1,
        data: {
          name: '牛乳',
          category: '食品',
          stockType: 'QUANTITY',
          quantity: 3,
          unit: '本',
          minThreshold: 1,
          memo: '低温殺菌牛乳',
          expiryDate: '2026-10-10',
          version: 3,
        },
      });
    });

    it('works via addOne alias', () => {
      const { result } = renderHook(() => useStockItemActions());

      act(() => {
        result.current.addOne(baseQuantityItem);
      });

      expect(mockUpdateMutate).toHaveBeenCalledTimes(1);
      expect(mockUpdateMutate).toHaveBeenCalledWith({
        id: 1,
        data: expect.objectContaining({
          quantity: 3,
          version: 3,
        }),
      });
    });
  });

  describe('Scenario 3: handleSetRemainingLevel / setRemainingLevel', () => {
    it('updates remainingLevel and converts to corresponding quantity (3 for FULL)', () => {
      const { result } = renderHook(() => useStockItemActions());

      act(() => {
        result.current.handleSetRemainingLevel(baseRemainingLevelItem, 'FULL');
      });

      expect(mockUpdateMutate).toHaveBeenCalledTimes(1);
      expect(mockUpdateMutate).toHaveBeenCalledWith({
        id: 2,
        data: {
          name: '醤油',
          category: '調味料',
          stockType: 'REMAINING_LEVEL',
          remainingLevel: 'FULL',
          quantity: 3,
          unit: '本',
          minThreshold: 1,
          memo: '濃口醤油',
          expiryDate: '2026-12-31',
          version: 5,
        },
      });
    });

    it('works via setRemainingLevel alias for EMPTY (quantity 0)', () => {
      const { result } = renderHook(() => useStockItemActions());

      act(() => {
        result.current.setRemainingLevel(baseRemainingLevelItem, 'EMPTY');
      });

      expect(mockUpdateMutate).toHaveBeenCalledTimes(1);
      expect(mockUpdateMutate).toHaveBeenCalledWith({
        id: 2,
        data: expect.objectContaining({
          remainingLevel: 'EMPTY',
          quantity: 0,
          version: 5,
        }),
      });
    });
  });

  describe('Scenario 4: handleDelete / remove (with standard window.confirm)', () => {
    it('calls deleteMutation when window.confirm returns true', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      const { result } = renderHook(() => useStockItemActions());

      act(() => {
        result.current.handleDelete(10);
      });

      expect(confirmSpy).toHaveBeenCalledWith('この在庫アイテムを削除してもよろしいですか？');
      expect(mockDeleteMutate).toHaveBeenCalledTimes(1);
      expect(mockDeleteMutate).toHaveBeenCalledWith(10);
    });

    it('does not call deleteMutation when window.confirm returns false', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      const { result } = renderHook(() => useStockItemActions());

      act(() => {
        result.current.handleDelete(10);
      });

      expect(confirmSpy).toHaveBeenCalledTimes(1);
      expect(mockDeleteMutate).not.toHaveBeenCalled();
    });

    it('works via remove alias', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      const { result } = renderHook(() => useStockItemActions());

      act(() => {
        result.current.remove(10);
      });

      expect(confirmSpy).toHaveBeenCalledTimes(1);
      expect(mockDeleteMutate).toHaveBeenCalledTimes(1);
      expect(mockDeleteMutate).toHaveBeenCalledWith(10);
    });
  });

  describe('Scenario 5: Offline guard', () => {
    beforeEach(() => {
      vi.spyOn(networkHook, 'useNetworkStatus').mockReturnValue({
        isOnline: false,
        isOffline: true,
        lastChangedAt: null,
      });
    });

    it('guards all operations when offline', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      const { result } = renderHook(() => useStockItemActions());

      act(() => {
        result.current.handleConsume(baseQuantityItem);
        result.current.handleAddOne(baseQuantityItem);
        result.current.handleSetRemainingLevel(baseRemainingLevelItem, 'FULL');
        result.current.handleDelete(1);
      });

      expect(mockConsumeMutate).not.toHaveBeenCalled();
      expect(mockUpdateMutate).not.toHaveBeenCalled();
      expect(confirmSpy).not.toHaveBeenCalled();
      expect(mockDeleteMutate).not.toHaveBeenCalled();
    });
  });

  describe('Scenario 6: Mutation pending guard', () => {
    it('guards update operations when updateMutation is pending', () => {
      vi.spyOn(stockHook, 'useUpdateStock').mockReturnValue({
        mutate: mockUpdateMutate,
        isPending: true,
      } as any);

      const { result } = renderHook(() => useStockItemActions());

      expect(result.current.isUpdating).toBe(true);

      act(() => {
        result.current.handleAddOne(baseQuantityItem);
        result.current.handleSetRemainingLevel(baseRemainingLevelItem, 'FULL');
      });

      expect(mockUpdateMutate).not.toHaveBeenCalled();
    });

    it('guards consume operation when consumeMutation is pending', () => {
      vi.spyOn(stockHook, 'useConsumeStock').mockReturnValue({
        mutate: mockConsumeMutate,
        isPending: true,
      } as any);

      const { result } = renderHook(() => useStockItemActions());

      expect(result.current.isConsuming).toBe(true);

      act(() => {
        result.current.handleConsume(baseQuantityItem);
      });

      expect(mockConsumeMutate).not.toHaveBeenCalled();
    });

    it('guards delete operation when deleteMutation is pending', () => {
      vi.spyOn(stockHook, 'useDeleteStock').mockReturnValue({
        mutate: mockDeleteMutate,
        isPending: true,
      } as any);

      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      const { result } = renderHook(() => useStockItemActions());

      expect(result.current.isDeleting).toBe(true);

      act(() => {
        result.current.handleDelete(1);
      });

      expect(confirmSpy).not.toHaveBeenCalled();
      expect(mockDeleteMutate).not.toHaveBeenCalled();
    });
  });
});
