import React, { useState } from 'react';
import { UserPlus, X, AlertTriangle } from 'lucide-react';
import { UserRole } from '../../types/security';
import { useSecurity } from '../../context/SecurityContext';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose }) => {
  const { addAccount } = useSecurity();
  const [id, setId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('L2');
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanId = id.trim().toLowerCase();
    if (!/^[a-zA-Z0-9_-]+$/.test(cleanId)) {
      setError('ユーザーIDは英数字、ハイフン、アンダースコアのみ使用可能です');
      return;
    }

    if (!displayName.trim() || !password) {
      setError('すべての必須項目を入力してください');
      return;
    }

    const ok = addAccount({
      id: cleanId,
      displayName: displayName.trim(),
      password,
      role,
      isVerified,
    });

    if (!ok) {
      setError('アカウントの登録に失敗しました（既に存在するID、または権限不足です）');
      return;
    }

    setId('');
    setDisplayName('');
    setPassword('');
    setRole('L2');
    setIsVerified(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-[#2a3550] bg-[#0f1420] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8b96b8] hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-[#5b8cff]/15 border border-[#5b8cff]/30 text-[#5b8cff]">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">新規アカウント登録</h3>
            <p className="text-xs text-[#8b96b8]">内部脅威防止のため適切な権限レベルを設定してください</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-[#ff5c7a]/15 border border-[#ff5c7a]/30 px-3 py-2 text-xs text-[#ff5c7a]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#8b96b8] mb-1">ユーザーID (必須・英数字)</label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="例: sec_operator01"
              className="w-full rounded-lg border border-[#2a3550] bg-[#161d2e] px-3 py-2 text-xs text-white placeholder-[#8b96b8]/50 focus:border-[#5b8cff] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8b96b8] mb-1">表示名 (必須)</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="例: 佐々木 浩二"
              className="w-full rounded-lg border border-[#2a3550] bg-[#161d2e] px-3 py-2 text-xs text-white placeholder-[#8b96b8]/50 focus:border-[#5b8cff] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8b96b8] mb-1">初期パスワード (必須)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワードを入力"
              className="w-full rounded-lg border border-[#2a3550] bg-[#161d2e] px-3 py-2 text-xs text-white placeholder-[#8b96b8]/50 focus:border-[#5b8cff] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8b96b8] mb-1">権限レベル</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full rounded-lg border border-[#2a3550] bg-[#161d2e] px-3 py-2 text-xs text-white focus:border-[#5b8cff] focus:outline-none"
            >
              <option value="L1">L1（閲覧者）：ダッシュボード概要と自身ログのみ閲覧可</option>
              <option value="L2">L2（編集者）：サイト情報追加/編集/削除、低信頼度制限の削除</option>
              <option value="L3">L3（管理者）：全権限、制限適用、アカウント管理</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isVerifiedCheck"
              checked={isVerified}
              onChange={(e) => setIsVerified(e.target.checked)}
              className="w-4 h-4 rounded border-[#2a3550] text-[#5b8cff] focus:ring-0 cursor-pointer"
            />
            <label htmlFor="isVerifiedCheck" className="text-xs text-[#e8ecf6] cursor-pointer">
              アカウントを「検証済み（Verified）」として承認する
            </label>
          </div>
          <p className="text-[11px] text-[#8b96b8] -mt-2">
            ※ 未検証のアカウントが制限をかけた場合、信頼性スコアに-40点のペナルティが課されます。
          </p>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#2a3550] bg-[#161d2e] hover:bg-[#2a3550] text-xs font-semibold text-[#e8ecf6] cursor-pointer"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#5b8cff] to-[#7c5bff] hover:opacity-95 text-xs font-bold text-white shadow-lg cursor-pointer"
            >
              登録する
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
