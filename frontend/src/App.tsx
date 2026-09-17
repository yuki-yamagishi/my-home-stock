import { useState, useMemo } from 'react';
import {
  Plus,
  Minus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  Search,
  Pencil,
  RotateCcw,
} from 'lucide-react';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { PwaInstallBanner } from './components/layout/PwaInstallBanner';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { Input } from './components/ui/input';
import { Badge } from './components/ui/badge';
import { LoginCard } from './components/auth/LoginCard';
import { FamilyMembersModal } from './components/household/FamilyMembersModal';
import { EditStockModal } from './components/stock/EditStockModal';
import { CreateStockModal } from './components/stock/CreateStockModal';
import { STOCK_CATEGORIES } from './constants/categories';
import { useAuth } from './hooks/useAuth';
import {
  useStockList,
  useShoppingList,
  useExpiringItems,
  useCreateStock,
  useConsumeStock,
  useUpdateStock,
  useDeleteStock,
} from './hooks/useStockItems';
import {
  isShortage,
  getExpiryStatus,
  calculateStockSummary,
  REMAINING_LEVEL_ORDER,
  REMAINING_LEVEL_CONFIGS,
  remainingLevelToQuantity,
} from './core/stockStatus';
import {
  groupShoppingListByCategory,
  getShoppingListCategoryCounts,
} from './core/shoppingList';
import { ApiError } from './api/client';
import type { StockItem, StockItemInput, AuthUser, RemainingLevel } from './api/schema';

interface DashboardProps {
  user: AuthUser;
  onOpenMembersModal: () => void;
}

function Dashboard({ user, onOpenMembersModal }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'stocks' | 'shopping' | 'expiring'>('stocks');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedShoppingCategory, setSelectedShoppingCategory] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Queries
  const { data: allStocks = [], isLoading: isLoadingStocks } = useStockList();
  const { data: shoppingList = [] } = useShoppingList();
  const { data: expiringList = [] } = useExpiringItems(7);

  // Mutations
  const createMutation = useCreateStock();
  const consumeMutation = useConsumeStock();
  const updateMutation = useUpdateStock();
  const deleteMutation = useDeleteStock();

  const categories = useMemo(() => {
    const set = new Set<string>(STOCK_CATEGORIES);
    allStocks.forEach((s) => s.category && set.add(s.category));
    return ['all', ...Array.from(set)];
  }, [allStocks]);

  const summary = useMemo(() => {
    return calculateStockSummary(allStocks);
  }, [allStocks]);

  const filteredStocks = useMemo(() => {
    return allStocks.filter((item) => {
      const matchQuery =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.memo && item.memo.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      return matchQuery && matchCat;
    });
  }, [allStocks, searchQuery, selectedCategory]);

  const shoppingCategoryCounts = useMemo(() => {
    return getShoppingListCategoryCounts(shoppingList);
  }, [shoppingList]);

  const groupedShoppingList = useMemo(() => {
    return groupShoppingListByCategory(shoppingList, selectedShoppingCategory);
  }, [shoppingList, selectedShoppingCategory]);

  const handleCreateSubmit = (payload: StockItemInput, resetForm: () => void) => {
    createMutation.mutate(payload, {
      onSuccess: () => {
        resetForm();
        setIsCreateOpen(false);
      },
    });
  };

  const handleConsume = (item: StockItem) => {
    consumeMutation.mutate({ id: item.id, amount: 1 });
  };

  const handleAddOne = (item: StockItem) => {
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
        version: item.version, // Required for optimistic lock!
      },
    });
  };

  const handleSetRemainingLevel = (item: StockItem, newLevel: RemainingLevel) => {
    if (updateMutation.isPending) return;
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
    if (confirm('この在庫アイテムを削除してもよろしいですか？')) {
      deleteMutation.mutate(id);
    }
  };

  const renderShoppingCard = (item: StockItem) => {
    const isLevel = item.stockType === 'REMAINING_LEVEL';
    const levelCfg = isLevel && item.remainingLevel
      ? REMAINING_LEVEL_CONFIGS[item.remainingLevel]
      : null;

    return (
      <Card key={item.id} className="border-rose-200 bg-rose-50/30">
        <CardContent className="p-4 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">{item.category}</span>
              {isLevel && levelCfg && (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${levelCfg.colorClasses.badge}`}
                >
                  {levelCfg.label} ({levelCfg.subtext})
                </span>
              )}
            </div>
            <h4 className="text-base font-bold text-slate-900 mt-0.5">
              {item.name}
            </h4>
            <p className="text-xs text-rose-600 font-medium mt-1">
              {isLevel && levelCfg
                ? `残量: ${levelCfg.label} / 補充を推奨`
                : `現在: ${item.quantity} ${item.unit} / 補充目安: ${item.minThreshold} ${item.unit}`}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2.5 text-xs text-slate-600 hover:text-slate-900 border-slate-200"
              onClick={() => setEditingItem(item)}
              title="詳細編集"
              aria-label={`${item.name}を編集`}
            >
              <Pencil className="h-3.5 w-3.5 mr-1" />
              編集
            </Button>
            {isLevel ? (
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shadow-sm"
                onClick={() => handleSetRemainingLevel(item, 'FULL')}
                disabled={updateMutation.isPending}
                title="残量を「十分」に復帰させます"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                補充完了 (十分)
              </Button>
            ) : (
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => handleAddOne(item)}
              >
                購入完了 (+1)
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PwaInstallBanner />
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        shoppingCount={summary.shortageCount}
        expiringCount={summary.expiringCount + summary.expiredCount}
        user={user}
        onOpenMembersModal={onOpenMembersModal}
      />

      <main className="container mx-auto max-w-5xl flex-1 px-4 py-6 pb-28 sm:pb-8 space-y-6">
        {/* Tab 1: Stocks List */}
        {activeTab === 'stocks' && (
          <div className="space-y-6">
            {/* Metric Cards (在庫タブでのみ表示し、買い物・期限タブの一覧性を最大化) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500">総登録品目</p>
                    <p className="text-2xl font-bold text-slate-900">{summary.totalItems}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600">
                    <Layers className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>

              <Card
                className={summary.shortageCount > 0 ? 'border-rose-200 bg-rose-50/50' : ''}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-rose-600">買い物候補 (不足)</p>
                    <p className="text-2xl font-bold text-rose-700">{summary.shortageCount}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-100 text-rose-600">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>

              <Card
                className={summary.expiringCount > 0 ? 'border-amber-200 bg-amber-50/50' : ''}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-amber-600">期限間近 (7日以内)</p>
                    <p className="text-2xl font-bold text-amber-700">{summary.expiringCount}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600">
                    <Calendar className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>

              <Card
                className={summary.expiredCount > 0 ? 'border-rose-300 bg-rose-100/50' : ''}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-rose-800">期限超過</p>
                    <p className="text-2xl font-bold text-rose-900">{summary.expiredCount}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-200 text-rose-800">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="在庫アイテムを検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white"
                />
              </div>

              {/* Controls (Category filter & Add button) */}
              <div className="flex items-center gap-2">
                {/* Category Filter */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                        selectedCategory === cat
                          ? 'bg-slate-900 text-white'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat === 'all' ? 'すべて' : cat}
                    </button>
                  ))}
                </div>

                {/* 在庫追加ボタン (デスクトップおよびタブ上部用: モバイルは右下FABに一本化) */}
                <Button
                  type="button"
                  onClick={() => setIsCreateOpen(true)}
                  className="hidden sm:flex bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 items-center gap-1.5 shadow-sm text-xs sm:text-sm px-3 py-1.5 h-9"
                >
                  <Plus className="h-4 w-4" />
                  <span>在庫を追加</span>
                </Button>
              </div>
            </div>

            {isLoadingStocks ? (
              <div className="py-12 text-center text-slate-500">
                在庫データを読み込み中...
              </div>
            ) : filteredStocks.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500 bg-white rounded-xl border border-dashed border-slate-200">
                該当する在庫アイテムがありません。
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredStocks.map((item) => {
                  const isLevel = item.stockType === 'REMAINING_LEVEL';
                  const shortage = isShortage(
                    item.quantity,
                    item.minThreshold,
                    item.stockType || 'QUANTITY',
                    item.remainingLevel
                  );
                  const expiry = getExpiryStatus(item.expiryDate);
                  const levelCfg = isLevel && item.remainingLevel
                    ? REMAINING_LEVEL_CONFIGS[item.remainingLevel]
                    : null;

                  return (
                    <Card
                      key={item.id}
                      className={`transition-all ${
                        shortage
                          ? 'border-rose-300 bg-rose-50/20'
                          : 'hover:border-slate-300'
                      }`}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-xs font-medium text-slate-500">
                                {item.category}
                              </span>

                              {/* 残量管理バッジ または 補充警告バッジ */}
                              {isLevel && levelCfg ? (
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${levelCfg.colorClasses.badge}`}
                                >
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${levelCfg.colorClasses.dot}`}
                                  />
                                  残量: {levelCfg.label}
                                </span>
                              ) : shortage ? (
                                <Badge variant="destructive">補充が必要</Badge>
                              ) : null}

                              {/* 期限バッジ */}
                              {(expiry.status === 'expired' || expiry.status === 'warning') && (
                                <Badge
                                  variant={
                                    expiry.status === 'expired'
                                      ? 'destructive'
                                      : 'warning'
                                  }
                                >
                                  {expiry.label}
                                </Badge>
                              )}
                            </div>
                            <h3 className="text-base font-bold text-slate-900 mt-1">
                              {item.name}
                            </h3>
                            {item.memo && (
                              <p className="text-xs text-slate-500 mt-0.5">
                                {item.memo}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => setEditingItem(item)}
                              className="text-slate-400 hover:text-emerald-600 p-1 transition-colors"
                              title="詳細編集"
                              aria-label={`${item.name}を編集`}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                              title="削除"
                              aria-label={`${item.name}を削除`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* 残量管理アイテムのワンタップ操作エリア */}
                        {isLevel ? (
                          <div className="border-t border-slate-100 pt-2.5 space-y-2">
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span>
                                残量ステータス ({item.unit || '袋'})
                                {item.expiryDate && (
                                  <span className="ml-2 text-slate-400">
                                    期限: {item.expiryDate}
                                  </span>
                                )}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-1.5 text-[11px] text-slate-500 hover:text-slate-900"
                                onClick={() => handleConsume(item)}
                                disabled={
                                  consumeMutation.isPending ||
                                  item.remainingLevel === 'EMPTY'
                                }
                                title="残量を1段階下げる"
                              >
                                <Minus className="h-3 w-3 mr-0.5" />
                                1段階消費
                              </Button>
                            </div>

                            {/* 4段階クイック切り替えボタン */}
                            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100/80 rounded-xl">
                              {REMAINING_LEVEL_ORDER.slice().reverse().map((lvl) => {
                                const cfg = REMAINING_LEVEL_CONFIGS[lvl];
                                const isCurrent = item.remainingLevel === lvl;
                                return (
                                  <button
                                    key={lvl}
                                    type="button"
                                    onClick={() => handleSetRemainingLevel(item, lvl)}
                                    disabled={updateMutation.isPending}
                                    className={`py-1 px-1 rounded-lg text-xs font-bold transition-all text-center ${
                                      isCurrent
                                        ? `${cfg.colorClasses.activeButton}`
                                        : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                                    title={`${item.name}の残量を「${cfg.label}」にする`}
                                  >
                                    {cfg.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          /* 個数管理アイテムの操作エリア */
                          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                            <div className="text-xs text-slate-500">
                              基準: {item.minThreshold} {item.unit}
                              {item.expiryDate && (
                                <span className="ml-2 text-slate-400">
                                  期限: {item.expiryDate}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-slate-900">
                                {item.quantity}
                                <span className="text-xs font-normal text-slate-500 ml-1">
                                  {item.unit}
                                </span>
                              </span>

                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleConsume(item)}
                                  disabled={item.quantity <= 0 || consumeMutation.isPending}
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleAddOne(item)}
                                  disabled={updateMutation.isPending}
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

        {/* Tab 2: Shopping List */}
        {activeTab === 'shopping' && (
          <div className="space-y-4">
            {/* Header & Desktop Add Button */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-700">
                  買い出しが必要なアイテム (不足・残りわずか)
                </h3>
                <Badge variant="destructive">{shoppingList.length} 件</Badge>
              </div>
              <Button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="hidden sm:flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 shadow-sm text-xs px-3 py-1.5 h-8"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>在庫を追加</span>
              </Button>
            </div>

            {/* Shopping Category Filter (Pills with count badges) */}
            {shoppingList.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setSelectedShoppingCategory('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 flex items-center gap-1.5 transition-colors ${
                    selectedShoppingCategory === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>すべて</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      selectedShoppingCategory === 'all'
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {shoppingCategoryCounts.all}
                  </span>
                </button>
                {STOCK_CATEGORIES.map((cat) => {
                  const count = shoppingCategoryCounts[cat] || 0;
                  const isSelected = selectedShoppingCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedShoppingCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 flex items-center gap-1.5 transition-colors ${
                        isSelected
                          ? 'bg-slate-900 text-white'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{cat}</span>
                      {count > 0 && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                            isSelected
                              ? 'bg-rose-500 text-white'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Empty State: Whole Shopping List */}
            {shoppingList.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500 bg-white rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                現在、補充が必要な在庫アイテムはありません！
              </div>
            ) : selectedShoppingCategory !== 'all' && (groupedShoppingList[0]?.count ?? 0) === 0 ? (
              /* Empty State: Filtered Category has 0 items */
              <div className="py-12 text-center text-sm text-slate-500 bg-white rounded-xl border border-dashed border-slate-200 space-y-3">
                <p className="text-slate-600 font-medium">
                  「{selectedShoppingCategory}」には現在、補充が必要なアイテムはありません。
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedShoppingCategory('all')}
                  className="text-xs"
                >
                  すべての買い物候補を表示
                </Button>
              </div>
            ) : selectedShoppingCategory !== 'all' ? (
              /* Single Category Filtered View */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {groupedShoppingList[0]?.items.map(renderShoppingCard)}
              </div>
            ) : (
              /* Grouped by Category View ('all') */
              <div className="space-y-6">
                {groupedShoppingList.map((group) => (
                  <div key={group.category} className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                      <h4 className="text-sm font-bold text-slate-800">
                        {group.category}
                      </h4>
                      <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
                        {group.count} 件
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {group.items.map(renderShoppingCard)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Expiring Items */}
        {activeTab === 'expiring' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">
                賞味・消費期限が近いアイテム (7日以内 / 期限切れ)
              </h3>
              <Badge variant="warning">{expiringList.length} 件</Badge>
            </div>

            {expiringList.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500 bg-white rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                直近7日以内に期限を迎えるアイテムはありません。
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {expiringList.map((item) => {
                  const isLevel = item.stockType === 'REMAINING_LEVEL';
                  const levelCfg = isLevel && item.remainingLevel
                    ? REMAINING_LEVEL_CONFIGS[item.remainingLevel]
                    : null;
                  const expiry = getExpiryStatus(item.expiryDate);

                  return (
                    <Card
                      key={item.id}
                      className={
                        expiry.status === 'expired'
                          ? 'border-rose-300 bg-rose-50/30'
                          : 'border-amber-300 bg-amber-50/30'
                      }
                    >
                      <CardContent className="p-4 flex items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">{item.category}</span>
                            <Badge
                              variant={expiry.status === 'expired' ? 'destructive' : 'warning'}
                            >
                              {expiry.label}
                            </Badge>
                            {isLevel && levelCfg && (
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${levelCfg.colorClasses.badge}`}
                              >
                                {levelCfg.label}
                              </span>
                            )}
                          </div>
                          <h4 className="text-base font-bold text-slate-900 mt-1">
                            {item.name}
                          </h4>
                          <p className="text-xs text-slate-500">
                            {isLevel && levelCfg
                              ? `残量: ${levelCfg.label} (${item.unit || '袋'}) | 期限日: ${item.expiryDate}`
                              : `数量: ${item.quantity} ${item.unit} | 期限日: ${item.expiryDate}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2.5 text-xs text-slate-600 hover:text-slate-900 border-slate-200"
                            onClick={() => setEditingItem(item)}
                            title="詳細編集"
                            aria-label={`${item.name}を編集`}
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1" />
                            編集
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleConsume(item)}
                            disabled={
                              (isLevel ? item.remainingLevel === 'EMPTY' : item.quantity <= 0) ||
                              consumeMutation.isPending
                            }
                          >
                            消費 (-1)
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Detail Edit Modal */}
        <EditStockModal
          item={editingItem}
          isOpen={editingItem !== null}
          onClose={() => setEditingItem(null)}
          onSave={(id, data) => {
            updateMutation.mutate(
              { id, data },
              {
                onSuccess: () => {
                  setEditingItem(null);
                },
                onError: (error) => {
                  // 409 Conflict (楽観的排他制御競合) 発生時は古い version を保持したモーダルを閉じ、
                  // 再取得された最新一覧をユーザーに確認させる（無限競合ループを防止）
                  if (error instanceof ApiError && error.status === 409) {
                    setEditingItem(null);
                  }
                },
              }
            );
          }}
          isSaving={updateMutation.isPending}
        />

        {/* Create Stock Modal */}
        <CreateStockModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreateSubmit}
          isSubmitting={createMutation.isPending}
        />
      </main>

      {/* モバイル専用 FAB (フローティングアクションボタン) */}
      <button
        type="button"
        onClick={() => setIsCreateOpen(true)}
        title="在庫アイテムを追加"
        aria-label="在庫アイテムを追加"
        className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] z-30 sm:hidden flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xl shadow-emerald-900/30 hover:bg-emerald-700 active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-emerald-300"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* モバイル専用 ボトムナビゲーションバー */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        shoppingCount={summary.shortageCount}
        expiringCount={summary.expiringCount + summary.expiredCount}
      />
    </div>
  );
}

export function App() {
  const { user, isAuthenticated, isLoading, loginWithGoogle } = useAuth();
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">認証情報を確認中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <PwaInstallBanner />
        <Header
          activeTab="stocks"
          setActiveTab={() => {}}
          shoppingCount={0}
          expiringCount={0}
        />
        <main className="container mx-auto max-w-5xl flex-1 px-4">
          <LoginCard onLogin={loginWithGoogle} />
        </main>
      </div>
    );
  }

  return (
    <>
      <Dashboard
        user={user}
        onOpenMembersModal={() => setIsMembersModalOpen(true)}
      />
      <FamilyMembersModal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        householdName={user.householdName}
        isOwner={user.role === 'OWNER'}
      />
    </>
  );
}

export default App;
