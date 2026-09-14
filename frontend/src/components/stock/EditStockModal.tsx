import React, { useState, useEffect } from 'react';
import { X, Calendar, Edit3 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { STOCK_CATEGORIES, normalizeCategory } from '../../constants/categories';
import type { StockItem, StockItemInput } from '../../api/schema';

interface EditStockModalProps {
  isOpen: boolean;
  item: StockItem | null;
  onClose: () => void;
  onSave: (id: number, data: StockItemInput) => void;
  isSaving?: boolean;
}

export function EditStockModal({
  isOpen,
  item,
  onClose,
  onSave,
  isSaving = false,
}: EditStockModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('食品');
  const [quantity, setQuantity] = useState(0);
  const [unit, setUnit] = useState('個');
  const [minThreshold, setMinThreshold] = useState(1);
  const [expiryDate, setExpiryDate] = useState('');
  const [memo, setMemo] = useState('');

  useEffect(() => {
    if (item && isOpen) {
      setName(item.name);
      setCategory(normalizeCategory(item.category));
      setQuantity(item.quantity);
      setUnit(item.unit || '個');
      setMinThreshold(item.minThreshold);
      setExpiryDate(item.expiryDate || '');
      setMemo(item.memo || '');
    }
  }, [item, isOpen]);

  // ESC キー押下で閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item) {
    return null;
  }

  const isNameEmpty = !name.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNameEmpty || isSaving) return;

    onSave(item.id, {
      name: name.trim(),
      category,
      quantity: Math.max(0, quantity),
      unit: unit.trim() || '個',
      minThreshold: Math.max(0, minThreshold),
      expiryDate: expiryDate.trim() ? expiryDate.trim() : undefined,
      memo: memo.trim() || undefined,
      version: item.version, // 楽観的排他制御
    });
  };

  const handleClearExpiry = () => {
    setExpiryDate('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">在庫アイテムの編集</h2>
              <p className="text-xs text-slate-500">詳細情報や補充基準、期限を更新します</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            title="閉じる"
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 品名 */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              品名 <span className="text-rose-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 牛乳, トイレットペーパー"
              required
              autoFocus
            />
            {isNameEmpty && (
              <p className="text-[11px] text-rose-500 mt-1 font-medium">品名は必須です</p>
            )}
          </div>

          {/* カテゴリ */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              カテゴリ <span className="text-rose-500">*</span>
            </label>
            <select
              className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {STOCK_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* 数量 & 単位 & 補充閾値 */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                現在数量
              </label>
              <Input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                単位
              </label>
              <Input
                placeholder="個, 本, 袋"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                最小閾値 (補充基準)
              </label>
              <Input
                type="number"
                min="0"
                value={minThreshold}
                onChange={(e) => setMinThreshold(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* 賞味・消費期限 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                賞味・消費期限
              </label>
              {expiryDate && (
                <button
                  type="button"
                  onClick={handleClearExpiry}
                  className="text-[11px] font-medium text-rose-600 hover:text-rose-700 flex items-center gap-0.5 hover:underline"
                >
                  <X className="h-3 w-3" />
                  期限をクリア
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="flex-1"
              />
              {expiryDate && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearExpiry}
                  className="shrink-0 h-10 px-3 text-xs text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                  title="賞味期限を未設定に戻す"
                >
                  <X className="h-4 w-4 mr-1" />
                  クリア
                </Button>
              )}
            </div>
          </div>

          {/* メモ */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              メモ (保管場所・ブランド等)
            </label>
            <Input
              placeholder="例: パントリー左奥、特売時のみ購入"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={isNameEmpty || isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[100px]"
            >
              {isSaving ? '更新中...' : '更新する'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
