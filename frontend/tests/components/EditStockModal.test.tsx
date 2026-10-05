// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { EditStockModal } from '../../src/components/stock/EditStockModal';
import type { StockItem } from '../../src/api/schema';

describe('EditStockModal Conflict Resolution UX (ISSUE-033)', () => {
  afterEach(() => {
    cleanup();
  });

  const baseItem: StockItem = {
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
    version: 1,
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  };

  const conflictServerItem: StockItem = {
    id: 1,
    name: '牛乳',
    category: '食品',
    stockType: 'QUANTITY',
    quantity: 1, // 他端末で 1 本消費された
    unit: '本',
    minThreshold: 1,
    expiryDate: '2026-10-12', // 他端末で期限も更新された
    memo: '他端末で追加されたメモ',
    householdId: 'test-household',
    version: 2, // バージョンがインクリメントされている
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-05T10:00:00Z',
  };

  it('renders initial item values in the form when opened', () => {
    const handleClose = vi.fn();
    const handleSave = vi.fn();

    render(
      <EditStockModal
        isOpen={true}
        item={baseItem}
        onClose={handleClose}
        onSave={handleSave}
      />
    );

    expect(screen.getByDisplayValue('牛乳')).toBeTruthy();
    expect(screen.getByDisplayValue('2')).toBeTruthy();
    expect(screen.getByDisplayValue('本')).toBeTruthy();
    expect(screen.getByDisplayValue('低温殺菌牛乳')).toBeTruthy();
    expect(screen.queryByTestId('conflict-banner')).toBeNull();
  });

  it('displays conflict banner with server details while keeping user inputs intact when conflictItem is provided', () => {
    const handleClose = vi.fn();
    const handleSave = vi.fn();
    const handleClearConflict = vi.fn();

    const { rerender } = render(
      <EditStockModal
        isOpen={true}
        item={baseItem}
        onClose={handleClose}
        onSave={handleSave}
        onClearConflict={handleClearConflict}
      />
    );

    // ユーザーがメモと数量を編集
    const memoInput = screen.getByDisplayValue('低温殺菌牛乳');
    fireEvent.change(memoInput, { target: { value: '自分の入力した特売メモ' } });

    const quantityInput = screen.getByDisplayValue('2');
    fireEvent.change(quantityInput, { target: { value: '5' } });

    // 409 Conflict 発生により conflictItem が props として渡された状況を再現
    rerender(
      <EditStockModal
        isOpen={true}
        item={baseItem}
        conflictItem={conflictServerItem}
        onClose={handleClose}
        onSave={handleSave}
        onClearConflict={handleClearConflict}
      />
    );

    // 1. 競合バナーが表示されていること
    const banner = screen.getByTestId('conflict-banner');
    expect(banner).toBeTruthy();
    expect(banner.textContent).toContain('【排他制御警告】他の端末によって内容が更新されました');

    // 2. 他端末の最新状態がバナー内に表示されていること
    expect(banner.textContent).toContain('1 本');
    expect(banner.textContent).toContain('他端末で追加されたメモ');

    // 3. ユーザーが入力した内容が破棄されずにそのまま残っていること（データ消失防止）
    expect(screen.getByDisplayValue('自分の入力した特売メモ')).toBeTruthy();
    expect(screen.getByDisplayValue('5')).toBeTruthy();
  });

  it('accepts latest server data, clears conflict, and retains latest version (2) on subsequent submit', () => {
    const handleClose = vi.fn();
    const handleSave = vi.fn();
    const handleClearConflict = vi.fn();

    const { rerender } = render(
      <EditStockModal
        isOpen={true}
        item={baseItem}
        conflictItem={conflictServerItem}
        onClose={handleClose}
        onSave={handleSave}
        onClearConflict={handleClearConflict}
      />
    );

    // ユーザーが入力していた値
    const memoInput = screen.getByDisplayValue('低温殺菌牛乳');
    fireEvent.change(memoInput, { target: { value: '書きかけのメモ' } });

    // 「最新データを取り込む」ボタンをクリック
    const acceptBtn = screen.getByRole('button', { name: /最新データを取り込む/i });
    fireEvent.click(acceptBtn);

    // conflictServerItem の最新データ（メモ・数量など）がフォームに反映されること
    expect(screen.getByDisplayValue('他端末で追加されたメモ')).toBeTruthy();
    expect(screen.getAllByDisplayValue('1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByDisplayValue('2026-10-12')).toBeTruthy();
    expect(handleClearConflict).toHaveBeenCalledTimes(1);

    // 親コンポーネントが onClearConflict を受けて conflictItem を null にした状態を再現
    rerender(
      <EditStockModal
        isOpen={true}
        item={baseItem}
        conflictItem={null}
        onClose={handleClose}
        onSave={handleSave}
        onClearConflict={handleClearConflict}
      />
    );

    // ユーザーが最新データを取り込んだ後に追記・再編集
    const newMemoInput = screen.getByDisplayValue('他端末で追加されたメモ');
    fireEvent.change(newMemoInput, { target: { value: '最新データに追記したメモ' } });

    // 通常の「更新する」ボタンをクリック
    const submitBtn = screen.getByRole('button', { name: '更新する' });
    fireEvent.click(submitBtn);

    // 古い item.version (1) ではなく、最新の conflictServerItem.version (2) が送信されること！
    expect(handleSave).toHaveBeenCalledTimes(1);
    expect(handleSave).toHaveBeenCalledWith(1, expect.objectContaining({
      name: '牛乳',
      memo: '最新データに追記したメモ',
      version: 2, // 破綻シナリオを解消し、最新バージョンが正しく維持されている！
    }));
  });

  it('submits form with latest server version when "自分の入力で上書き保存" is clicked', () => {
    const handleClose = vi.fn();
    const handleSave = vi.fn();
    const handleClearConflict = vi.fn();

    render(
      <EditStockModal
        isOpen={true}
        item={baseItem}
        conflictItem={conflictServerItem}
        onClose={handleClose}
        onSave={handleSave}
        onClearConflict={handleClearConflict}
      />
    );

    // ユーザーがメモを編集
    const memoInput = screen.getByDisplayValue('低温殺菌牛乳');
    fireEvent.change(memoInput, { target: { value: '自分がどうしても保存したいメモ' } });

    // 「自分の入力で上書き保存」ボタンをクリック
    const overwriteBtn = screen.getByRole('button', { name: /自分の入力で上書き保存/i });
    fireEvent.click(overwriteBtn);

    // onSave が呼ばれ、最新の conflictServerItem.version (2) が付与され、入力値が維持されていること
    expect(handleSave).toHaveBeenCalledTimes(1);
    expect(handleSave).toHaveBeenCalledWith(1, expect.objectContaining({
      name: '牛乳',
      memo: '自分がどうしても保存したいメモ',
      version: 2, // 最新バージョンに引き継がれて無限競合ループを防止！
    }));
  });

  it('calls onClearConflict when cancel button is clicked', () => {
    const handleClose = vi.fn();
    const handleSave = vi.fn();
    const handleClearConflict = vi.fn();

    render(
      <EditStockModal
        isOpen={true}
        item={baseItem}
        conflictItem={conflictServerItem}
        onClose={handleClose}
        onSave={handleSave}
        onClearConflict={handleClearConflict}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: 'キャンセル' });
    fireEvent.click(cancelBtn);

    expect(handleClearConflict).toHaveBeenCalledTimes(1);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
