import { Package2, ShoppingBag, Activity } from 'lucide-react';
import { Badge } from '../ui/badge';

interface BottomNavProps {
  activeTab: 'stocks' | 'shopping' | 'expiring';
  setActiveTab: (tab: 'stocks' | 'shopping' | 'expiring') => void;
  shoppingCount: number;
  expiringCount: number;
}

export function BottomNav({
  activeTab,
  setActiveTab,
  shoppingCount,
  expiringCount,
}: BottomNavProps) {
  return (
    <nav
      aria-label="モバイルナビゲーション"
      className="fixed bottom-0 left-0 right-0 z-40 sm:hidden border-t border-slate-200 bg-white/95 backdrop-blur-md px-3 pt-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] shadow-lg shadow-slate-900/10"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* 在庫タブ */}
        <button
          type="button"
          onClick={() => setActiveTab('stocks')}
          className={`flex flex-1 flex-col items-center justify-center py-1 rounded-lg transition-colors ${
            activeTab === 'stocks'
              ? 'text-emerald-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <Package2 className="h-5 w-5" />
          </div>
          <span className="text-[11px] mt-0.5">在庫</span>
        </button>

        {/* 買い物リストタブ */}
        <button
          type="button"
          onClick={() => setActiveTab('shopping')}
          className={`flex flex-1 flex-col items-center justify-center py-1 rounded-lg transition-colors ${
            activeTab === 'shopping'
              ? 'text-emerald-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <ShoppingBag className="h-5 w-5" />
            {shoppingCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1.5 -right-3 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center font-bold"
              >
                {shoppingCount > 99 ? '99+' : shoppingCount}
              </Badge>
            )}
          </div>
          <span className="text-[11px] mt-0.5">買い物</span>
        </button>

        {/* 期限間近タブ */}
        <button
          type="button"
          onClick={() => setActiveTab('expiring')}
          className={`flex flex-1 flex-col items-center justify-center py-1 rounded-lg transition-colors ${
            activeTab === 'expiring'
              ? 'text-emerald-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <Activity className="h-5 w-5" />
            {expiringCount > 0 && (
              <Badge
                variant="warning"
                className="absolute -top-1.5 -right-3 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center font-bold"
              >
                {expiringCount > 99 ? '99+' : expiringCount}
              </Badge>
            )}
          </div>
          <span className="text-[11px] mt-0.5">期限</span>
        </button>
      </div>
    </nav>
  );
}
