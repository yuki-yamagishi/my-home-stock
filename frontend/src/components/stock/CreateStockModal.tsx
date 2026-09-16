import React, { useState, useEffect } from 'react';
import { X, Plus, Gauge, Hash } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { STOCK_CATEGORIES, DEFAULT_CATEGORY } from '../../constants/categories';
import {
  REMAINING_LEVEL_ORDER,
  REMAINING_LEVEL_CONFIGS,
  remainingLevelToQuantity,
} from '../../core/stockStatus';
import type { StockItemInput, StockType, RemainingLevel } from '../../api/schema';

interface CreateStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StockItemInput, resetForm: () => void) => void;
  isSubmitting?: boolean;
}

export function CreateStockModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}: CreateStockModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORY);
  const [stockType, setStockType] = useState<StockType>('QUANTITY');
  const [remainingLevel, setRemainingLevel] = useState<RemainingLevel>('FULL');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('個');
  const [minThreshold, setMinThreshold] = useState(1);
  const [memo, setMemo] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // ESC キー押下で閉じる
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isSubmitting]);

  const resetForm = () => {
    setName('');
    setCategory(DEFAULT_CATEGORY);
    setStockType('QUANTITY');
    setRemainingLevel('FULL');
    setQuantity(1);
    setUnit('個');
    setMinThreshold(1);
    setMemo('');
    setExpiryDate('');
  };

  if (!isOpen) {
    return null;
  }

  const isNameEmpty = !name.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNameEmpty || isSubmitting) return;

    const isLevel = stockType === 'REMAINING_LEVEL';
    const payload: StockItemInput = {
      name: name.trim(),
      category: category || DEFAULT_CATEGORY,
      stockType,
      remainingLevel: isLevel ? remainingLevel : undefined,
      quantity: isLevel ? remainingLevelToQuantity(remainingLevel) : Math.max(0, quantity),
      unit: unit.trim() || (isLevel ? '袋' : '個'),
      minThreshold: isLevel ? 1 : Math.max(0, minThreshold),
      expiryDate: expiryDate.trim() ? expiryDate.trim() : undefined,
      memo: memo.trim() || undefined,
    };

    onSubmit(payload, resetForm);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => {
        if (!isSubmitting) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-stock-title"
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h2 id="create-stock-title" className="text-base font-bold text-slate-900">
                在庫アイテムを追加
              </h2>
              <p className="text-xs text-slate-500">
                新しいアイテムの基本情報と管理方法を設定します
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="閉じる"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* 管理方法の選択 (トグル) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              在庫の管理方法 <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setStockType('QUANTITY');
                  if (unit === '袋') setUnit('個');
                }}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all ${
                  stockType === 'QUANTITY'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Hash className="h-4 w-4 text-emerald-600" />
                個数で管理
              </button>
              <button
                type="button"
                onClick={() => {
                  setStockType('REMAINING_LEVEL');
                  if (unit === '個') setUnit('袋');
                }}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all ${
                  stockType === 'REMAINING_LEVEL'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Gauge className="h-4 w-4 text-blue-600" />
                残量で管理 (4段階)
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              {stockType === 'REMAINING_LEVEL'
                ? '調味料や洗剤など、1本を使い切る消耗品に適しています。'
                : '缶詰や納豆パックなど、ストック個数を数える品に適しています。'}
            </p>
          </div>

          {/* 品名 & カテゴリ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-medium text-slate-700 block">
                品名 <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder={
                  stockType === 'REMAINING_LEVEL'
                    ? '例: マヨネーズ, 塩, 洗剤, シャンプー'
                    : '例: 牛乳, 卵, 缶詰'
                }
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 block">
                カテゴリ
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {STOCK_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 残量管理モードの入力項目 */}
          {stockType === 'REMAINING_LEVEL' ? (
            <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="text-xs font-semibold text-slate-800">
                  初期残量ステータス
                </label>
                <span className="text-[11px] text-slate-500">
                  ※「怪しい」「すっからかん」で買い物リストに入ります
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {REMAINING_LEVEL_ORDER.slice().reverse().map((lvl) => {
                  const cfg = REMAINING_LEVEL_CONFIGS[lvl];
                  const isSelected = remainingLevel === lvl;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setRemainingLevel(lvl)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-all ${
                        isSelected
                          ? `${cfg.colorClasses.activeButton} border-transparent shadow-sm`
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xs font-bold">{cfg.label}</span>
                      <span
                        className={`text-[10px] mt-0.5 ${
                          isSelected ? 'text-white/90' : 'text-slate-400'
                        }`}
                      >
                        {cfg.subtext}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 block">
                    単位 / 容器
                  </label>
                  <Input
                    placeholder="袋, 本, ボトル, パック"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-700">
                      賞味・消費期限 (任意)
                    </label>
                    {expiryDate && (
                      <button
                        type="button"
                        onClick={() => setExpiryDate('')}
                        className="text-[11px] font-medium text-rose-600 hover:text-rose-700 flex items-center gap-0.5 hover:underline"
                      >
                        <X className="h-3 w-3" />
                        クリア
                      </button>
                    )}
                  </div>
                  <Input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="bg-white"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* 個数管理モードの入力項目 */
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 block">
                    現在数量
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 block">
                    単位
                  </label>
                  <Input
                    placeholder="個, 本, パック"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                  />
                </div>
                <div className="col-span-2 sm:col-span-1 space-y-1">
                  <label className="text-xs font-medium text-slate-700 block">
                    補充閾値 (この個数以下で補充)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={minThreshold}
                    onChange={(e) => setMinThreshold(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-700">
                    賞味・消費期限 (任意)
                  </label>
                  {expiryDate && (
                    <button
                      type="button"
                      onClick={() => setExpiryDate('')}
                      className="text-[11px] font-medium text-rose-600 hover:text-rose-700 flex items-center gap-0.5 hover:underline"
                    >
                      <X className="h-3 w-3" />
                      クリア
                    </button>
                  )}
                </div>
                <Input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* メモ */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 block">
              メモ (任意)
            </label>
            <Input
              placeholder="保管場所、お気に入りの銘柄など"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>

          {/* アクションボタン */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isNameEmpty}
              className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[100px]"
            >
              {isSubmitting ? '追加中...' : '追加する'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
