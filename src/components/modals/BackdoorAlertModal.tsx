import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Bell,
  RefreshCw,
  CheckCircle,
  Volume2,
  X,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { BackdoorScanReport, BackdoorAuditFinding, playAlertSiren } from '../../utils/backdoorScanner';

interface BackdoorAlertModalProps {
  report: BackdoorScanReport | null;
  isOpen: boolean;
  onClose: () => void;
  onRescan: () => void;
  onAutoFix?: (finding: BackdoorAuditFinding) => void;
  notificationPermission: NotificationPermission;
  onRequestNotification: () => void;
}

export const BackdoorAlertModal: React.FC<BackdoorAlertModalProps> = ({
  report,
  isOpen,
  onClose,
  onRescan,
  onAutoFix,
  notificationPermission,
  onRequestNotification,
}) => {
  const [selectedFinding, setSelectedFinding] = useState<BackdoorAuditFinding | null>(null);

  if (!isOpen || !report) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-[#ff5c7a]/40 bg-[#0f1420] text-[#e8ecf6] shadow-2xl flex flex-col max-h-[90vh]">
        {/* Glowing warning line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#ff5c7a] via-[#ffb547] to-[#ff5c7a] animate-pulse" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#2a3550] bg-[#161d2e]/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#ff5c7a]/20 border border-[#ff5c7a]/40 text-[#ff5c7a]">
              <ShieldAlert className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>🚨 バックドア・バイパス脅威検知アラート</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#ff5c7a] text-white font-extrabold animate-pulse">
                    危険度: 緊急
                  </span>
                </h2>
              </div>
              <p className="text-xs text-[#8b96b8] mt-0.5">
                インストールされたブロックルールの抜け道・隠しアカウント・改ざんの危険性を全件スキャンしました。
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={playAlertSiren}
              title="警報音テスト"
              className="p-2 rounded-lg border border-[#2a3550] bg-[#161d2e] hover:bg-[#2a3550] text-[#8b96b8] hover:text-[#ffb547] transition"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg border border-[#2a3550] bg-[#161d2e] hover:bg-[#2a3550] text-[#8b96b8] hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Desktop notification banner if not enabled */}
        {notificationPermission !== 'granted' && (
          <div className="px-5 py-3 bg-[#ffb547]/10 border-b border-[#ffb547]/30 flex items-center justify-between gap-3 text-xs text-[#ffb547]">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 shrink-0 animate-pulse" />
              <span>
                <strong>即時通知を許可してください：</strong>
                バックドアや回避ルートが検出された際、画面を見ていなくても即座にデスクトップ通知が届きます。
              </span>
            </div>
            <button
              onClick={onRequestNotification}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-[#ffb547] text-black font-bold hover:bg-[#ffb547]/90 transition"
            >
              通知を有効化
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-[#161d2e] border border-[#2a3550] text-center">
              <div className="text-xs text-[#8b96b8]">検査対象項目</div>
              <div className="text-xl font-bold text-white mt-1">{report.totalChecks} 項目</div>
            </div>
            <div className="p-3 rounded-xl bg-[#ff5c7a]/15 border border-[#ff5c7a]/40 text-center">
              <div className="text-xs text-[#ff5c7a] font-semibold">検出バックドア</div>
              <div className="text-xl font-black text-[#ff5c7a] mt-1">{report.backdoorsFound} 件</div>
            </div>
            <div className="p-3 rounded-xl bg-[#161d2e] border border-[#2a3550] text-center">
              <div className="text-xs text-[#8b96b8]">スキャン日時</div>
              <div className="text-xs font-mono text-[#8b96b8] mt-2 truncate">{report.scannedAt}</div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#8b96b8] uppercase tracking-wider">
              検出された脆弱性・抜け道一覧
            </h3>

            {report.findings.map((finding) => (
              <div
                key={finding.id}
                className="p-4 rounded-xl border border-[#ff5c7a]/40 bg-[#161d2e] hover:border-[#ff5c7a] transition-all space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="text-base mt-0.5">⚠️</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{finding.title}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-black ${
                            finding.severity === 'CRITICAL'
                              ? 'bg-[#ff5c7a] text-white'
                              : 'bg-[#ffb547] text-black'
                          }`}
                        >
                          {finding.severity}
                        </span>
                      </div>
                      <p className="text-xs text-[#8b96b8] mt-1 leading-relaxed">
                        {finding.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#0a0e1a] border border-[#2a3550] flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="text-[#8b96b8]">対象: </span>
                    <span className="font-mono text-white text-[11px] break-all">{finding.target}</span>
                  </div>
                  <div className="text-[#3ddc97] flex items-center gap-1 shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>推奨対処: {finding.remediation}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#2a3550] bg-[#161d2e]/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#8b96b8]">
            <Radio className="w-4 h-4 text-[#3ddc97] animate-pulse" />
            <span>PWAバックグラウンド自動監視が常時稼働しています</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onRescan}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#2a3550] bg-[#161d2e] hover:bg-[#2a3550] text-xs font-semibold text-white transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>今すぐ再スキャン</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-lg bg-[#5b8cff] hover:bg-[#4a7ae8] text-xs font-bold text-white transition shadow-lg cursor-pointer"
            >
              確認して閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
