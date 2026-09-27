import React, { useState } from 'react';
import { Shield, Key, Lock, User, AlertCircle, CheckCircle, Radio } from 'lucide-react';
import { useSecurity, MASTER_KEY } from '../context/SecurityContext';
import { RemoteRecoveryModal } from './modals/RemoteRecoveryModal';

export const LoginModal: React.FC = () => {
  const { login } = useSecurity();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRemoteRecoveryOpen, setIsRemoteRecoveryOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedback(null);

    setTimeout(() => {
      const res = login(userId, password);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
      setIsLoading(false);
    }, 250);
  };

  const handleFillDemo = (id: string, pass: string) => {
    setUserId(id);
    setPassword(pass);
    setFeedback(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0e1a]/95 backdrop-blur-md p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#2a3550] bg-[#0f1420] p-8 shadow-2xl">
        {/* Glow accent */}
        <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#5b8cff]/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-[#7c5bff]/10 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#5b8cff] to-[#7c5bff] shadow-lg shadow-[#5b8cff]/20 text-2xl">
            🛡️
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            🛡️ サイト管理ダッシュボード
          </h2>
          <div className="text-xs font-semibold text-[#5b8cff] mt-0.5">
            Multi-Layer Security (MLSMD)
          </div>
          <p className="text-xs text-[#8b96b8] mt-1">
            未登録IDの侵入遮断・改ざん防止ログ・多層復旧システム
          </p>
        </div>

        {/* Feedback Message */}
        {feedback && (
          <div
            className={`mb-5 flex items-center gap-2.5 rounded-lg px-4 py-3 text-xs font-semibold ${
              feedback.type === 'success'
                ? 'bg-[#3ddc97]/15 border border-[#3ddc97]/40 text-[#3ddc97]'
                : 'bg-[#ff5c7a]/15 border border-[#ff5c7a]/40 text-[#ff5c7a]'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#8b96b8] mb-1.5">
              ユーザーID
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-[#8b96b8]" />
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="例: admin"
                className="w-full rounded-lg border border-[#2a3550] bg-[#161d2e] pl-9 pr-3 py-2 text-xs text-white placeholder-[#8b96b8]/50 focus:border-[#5b8cff] focus:outline-none focus:ring-1 focus:ring-[#5b8cff]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8b96b8] mb-1.5">
              パスワード または マスターキー
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-[#8b96b8]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワードまたはマスターキー"
                className="w-full rounded-lg border border-[#2a3550] bg-[#161d2e] pl-9 pr-3 py-2 text-xs text-white placeholder-[#8b96b8]/50 focus:border-[#5b8cff] focus:outline-none focus:ring-1 focus:ring-[#5b8cff]"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#5b8cff] to-[#7c5bff] py-2.5 text-xs font-bold text-white shadow-lg shadow-[#5b8cff]/25 hover:opacity-95 active:scale-[0.99] transition cursor-pointer"
          >
            <Key className="w-4 h-4" />
            <span>{isLoading ? '認証中...' : 'セキュアログイン'}</span>
          </button>
        </form>

        {/* Remote Recovery Route Access Button */}
        <div className="mt-4 pt-3.5 border-t border-[#2a3550]">
          <button
            type="button"
            onClick={() => setIsRemoteRecoveryOpen(true)}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#ff5c7a]/60 bg-gradient-to-r from-[#ff5c7a]/25 via-[#ffb547]/20 to-[#ff5c7a]/25 py-2.5 px-3 text-xs font-extrabold text-white hover:border-[#ff5c7a] hover:bg-[#ff5c7a]/35 transition cursor-pointer shadow-lg shadow-[#ff5c7a]/20 group"
          >
            <Radio className="w-4 h-4 text-[#ff5c7a] animate-pulse group-hover:scale-110 transition-transform" />
            <span>🚨 画面ロック時：検証用ルートから遠隔復旧</span>
          </button>
          <p className="text-[10px] text-center text-[#8b96b8] mt-1.5">
            画面ロック・制限下でも安全な検証トンネルを確立し、バックドアを迅速無効化します
          </p>
        </div>

        {/* Demo Credentials Box */}
        <div className="mt-4 rounded-xl border border-[#2a3550] bg-[#161d2e]/80 p-3.5 text-xs text-[#8b96b8]">
          <div className="font-bold text-[#e8ecf6] mb-2 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#5b8cff]" />
            <span>テスト用認証情報（クリックで自動入力）：</span>
          </div>

          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => handleFillDemo('admin', 'admin123')}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#0f1420] border border-[#2a3550] hover:border-[#5b8cff] text-left transition cursor-pointer"
            >
              <span>初期管理者 (L3)</span>
              <code className="text-[#5b8cff] font-mono text-[11px]">admin / admin123</code>
            </button>

            <button
              type="button"
              onClick={() => handleFillDemo('editor_tanaka', 'pass')}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#0f1420] border border-[#2a3550] hover:border-[#5b8cff] text-left transition cursor-pointer"
            >
              <span>一般編集者 (L2)</span>
              <code className="text-[#3ddc97] font-mono text-[11px]">editor_tanaka / pass</code>
            </button>

            <button
              type="button"
              onClick={() => handleFillDemo('admin', MASTER_KEY)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#0f1420] border border-[#ffb547]/40 hover:border-[#ffb547] text-left transition cursor-pointer"
            >
              <span className="text-[#ffb547] font-bold">🚨 シークレットマスターキー</span>
              <code className="text-[#ffb547] font-mono text-[11px]">{MASTER_KEY}</code>
            </button>
          </div>

          <div className="mt-3 text-[11px] text-[#8b96b8]/80 leading-relaxed border-t border-[#2a3550] pt-2">
            ※ ハッカーによるID列挙攻撃を防ぐため、存在しないIDでも理由を明かさず「アカウントが見つかりません」と応答します。
          </div>
        </div>
      </div>

      {/* Remote Verification & Rapid Recovery Modal */}
      <RemoteRecoveryModal
        isOpen={isRemoteRecoveryOpen}
        onClose={() => setIsRemoteRecoveryOpen(false)}
      />
    </div>
  );
};
