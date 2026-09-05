import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '../ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!deferredPrompt || isDismissed) {
    return null;
  }

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="bg-emerald-700 text-white px-4 py-2.5 shadow-md">
      <div className="container mx-auto max-w-5xl flex items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <Download className="h-4 w-4 shrink-0 text-emerald-200" />
          <span>ホーム画面に追加して、オフラインでも使える PWA アプリとしてインストールできます。</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleInstall}
            className="bg-white text-emerald-800 hover:bg-emerald-50 h-7 text-xs px-2.5"
          >
            インストール
          </Button>
          <button
            onClick={() => setIsDismissed(true)}
            className="text-emerald-200 hover:text-white p-1"
            aria-label="閉じる"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
