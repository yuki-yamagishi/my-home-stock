import { Package2, Activity, ShoppingBag } from 'lucide-react';
import { useHealth } from '../../hooks/useStockItems';
import { Badge } from '../ui/badge';

interface HeaderProps {
  activeTab: 'stocks' | 'shopping' | 'expiring';
  setActiveTab: (tab: 'stocks' | 'shopping' | 'expiring') => void;
  shoppingCount: number;
  expiringCount: number;
}

export function Header({
  activeTab,
  setActiveTab,
  shoppingCount,
  expiringCount,
}: HeaderProps) {
  const { data: health, isSuccess } = useHealth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md">
            <Package2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">
              MyHomeStock
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  isSuccess && health?.status === 'UP' ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'
                }`}
              />
              <span>{isSuccess && health?.status === 'UP' ? 'API 稼働中' : '接続待機'}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          <button
            onClick={() => setActiveTab('stocks')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'stocks'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package2 className="h-4 w-4" />
            <span>在庫一覧</span>
          </button>
          <button
            onClick={() => setActiveTab('shopping')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'shopping'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            <span>買い物リスト</span>
            {shoppingCount > 0 && (
              <Badge variant="destructive" className="h-4 px-1.5 text-[10px]">
                {shoppingCount}
              </Badge>
            )}
          </button>
          <button
            onClick={() => setActiveTab('expiring')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'expiring'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>期限注意</span>
            {expiringCount > 0 && (
              <Badge variant="warning" className="h-4 px-1.5 text-[10px]">
                {expiringCount}
              </Badge>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
