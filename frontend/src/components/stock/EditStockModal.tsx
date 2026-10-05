import React, { useState, useEffect } from 'react';
import { X, Calendar, Edit3, Gauge, Hash, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { STOCK_CATEGORIES, normalizeCategory } from '../../constants/categories';
import {
  REMAINING_LEVEL_ORDER,
  REMAINING_LEVEL_CONFIGS,
  remainingLevelToQuantity,
} from '../../core/stockStatus';
import type { StockItem, StockItemInput, StockType, RemainingLevel } from '../../api/schema';

interface EditStockModalProps {
  isOpen: boolean;
  item: StockItem | null;
  conflictItem?: StockItem | null;
  onClose: () => void;
  onSave: (id: number, data: StockItemInput) => void;
  onClearConflict?: () => void;
  isSaving?: boolean;
}

export function EditStockModal({
  isOpen,
  item,
  conflictItem,
  onClose,
  onSave,
  onClearConflict,
  isSaving = false,
}: EditStockModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('食品');
  const [stockType, setStockType] = useState<StockType>('QUANTITY');
  const [remainingLevel, setRemainingLevel] = useState<RemainingLevel>('FULL');
  const [quantity, setQuantity] = useState(0);
  const [unit, setUnit] = useState('個');
  const [minThreshold, setMinThreshold] = useState(1);
  const [expiryDate, setExpiryDate] = useState('');
  const [memo, setMemo] = useState('');

  useEffect(() => {
    if (item && isOpen) {
      setName(item.name);
      setCategory(normalizeCategory(item.category));
      setStockType(item.stockType || 'QUANTITY');
      setRemainingLevel(item.remainingLevel || 'FULL');
      setQuantity(item.quantity);
      setUnit(item.unit || (item.stockType === 'REMAINING_LEVEL' ? '袋' : '個'));
      setMinThreshold(item.minThreshold);
      setExpiryDate(item.expiryDate || '');
      setMemo(item.memo || '');
    }
  }, [item, isOpen]);

  const handleCloseModal = () => {
    if (!isSaving) {
      onClearConflict?.();
      onClose();
    }
  };

  // ESC キー押下で閉じる (保存中または非表示時は無効)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving]);

  if (!isOpen || !item) {
    return null;
  }

  const isNameEmpty = !name.trim();

  // 現在のフォーム入力内容から送信用 DTO を生成
  const buildPayload = (targetVersion: number): StockItemInput => ({
    name: name.trim(),
    category,
    stockType,
    remainingLevel: stockType === 'REMAINING_LEVEL' ? remainingLevel : undefined,
    quantity:
      stockType === 'REMAINING_LEVEL'
        ? remainingLevelToQuantity(remainingLevel)
        : Math.max(0, quantity),
    unit: unit.trim() || (stockType === 'REMAINING_LEVEL' ? '袋' : '個'),
    minThreshold: stockType === 'REMAINING_LEVEL' ? 1 : Math.max(0, minThreshold),
    expiryDate: expiryDate.trim() ? expiryDate.trim() : undefined,
    memo: memo.trim() || undefined,
    version: targetVersion,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNameEmpty || isSaving) return;

    // 競合発生時は最新サーバーバージョンを採用、通常時は item.version
    const targetVersion = conflictItem ? conflictItem.version : item.version;
    onSave(item.id, buildPayload(targetVersion));
  };

  // 競合解決 1: 他端末の最新データを取り込んで再編集
  const handleAcceptLatest = () => {
    if (!conflictItem) return;
    setName(conflictItem.name);
    setCategory(normalizeCategory(conflictItem.category));
    setStockType(conflictItem.stockType || 'QUANTITY');
    setRemainingLevel(conflictItem.remainingLevel || 'FULL');
    setQuantity(conflictItem.quantity);
    setUnit(conflictItem.unit || (conflictItem.stockType === 'REMAINING_LEVEL' ? '袋' : '個'));
    setMinThreshold(conflictItem.minThreshold);
    setExpiryDate(conflictItem.expiryDate || '');
    setMemo(conflictItem.memo || '');
    onClearConflict?.();
  };

  // 競合解決 2: 自分の入力内容のまま最新バージョンで上書き保存
  const handleForceOverwrite = () => {
    if (isNameEmpty || isSaving || !conflictItem) return;
    onSave(item.id, buildPayload(conflictItem.version));
  };

  const handleClearExpiry = () => {
    setExpiryDate('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleCloseModal}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-stock-title"
        className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <h2 id="edit-stock-title" className="text-base font-bold text-slate-800">
                在庫アイテムの編集
              </h2>
              <p className="text-xs text-slate-500">
                詳細情報や管理タイプ、残量ステータスを更新します
              </p>
            </div>
          </div>
          <button
            onClick={handleCloseModal}
            disabled={isSaving}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors disabled:opacity-40 disabled:pointer-events-none"
            title="閉じる"
            type="button"
            aria-label="閉じる"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* 排他制御 409 Conflict 競合バナー */}
          {conflictItem && (
            <div
              data-testid="conflict-banner"
              className="rounded-xl border border-amber-300 bg-amber-50/90 p-4 text-amber-900 shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-amber-900">
                    【排他制御警告】他の端末によって内容が更新されました
                  </h3>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    入力中の内容は保持されています。他端末による最新の変更内容を確認の上、解決方法を選択してください。
                  </p>
                </div>
              </div>

              {/* 他端末の最新データ概要 */}
              <div className="rounded-lg bg-white/90 border border-amber-200 p-3 text-xs space-y-1.5 shadow-xs">
                <div className="font-semibold text-slate-700">他端末による最新の状態：</div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-600">
                  <div>
                    <span className="text-slate-400">品名:</span> {conflictItem.name}
                  </div>
                  <div>
                    <span className="text-slate-400">カテゴリ:</span> {conflictItem.category}
                  </div>
                  <div>
                    <span className="text-slate-400">数量/残量:</span>{' '}
                    {conflictItem.stockType === 'REMAINING_LEVEL' && conflictItem.remainingLevel
                      ? `${REMAINING_LEVEL_CONFIGS[conflictItem.remainingLevel]?.label || conflictItem.remainingLevel} (${conflictItem.unit})`
                      : `${conflictItem.quantity} ${conflictItem.unit}`}
                  </div>
                  <div>
                    <span className="text-slate-400">賞味期限:</span>{' '}
                    {conflictItem.expiryDate || '未設定'}
                  </div>
                </div>
                {conflictItem.memo && (
                  <div className="text-slate-600 pt-1 border-t border-slate-100">
                    <span className="text-slate-400">メモ:</span> {conflictItem.memo}
                  </div>
                )}
              </div>

              {/* 競合解決アクション */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAcceptLatest}
                  disabled={isSaving}
                  className="h-8 text-xs bg-white border-amber-300 text-amber-900 hover:bg-amber-100"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  最新データを取り込む
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleForceOverwrite}
                  disabled={isNameEmpty || isSaving}
                  className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                >
                  自分の入力で上書き保存
                </Button>
              </div>
            </div>
          )}

          {/* 品名 */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              品名 <span className="text-rose-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 牛乳, マヨネーズ, 洗剤"
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

          {/* 管理方法の選択 (個数管理 vs 残量段階管理) */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              管理方法 <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setStockType('QUANTITY');
                  if (unit === '袋' && quantity === 0) {
                    setQuantity(1);
                  }
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  stockType === 'QUANTITY'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Hash className="h-4 w-4 text-emerald-600" />
                個数で管理 (1個, 2本...)
              </button>
              <button
                type="button"
                onClick={() => {
                  setStockType('REMAINING_LEVEL');
                  if (unit === '個') {
                    setUnit('袋');
                  }
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  stockType === 'REMAINING_LEVEL'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Gauge className="h-4 w-4 text-blue-600" />
                残量で管理 (4段階)
              </button>
            </div>
          </div>

          {/* 管理方法に応じた入力欄の切り替え */}
          {stockType === 'QUANTITY' ? (
            /* 個数管理用入力欄 */
            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50/70 rounded-xl border border-slate-200/60">
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
                  placeholder="個, 本, パック"
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
          ) : (
            /* 残量段階管理用入力欄 */
            <div className="space-y-3 p-3 bg-blue-50/40 rounded-xl border border-blue-100">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    現在の残量ステータス (4段階)
                  </label>
                  <span className="text-[11px] text-slate-500">
                    ※「怪しい」「すっからかん」で買い物リスト入り
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
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                          isSelected
                            ? `${cfg.colorClasses.activeButton} border-transparent`
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-sm font-bold">{cfg.label}</span>
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
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  容器・単位の名称
                </label>
                <Input
                  placeholder="袋, 本, ボトル, パック, 箱"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="bg-white max-w-xs"
                />
              </div>
            </div>
          )}

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
                  disabled={isSaving}
                  className="text-[11px] font-medium text-rose-600 hover:text-rose-700 flex items-center gap-0.5 hover:underline disabled:opacity-40"
                >
                  <X className="h-3 w-3" />
                  期限をクリア
                </button>
              )}
            </div>
            <Input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              disabled={isSaving}
            />
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
              onClick={handleCloseModal}
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
