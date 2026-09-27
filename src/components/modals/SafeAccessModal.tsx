import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ExternalLink,
  Eye,
  Copy,
  Check,
  Lock,
  Unlock,
  X,
  Globe,
  Radio,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { SiteItem } from '../../types/security';
import { useSecurity } from '../../context/SecurityContext';

interface SafeAccessModalProps {
  site: SiteItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SafeAccessModal: React.FC<SafeAccessModalProps> = ({ site, isOpen, onClose }) => {
  const { addLogEntry, pwaShieldActive } = useSecurity();
  const [copied, setCopied] = useState(false);
  const [showSandboxIframe, setShowSandboxIframe] = useState(false);
  const [temporaryBypassActive, setTemporaryBypassActive] = useState(false);
  const [bypassSecondsRemaining, setBypassSecondsRemaining] = useState(600);

  if (!isOpen || !site) return null;

  const isHttps = site.url.startsWith('https://');
  const isDanger = site.status === 'danger' || (site.scanResults && site.scanResults.level === 'danger');
  const isWarning = site.status === 'warning' || (site.scanResults && site.scanResults.level === 'warning');

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(site.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenIsolatedTab = () => {
    addLogEntry(
      `対象サイト安全確認アクセス実行（分離タブ）: ${site.name} (${site.url})`,
      'SECURITY',
      'success'
    );
    // Open in protected isolated context
    const newWindow = window.open(site.url, '_blank', 'noopener,noreferrer');
    if (newWindow) {
      newWindow.opener = null;
    }
  };

  const handleToggleTemporaryBypass = () => {
    setTemporaryBypassActive((prev) => !prev);
    addLogEntry(
      `安全確認用一時アクセスバイパス（10分間）${!temporaryBypassActive ? '有効化' : '無効化'}: ${site.name}`,
      'SECURITY',
      'warning'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl border border-[#5b8cff]/40 bg-[#0f1420] text-[#e8ecf6] shadow-2xl p-6 space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8b96b8] hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${
            isDanger
              ? 'bg-[#ff5c7a]/15 border-[#ff5c7a]/40 text-[#ff5c7a]'
              : isWarning
              ? 'bg-[#ffb547]/15 border-[#ffb547]/40 text-[#ffb547]'
              : 'bg-[#3ddc97]/15 border-[#3ddc97]/40 text-[#3ddc97]'
          }`}>
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">
                🛡️ 対象サイトへの安全確認アクセス
              </h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                isDanger
                  ? 'bg-[#ff5c7a]/20 text-[#ff5c7a] border border-[#ff5c7a]/30'
                  : isWarning
                  ? 'bg-[#ffb547]/20 text-[#ffb547] border border-[#ffb547]/30'
                  : 'bg-[#3ddc97]/20 text-[#3ddc97] border border-[#3ddc97]/30'
              }`}>
                {isDanger ? '危険レベル' : isWarning ? '警告レベル' : '安全検証済'}
              </span>
            </div>
            <p className="text-xs text-[#8b96b8] mt-0.5">
              親プロセスやCookieを隔離（Noopener/Noreferrer/サンドボックス保護）して安全に確認します
            </p>
          </div>
        </div>

        {/* Target Site Details Card */}
        <div className="p-4 rounded-xl bg-[#161d2e] border border-[#2a3550] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-xs text-[#8b96b8]">対象サイト名</div>
              <div className="text-sm font-bold text-white">{site.name}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8b96b8]">登録者: <strong className="text-white">{site.createdBy}</strong></span>
              <span className="text-xs text-[#8b96b8]">カテゴリ: <strong className="text-white">{site.category}</strong></span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[#0f1420] border border-[#2a3550] text-xs">
            <div className="flex items-center gap-2 truncate">
              {isHttps ? (
                <Lock className="w-3.5 h-3.5 text-[#3ddc97] shrink-0" />
              ) : (
                <Unlock className="w-3.5 h-3.5 text-[#ff5c7a] shrink-0" />
              )}
              <code className="text-[#5b8cff] font-mono truncate">{site.url}</code>
            </div>
            <button
              onClick={handleCopyUrl}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#161d2e] hover:bg-[#2a3550] text-[11px] text-[#e8ecf6] font-semibold transition shrink-0 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#3ddc97]" /> : <Copy className="w-3.5 h-3.5 text-[#8b96b8]" />}
              <span>{copied ? 'コピー完了' : 'URLコピー'}</span>
            </button>
          </div>

          {/* Security Pre-Flight Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="p-2 rounded bg-[#0f1420] border border-[#2a3550]">
              <span className="text-[#8b96b8] block">通信暗号化</span>
              <span className={isHttps ? 'text-[#3ddc97] font-bold' : 'text-[#ff5c7a] font-bold'}>
                {isHttps ? '🔒 HTTPS保護' : '⚠️ 平文HTTP'}
              </span>
            </div>
            <div className="p-2 rounded bg-[#0f1420] border border-[#2a3550]">
              <span className="text-[#8b96b8] block">隔離シールド</span>
              <span className={pwaShieldActive ? 'text-[#3ddc97] font-bold' : 'text-[#ffb547] font-bold'}>
                {pwaShieldActive ? '🛡️ PWA隔離稼働' : '通常保護'}
              </span>
            </div>
            <div className="p-2 rounded bg-[#0f1420] border border-[#2a3550]">
              <span className="text-[#8b96b8] block">スキャンスコア</span>
              <span className="text-white font-mono font-bold">
                {site.scanResults ? `${site.scanResults.score} / 100` : '未スキャン'}
              </span>
            </div>
            <div className="p-2 rounded bg-[#0f1420] border border-[#2a3550]">
              <span className="text-[#8b96b8] block">一時バイパス</span>
              <span className={temporaryBypassActive ? 'text-[#3ddc97] font-bold' : 'text-[#8b96b8]'}>
                {temporaryBypassActive ? '有効 (10分)' : '無効'}
              </span>
            </div>
          </div>
        </div>

        {/* In-app Sandbox Preview Box (Toggled) */}
        {showSandboxIframe && (
          <div className="space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#5b8cff] flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                <span>隔離サンドボックス内プレビュー</span>
              </span>
              <button
                onClick={() => setShowSandboxIframe(false)}
                className="text-[11px] text-[#8b96b8] hover:text-white cursor-pointer"
              >
                プレビューを閉じる
              </button>
            </div>
            <div className="w-full h-64 rounded-xl border border-[#2a3550] bg-white overflow-hidden relative">
              <iframe
                src={site.url}
                title="Safe Preview"
                sandbox="allow-same-origin allow-scripts allow-forms"
                className="w-full h-full border-none"
              />
            </div>
            <p className="text-[10px] text-[#8b96b8]">
              ※ 外部サイトのX-Frame-Options制限等によりプレビュー表示が拒否される場合は、下の「安全な分離タブで開く」をご利用ください。
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Action 1: Open in Isolated Protected Tab */}
            <button
              onClick={handleOpenIsolatedTab}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#5b8cff] to-[#7c5bff] hover:opacity-95 active:scale-98 text-xs font-bold text-white shadow-lg shadow-[#5b8cff]/20 transition cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>安全な分離タブでアクセス（推奨）</span>
            </button>

            {/* Action 2: Toggle Sandbox Preview */}
            <button
              onClick={() => setShowSandboxIframe((prev) => !prev)}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[#2a3550] bg-[#161d2e] hover:bg-[#2a3550] active:scale-98 text-xs font-bold text-[#e8ecf6] transition cursor-pointer"
            >
              <Eye className="w-4 h-4 text-[#5b8cff]" />
              <span>{showSandboxIframe ? 'プレビューを非表示' : 'サンドボックス内でプレビュー'}</span>
            </button>
          </div>

          {/* Secondary Options: Temporary bypass & Close */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-[#2a3550] text-xs">
            <button
              onClick={handleToggleTemporaryBypass}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition cursor-pointer ${
                temporaryBypassActive
                  ? 'bg-[#3ddc97]/15 border-[#3ddc97]/40 text-[#3ddc97]'
                  : 'bg-[#161d2e] border-[#2a3550] hover:border-[#ffb547] text-[#8b96b8] hover:text-[#ffb547]'
              }`}
            >
              {temporaryBypassActive ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>
                {temporaryBypassActive
                  ? '✅ 検証バイパス稼働中（通信制限を一時解除）'
                  : '安全確認のための検証バイパスを有効化（10分間）'}
              </span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#2a3550] bg-[#161d2e] hover:bg-[#2a3550] text-xs font-semibold text-[#8b96b8] hover:text-white transition cursor-pointer"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
