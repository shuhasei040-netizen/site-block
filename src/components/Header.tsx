import React, { useState } from 'react';
import { Download, FileCode, AlertOctagon, Clock, ShieldAlert } from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';
import { PWAInstallButton } from './PWAInstallButton';
import { TabKey } from './Sidebar';

interface HeaderProps {
  currentTab: TabKey;
  onOpenEmergencyModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onOpenEmergencyModal }) => {
  const {
    sessionRemainingSeconds,
    exportJsonBackup,
    downloadStandaloneFile,
    isEmergencyOverridden,
    backdoorReport,
    runDeepBackdoorAudit,
    notificationPermission,
    requestNotificationPermission,
  } = useSecurity();

  const getHeaderInfo = (tab: TabKey) => {
    switch (tab) {
      case 'dashboard':
        return {
          title: '📊 セキュリティダッシュボード',
          desc: '企業全体のWebサイト防護状態、アクティブな制限、信頼性検証スコアを一元監視',
        };
      case 'sites':
        return {
          title: '🌐 管理サイト一覧',
          desc: '登録WebサイトのURL整合性、HTTPS状態、マルウェア・不正リンク簡易ヒューリスティックスキャン',
        };
      case 'restrictions':
        return {
          title: '🔒 制限・ロックダウン管理',
          desc: 'アクセス遮断・権限剥奪の信頼度スコア検証、自動失効カウントダウン、及び低信頼度制限の強制解除',
        };
      case 'accounts':
        return {
          title: '👤 アカウント・権限管理',
          desc: '内部脅威を最小化する多層権限レベル（L1閲覧者 / L2編集者 / L3管理者）の制御と検証ステータス',
        };
      case 'audit':
        return {
          title: '🔍 内部脅威・セキュリティ監査',
          desc: 'ロックダウンスパム・深夜帯異常操作・ID連続失敗・ログ改ざんのリアルタイム自動検出エンジン',
        };
      case 'logs':
        return {
          title: '📜 不可逆アクティビティログ',
          desc: 'CRC-32暗号チェックサムによる改ざん防止監査ログ。全操作の証跡記録と不整合検知',
        };
      case 'settings':
        return {
          title: '⚙️ システム設定＆実証検証',
          desc: 'マスターキー保護設定、仕様シナリオ1〜4のシミュレーター、及びスタンドアローンHTML書き出し',
        };
      default:
        return { title: 'ダッシュボード', desc: '' };
    }
  };

  const info = getHeaderInfo(currentTab);

  const formatSessionTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <header className="border-b border-[#2a3550] bg-[#0f1420]/80 backdrop-blur-md px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-20">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          {info.title}
        </h1>
        <p className="text-xs text-[#8b96b8] mt-1">{info.desc}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* Session Timeout Watcher */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2a3550] bg-[#161d2e] text-[#8b96b8] text-xs font-mono"
          title="30分無操作で自動ログアウトされます（クリックまたはキー入力でリセット）"
        >
          <Clock className="w-3.5 h-3.5 text-[#ffb547]" />
          <span>セッション有効: {formatSessionTime(sessionRemainingSeconds)}</span>
        </div>

        {/* PWA Install Button */}
        <PWAInstallButton />

        {/* JSON Backup Button */}
        <button
          onClick={exportJsonBackup}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2a3550] bg-[#161d2e] hover:bg-[#2a3550] text-[#e8ecf6] text-xs font-semibold transition cursor-pointer"
          title="全サイト・アカウント・制限・ログをJSON形式でダウンロード"
        >
          <Download className="w-3.5 h-3.5 text-[#5b8cff]" />
          <span>JSONバックアップ</span>
        </button>

        {/* Standalone HTML File Export Button */}
        <button
          onClick={downloadStandaloneFile}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#5b8cff]/40 bg-[#5b8cff]/10 hover:bg-[#5b8cff]/20 text-[#5b8cff] text-xs font-semibold transition cursor-pointer"
          title="完全自己完結型の単一HTML（site-manager-security.html）を生成・保存"
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>単一HTML保存</span>
        </button>

        {/* Backdoor & Evasion Scanner Button */}
        <button
          onClick={() => {
            if (notificationPermission === 'default') {
              requestNotificationPermission();
            }
            runDeepBackdoorAudit(true);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer shadow-md ${
            backdoorReport && !backdoorReport.isSafe
              ? 'bg-[#ff5c7a]/20 border-[#ff5c7a]/60 text-[#ff5c7a] animate-pulse'
              : 'border-[#2a3550] bg-[#161d2e] hover:bg-[#2a3550] text-[#e8ecf6]'
          }`}
          title="すべてのブロックルール、特権アカウント、ログのバックドア抜け道を総点検"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-[#ff5c7a]" />
          <span>
            バックドア点検
            {backdoorReport && !backdoorReport.isSafe && ` (${backdoorReport.backdoorsFound})`}
          </span>
        </button>

        {/* Emergency Override Button */}
        <button
          onClick={onOpenEmergencyModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#ff416c] to-[#ff5c7a] hover:opacity-90 active:scale-95 text-white text-xs font-bold shadow-md shadow-[#ff5c7a]/20 transition cursor-pointer"
          title="シークレットマスターキーによる完全ロックダウン脱出"
        >
          <AlertOctagon className="w-3.5 h-3.5 animate-pulse" />
          <span>🚨 緊急復旧</span>
        </button>
      </div>
    </header>
  );
};
