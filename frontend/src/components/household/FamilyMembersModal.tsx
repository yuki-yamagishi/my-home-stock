import { useState, type FormEvent } from 'react';
import { X, UserPlus, Users, CheckCircle2, AlertCircle, Shield, User } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { useHouseholdMembers, useInviteMember } from '../../hooks/useHousehold';

interface FamilyMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  householdName?: string;
  isOwner?: boolean;
}

export function FamilyMembersModal({
  isOpen,
  onClose,
  householdName,
  isOwner = true,
}: FamilyMembersModalProps) {
  const [email, setEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: members = [], isLoading } = useHouseholdMembers(isOpen);
  const inviteMutation = useInviteMember();

  if (!isOpen) return null;

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSuccessMessage(null);
    try {
      await inviteMutation.mutateAsync({
        email: email.trim(),
        role: 'MEMBER',
      });
      setSuccessMessage(`「${email}」を世帯メンバーに招待しました`);
      setEmail('');
    } catch {
      // エラーは inviteMutation.error から表示
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                世帯メンバー管理
              </h2>
              <p className="text-xs text-slate-500">
                {householdName || '所属世帯'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Member List */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            現在のメンバー一覧 ({members.length})
          </h3>

          {isLoading ? (
            <div className="py-6 text-center text-sm text-slate-400">
              メンバー情報を取得中...
            </div>
          ) : (
            <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600/10 text-emerald-700">
                      {m.role === 'OWNER' ? (
                        <Shield className="h-4 w-4" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-800">
                          {m.displayName || m.email}
                        </span>
                        <Badge
                          variant={m.role === 'OWNER' ? 'default' : 'outline'}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {m.role === 'OWNER' ? '管理者' : 'メンバー'}
                        </Badge>
                      </div>
                      <span className="text-xs text-slate-400">{m.email}</span>
                    </div>
                  </div>

                  <div>
                    <span
                      className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        m.status === 'JOINED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {m.status === 'JOINED' ? '参加中' : '招待中 (未ログイン)'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invite Form */}
        {isOwner ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-emerald-600" />
              <h4 className="text-sm font-semibold text-slate-800">
                家族メンバーを招待
              </h4>
            </div>
            <p className="text-xs text-slate-500">
              家族の Google メールアドレスを入力して招待すると、その家族がログインした際に同じ世帯の在庫を共有できます。
            </p>

            <form onSubmit={handleInvite} className="space-y-3">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="family@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white text-sm"
                  required
                />
                <Button
                  type="submit"
                  disabled={inviteMutation.isPending || !email.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                >
                  {inviteMutation.isPending ? '招待中...' : '招待する'}
                </Button>
              </div>

              {successMessage && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 p-2 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {inviteMutation.isError && (
                <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 p-2 rounded-lg">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{inviteMutation.error?.message || '招待に失敗しました'}</span>
                </div>
              )}
            </form>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-500 text-center">
            ※ 家族メンバーの招待は世帯管理者（オーナー）のみが行えます。
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-slate-600"
          >
            閉じる
          </Button>
        </div>
      </div>
    </div>
  );
}
