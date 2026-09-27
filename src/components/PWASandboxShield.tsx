import React, { useState } from 'react';
import { ShieldAlert, Zap, Shield, Sparkles, AlertCircle, Radio } from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';
import { RemoteRecoveryModal } from './modals/RemoteRecoveryModal';

export const PWASandboxShield: React.FC = () => {
  const {
    pwaShieldActive,
    isStandalonePWA,
    repelRestrictionsWithPwaPulse,
    togglePwaSandboxShield,
    restrictions,
    runDeepBackdoorAudit,
  } = useSecurity();

  const [isBlasting, setIsBlasting] = useState(false);
  const [lastBlastResult, setLastBlastResult] = useState<number | null>(null);
  const [isRemoteRecoveryOpen, setIsRemoteRecoveryOpen] = useState(false);

  const activeRogueCount = restrictions.filter((r) => r.status === 'active').length;
  const repelledCount = restrictions.filter((r) => r.status === 'repelled').length;

  const handlePulseBlast = () => {
    setIsBlasting(true);
    const { count } = repelRestrictionsWithPwaPulse();
    setLastBlastResult(count);

    setTimeout(() => {
      setIsBlasting(false);
    }, 1200);
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-[#2a3550] bg-gradient-to-r from-[#0f1420] via-[#161d2e] to-[#0f1420] p-4 shadow-lg mb-6">
      {/* Background glow */}
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#5b8cff]/10 blur-2xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-lg border ${
              pwaShieldActive
                ? 'bg-[#3ddc97]/15 border-[#3ddc97]/40 text-[#3ddc97]'
                : 'bg-[#ffb547]/15 border-[#ffb547]/40 text-[#ffb547]'
            }`}
          >
            {pwaShieldActive ? (
              <Shield className="w-5 h-5 animate-pulse" />
            ) : (
              <ShieldAlert className="w-5 h-5" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>🛡️ PWA独立サンドボックス防御シールド</span>
                {isStandalonePWA && (
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[#5b8cff]/20 text-[#5b8cff] border border-[#5b8cff]/30">
                    Native PWA Mode
                  </span>
                )}
              </h3>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                  pwaShieldActive
                    ? 'bg-[#3ddc97]/20 text-[#3ddc97] border border-[#3ddc97]/30'
                    : 'bg-[#ffb547]/20 text-[#ffb547] border border-[#ffb547]/30'
                }`}
              >
                {pwaShieldActive ? '常時迎撃中' : '待機中'}
              </span>
            </div>

            <p className="text-xs text-[#8b96b8] mt-1">
              ブラウザまたはPWAアプリから、ハッカーや悪意ある登録者がかけた不当な制限・ロックダウンを検知し即座に弾き出します。
              {repelledCount > 0 && (
                <span className="ml-1 text-[#3ddc97] font-semibold">
                  （現在までに {repelledCount} 件の制限を弾き排除済）
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end md:self-center shrink-0">
          <button
            onClick={() => setIsRemoteRecoveryOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border border-[#ff5c7a]/60 bg-gradient-to-r from-[#ff5c7a]/20 to-[#ffb547]/20 hover:from-[#ff5c7a]/30 hover:to-[#ffb547]/30 text-white transition cursor-pointer shadow-md shadow-[#ff5c7a]/15"
            title="画面ロック時でも検証用ルートからリモート接続し、バックドアを迅速無効化"
          >
            <Radio className="w-4 h-4 text-[#ff5c7a] animate-pulse" />
            <span>検証リモート復旧</span>
          </button>

          <button
            onClick={() => runDeepBackdoorAudit(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-[#ff5c7a]/40 bg-[#ff5c7a]/10 hover:bg-[#ff5c7a]/20 text-[#ff5c7a] transition cursor-pointer"
            title="ブロックルールの抜け道・隠しバックドアを即時診断"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>バックドア監査</span>
          </button>

          <button
            onClick={togglePwaSandboxShield}
            className="text-xs font-semibold px-3 py-2 rounded-lg border border-[#2a3550] bg-[#161d2e] hover:bg-[#2a3550] text-[#8b96b8] hover:text-white transition cursor-pointer"
          >
            {pwaShieldActive ? 'シールド一時解除' : 'シールド有効化'}
          </button>

          <button
            onClick={handlePulseBlast}
            disabled={isBlasting}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-white shadow-lg transition-all cursor-pointer overflow-hidden ${
              isBlasting
                ? 'bg-gradient-to-r from-[#ff416c] to-[#ff4b2b] scale-95 ring-4 ring-[#ff416c]/40'
                : 'bg-gradient-to-r from-[#7c5bff] to-[#5b8cff] hover:opacity-95 hover:shadow-[#5b8cff]/25 active:scale-95'
            }`}
          >
            {isBlasting ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-white" />
                <span>制限弾きパルス放射中...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-[#ffb547] fill-[#ffb547]" />
                <span>⚡ 不正制限を弾き出す ({activeRogueCount})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {lastBlastResult !== null && (
        <div className="mt-3 pt-2.5 border-t border-[#2a3550]/60 flex items-center gap-2 text-xs text-[#3ddc97]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>
            {lastBlastResult > 0
              ? `パルス成功：${lastBlastResult} 件の不当な制限を弾き出し、システムから無効化しました！`
              : 'パルス完了：現在アクティブな制限はありません。システムは正常です。'}
          </span>
        </div>
      )}

      {/* Remote Verification & Rapid Backdoor Recovery Modal */}
      <RemoteRecoveryModal
        isOpen={isRemoteRecoveryOpen}
        onClose={() => setIsRemoteRecoveryOpen(false)}
      />
    </div>
  );
};
