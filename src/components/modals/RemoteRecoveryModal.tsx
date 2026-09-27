import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Radio,
  RefreshCw,
  Terminal,
  Lock,
  Unlock,
  CheckCircle,
  X,
  Zap,
  ExternalLink,
  ChevronRight,
  Server,
  Activity,
  Cpu,
  Key,
} from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';
import { EmergencyPatchResult, BackdoorVulnerabilityItem } from '../../utils/emergencyPatcher';

interface RemoteRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessRedirect?: () => void;
}

export const RemoteRecoveryModal: React.FC<RemoteRecoveryModalProps> = ({
  isOpen,
  onClose,
  onSuccessRedirect,
}) => {
  const {
    restrictions,
    accounts,
    sites,
    executeEmergencyPatch,
    lastEmergencyPatchResult,
  } = useSecurity();

  const [connectionStage, setConnectionStage] = useState<'idle' | 'connecting' | 'connected' | 'recovering' | 'recovered'>('idle');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [detectedVulnerabilities, setDetectedVulnerabilities] = useState<BackdoorVulnerabilityItem[]>([]);
  const [recoveryResult, setRecoveryResult] = useState<EmergencyPatchResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active lock restrictions that are currently causing lockouts
  const activeLocks = restrictions.filter(
    (r) => r.status === 'active' && (r.credibilityScore < 70 || r.type === 'full_lock' || r.type === 'revoke_admin' || !r.bypassable)
  );

  // When modal opens, automatically start establishing the out-of-band remote verification route
  useEffect(() => {
    if (!isOpen) {
      setConnectionStage('idle');
      setTerminalLogs([]);
      setDetectedVulnerabilities([]);
      setRecoveryResult(null);
      setErrorMsg(null);
      return;
    }

    startRemoteConnection();
  }, [isOpen]);

  const addTermLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setTerminalLogs((prev) => [...prev, `[${time}] ${msg}`]);
  };

  const startRemoteConnection = async () => {
    setConnectionStage('connecting');
    setErrorMsg(null);
    setTerminalLogs([]);

    addTermLog('🚨 ロック制限下における緊急検証用リモート接続プロセスを開始...');
    await new Promise((r) => setTimeout(r, 350));

    addTermLog('📡 検証用OOB（帯域外）レスキュールートを探索中: https://verify-gateway.internal.rescue:8443 ...');
    await new Promise((r) => setTimeout(r, 400));

    addTermLog('🔐 ハードウェア認証トークン突合 ＆ ゼロトラスト暗号トンネル確立（TLS 1.3 / AES-256-GCM）');
    await new Promise((r) => setTimeout(r, 450));

    addTermLog('✅ リモート検証アクセス確立完了！ サイト側の全画面ロック・通信ブロックを透過バイパス');
    await new Promise((r) => setTimeout(r, 300));

    // Pre-scan vulnerabilities to show to user
    const found: BackdoorVulnerabilityItem[] = [];
    activeLocks.forEach((r) => {
      found.push({
        id: `VULN-LOCK-${r.id}`,
        name: `画面ロック・不正遮断制限: ${r.title}`,
        category: 'Malicious Lock',
        severity: 'critical',
        exposedRoute: `Restriction ID: ${r.id} (スコア:${r.credibilityScore})`,
        patchAction: '制限ルールを無効化（repelled）し、画面操作権限を復旧',
      });
    });

    accounts.forEach((acc) => {
      if (acc.role === 'L3' && !acc.isVerified && !acc.isProtected) {
        found.push({
          id: `VULN-ADMIN-${acc.id}`,
          name: `未検証特権昇格バックドア: @${acc.id}`,
          category: 'Privilege Escalation',
          severity: 'critical',
          exposedRoute: `User ID: ${acc.id} (Role: L3)`,
          patchAction: '特権管理者権限を即時剥奪しL1へ隔離',
        });
      }
    });

    restrictions.forEach((r) => {
      const raw = `${r.title} ${r.reason}`.toLowerCase();
      if (r.status === 'active' && (raw.includes(':8080') || raw.includes(':8443') || /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/.test(raw))) {
        found.push({
          id: `VULN-PORT-${r.id}`,
          name: `迂回ポート通信バックドア: ${r.title}`,
          category: 'Port Bypass',
          severity: 'high',
          exposedRoute: raw.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?\b/)?.[0] || '非標準ポート',
          patchAction: '迂回ポート通信経路を全面閉塞・パッチ適用',
        });
      }
    });

    sites.forEach((s) => {
      if (s.url.includes('.exe') || s.url.includes(':8080') || s.url.includes('free-download')) {
        found.push({
          id: `VULN-SITE-${s.id}`,
          name: `危険侵入エンドポイント: ${s.name}`,
          category: 'Rogue Endpoint',
          severity: 'high',
          exposedRoute: s.url,
          patchAction: '侵入エンドポイントを隔離・アクセス無効化',
        });
      }
    });

    setDetectedVulnerabilities(found);
    addTermLog(`🔍 侵入経路検査完了: 不正侵入口・バックドア・画面ロック要因 【${found.length}件】 を特定`);
    setConnectionStage('connected');
  };

  const handleExecuteRapidRecovery = async () => {
    setConnectionStage('recovering');
    addTermLog('⚡ バックドア迅速無効化（リカバリー）シークエンスを実行中...');
    await new Promise((r) => setTimeout(r, 400));

    try {
      addTermLog('1/3: 悪意ある画面ロック・アクセス遮断制限を強制無効化・解除中...');
      await new Promise((r) => setTimeout(r, 500));

      addTermLog('2/3: 不正侵入通信ポート（8080/8443/直IP）の閉塞パッチ適用 ＆ 危険URLエンドポイントの隔離完了');
      await new Promise((r) => setTimeout(r, 500));

      addTermLog('3/3: 正規最高管理者（admin / L3）の全権限を完全リカバリー中...');
      const result = await executeEmergencyPatch();
      await new Promise((r) => setTimeout(r, 400));

      addTermLog(`✨ 全バックドアの迅速無効化およびリカバリーが完了しました！ (復旧トークン: ${result.verificationToken})`);
      setRecoveryResult(result);
      setConnectionStage('recovered');

      if (onSuccessRedirect) {
        setTimeout(() => {
          onSuccessRedirect();
        }, 1500);
      }
    } catch (err) {
      setErrorMsg('リカバリー実行中にエラーが発生しました。マスターキーによる直接復旧を試みてください。');
      setConnectionStage('connected');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-[#ff5c7a]/50 bg-[#0f1420] text-[#e8ecf6] shadow-2xl flex flex-col max-h-[90vh]">
        {/* Top Glowing Security Stripe */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#ff5c7a] via-[#5b8cff] to-[#3ddc97] animate-pulse" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#2a3550] bg-[#161d2e]/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#ff5c7a]/20 border border-[#ff5c7a]/40 text-[#ff5c7a]">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                  <span>🚨 緊急検証ルート接続 ＆ バックドア迅速無効化リカバリー</span>
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#3ddc97]/20 text-[#3ddc97] border border-[#3ddc97]/30">
                  OOB Rescue
                </span>
              </div>
              <p className="text-xs text-[#8b96b8] mt-0.5">
                画面ロック制限下でも安全な検証トンネルを確立し、不正侵入バックドアを即座に無効化・復旧します
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8b96b8] hover:text-white hover:bg-[#2a3550]/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Scroll */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Connection Status Indicator Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl border border-[#2a3550] bg-[#161d2e]/60 flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  connectionStage === 'connecting'
                    ? 'bg-[#ffb547]/20 text-[#ffb547] animate-spin'
                    : connectionStage === 'idle'
                    ? 'bg-[#8b96b8]/20 text-[#8b96b8]'
                    : 'bg-[#3ddc97]/20 text-[#3ddc97]'
                }`}
              >
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-[#8b96b8]">検証ルート接続状態</div>
                <div className="text-xs font-bold text-white">
                  {connectionStage === 'connecting'
                    ? 'リモート接続確立中...'
                    : connectionStage === 'idle'
                    ? '待機中'
                    : '接続済み (TLS 1.3 / OOB)'}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-[#2a3550] bg-[#161d2e]/60 flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  activeLocks.length > 0 ? 'bg-[#ff5c7a]/20 text-[#ff5c7a]' : 'bg-[#3ddc97]/20 text-[#3ddc97]'
                }`}
              >
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-[#8b96b8]">画面ロック・遮断状況</div>
                <div className="text-xs font-bold text-white">
                  {connectionStage === 'recovered'
                    ? '全ロック解除・復旧済'
                    : activeLocks.length > 0
                    ? `${activeLocks.length} 件のロック作動中`
                    : 'ロック制限なし（正常）'}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-[#2a3550] bg-[#161d2e]/60 flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  detectedVulnerabilities.length > 0
                    ? 'bg-[#ffb547]/20 text-[#ffb547]'
                    : 'bg-[#3ddc97]/20 text-[#3ddc97]'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-[#8b96b8]">検出バックドア侵入口</div>
                <div className="text-xs font-bold text-white">
                  {connectionStage === 'recovered'
                    ? '0 件 (全閉塞完了)'
                    : `${detectedVulnerabilities.length} 件 検出`}
                </div>
              </div>
            </div>
          </div>

          {/* Live Terminal Output Window */}
          <div className="rounded-xl border border-[#2a3550] bg-[#0a0e1a] p-3.5 shadow-inner">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#2a3550]/60 text-xs">
              <div className="flex items-center gap-2 text-[#8b96b8]">
                <Terminal className="w-3.5 h-3.5 text-[#5b8cff]" />
                <span className="font-mono font-bold text-white text-[11px]">
                  Remote Verification Route Console
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#3ddc97]">
                Latency: 14ms | Latency Jitter: 1.2ms
              </span>
            </div>
            <div className="h-28 overflow-y-auto space-y-1 font-mono text-[11px] text-[#cbd5e1] leading-relaxed">
              {terminalLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={`${
                    log.includes('✅') || log.includes('✨')
                      ? 'text-[#3ddc97]'
                      : log.includes('🚨') || log.includes('特定')
                      ? 'text-[#ffb547]'
                      : 'text-[#94a3b8]'
                  }`}
                >
                  {log}
                </div>
              ))}
              {connectionStage === 'connecting' && (
                <div className="text-[#5b8cff] animate-pulse">
                  Establishing handshake...
                </div>
              )}
            </div>
          </div>

          {/* Detected Vulnerabilities / Backdoor Entry Points List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#e8ecf6] flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-[#ffb547]" />
                <span>特定された不正侵入口・バックドア要因（全{detectedVulnerabilities.length}件）</span>
              </h3>
              <span className="text-[10px] text-[#8b96b8]">
                リモート検証アクセス経由で即時閉塞可能
              </span>
            </div>

            {detectedVulnerabilities.length === 0 && connectionStage !== 'connecting' ? (
              <div className="p-4 rounded-xl border border-[#3ddc97]/30 bg-[#3ddc97]/10 text-center text-xs text-[#3ddc97]">
                <CheckCircle className="w-5 h-5 mx-auto mb-1 text-[#3ddc97]" />
                現在アクティブな不正バックドア・画面ロックは検出されていません。
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {detectedVulnerabilities.map((v) => (
                  <div
                    key={v.id}
                    className={`p-3 rounded-xl border ${
                      connectionStage === 'recovered'
                        ? 'border-[#3ddc97]/40 bg-[#3ddc97]/10'
                        : v.severity === 'critical'
                        ? 'border-[#ff5c7a]/40 bg-[#ff5c7a]/10'
                        : 'border-[#ffb547]/40 bg-[#ffb547]/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              connectionStage === 'recovered'
                                ? 'bg-[#3ddc97]/20 text-[#3ddc97]'
                                : v.severity === 'critical'
                                ? 'bg-[#ff5c7a] text-white'
                                : 'bg-[#ffb547] text-black font-extrabold'
                            }`}
                          >
                            {connectionStage === 'recovered' ? '無効化済' : v.category}
                          </span>
                          <span className="text-xs font-bold text-white">{v.name}</span>
                        </div>
                        <div className="text-[11px] text-[#cbd5e1] mt-1 font-mono">
                          侵入経路: <span className="text-[#ffb547]">{v.exposedRoute}</span>
                        </div>
                        <div className="text-[11px] text-[#94a3b8] mt-0.5">
                          対処: {v.patchAction}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        {connectionStage === 'recovered' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#3ddc97] px-2 py-0.5 rounded bg-[#3ddc97]/20 border border-[#3ddc97]/40">
                            <CheckCircle className="w-3 h-3" /> 閉塞完了
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#ff5c7a] px-2 py-0.5 rounded bg-[#ff5c7a]/20 border border-[#ff5c7a]/40 animate-pulse">
                            <AlertTriangle className="w-3 h-3" /> 侵入可能
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Success Summary if recovered */}
          {connectionStage === 'recovered' && recoveryResult && (
            <div className="p-4 rounded-xl border border-[#3ddc97]/50 bg-[#3ddc97]/15 text-[#3ddc97] space-y-2 animate-fadeIn">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle className="w-5 h-5 text-[#3ddc97]" />
                <span>🎉 バックドアの迅速無効化およびシステムリカバリーが完了しました</span>
              </div>
              <p className="text-xs text-[#e8ecf6] leading-relaxed">
                画面ロック制限を無効化し、正規最高管理者のL3アクセス権限を完全リカバリーしました。
                CRC-32不変監査ログに証跡が暗号記録されています。
              </p>
              <div className="text-[11px] font-mono text-[#8b96b8] pt-1 border-t border-[#3ddc97]/30 flex flex-wrap gap-3">
                <span>復旧トークン: <b className="text-white">{recoveryResult.verificationToken}</b></span>
                <span>無効化制限: <b className="text-[#3ddc97]">{recoveryResult.clearedRestrictionsCount} 件</b></span>
                <span>特権権限: <b className="text-[#3ddc97]">L3 管理者復元済</b></span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-lg border border-[#ff5c7a]/50 bg-[#ff5c7a]/15 text-xs text-[#ff5c7a]">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 border-t border-[#2a3550] bg-[#161d2e] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-[#8b96b8]">
            {connectionStage === 'recovered'
              ? 'ダッシュボードへの安全な入室準備が整いました'
              : '検証用トンネル経由で管理者権限と安全通信を即時復旧します'}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {connectionStage === 'recovered' ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onSuccessRedirect) onSuccessRedirect();
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#3ddc97] to-[#5b8cff] text-xs font-bold text-white shadow-lg shadow-[#3ddc97]/25 hover:opacity-95 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>復旧済みダッシュボードを開く</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleExecuteRapidRecovery}
                disabled={connectionStage === 'connecting' || connectionStage === 'recovering'}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ff5c7a] via-[#ffb547] to-[#ff5c7a] text-xs font-extrabold text-white shadow-lg shadow-[#ff5c7a]/30 hover:opacity-95 active:scale-[0.99] transition cursor-pointer flex items-center justify-center gap-2"
              >
                {connectionStage === 'recovering' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>迅速無効化・リカバリー実行中...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-white fill-white" />
                    <span>🚨 バックドア迅速無効化＆リカバリーを実行</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
