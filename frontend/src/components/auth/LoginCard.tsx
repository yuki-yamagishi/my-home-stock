import { Package2, ShieldCheck, Users, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

interface LoginCardProps {
  onLogin: () => void;
  isLoading?: boolean;
}

export function LoginCard({ onLogin, isLoading }: LoginCardProps) {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md shadow-xl border-slate-200">
        <CardHeader className="text-center space-y-3 pb-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg">
            <Package2 className="h-9 w-9" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
              MyHomeStock
            </CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              家族でスマートに共有する、自宅在庫・買い物管理
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-3 rounded-xl bg-slate-50 p-4 text-xs sm:text-sm text-slate-600 border border-slate-100">
            <div className="flex items-center gap-2.5">
              <Users className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>世帯単位で家族とリアルタイムに在庫を共有</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>賞味期限切れ・在庫不足を自動でアラート通知</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Google アカウントによる安全で確実なデータ分離</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              type="button"
              onClick={onLogin}
              disabled={isLoading}
              className="w-full h-12 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-medium shadow-sm transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              {/* Google G Logo SVG */}
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Google アカウントでログイン</span>
            </Button>
            <p className="text-center text-[11px] text-slate-400">
              ※ 初回ログイン時に世帯が自動的に初期化されます
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
