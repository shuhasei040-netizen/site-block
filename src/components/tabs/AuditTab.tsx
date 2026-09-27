import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileX,
  UserX,
  Moon,
  Globe,
  Key,
  UserPlus,
  Lock,
  CheckCircle,
  AlertCircle,
  Crosshair,
  RefreshCw,
  Wrench,
  Award,
  Zap,
  ChevronDown,
  ChevronUp,
  Search,
  ArrowRight,
  Radio,
  Server,
  Laptop,
  Network,
  PlusCircle,
  DownloadCloud,
  Layers,
  HardDrive,
  ArrowDownCircle,
} from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';
import { analyzeThreatPatterns } from '../../utils/threatEngine';
import { simulateUrlPenetrationRoute, UrlRouteSimulationReport } from '../../utils/urlRouteSimulator';
import { simulateInboundDevicePenetration, InboundPenetrationReport } from '../../utils/inboundPenetrationSimulator';

export const AuditTab: React.FC = () => {
  const {
    sites,
    restrictions,
    logs,
    accounts,
    simulateTamperAttack,
    backdoorReport,
    runDeepBackdoorAudit,
    setIsBackdoorAlertOpen,
    postureReport,
    isPostureEvaluating,
    runPostureEvaluation,
    autoHardenVulnerabilities,
    executeEmergencyPatch,
    lastEmergencyPatchResult,
    notificationPermission,
    requestNotificationPermission,
    applyRestriction,
    addLogEntry,
    pwaShieldActive,
    togglePwaSandboxShield,
  } = useSecurity();

  const [expandedScenarioId, setExpandedScenarioId] = useState<string | null>(null);
  const [hardenFeedback, setHardenFeedback] = useState<{ count: number; details: string[] } | null>(null);
  const [isEmergencyPatchRunning, setIsEmergencyPatchRunning] = useState<boolean>(false);
  const [emergencyPatchNotice, setEmergencyPatchNotice] = useState<string | null>(null);

  // URL指定型・通信経路侵入診断ステート
  const [targetUrlInput, setTargetUrlInput] = useState<string>('https://suspicious-external-c2.net:8443/ws');
  const [urlSimulationReport, setUrlSimulationReport] = useState<UrlRouteSimulationReport | null>(null);
  const [inboundReport, setInboundReport] = useState<InboundPenetrationReport | null>(null);
  const [urlDiagnosticMode, setUrlDiagnosticMode] = useState<'both' | 'outbound' | 'inbound'>('both');
  const [isSimulatingRoute, setIsSimulatingRoute] = useState<boolean>(false);
  const [urlBlockSuccessMsg, setUrlBlockSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!postureReport && !isPostureEvaluating) {
      runPostureEvaluation();
    }
  }, [postureReport, isPostureEvaluating, runPostureEvaluation]);

  const handleAutoHarden = () => {
    const res = autoHardenVulnerabilities();
    setHardenFeedback({ count: res.fixedCount, details: res.details });
    setTimeout(() => {
      setHardenFeedback(null);
    }, 6000);
  };

  const handleRunUrlRouteSimulation = (overrideUrl?: string) => {
    const raw = (overrideUrl || targetUrlInput).trim();
    if (!raw) return;
    setIsSimulatingRoute(true);
    setUrlBlockSuccessMsg(null);

    setTimeout(() => {
      const report = simulateUrlPenetrationRoute(raw, sites, restrictions);
      setUrlSimulationReport(report);

      const isSiteBlocked =
        sites.some((s) => s.status === 'blocked' && (report.hostname.includes(s.url.toLowerCase()) || s.url.toLowerCase().includes(report.hostname))) ||
        restrictions.some((r) => r.status === 'active' && `${r.title} ${r.reason}`.toLowerCase().includes(report.hostname));

      const inbReport = simulateInboundDevicePenetration(raw, pwaShieldActive, isSiteBlocked);
      setInboundReport(inbReport);

      setIsSimulatingRoute(false);
      addLogEntry(
        `URL通信経路＆インバウンド端末侵入診断実施: ${report.hostname} (経路リスク: ${report.riskScore}/100, 端末防御力: ${inbReport.overallDefensePower}/100)`,
        'AUDIT',
        report.overallRouteStatus === 'securely_blocked' ? 'success' : report.overallRouteStatus === 'monitored_safe' ? 'info' : 'warning'
      );
    }, 600);
  };

  const handleBlockDiscoveredUrl = () => {
    if (!urlSimulationReport) return;
    const res = applyRestriction({
      type: 'site_block',
      title: `危険通信経路遮断: ${urlSimulationReport.hostname}`,
      reason: `擬似侵入テストにて検出された不正通信・迂回リスク（スコア:${urlSimulationReport.riskScore}）に対する緊急遮断`,
      targetScope: 'sites',
      durationMinutes: 1440,
    });
    if (res.success) {
      setUrlBlockSuccessMsg(`「${urlSimulationReport.hostname}」への通信経路を即時遮断ルールに登録しました`);
      setTimeout(() => {
        handleRunUrlRouteSimulation(urlSimulationReport.targetUrl);
      }, 500);
    }
  };

  const activeRestrictions = restrictions.filter((r) => r.status === 'active');
  const highCredibility = activeRestrictions.filter((r) => r.credibilityScore >= 70);
  const mediumCredibility = activeRestrictions.filter((r) => r.credibilityScore >= 40 && r.credibilityScore < 70);
  const lowCredibility = activeRestrictions.filter((r) => r.credibilityScore < 40);

  const threatAnalysis = analyzeThreatPatterns(logs, restrictions, accounts);

  const getPatternIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShieldAlert':
        return <ShieldAlert className="w-5 h-5 text-[#ff5c7a]" />;
      case 'UserX':
        return <UserX className="w-5 h-5 text-[#ff5c7a]" />;
      case 'FileX':
        return <FileX className="w-5 h-5 text-[#ff5c7a]" />;
      case 'Moon':
        return <Moon className="w-5 h-5 text-[#ffb547]" />;
      case 'Globe':
        return <Globe className="w-5 h-5 text-[#ffb547]" />;
      case 'Key':
        return <Key className="w-5 h-5 text-[#ffb547]" />;
      case 'UserPlus':
      default:
        return <UserPlus className="w-5 h-5 text-[#ffb547]" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Backdoor & Evasion Audit Banner Card */}
      <div className="rounded-xl border border-[#ff5c7a]/40 bg-gradient-to-r from-[#161d2e] via-[#0f1420] to-[#161d2e] p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-xl bg-[#ff5c7a]/20 border border-[#ff5c7a]/40 text-[#ff5c7a]">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-white">
                🛡️ 全ブロック・バックドア＆バイパス自動診断エンジン
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#3ddc97]/20 text-[#3ddc97] font-semibold border border-[#3ddc97]/30">
                PWA常時リアルタイム監視
              </span>
            </div>
            <p className="text-xs text-[#8b96b8] mt-1 max-w-2xl leading-relaxed">
              登録されたすべてのサイトブロック・アクセス遮断ルール・未検証特権アカウント・CRC-32ログ改ざんを網羅的に検査し、潜むバックドアや回避ルートを即座に発見・通知します。
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
          {notificationPermission !== 'granted' && (
            <button
              onClick={requestNotificationPermission}
              className="px-3 py-2 rounded-lg border border-[#ffb547]/50 bg-[#ffb547]/10 hover:bg-[#ffb547]/20 text-xs font-bold text-[#ffb547] transition cursor-pointer"
            >
              🔔 即時通知を許可
            </button>
          )}

          <button
            onClick={async () => {
              setIsEmergencyPatchRunning(true);
              const res = await executeEmergencyPatch();
              setIsEmergencyPatchRunning(false);
              setEmergencyPatchNotice(`緊急遠隔検証アクセスを確立し、${res.patchedVulnerabilities.length}件のバックドア・脆弱性に閉塞パッチを適用しました（トークン: ${res.verificationToken}）`);
              setTimeout(() => setEmergencyPatchNotice(null), 8000);
            }}
            disabled={isEmergencyPatchRunning}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#ff5c7a]/50 bg-[#ff5c7a]/15 hover:bg-[#ff5c7a]/25 text-xs font-bold text-[#ff5c7a] transition cursor-pointer active:scale-95"
            title="対象サイトによるロック制限下において、残存バックドア通信経路を介して緊急遠隔検証アクセスを確立し、脆弱性パッチ（閉塞）を適用"
          >
            <Wrench className={`w-3.5 h-3.5 ${isEmergencyPatchRunning ? 'animate-spin' : ''}`} />
            <span>{isEmergencyPatchRunning ? '閉塞パッチ適用中...' : '🚨 緊急検証＆閉塞パッチ'}</span>
          </button>

          <button
            onClick={() => {
              const res = runDeepBackdoorAudit(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-[#ff416c] to-[#ff5c7a] hover:opacity-90 active:scale-95 text-xs font-bold text-white shadow-lg shadow-[#ff5c7a]/20 transition cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>全ブロックのバックドアを点検</span>
          </button>
        </div>
      </div>

      {/* Emergency Patch Feedback Banner */}
      {emergencyPatchNotice && (
        <div className="p-4 rounded-xl bg-[#3ddc97]/15 border border-[#3ddc97]/40 text-xs text-[#3ddc97] flex items-start justify-between gap-3 animate-fadeIn">
          <div className="flex items-start gap-2.5">
            <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm">✅ ロック制限下の緊急遠隔検証アクセス確立 ＆ 閉塞パッチ適用完了</div>
              <div className="text-xs text-[#e8ecf6] mt-1">{emergencyPatchNotice}</div>
              {lastEmergencyPatchResult && lastEmergencyPatchResult.actionsTaken.length > 0 && (
                <ul className="mt-2 list-disc list-inside space-y-0.5 text-[11px] text-[#cbd5e1]">
                  {lastEmergencyPatchResult.actionsTaken.map((act, i) => (
                    <li key={i}>{act}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <button
            onClick={() => setEmergencyPatchNotice(null)}
            className="text-[#8b96b8] hover:text-white text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 模擬侵入テスト＆システム防御態勢評価（Posture Evaluation & Threat Simulation） */}
      <div className="rounded-xl border border-[#5b8cff]/30 bg-[#0f1420] p-5 shadow-lg space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#2a3550] gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#5b8cff]/15 border border-[#5b8cff]/30 text-[#5b8cff]">
              <Crosshair className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm md:text-base text-white">
                  模擬侵入＆防御態勢評価シミュレーション（Posture Evaluation）
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#5b8cff]/20 text-[#5b8cff] font-mono border border-[#5b8cff]/30">
                  MITRE ATT&CK / OWASP
                </span>
              </div>
              <p className="text-xs text-[#8b96b8] mt-0.5">
                外部C2迂回、特権昇格、ログ改ざん、DoS攻撃シナリオを安全に模擬テストし、システムの防御強度をスコアリングします。
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center">
            {postureReport && (postureReport.summary.vulnerableCount > 0 || postureReport.summary.warningCount > 0) && (
              <button
                onClick={handleAutoHarden}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#3ddc97]/15 hover:bg-[#3ddc97]/25 border border-[#3ddc97]/40 text-[#3ddc97] text-xs font-bold transition active:scale-95 cursor-pointer shadow-sm"
                title="発見された脆弱性（未検証管理者・低信頼度制限等）を一括修正"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>脆弱性を自動堅牢化</span>
              </button>
            )}

            <button
              onClick={() => runPostureEvaluation()}
              disabled={isPostureEvaluating}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white transition active:scale-95 shadow-md cursor-pointer ${
                isPostureEvaluating
                  ? 'bg-[#2a3550] cursor-not-allowed opacity-70'
                  : 'bg-gradient-to-r from-[#3b82f6] to-[#5b8cff] hover:opacity-90 shadow-[#5b8cff]/20'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPostureEvaluating ? 'animate-spin' : ''}`} />
              <span>{isPostureEvaluating ? '模擬侵入テスト中...' : '模擬侵入テストを実行'}</span>
            </button>
          </div>
        </div>

        {/* Auto-Harden Feedback Banner */}
        {hardenFeedback && (
          <div className="p-3.5 rounded-lg bg-[#3ddc97]/10 border border-[#3ddc97]/40 text-xs text-[#3ddc97] flex items-start gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">自動堅牢化（Auto-Harden）が完了しました（{hardenFeedback.count}件の脆弱性を是正）</div>
              <ul className="mt-1 list-disc list-inside space-y-0.5 text-[11px] text-[#e8ecf6]">
                {hardenFeedback.details.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Posture Score & Metrics */}
        {postureReport ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-[#161d2e] border border-[#2a3550] flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-[#8b96b8]">総合防御態勢スコア</div>
                  <div className="text-2xl font-black font-mono text-white mt-0.5">
                    {postureReport.overallScore} <span className="text-xs text-[#8b96b8] font-normal">/ 100</span>
                  </div>
                </div>
                <div
                  className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                    postureReport.overallScore >= 80
                      ? 'bg-[#3ddc97]/15 text-[#3ddc97] border-[#3ddc97]/30'
                      : postureReport.overallScore >= 60
                      ? 'bg-[#ffb547]/15 text-[#ffb547] border-[#ffb547]/30'
                      : 'bg-[#ff5c7a]/15 text-[#ff5c7a] border-[#ff5c7a]/30'
                  }`}
                >
                  {postureReport.defenseRating}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#161d2e] border border-[#2a3550] flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-[#8b96b8]">防衛成功シナリオ</div>
                  <div className="text-xl font-bold font-mono text-[#3ddc97] mt-0.5">
                    {postureReport.summary.defendedCount} <span className="text-xs text-[#8b96b8] font-normal">/ {postureReport.summary.totalTests}</span>
                  </div>
                </div>
                <CheckCircle className="w-5 h-5 text-[#3ddc97]" />
              </div>

              <div className="p-3.5 rounded-xl bg-[#161d2e] border border-[#2a3550] flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-[#8b96b8]">要警戒シナリオ</div>
                  <div className="text-xl font-bold font-mono text-[#ffb547] mt-0.5">
                    {postureReport.summary.warningCount} 件
                  </div>
                </div>
                <AlertTriangle className="w-5 h-5 text-[#ffb547]" />
              </div>

              <div className="p-3.5 rounded-xl bg-[#161d2e] border border-[#2a3550] flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-[#8b96b8]">脆弱性検知</div>
                  <div className="text-xl font-bold font-mono text-[#ff5c7a] mt-0.5">
                    {postureReport.summary.vulnerableCount} 件
                  </div>
                </div>
                <ShieldAlert className="w-5 h-5 text-[#ff5c7a]" />
              </div>
            </div>

            {/* Test Scenarios Accordion List */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-[#8b96b8] flex items-center justify-between px-1">
                <span>模擬侵入テストケース結果（全{postureReport.scenarios.length}件）</span>
                <span className="text-[11px] text-[#5b8cff]">クリックで詳細・攻撃メカニズム・防御対策を表示</span>
              </div>

              {postureReport.scenarios.map((sc) => {
                const isExpanded = expandedScenarioId === sc.id;
                const statusBadge =
                  sc.status === 'defended' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#3ddc97]/15 text-[#3ddc97] border border-[#3ddc97]/30 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> 防衛成功
                    </span>
                  ) : sc.status === 'warning' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ffb547]/15 text-[#ffb547] border border-[#ffb547]/30 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> 要警戒 (-{sc.scoreImpact}点)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ff5c7a]/20 text-[#ff5c7a] border border-[#ff5c7a]/40 flex items-center gap-1 animate-pulse">
                      <ShieldAlert className="w-3 h-3" /> 脆弱性検知 (-{sc.scoreImpact}点)
                    </span>
                  );

                return (
                  <div
                    key={sc.id}
                    className={`rounded-xl border transition-all ${
                      sc.status === 'vulnerable'
                        ? 'bg-[#161d2e] border-[#ff5c7a]/40'
                        : sc.status === 'warning'
                        ? 'bg-[#161d2e] border-[#ffb547]/40'
                        : 'bg-[#161d2e]/80 border-[#2a3550]'
                    }`}
                  >
                    <button
                      onClick={() => setExpandedScenarioId(isExpanded ? null : sc.id)}
                      className="w-full p-3.5 flex items-center justify-between text-left cursor-pointer hover:bg-white/[0.02] transition rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#0f1420] text-[#5b8cff] border border-[#2a3550]">
                          {sc.id}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{sc.name}</span>
                            <span className="text-[10px] font-mono text-[#8b96b8]">[{sc.category}]</span>
                          </div>
                          <div className="text-[11px] text-[#8b96b8] mt-0.5 font-mono">
                            MITRE: {sc.mitreTechnique}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {statusBadge}
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-[#8b96b8]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#8b96b8]" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-[#2a3550]/60 space-y-3 text-xs">
                        <div className="p-2.5 rounded-lg bg-[#0f1420] border border-[#2a3550]">
                          <div className="text-[11px] font-bold text-[#5b8cff] flex items-center gap-1.5 mb-1">
                            <Crosshair className="w-3.5 h-3.5" />
                            <span>模擬侵入ベクトル (Simulated Attack Vector)</span>
                          </div>
                          <p className="text-[#cbd5e1] leading-relaxed">{sc.simulatedAttackVector}</p>
                        </div>

                        {sc.observedWeakness && (
                          <div className="p-2.5 rounded-lg bg-[#ff5c7a]/10 border border-[#ff5c7a]/30">
                            <div className="text-[11px] font-bold text-[#ff5c7a] flex items-center gap-1.5 mb-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>検出された脆弱性・設定不備 (Observed Weakness)</span>
                            </div>
                            <p className="text-[#ffd6dd] leading-relaxed">{sc.observedWeakness}</p>
                          </div>
                        )}

                        <div className="p-2.5 rounded-lg bg-[#0f1420] border border-[#2a3550]">
                          <div className="text-[11px] font-bold text-[#3ddc97] flex items-center gap-1.5 mb-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>防御メカニズム (Defense Mechanics)</span>
                          </div>
                          <p className="text-[#cbd5e1] leading-relaxed">{sc.defenseMechanics}</p>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#3b82f6]/10 border border-[#3b82f6]/30">
                          <div className="text-[11px] font-bold text-[#60a5fa] flex items-center gap-1.5 mb-1">
                            <Wrench className="w-3.5 h-3.5" />
                            <span>推奨対策手順 (Remediation Guidance)</span>
                          </div>
                          <p className="text-[#e2e8f0] leading-relaxed">{sc.remediation}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-[#161d2e] rounded-xl border border-dashed border-[#2a3550]">
            <p className="text-xs text-[#8b96b8]">
              「模擬侵入テストを実行」をクリックすると、現在のシステムルール・アカウント・ログに対する防御態勢評価が開始されます。
            </p>
          </div>
        )}
      </div>

      {/* 対象URL・通信経路擬似侵入診断パネル */}
      <div className="rounded-xl border border-[#9d4edd]/30 bg-[#0f1420] p-5 shadow-lg space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#2a3550] gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#9d4edd]/15 border border-[#9d4edd]/30 text-[#c77dff]">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm md:text-base text-white">
                  対象URL通信経路・擬似侵入テスト（Path Penetration & Evasion Diagnostic）
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#9d4edd]/20 text-[#c77dff] font-mono border border-[#9d4edd]/30">
                  侵入経路特定・端末保護
                </span>
              </div>
              <p className="text-xs text-[#8b96b8] mt-0.5">
                調べたい対象URLを入力し、端末〜宛先間の通信経路上に潜むバックドア、DNS迂回、平文盗聴（MitM）、不正トンネリングの有無を安全に模擬検証します。
              </p>
            </div>
          </div>
        </div>

        {/* URL Input Form & Quick Presets */}
        <div className="space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRunUrlRouteSimulation();
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8b96b8]">
                <Globe className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={targetUrlInput}
                onChange={(e) => setTargetUrlInput(e.target.value)}
                placeholder="https://example.com または http://, 192.168.x.x:8443 を入力"
                className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-[#161d2e] border border-[#2a3550] focus:border-[#9d4edd] focus:outline-none text-white text-xs font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isSimulatingRoute || !targetUrlInput.trim()}
              className={`flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-bold text-white transition active:scale-95 shadow-md cursor-pointer shrink-0 ${
                isSimulatingRoute || !targetUrlInput.trim()
                  ? 'bg-[#2a3550] cursor-not-allowed opacity-60'
                  : 'bg-gradient-to-r from-[#7b2cbf] to-[#9d4edd] hover:opacity-90 shadow-[#9d4edd]/20'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSimulatingRoute ? 'animate-spin' : ''}`} />
              <span>{isSimulatingRoute ? '通信経路を診断中...' : '侵入経路テストを実行'}</span>
            </button>
          </form>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#8b96b8]">
            <span className="font-semibold text-[#8b96b8]">検証用プリセット:</span>
            {[
              { label: '平文HTTP盗聴 (MitM)', url: 'http://insecure-internal-login.local' },
              { label: 'IP直打ち・ポート迂回 (:8443)', url: 'https://192.168.1.150:8443/ws' },
              { label: '偽装フィッシング (Punycode)', url: 'https://goog1e-security-verify.net' },
              { label: '標準正規サイト', url: 'https://developer.mozilla.org' },
            ].map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setTargetUrlInput(p.url);
                  handleRunUrlRouteSimulation(p.url);
                }}
                className="px-2 py-0.5 rounded bg-[#161d2e] hover:bg-[#20293d] border border-[#2a3550] text-[#c77dff] hover:text-white transition cursor-pointer text-[10px] font-mono"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Success message banner when blocked */}
        {urlBlockSuccessMsg && (
          <div className="p-3 rounded-lg bg-[#3ddc97]/15 border border-[#3ddc97]/40 text-xs text-[#3ddc97] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{urlBlockSuccessMsg}</span>
            </div>
            <button
              onClick={() => setUrlBlockSuccessMsg(null)}
              className="text-[#8b96b8] hover:text-white text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Simulation Output Report */}
        {urlSimulationReport && (
          <div className="space-y-4 pt-2 border-t border-[#2a3550]">
            {/* View Mode Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#2a3550]">
              <div className="flex items-center gap-1 bg-[#161d2e] p-1 rounded-lg border border-[#2a3550]">
                <button
                  type="button"
                  onClick={() => setUrlDiagnosticMode('both')}
                  className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                    urlDiagnosticMode === 'both' ? 'bg-[#9d4edd] text-white shadow-sm' : 'text-[#8b96b8] hover:text-white'
                  }`}
                >
                  🔄 双方向（全体）
                </button>
                <button
                  type="button"
                  onClick={() => setUrlDiagnosticMode('outbound')}
                  className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                    urlDiagnosticMode === 'outbound' ? 'bg-[#5b8cff] text-white shadow-sm' : 'text-[#8b96b8] hover:text-white'
                  }`}
                >
                  📤 通信経路 (端末 ➔ 宛先)
                </button>
                <button
                  type="button"
                  onClick={() => setUrlDiagnosticMode('inbound')}
                  className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                    urlDiagnosticMode === 'inbound' ? 'bg-[#ff5c7a] text-white shadow-sm' : 'text-[#8b96b8] hover:text-white'
                  }`}
                >
                  📥 侵入実証 (宛先 ➔ 端末)
                </button>
              </div>

              <div className="text-[11px] text-[#8b96b8] font-mono">
                Target: <span className="text-[#c77dff] font-bold">{urlSimulationReport.hostname}</span>
              </div>
            </div>

            {/* Outbound Route Section */}
            {(urlDiagnosticMode === 'both' || urlDiagnosticMode === 'outbound') && (
              <div className="space-y-4">
                {/* Visual Penetration Path Map */}
                <div className="p-4 rounded-xl bg-[#161d2e] border border-[#2a3550] space-y-3">
                  <div className="text-xs font-bold text-white flex items-center justify-between">
                    <span>通信経路シミュレーション・フロー（端末 ➔ フィルタ ➔ 宛先）</span>
                    <span className="text-[11px] font-mono text-[#8b96b8]">
                      {urlSimulationReport.protocol}//:{urlSimulationReport.port}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                    {/* Node 1: Device Layer */}
                    <div className="p-3 rounded-lg bg-[#0f1420] border border-[#2a3550] flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        urlSimulationReport.pathVisual.deviceLayer === 'protected'
                          ? 'bg-[#3ddc97]/20 text-[#3ddc97]'
                          : 'bg-[#ff5c7a]/20 text-[#ff5c7a]'
                      }`}>
                        <Laptop className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[10px] text-[#8b96b8]">発信元</div>
                        <div className="text-xs font-bold text-white">ローカル端末 / PWA</div>
                        <div className="text-[10px] mt-0.5 text-[#3ddc97]">サンドボックス稼働中</div>
                      </div>
                    </div>

                    {/* Node 2: Filter Layer */}
                    <div className="p-3 rounded-lg bg-[#0f1420] border border-[#2a3550] flex items-center gap-3 relative">
                      <div className={`p-2 rounded-lg ${
                        urlSimulationReport.pathVisual.filterLayer === 'dropped'
                          ? 'bg-[#3ddc97]/20 text-[#3ddc97]'
                          : urlSimulationReport.pathVisual.filterLayer === 'bypassed'
                          ? 'bg-[#ff5c7a]/20 text-[#ff5c7a] animate-pulse'
                          : 'bg-[#ffb547]/20 text-[#ffb547]'
                      }`}>
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[10px] text-[#8b96b8]">中間防御</div>
                        <div className="text-xs font-bold text-white">ローカルACL・ブロック層</div>
                        <div className="text-[10px] mt-0.5 font-bold">
                          {urlSimulationReport.pathVisual.filterLayer === 'dropped' && (
                            <span className="text-[#3ddc97]">🚫 トラフィック遮断成功</span>
                          )}
                          {urlSimulationReport.pathVisual.filterLayer === 'bypassed' && (
                            <span className="text-[#ff5c7a]">⚠️ 迂回経路が露出</span>
                          )}
                          {urlSimulationReport.pathVisual.filterLayer === 'allowed' && (
                            <span className="text-[#ffb547]">⚪ ルール未設定（通過可能）</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Node 3: Target Layer */}
                    <div className="p-3 rounded-lg bg-[#0f1420] border border-[#2a3550] flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        urlSimulationReport.pathVisual.destinationLayer === 'safe'
                          ? 'bg-[#3ddc97]/20 text-[#3ddc97]'
                          : urlSimulationReport.pathVisual.destinationLayer === 'suspicious'
                          ? 'bg-[#ffb547]/20 text-[#ffb547]'
                          : 'bg-[#ff5c7a]/20 text-[#ff5c7a]'
                      }`}>
                        <Server className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[10px] text-[#8b96b8]">通信宛先</div>
                        <div className="text-xs font-bold text-white truncate max-w-[120px]">{urlSimulationReport.hostname}</div>
                        <div className="text-[10px] mt-0.5">
                          {urlSimulationReport.overallRouteStatus === 'securely_blocked' ? (
                            <span className="text-[#3ddc97] font-semibold">到達不可 (安全)</span>
                          ) : urlSimulationReport.overallRouteStatus === 'bypass_risk_detected' ? (
                            <span className="text-[#ff5c7a] font-bold">不正接続リスク大</span>
                          ) : (
                            <span className="text-[#8b96b8]">通常監視対象</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick action bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-[#161d2e] border border-[#2a3550] gap-3">
                  <div className="flex items-center gap-3">
                    <div className="text-xs">
                      <span className="text-[#8b96b8]">経路危険度リスクスコア: </span>
                      <span className={`font-mono font-black text-base ml-1 ${
                        urlSimulationReport.riskScore >= 40
                          ? 'text-[#ff5c7a]'
                          : urlSimulationReport.riskScore > 0
                          ? 'text-[#ffb547]'
                          : 'text-[#3ddc97]'
                      }`}>
                        {urlSimulationReport.riskScore} / 100
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      urlSimulationReport.overallRouteStatus === 'securely_blocked'
                        ? 'bg-[#3ddc97]/20 text-[#3ddc97] border-[#3ddc97]/40'
                        : urlSimulationReport.overallRouteStatus === 'bypass_risk_detected'
                        ? 'bg-[#ff5c7a]/20 text-[#ff5c7a] border-[#ff5c7a]/40 animate-pulse'
                        : 'bg-[#ffb547]/20 text-[#ffb547] border-[#ffb547]/40'
                    }`}>
                      {urlSimulationReport.overallRouteStatus === 'securely_blocked' && '🔒 安全に遮断中'}
                      {urlSimulationReport.overallRouteStatus === 'bypass_risk_detected' && '🚨 迂回・侵入リスク検知'}
                      {urlSimulationReport.overallRouteStatus === 'monitored_safe' && '🛡️ 監視対象'}
                    </span>
                  </div>

                  {urlSimulationReport.overallRouteStatus !== 'securely_blocked' && (
                    <button
                      onClick={handleBlockDiscoveredUrl}
                      className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-[#ff416c] to-[#ff5c7a] hover:opacity-90 active:scale-95 text-xs font-bold text-white shadow-md cursor-pointer transition"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>この通信経路を即時ブロック</span>
                    </button>
                  )}
                </div>

                {/* Step-by-step diagnostic test results */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#8b96b8] px-1">
                    通信経路・迂回テスト結果詳細（全{urlSimulationReport.steps.length}項目）
                  </div>

                  {urlSimulationReport.steps.map((st) => (
                    <div
                      key={st.stepId}
                      className={`p-3.5 rounded-xl border ${
                        st.status === 'open_bypass'
                          ? 'bg-[#161d2e] border-[#ff5c7a]/40'
                          : st.status === 'warning'
                          ? 'bg-[#161d2e] border-[#ffb547]/40'
                          : 'bg-[#161d2e]/70 border-[#2a3550]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-[#0f1420] text-[#5b8cff]">
                              Step {st.stepId}
                            </span>
                            <span className="text-xs font-bold text-white">{st.name}</span>
                            <span className="text-[10px] font-mono text-[#8b96b8]">[{st.category}]</span>
                          </div>
                          <p className="text-xs text-[#cbd5e1] mt-1.5 leading-relaxed">{st.description}</p>
                        </div>

                        <div className="shrink-0">
                          {st.status === 'blocked' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#3ddc97]/15 text-[#3ddc97] border border-[#3ddc97]/30 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> 遮断・正常
                            </span>
                          ) : st.status === 'warning' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ffb547]/15 text-[#ffb547] border border-[#ffb547]/30 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> 要注意
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ff5c7a]/20 text-[#ff5c7a] border border-[#ff5c7a]/40 flex items-center gap-1 animate-pulse">
                              <ShieldAlert className="w-3 h-3" /> 抜け道検知
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Simulated attack & remediation */}
                      <div className="mt-3 pt-2.5 border-t border-[#2a3550]/60 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2 rounded bg-[#0f1420] border border-[#2a3550]/60">
                          <span className="font-bold text-[#c77dff] block mb-0.5">模擬侵入シナリオ:</span>
                          <span className="text-[#94a3b8]">{st.attackVectorSimulated}</span>
                        </div>
                        <div className="p-2 rounded bg-[#0f1420] border border-[#2a3550]/60">
                          <span className="font-bold text-[#3ddc97] block mb-0.5">防御的対策手順:</span>
                          <span className="text-[#94a3b8]">{st.remediation}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inbound Penetration & Device Containment Section */}
            {(urlDiagnosticMode === 'both' || urlDiagnosticMode === 'inbound') && inboundReport && (
              <div className="space-y-4 pt-4 border-t border-[#2a3550]">
                {/* Header Card */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-[#161d2e] via-[#1a1528] to-[#161d2e] border border-[#ff5c7a]/30 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-[#ff5c7a]/20 text-[#ff5c7a]">
                        <ArrowDownCircle className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">
                            対象サイト ➔ デバイスへの擬似侵入ルート実証
                          </h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            inboundReport.overallDefensePower >= 85
                              ? 'bg-[#3ddc97]/20 text-[#3ddc97] border-[#3ddc97]/40'
                              : inboundReport.overallDefensePower >= 60
                              ? 'bg-[#ffb547]/20 text-[#ffb547] border-[#ffb547]/40'
                              : 'bg-[#ff5c7a]/20 text-[#ff5c7a] border-[#ff5c7a]/40 animate-pulse'
                          }`}>
                            {inboundReport.containmentRating}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#8b96b8] mt-0.5 font-mono">
                          Origin: {inboundReport.hostname}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-[10px] text-[#8b96b8]">端末防御・封じ込め強度</div>
                        <div className={`font-mono font-black text-xl ${
                          inboundReport.overallDefensePower >= 85
                            ? 'text-[#3ddc97]'
                            : inboundReport.overallDefensePower >= 60
                            ? 'text-[#ffb547]'
                            : 'text-[#ff5c7a]'
                        }`}>
                          {inboundReport.overallDefensePower} <span className="text-xs text-[#8b96b8] font-normal">/ 100</span>
                        </div>
                      </div>

                      {!pwaShieldActive && (
                        <button
                          type="button"
                          onClick={togglePwaSandboxShield}
                          className="px-3 py-1.5 rounded-lg bg-[#5b8cff]/20 hover:bg-[#5b8cff]/30 border border-[#5b8cff]/40 text-xs font-bold text-[#5b8cff] transition cursor-pointer"
                        >
                          🛡️ PWAシールド起動
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-[#cbd5e1] leading-relaxed bg-[#0f1420]/80 p-2.5 rounded-lg border border-[#2a3550]">
                    {inboundReport.executiveSummary}
                  </p>

                  {/* Multi-Layer Containment Flow */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                    <div className={`p-2.5 rounded-lg border flex items-center gap-2.5 ${
                      inboundReport.layerStatus.networkPerimeter === 'blocked'
                        ? 'bg-[#3ddc97]/10 border-[#3ddc97]/40 text-[#3ddc97]'
                        : 'bg-[#ffb547]/10 border-[#ffb547]/40 text-[#ffb547]'
                    }`}>
                      <Layers className="w-4 h-4 shrink-0" />
                      <div>
                        <div className="font-bold text-[11px]">第1防壁: ネットワーク境界</div>
                        <div className="text-[10px] text-[#e8ecf6]">
                          {inboundReport.layerStatus.networkPerimeter === 'blocked' ? '🚫 接続パケット即時破棄' : '⚪ トラフィック受信中'}
                        </div>
                      </div>
                    </div>

                    <div className={`p-2.5 rounded-lg border flex items-center gap-2.5 ${
                      inboundReport.layerStatus.pwaSandbox === 'active_intercept'
                        ? 'bg-[#3ddc97]/10 border-[#3ddc97]/40 text-[#3ddc97]'
                        : 'bg-[#ff5c7a]/10 border-[#ff5c7a]/40 text-[#ff5c7a]'
                    }`}>
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <div>
                        <div className="font-bold text-[11px]">第2防壁: PWAサンドボックス</div>
                        <div className="text-[10px] text-[#e8ecf6]">
                          {inboundReport.layerStatus.pwaSandbox === 'active_intercept' ? '🛡️ 独立プロセス隔離' : '⚠️ 共有ブラウザ環境'}
                        </div>
                      </div>
                    </div>

                    <div className={`p-2.5 rounded-lg border flex items-center gap-2.5 ${
                      inboundReport.layerStatus.osStorageShield === 'protected'
                        ? 'bg-[#3ddc97]/10 border-[#3ddc97]/40 text-[#3ddc97]'
                        : 'bg-[#ff5c7a]/10 border-[#ff5c7a]/40 text-[#ff5c7a]'
                    }`}>
                      <HardDrive className="w-4 h-4 shrink-0" />
                      <div>
                        <div className="font-bold text-[11px]">第3防壁: OSストレージ保護</div>
                        <div className="text-[10px] text-[#e8ecf6]">
                          {inboundReport.layerStatus.osStorageShield === 'protected' ? '🔒 ファイル汚染防止' : '⚠️ 保存・実行リスク'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inbound Attack Vector Details */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#8b96b8] px-1 flex items-center justify-between">
                    <span>外部サイトからの侵入ルート実証結果（全{inboundReport.vectors.length}項目）</span>
                    <span className="text-[10px] text-[#c77dff]">サンドボックス封じ込め検証</span>
                  </div>

                  {inboundReport.vectors.map((vec) => (
                    <div
                      key={vec.id}
                      className={`p-3.5 rounded-xl border ${
                        vec.defenseStatus === 'exposed'
                          ? 'bg-[#161d2e] border-[#ff5c7a]/40'
                          : vec.defenseStatus === 'sandboxed'
                          ? 'bg-[#161d2e] border-[#ffb547]/40'
                          : 'bg-[#161d2e]/70 border-[#2a3550]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-[#0f1420] text-[#c77dff]">
                              {vec.id}
                            </span>
                            <span className="text-xs font-bold text-white">{vec.vectorName}</span>
                            <span className="text-[10px] font-mono text-[#8b96b8]">[{vec.category}]</span>
                          </div>
                          <div className="text-xs text-[#cbd5e1] mt-1.5">
                            <span className="text-[#8b96b8]">侵入経路(Entry): </span>
                            <code className="text-[11px] text-[#c77dff] font-mono">{vec.entryPoint}</code>
                          </div>
                          <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">{vec.impactAnalysis}</p>
                        </div>

                        <div className="shrink-0 text-right">
                          {vec.defenseStatus === 'contained' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#3ddc97]/15 text-[#3ddc97] border border-[#3ddc97]/30 inline-flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> 封じ込め成功
                            </span>
                          ) : vec.defenseStatus === 'sandboxed' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ffb547]/15 text-[#ffb547] border border-[#ffb547]/30 inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> サンドボックス隔離
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ff5c7a]/20 text-[#ff5c7a] border border-[#ff5c7a]/40 inline-flex items-center gap-1 animate-pulse">
                              <ShieldAlert className="w-3 h-3" /> 端末露出リスク
                            </span>
                          )}
                          <div className="text-[10px] font-mono text-[#8b96b8] mt-1">
                            阻害層: {vec.barrierHit}
                          </div>
                        </div>
                      </div>

                      {/* Simulated Payload & Hardening */}
                      <div className="mt-3 pt-2.5 border-t border-[#2a3550]/60 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2 rounded bg-[#0f1420] border border-[#2a3550]/60">
                          <span className="font-bold text-[#ffb547] block mb-0.5">試行ペイロード / 侵入挙動:</span>
                          <span className="text-[#cbd5e1] font-mono">{vec.simulatedPayload}</span>
                        </div>
                        <div className="p-2 rounded bg-[#0f1420] border border-[#2a3550]/60">
                          <span className="font-bold text-[#3ddc97] block mb-0.5">封じ込め＆防御強化策:</span>
                          <span className="text-[#cbd5e1]">{vec.hardeningFix}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>


      {/* Overview 2-column layout per prompt spec */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Restriction Verification Check */}
        <div className="rounded-xl border border-[#2a3550] bg-[#0f1420] p-5 shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#2a3550]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#5b8cff]" />
                <h3 className="font-bold text-sm text-white">制限信頼性検証チェック</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161d2e] text-[#8b96b8]">
                リアルタイム動的算出
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#161d2e] border border-[#2a3550]">
                <div className="flex items-center gap-2 text-xs">
                  <Lock className="w-4 h-4 text-[#8b96b8]" />
                  <span className="text-[#e8ecf6] font-medium">アクティブな制限総数</span>
                </div>
                <span className="text-base font-bold text-white font-mono">{activeRestrictions.length} 件</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-[#161d2e] border border-[#2a3550]">
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle className="w-4 h-4 text-[#3ddc97]" />
                  <div>
                    <div className="text-white font-semibold">信頼度70以上の制限</div>
                    <div className="text-[11px] text-[#8b96b8]">検証済み管理者による通常制限</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#3ddc97]/15 text-[#3ddc97] border border-[#3ddc97]/30">
                  {highCredibility.length} 件（信頼）
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-[#161d2e] border border-[#2a3550]">
                <div className="flex items-center gap-2 text-xs">
                  <AlertTriangle className="w-4 h-4 text-[#ffb547]" />
                  <div>
                    <div className="text-white font-semibold">信頼度40〜70の制限</div>
                    <div className="text-[11px] text-[#8b96b8]">中程度の警戒・一部ユーザー回避可能</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#ffb547]/15 text-[#ffb547] border border-[#ffb547]/30">
                  {mediumCredibility.length} 件（中程度）
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-[#ff5c7a]/10 border border-[#ff5c7a]/40">
                <div className="flex items-center gap-2 text-xs">
                  <ShieldAlert className="w-4 h-4 text-[#ff5c7a]" />
                  <div>
                    <div className="text-[#ff5c7a] font-bold">信頼度40未満の制限（赤色警告）</div>
                    <div className="text-[11px] text-[#ffb8c5]">不正制限の疑い：誰でも削除・無視可能</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#ff5c7a]/20 text-[#ff5c7a] border border-[#ff5c7a]/40 animate-pulse">
                  {lowCredibility.length} 件（危険）
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-[#161d2e] border border-[#2a3550]">
                <div className="flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 text-[#ffb547]" />
                  <span className="text-[#e8ecf6] font-medium">検知異常数（総合脅威）</span>
                </div>
                <span className="text-sm font-bold text-[#ffb547] font-mono">
                  {threatAnalysis.activeThreatCount} パターン検知
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#2a3550] text-[11px] text-[#8b96b8] leading-relaxed">
            ※ 信頼性スコア算出基準：基本100点、未検証アカウント適用(-40点)、24時間以内5件以上(-30点)、短時間管理者権限剥奪試行(-50点)。
          </div>
        </div>

        {/* Right Column: Hacker & Internal Threat Detection Patterns */}
        <div className="rounded-xl border border-[#2a3550] bg-[#0f1420] p-5 shadow">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#2a3550]">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#ff5c7a]" />
              <h3 className="font-bold text-sm text-white">ハッカー・内部不正検知パターン</h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ff5c7a]/20 text-[#ff5c7a] font-semibold">
              7項目自動監視
            </span>
          </div>

          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {threatAnalysis.patterns.map((p) => {
              const isTriggered = p.status === 'triggered';
              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-xl border transition-all ${
                    isTriggered
                      ? p.severity === 'critical'
                        ? 'bg-[#ff5c7a]/15 border-[#ff5c7a]/40 shadow-sm'
                        : 'bg-[#ffb547]/15 border-[#ffb547]/40 shadow-sm'
                      : 'bg-[#161d2e] border-[#2a3550] opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5">{getPatternIcon(p.iconName)}</div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">
                            {p.severity === 'critical' ? '🔴' : '🟡'} {p.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#8b96b8] mt-0.5 leading-snug">
                          {p.description}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {isTriggered ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.severity === 'critical'
                              ? 'bg-[#ff5c7a] text-white animate-pulse'
                              : 'bg-[#ffb547] text-black font-extrabold'
                          }`}
                        >
                          異常検知中 ({p.triggerCount})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#3ddc97]/15 text-[#3ddc97] border border-[#3ddc97]/30">
                          <CheckCircle className="w-3 h-3" />
                          <span>正常</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
