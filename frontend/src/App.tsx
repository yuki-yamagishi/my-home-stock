import React, { useState, useMemo } from 'react';
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
  X,
} from 'lucide-react';
import { Header } from './components/layout/Header';
import { PwaInstallBanner } from './components/layout/PwaInstallBanner';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Badge } from './components/ui/badge';
import { LoginCard } from './components/auth/LoginCard';
import { FamilyMembersModal } from './components/household/FamilyMembersModal';
import { EditStockModal } from './components/stock/EditStockModal';
import { STOCK_CATEGORIES, DEFAULT_CATEGORY } from './constants/categories';
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
} from './core/stockStatus';
import { ApiError } from './api/client';
import type { StockItem, StockItemInput, AuthUser } from './api/schema';

interface DashboardProps {
  user: AuthUser;
  onOpenMembersModal: () => void;
}

function Dashboard({ user, onOpenMembersModal }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'stocks' | 'shopping' | 'expiring'>('stocks');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);

  // Queries
  const { data: allStocks = [], isLoading: isLoadingStocks } = useStockList();
  const { data: shoppingList = [] } = useShoppingList();
  const { data: expiringList = [] } = useExpiringItems(7);

  // Mutations
  const createMutation = useCreateStock();
  const consumeMutation = useConsumeStock();
  const updateMutation = useUpdateStock();
  const deleteMutation = useDeleteStock();

  // Form State
  const [form, setForm] = useState<StockItemInput>({
    name: '',
    category: DEFAULT_CATEGORY,
    quantity: 1,
    unit: '個',
    minThreshold: 1,
    memo: '',
    expiryDate: '',
  });

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

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    createMutation.mutate(
      {
        ...form,
        expiryDate: form.expiryDate ? form.expiryDate : undefined,
      },
      {
        onSuccess: () => {
          setForm({
            name: '',
            category: form.category || DEFAULT_CATEGORY,
            quantity: 1,
            unit: '個',
            minThreshold: 1,
            memo: '',
            expiryDate: '',
          });
        },
      }
    );
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
        quantity: item.quantity + 1,
        unit: item.unit,
        minThreshold: item.minThreshold,
        memo: item.memo,
        expiryDate: item.expiryDate,
        version: item.version, // Required for optimistic lock!
      },
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('この在庫アイテムを削除してもよろしいですか？')) {
      deleteMutation.mutate(id);
    }
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

      <main className="container mx-auto max-w-5xl flex-1 px-4 py-6 space-y-6">
        {/* Metric Cards */}
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

        {/* Quick Add Form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-600" />
              在庫クイック追加
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-slate-600 block mb-1">
                    品名 <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    placeholder="例: 牛乳, トイレットペーパー"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">
                    カテゴリ
                  </label>
                  <select
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    {STOCK_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">
                    現在数量
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm({ ...form, quantity: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">
                    単位
                  </label>
                  <Input
                    placeholder="個, 本, パック"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">
                    最小閾値 (補充基準)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={form.minThreshold}
                    onChange={(e) =>
                      setForm({ ...form, minThreshold: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-600">
                      賞味・消費期限
                    </label>
                    {form.expiryDate && (
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, expiryDate: '' })}
                        className="text-[11px] font-medium text-rose-600 hover:text-rose-700 flex items-center gap-0.5 hover:underline"
                        title="期限をクリア"
                        aria-label="期限をクリア"
                      >
                        <X className="h-3 w-3" />
                        クリア
                      </button>
                    )}
                  </div>
                  <Input
                    type="date"
                    value={form.expiryDate || ''}
                    onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="メモ (任意: ブランド名、保管場所など)"
                  value={form.memo}
                  onChange={(e) => setForm({ ...form, memo: e.target.value })}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={createMutation.isPending || !form.name.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                >
                  追加する
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Tab 1: Stocks List */}
        {activeTab === 'stocks' && (
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
                  const shortage = isShortage(item.quantity, item.minThreshold);
                  const expiry = getExpiryStatus(item.expiryDate);

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
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-slate-500">
                                {item.category}
                              </span>
                              {shortage && (
                                <Badge variant="destructive">補充が必要</Badge>
                              )}
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
                            <h3 className="text-base font-bold text-slate-900 mt-0.5">
                              {item.name}
                            </h3>
                            {item.memo && (
                              <p className="text-xs text-slate-500 mt-0.5">
                                {item.memo}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
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
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Shopping List */}
        {activeTab === 'shopping' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">
                買い出しが必要なアイテム (最小閾値以下)
              </h3>
              <Badge variant="destructive">{shoppingList.length} 件</Badge>
            </div>

            {shoppingList.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500 bg-white rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                現在、補充が必要な在庫アイテムはありません！
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {shoppingList.map((item) => (
                  <Card key={item.id} className="border-rose-200 bg-rose-50/30">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-500">{item.category}</span>
                        <h4 className="text-base font-bold text-slate-900">
                          {item.name}
                        </h4>
                        <p className="text-xs text-rose-600 font-medium mt-1">
                          現在: {item.quantity} {item.unit} / 補充目安: {item.minThreshold}{' '}
                          {item.unit}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
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
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => handleAddOne(item)}
                        >
                          購入完了 (+1)
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
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
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">{item.category}</span>
                            <Badge
                              variant={expiry.status === 'expired' ? 'destructive' : 'warning'}
                            >
                              {expiry.label}
                            </Badge>
                          </div>
                          <h4 className="text-base font-bold text-slate-900 mt-1">
                            {item.name}
                          </h4>
                          <p className="text-xs text-slate-500">
                            数量: {item.quantity} {item.unit} | 期限日: {item.expiryDate}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
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
                            disabled={item.quantity <= 0 || consumeMutation.isPending}
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
      </main>
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
