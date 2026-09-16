import { Package2, Activity, ShoppingBag, Users, LogOut } from 'lucide-react';
import { useHealth } from '../../hooks/useStockItems';
import { useLogout } from '../../hooks/useAuth';
import { Badge } from '../ui/badge';
import type { AuthUser } from '../../api/schema';

interface HeaderProps {
  activeTab: 'stocks' | 'shopping' | 'expiring';
  setActiveTab: (tab: 'stocks' | 'shopping' | 'expiring') => void;
  shoppingCount: number;
  expiringCount: number;
  user?: AuthUser | null;
  onOpenMembersModal?: () => void;
}

export function Header({
  activeTab,
  setActiveTab,
  shoppingCount,
  expiringCount,
  user,
  onOpenMembersModal,
}: HeaderProps) {
  const { data: health, isSuccess } = useHealth();
  const logoutMutation = useLogout();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        {/* Brand */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* デスクトップ用ブランド表示 */}
          <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shrink-0">
            <Package2 className="h-6 w-6" />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                MyHomeStock
              </h1>
              {user?.householdName && (
                <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
                  {user.householdName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  isSuccess && health?.status === 'UP' ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'
                }`}
              />
              <span>{isSuccess && health?.status === 'UP' ? 'API 稼働中' : '接続待機'}</span>
            </div>
          </div>

          {/* モバイル用コンパクト表示 (世帯名優先 & 極小アイコン) */}
          <div className="flex sm:hidden items-center gap-1.5 min-w-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm shrink-0">
              <Package2 className="h-4 w-4" />
            </div>
            {user?.householdName ? (
              <span className="text-sm font-bold text-slate-900 truncate max-w-[140px]">
                {user.householdName}
              </span>
            ) : (
              <span className="text-sm font-bold text-slate-900">
                MyHomeStock
              </span>
            )}
            <span
              title={isSuccess && health?.status === 'UP' ? 'API 稼働中' : '接続待機'}
              className={`inline-block h-1.5 w-1.5 rounded-full shrink-0 ${
                isSuccess && health?.status === 'UP' ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'
              }`}
            >
              <span className="sr-only">
                {isSuccess && health?.status === 'UP' ? 'API 稼働中' : '接続待機'}
              </span>
            </span>
          </div>
        </div>

        {/* Navigation Tabs (デスクトップのみヘッダーに配置。モバイルはBottomNavへ移行) */}
        {user && (
          <nav aria-label="メインナビゲーション" className="hidden sm:flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            <button
              onClick={() => setActiveTab('stocks')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'stocks'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package2 className="h-4 w-4" />
              <span>在庫</span>
            </button>
            <button
              onClick={() => setActiveTab('shopping')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'shopping'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              <span>買い物</span>
              {shoppingCount > 0 && (
                <Badge variant="destructive" className="h-4 px-1.5 text-[10px]">
                  {shoppingCount}
                </Badge>
              )}
            </button>
            <button
              onClick={() => setActiveTab('expiring')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'expiring'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="h-4 w-4" />
              <span>期限</span>
              {expiringCount > 0 && (
                <Badge variant="warning" className="h-4 px-1.5 text-[10px]">
                  {expiringCount}
                </Badge>
              )}
            </button>
          </nav>
        )}

        {/* User & Household Controls (絶対に見切れない最適化配置) */}
        {user && (
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {onOpenMembersModal && (
              <button
                type="button"
                onClick={onOpenMembersModal}
                title="世帯メンバー・招待管理"
                aria-label="世帯メンバー・招待管理"
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
              >
                <Users className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-emerald-600" />
                <span className="hidden md:inline">世帯管理</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 sm:gap-2 border-l border-slate-200 pl-1.5 sm:pl-2">
              {user.pictureUrl ? (
                <img
                  src={user.pictureUrl}
                  alt={user.displayName || user.email}
                  className="h-7 w-7 sm:h-8 sm:w-8 rounded-full border border-slate-200 object-cover"
                />
              ) : (
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                  {(user.displayName || user.email)[0].toUpperCase()}
                </div>
              )}

              <button
                type="button"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                title="ログアウト"
                aria-label="ログアウト"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
