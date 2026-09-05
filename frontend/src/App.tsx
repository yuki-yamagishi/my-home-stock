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
} from 'lucide-react';
import { Header } from './components/layout/Header';
import { PwaInstallBanner } from './components/layout/PwaInstallBanner';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Badge } from './components/ui/badge';
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
import type { StockItem, StockItemInput } from './api/schema';

export function App() {
  const [activeTab, setActiveTab] = useState<'stocks' | 'shopping' | 'expiring'>('stocks');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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
    category: '食品',
    quantity: 1,
    unit: '個',
    minThreshold: 1,
    memo: '',
    expiryDate: '',
  });

  const categories = useMemo(() => {
    const set = new Set<string>();
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
            category: form.category || '食品',
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
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Plus className="h-4 w-4 text-emerald-600" />
              在庫クイック登録
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-6 gap-3">
              <div className="sm:col-span-2">
                <Input
                  placeholder="品名 (例: 牛乳, トイレットペーパー)"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Input
                  placeholder="カテゴリ"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="0"
                  placeholder="数量"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
                  className="w-20"
                />
                <Input
                  placeholder="単位"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="w-16"
                />
              </div>
              <div>
                <Input
                  type="date"
                  placeholder="賞味期限"
                  value={form.expiryDate || ''}
                  onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                />
              </div>
              <div>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || !form.name.trim()}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  追加
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Tab 1: All Stocks */}
        {activeTab === 'stocks' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              {/* Search & Filter */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="品名やメモで検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      selectedCategory === cat
                        ? 'bg-slate-900 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {cat === 'all' ? 'すべて' : cat}
                  </button>
                ))}
              </div>
            </div>

            {isLoadingStocks ? (
              <div className="py-12 text-center text-sm text-slate-500">読み込み中...</div>
            ) : filteredStocks.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500">
                該当する在庫アイテムがありません。上のフォームから登録してください。
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredStocks.map((item) => {
                  const shortage = isShortage(item.quantity, item.minThreshold);
                  const expiry = getExpiryStatus(item.expiryDate);

                  return (
                    <Card
                      key={item.id}
                      className={`relative transition-all hover:shadow-md ${
                        shortage ? 'border-l-4 border-l-rose-500' : ''
                      }`}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs font-medium text-slate-500">
                              {item.category}
                            </span>
                            <h4 className="text-base font-bold text-slate-900 leading-tight">
                              {item.name}
                            </h4>
                          </div>
                          <div className="flex items-center gap-1">
                            {shortage && (
                              <Badge variant="destructive">不足</Badge>
                            )}
                            {expiry.status !== 'none' && (
                              <Badge
                                variant={
                                  expiry.status === 'expired'
                                    ? 'destructive'
                                    : expiry.status === 'warning'
                                    ? 'warning'
                                    : 'outline'
                                }
                              >
                                {expiry.label}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Quantity controls */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-slate-900">
                              {item.quantity}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                              {item.unit}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-1">
                              (下限: {item.minThreshold})
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleConsume(item)}
                              disabled={item.quantity <= 0 || consumeMutation.isPending}
                              className="h-8 w-8 p-0"
                              title="1つ消費"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleAddOne(item)}
                              disabled={updateMutation.isPending}
                              className="h-8 w-8 p-0"
                              title="1つ補充"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(item.id)}
                              disabled={deleteMutation.isPending}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600"
                              title="削除"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
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
                補充が必要なアイテム（現在数量 ≦ 下限閾値）
              </h3>
              <Badge variant="destructive">{shoppingList.length} 件</Badge>
            </div>

            {shoppingList.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500 bg-white rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                不足しているアイテムはありません。すべて十分な在庫があります！
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {shoppingList.map((item) => (
                  <Card key={item.id} className="border-rose-200 bg-rose-50/20">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-rose-600 font-medium">
                          {item.category}
                        </span>
                        <h4 className="text-base font-bold text-slate-900">{item.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          残り: <span className="text-rose-600 font-bold">{item.quantity}</span> / 下限: {item.minThreshold} {item.unit}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddOne(item)}
                        disabled={updateMutation.isPending}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        購入完了 (+1)
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Expiring Warning List */}
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
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleConsume(item)}
                          disabled={item.quantity <= 0 || consumeMutation.isPending}
                        >
                          消費 (-1)
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
export default App;
