import { WifiOff } from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export function formatOfflineBannerText(lastSyncedAt?: Date | null): string {
  if (!lastSyncedAt) {
    return '⚠️ オフライン表示中 - 電波復帰時に自動更新されます';
  }
  const h = String(lastSyncedAt.getHours()).padStart(2, '0');
  const m = String(lastSyncedAt.getMinutes()).padStart(2, '0');
  return `⚠️ オフライン表示中 (最終同期: ${h}:${m}) - 電波復帰時に自動更新されます`;
}

interface OfflineBannerProps {
  lastSyncedAt?: Date | null;
}

export function OfflineBanner({ lastSyncedAt }: OfflineBannerProps) {
  const { isOffline } = useNetworkStatus();

  if (!isOffline) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-amber-500 text-white text-xs sm:text-sm font-medium py-2 px-4 shadow-sm flex items-center justify-center gap-2 sticky top-0 z-40 transition-all animate-in fade-in duration-200"
    >
      <WifiOff className="h-4 w-4 shrink-0 animate-pulse" />
      <span>{formatOfflineBannerText(lastSyncedAt)}</span>
    </div>
  );
}
