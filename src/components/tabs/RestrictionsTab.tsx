import React, { useState } from 'react';
import {
  Lock,
  Plus,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  AlertOctagon,
  Trash2,
  CheckCircle,
  Key,
} from 'lucide-react';
import { RestrictionItem } from '../../types/security';
import { useSecurity, MASTER_KEY } from '../../context/SecurityContext';
import { RestrictionModal } from '../modals/RestrictionModal';

export const RestrictionsTab: React.FC = () => {
  const {
    restrictions,
    currentUser,
    removeRestriction,
    emergencyOverride,
    isEmergencyOverridden,
    runDeepBackdoorAudit,
    backdoorReport,
  } = useSecurity();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [masterKeyInput, setMasterKeyInput] = useState('');
  const [overrideMessage, setOverrideMessage] = useState<string | null>(null);

  const activeRestrictions = restrictions.filter((r) => r.status === 'active');
  const untrustedRestrictions = activeRestrictions.filter((r) => r.credibilityScore < 40);

  const handleExecuteEmergency = (e: React.FormEvent) => {
    e.preventDefault();
    setOverrideMessage(null);

    const ok = emergencyOverride(masterKeyInput.trim());
    if (ok) {
      setOverrideMessage('🚨 緊急復旧を実行しました！すべてのアクティブな制限が無視状態に変更されました。');
      setMasterKeyInput('');
    } else {
      setOverrideMessage('❌ マスターキーが一致しません');
    }
  };

  const handleRemove = (r: RestrictionItem) => {
    const isLow = r.credibilityScore < 40;
    const confirmMsg = isLow
      ? `低信頼度制限「${r.title}」(スコア: ${r.credibilityScore}点) を削除してアクセスを復旧しますか？`
      : `制限「${r.title}」を解除しますか？`;

    if (window.confirm(confirmMsg)) {
      const result = removeRestriction(r.id);
      if (!result.success) {
        alert(result.message);
      }
    }
  };

  const getStatusBadge = (status: RestrictionItem['status']) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ff5c7a]/20 text-[#ff5c7a] border border-[#ff5c7a]/30">稼働中</span>;
      case 'ignored':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ffb547]/20 text-[#ffb547] border border-[#ffb547]/30">無視中 (復旧)</span>;
      case 'expired':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#8b96b8]/20 text-[#8b96b8] border border-[#8b96b8]/30">期限切れ</span>;
      case 'repelled':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#3ddc97]/20 text-[#3ddc97] border border-[#3ddc97]/30">⚡ 弾き無効化</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Untrusted Restriction Upper Alert */}
      {untrustedRestrictions.length > 0 && (
        <div className="rounded-xl border border-[#ff5c7a]/40 bg-[#ff5c7a]/15 p-4 text-[#ff5c7a] flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 shrink-0 animate-bounce" />
            <div>
              <div className="font-bold text-sm text-white">
                ⚠️ 信頼度40点未満の「疑わしい制限」が {untrustedRestrictions.length} 件稼働しています
              </div>
              <div className="text-xs text-[#ffb8c5] mt-0.5">
                ハッカーによる管理者権限奪取や不正な制限の可能性があります。内部脅威防護仕様に基づき、一般ユーザー（L1・L2）を含むすべてのユーザーが直接削除可能です。
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Restrictions Panel */}
      <div className="rounded-xl border border-[#2a3550] bg-[#0f1420] p-5 shadow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#ff5c7a]" />
              <span>システムアクセス制限・ロックダウン一覧</span>
            </h3>
            <p className="text-xs text-[#8b96b8] mt-0.5">
              有効期間が経過した制限は自動的に期限切れとなり、効果を失います。
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => runDeepBackdoorAudit(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#ff5c7a]/40 bg-[#ff5c7a]/10 hover:bg-[#ff5c7a]/20 text-[#ff5c7a] text-xs font-bold transition cursor-pointer"
              title="制限ルールやサイトブロックのバイパス抜け道をスキャン"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>バックドア検査</span>
            </button>

            {currentUser?.role === 'L3' && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-[#ff416c] to-[#ff5c7a] text-white text-xs font-bold shadow-md hover:opacity-95 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ 制限を適用 (L3管理者)</span>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#2a3550] bg-[#161d2e]/80 text-[#8b96b8]">
                <th className="py-3 px-4">制限内容</th>
                <th className="py-3 px-4">実行者</th>
                <th className="py-3 px-4">信頼度スコア</th>
                <th className="py-3 px-4">残り時間</th>
                <th className="py-3 px-4">状態</th>
                <th className="py-3 px-4 text-right">アクション</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a3550]/40">
              {restrictions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#8b96b8]">
                    現在適用されている制限はありません
                  </td>
                </tr>
              ) : (
                restrictions.map((r) => {
                  const remainingMinutes = Math.max(0, Math.round((r.expiresAt - Date.now()) / 60000));
                  const isUntrusted = r.credibilityScore < 40;
                  const canDelete = isUntrusted || currentUser?.role === 'L3';

                  return (
                    <tr key={r.id} className="hover:bg-[#161d2e]/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{r.title}</span>
                          {r.bypassable && (
                            <span className="text-[10px] text-[#ffb547] bg-[#ffb547]/10 px-1.5 py-0.5 rounded border border-[#ffb547]/30">
                              バイパス有効
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#8b96b8] mt-0.5">{r.reason}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-white">{r.appliedBy}</span>
                        {r.appliedByName && (
                          <div className="text-[10px] text-[#8b96b8]">{r.appliedByName}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              r.credibilityScore >= 70
                                ? 'bg-[#3ddc97]/15 text-[#3ddc97] border border-[#3ddc97]/30'
                                : r.credibilityScore >= 40
                                ? 'bg-[#ffb547]/15 text-[#ffb547] border border-[#ffb547]/30'
                                : 'bg-[#ff5c7a]/15 text-[#ff5c7a] border border-[#ff5c7a]/30'
                            }`}
                          >
                            {r.credibilityScore} 点 (
                            {r.credibilityScore >= 70
                              ? '信頼'
                              : r.credibilityScore >= 40
                              ? '中程度'
                              : '低・疑わしい'}
                            )
                          </span>
                        </div>
                        {isUntrusted && (
                          <div className="text-[10px] text-[#ff5c7a] mt-0.5">※ 全員が削除可能</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-[#8b96b8] font-mono">
                          <Clock className="w-3.5 h-3.5 text-[#5b8cff]" />
                          <span>
                            {r.status === 'expired'
                              ? '有効期限切れ'
                              : remainingMinutes > 0
                              ? `${remainingMinutes} 分`
                              : '期限直前'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(r.status)}</td>
                      <td className="py-3 px-4 text-right">
                        {canDelete ? (
                          <button
                            onClick={() => handleRemove(r)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#ff5c7a]/15 hover:bg-[#ff5c7a]/25 text-[#ff5c7a] text-xs font-semibold border border-[#ff5c7a]/30 transition cursor-pointer"
                            title={isUntrusted ? '低信頼度のため誰でも削除可能' : '管理者による制限解除'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{isUntrusted ? '低信頼度制限を削除' : '解除'}</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-[#8b96b8]">高信頼度のため保護</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Emergency Recovery Mode Section (Bottom) */}
      <div className="rounded-xl border border-[#ff5c7a]/40 bg-gradient-to-r from-[#0f1420] via-[#161d2e] to-[#0f1420] p-6 shadow-xl">
        <div className="flex items-center gap-3 text-[#ff5c7a] mb-2">
          <AlertOctagon className="w-5 h-5 animate-pulse" />
          <h3 className="font-bold text-sm text-white">
            🚨 緊急復旧モード（ハッカーによる完全ロックダウンからの脱出）
          </h3>
        </div>

        <p className="text-xs text-[#8b96b8] leading-relaxed mb-4 max-w-2xl">
          ハッカーに管理者権限を乗っ取られたり、全ユーザーが締め出されたりした場合、環境変数に保管された最高レベル秘密鍵を入力してシステムを完全復旧できます。
        </p>

        {overrideMessage && (
          <div
            className={`mb-4 p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
              overrideMessage.includes('実行')
                ? 'bg-[#3ddc97]/15 border border-[#3ddc97]/40 text-[#3ddc97]'
                : 'bg-[#ff5c7a]/15 border border-[#ff5c7a]/40 text-[#ff5c7a]'
            }`}
          >
            {overrideMessage.includes('実行') ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{overrideMessage}</span>
          </div>
        )}

        <form onSubmit={handleExecuteEmergency} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-xl">
          <div className="relative flex-1">
            <Key className="absolute left-3 top-2.5 w-4 h-4 text-[#8b96b8]" />
            <input
              type="password"
              value={masterKeyInput}
              onChange={(e) => setMasterKeyInput(e.target.value)}
              placeholder="シークレットマスターキーを入力"
              className="w-full rounded-lg border border-[#2a3550] bg-[#0f1420] pl-9 pr-3 py-2 text-xs text-white placeholder-[#8b96b8]/50 focus:border-[#ff5c7a] focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            className="flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-[#ff416c] to-[#ff5c7a] text-white text-xs font-bold shadow-md hover:opacity-95 transition cursor-pointer whitespace-nowrap"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>🚨 緊急復旧を実行</span>
          </button>
        </form>

        <div className="mt-2 text-[11px] text-[#8b96b8] flex items-center gap-2">
          <span>テスト用マスターキー：</span>
          <button
            type="button"
            onClick={() => setMasterKeyInput(MASTER_KEY)}
            className="text-[#ffb547] underline hover:text-white cursor-pointer"
          >
            {MASTER_KEY} を自動入力
          </button>
        </div>
      </div>

      {/* Restriction Modal */}
      <RestrictionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
