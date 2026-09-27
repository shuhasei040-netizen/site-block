import React, { useState } from 'react';
import { Download, Smartphone, CheckCircle, ShieldCheck } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installing, setInstalling] = useState(false);

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      await install();
    } finally {
      setInstalling(false);
    }
  };

  // If already running in standalone PWA mode
  if (isInstalled) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3ddc97]/10 border border-[#3ddc97]/30 text-[#3ddc97] text-xs font-semibold">
        <ShieldCheck className="w-4 h-4 animate-pulse" />
        <span>PWA保護アプリ稼働中</span>
      </div>
    );
  }

  // Chromium / Desktop / Android flow
  if (isInstallable) {
    return (
      <button
        onClick={handleInstallClick}
        disabled={installing}
        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#5b8cff] to-[#7c5bff] px-3.5 py-1.5 text-xs font-semibold text-white shadow-md hover:opacity-90 active:scale-95 transition-all cursor-pointer"
        title="ブラウザから直接PWAアプリとしてインストール"
      >
        <Download className="w-4 h-4" />
        <span>{installing ? 'インストール中...' : 'PWAアプリをインストール'}</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-lg border border-[#2a3550] bg-[#161d2e] px-3 py-1.5 text-xs font-medium text-[#e8ecf6] hover:bg-[#2a3550] transition cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#5b8cff]" />
          <span>iOSホーム画面に追加</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-xl bg-[#0f1420] border border-[#2a3550] p-6 shadow-2xl text-[#e8ecf6]">
              <div className="flex items-center gap-2 mb-3 text-[#5b8cff] font-bold">
                <Smartphone className="w-5 h-5" />
                <h3>iPhone / iPad へのインストール手順</h3>
              </div>
              <p className="text-xs text-[#8b96b8] leading-relaxed mb-4">
                1. Safari下部の<strong>共有ボタン（四角から上向き矢印）</strong>をタップします。<br />
                2. メニューをスクロールし<strong>「ホーム画面に追加」</strong>を選択します。<br />
                3. 右上の<strong>「追加」</strong>を押すと、独立した保護セキュリティアプリとして起動可能になります。
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-lg bg-[#161d2e] border border-[#2a3550] py-2 text-xs font-medium text-[#e8ecf6] hover:bg-[#2a3550] transition cursor-pointer"
              >
                閉じる
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback indicator showing browser readiness
  return (
    <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#161d2e]/80 border border-[#2a3550] text-[#8b96b8] text-[11px]">
      <CheckCircle className="w-3.5 h-3.5 text-[#5b8cff]" />
      <span>PWA Ready</span>
    </div>
  );
};
