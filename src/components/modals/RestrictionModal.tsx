import React, { useState, useMemo } from 'react';
import { Lock, X, AlertTriangle, ShieldCheck, AlertCircle } from 'lucide-react';
import { RestrictionType } from '../../types/security';
import { useSecurity } from '../../context/SecurityContext';
import { calculateCredibilityScore } from '../../utils/credibility';

interface RestrictionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RestrictionModal: React.FC<RestrictionModalProps> = ({ isOpen, onClose }) => {
  const { applyRestriction, currentUser, restrictions } = useSecurity();
  const [type, setType] = useState<RestrictionType>('full_lock');
  const [title, setTitle] = useState('');
  const [reason, setReason] = useState('');
  const [targetScope, setTargetScope] = useState<'all' | 'sites' | 'admins' | 'system'>('all');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [error, setError] = useState<string | null>(null);

  // Real-time credibility score prediction
  const estimatedCredibility = useMemo(() => {
    if (!currentUser) return null;
    return calculateCredibilityScore(currentUser, type, restrictions);
  }, [currentUser, type, restrictions]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reason.trim()) {
      setError('制限適用の理由は必須です');
      return;
    }

    const appliedTitle = title.trim() || getDefaultTitle(type);

    const { success, score } = applyRestriction({
      type,
      title: appliedTitle,
      reason: reason.trim(),
      targetScope,
      durationMinutes: Number(durationMinutes) || 60,
    });

    if (!success) {
      setError('制限の適用に失敗しました（L3管理者権限が必要です）');
      return;
    }

    onClose();
  };

  const getDefaultTitle = (t: RestrictionType) => {
    switch (t) {
      case 'full_lock':
        return 'システム全体の緊急フルロックダウン';
      case 'read_only':
        return '全管理サイトの読み取り専用化';
      case 'revoke_admin':
        return '管理者権限の緊急剥奪制限';
      case 'site_block':
        return '外部アクセス一時遮断制限';
      case 'api_freeze':
        return 'システムAPI及び設定変更の凍結';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-[#ff5c7a]/40 bg-[#0f1420] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8b96b8] hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-[#ff5c7a]/15 border border-[#ff5c7a]/30 text-[#ff5c7a]">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">制限・ロックダウンの適用</h3>
            <p className="text-xs text-[#8b96b8]">適用時に「制限の信頼性スコア」が自動計算されます</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-[#ff5c7a]/15 border border-[#ff5c7a]/30 px-3 py-2 text-xs text-[#ff5c7a]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Real-time Credibility Score Preview Card */}
        {estimatedCredibility && (
          <div className="mb-4 rounded-xl border border-[#2a3550] bg-[#161d2e] p-3 text-xs">
            <div className="flex justify-between items-center mb-1.5">
              <span className="font-semibold text-[#8b96b8]">システム自動算出 信頼度スコア予測：</span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-xs ${
                  estimatedCredibility.score >= 70
                    ? 'bg-[#3ddc97]/20 text-[#3ddc97]'
                    : estimatedCredibility.score >= 40
                    ? 'bg-[#ffb547]/20 text-[#ffb547]'
                    : 'bg-[#ff5c7a]/20 text-[#ff5c7a]'
                }`}
              >
                {estimatedCredibility.score} 点 ({estimatedCredibility.levelLabel})
              </span>
            </div>

            {estimatedCredibility.breakdown.deductions.length > 0 ? (
              <div className="space-y-1 mt-2 text-[11px] text-[#ff5c7a] bg-[#0a0e1a]/60 p-2 rounded border border-[#ff5c7a]/20">
                <div className="font-semibold text-white">適用されるペナルティ減点：</div>
                {estimatedCredibility.breakdown.deductions.map((d, i) => (
                  <div key={i} className="flex justify-between">
                    <span>• {d.reason}</span>
                    <span className="font-mono font-bold">-{d.amount}点</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-[#3ddc97] mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>検証済み管理者による通常操作のためペナルティなし (100点満点)</span>
              </div>
            )}

            {estimatedCredibility.score < 40 && (
              <div className="mt-2 text-[11px] text-[#ffb547] bg-[#ffb547]/10 p-2 rounded border border-[#ffb547]/20">
                ⚠️ 注意：信頼度40点未満の制限は、ハッカー対策として一般ユーザー（L1・L2）でも即座に解除・削除が許可されます。
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#8b96b8] mb-1">制限の種類</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as RestrictionType)}
              className="w-full rounded-lg border border-[#2a3550] bg-[#161d2e] px-3 py-2 text-xs text-white focus:border-[#ff5c7a] focus:outline-none"
            >
              <option value="full_lock">フルロックダウン（全ユーザーアクセス拒否・緊急封鎖）</option>
              <option value="read_only">読み取り専用化（全サイトのデータ編集・更新凍結）</option>
              <option value="revoke_admin">管理者権限の剥奪（管理操作の緊急一時停止）</option>
              <option value="site_block">サイトアクセス禁止（特定ドメイン遮断）</option>
              <option value="api_freeze">API凍結（外部連携・バッチ停止）</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8b96b8] mb-1">制限のタイトル (任意)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 深夜メンテナンスによる緊急フルロック"
              className="w-full rounded-lg border border-[#2a3550] bg-[#161d2e] px-3 py-2 text-xs text-white placeholder-[#8b96b8]/50 focus:border-[#ff5c7a] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8b96b8] mb-1">制限適用の理由 (必須テキスト)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="不審なログインの検知、緊急パッチ適用、不正データ流入防止など具体的な理由を記入"
              className="w-full rounded-lg border border-[#2a3550] bg-[#161d2e] px-3 py-2 text-xs text-white placeholder-[#8b96b8]/50 focus:border-[#ff5c7a] focus:outline-none resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#8b96b8] mb-1">
                有効期間（分、デフォルト60）
              </label>
              <input
                type="number"
                min="1"
                max="1440"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full rounded-lg border border-[#2a3550] bg-[#161d2e] px-3 py-2 text-xs text-white focus:border-[#ff5c7a] focus:outline-none"
                required
              />
              <span className="text-[10px] text-[#8b96b8]">※ 期限超過後は自動的に無効化</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8b96b8] mb-1">対象範囲 (スコープ)</label>
              <select
                value={targetScope}
                onChange={(e) => setTargetScope(e.target.value as any)}
                className="w-full rounded-lg border border-[#2a3550] bg-[#161d2e] px-3 py-2 text-xs text-white focus:border-[#ff5c7a] focus:outline-none"
              >
                <option value="all">全域（システム全体）</option>
                <option value="sites">Webサイト管理のみ</option>
                <option value="admins">管理者権限のみ</option>
                <option value="system">システムAPIのみ</option>
              </select>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#ff5c7a]/10 border border-[#ff5c7a]/20 text-[11px] text-[#ffb8c5] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#ff5c7a]" />
            <span>⚠️ 警告：この操作は改ざん防止監査ログに暗号チェックサム付きで永続記録されます。</span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#2a3550] bg-[#161d2e] hover:bg-[#2a3550] text-xs font-semibold text-[#e8ecf6] cursor-pointer"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#ff416c] to-[#ff5c7a] hover:opacity-95 text-xs font-bold text-white shadow-lg cursor-pointer"
            >
              制限を適用する
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
