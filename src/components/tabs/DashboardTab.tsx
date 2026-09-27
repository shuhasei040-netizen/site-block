import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Users,
  Activity,
  CheckCircle,
  XCircle,
  TrendingUp,
  FileText,
  Zap,
} from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';
import { analyzeThreatPatterns } from '../../utils/threatEngine';

export const DashboardTab: React.FC<{ onNavigateTo: (tab: any) => void }> = ({ onNavigateTo }) => {
  const {
    restrictions,
    accounts,
    logs,
    isEmergencyOverridden,
    backdoorReport,
    setIsBackdoorAlertOpen,
  } = useSecurity();

  const activeRestrictions = restrictions.filter((r) => r.status === 'active');
  const suspiciousRestrictions = activeRestrictions.filter((r) => r.credibilityScore < 40);
  const verifiedAccountsCount = accounts.filter((a) => a.isVerified).length;

  const threatAnalysis = analyzeThreatPatterns(logs, restrictions, accounts);

  // Compute overall security score (0-100)
  const calcSecurityScore = () => {
    let score = 96;
    score -= suspiciousRestrictions.length * 25;
    score -= threatAnalysis.criticalCount * 20;
    score -= (threatAnalysis.activeThreatCount - threatAnalysis.criticalCount) * 10;
    if (isEmergencyOverridden) score = Math.max(score, 75); // master recovery restored stability
    return Math.max(12, Math.min(100, score));
  };

  const securityScore = calcSecurityScore();

  const getScoreColor = (sc: number) => {
    if (sc >= 80) return '#3ddc97'; // Green
    if (sc >= 50) return '#ffb547'; // Yellow
    return '#ff5c7a'; // Red
  };

  const recentLogs = logs.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Emergency Recovery Banner */}
      {isEmergencyOverridden && (
        <div className="rounded-xl border border-[#ffb547]/40 bg-[#ffb547]/10 p-4 text-[#ffb547] flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-bounce">🚨</span>
            <div>
              <div className="font-bold text-sm">
                緊急復旧（EMERGENCY OVERRIDE）が適用されています
              </div>
              <div className="text-xs text-[#8b96b8]">
                すべてのロックダウン制限は「無視モード」に変更されており、全機能の管理者アクセスが保証されています。
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigateTo('restrictions')}
            className="px-3 py-1.5 rounded-lg bg-[#ffb547] text-black font-bold text-xs hover:opacity-90 transition cursor-pointer"
          >
            制限状況を確認
          </button>
        </div>
      )}

      {/* Backdoor & Escape Route Alert Banner */}
      {backdoorReport && !backdoorReport.isSafe && (
        <div className="rounded-xl border border-[#ff5c7a]/60 bg-gradient-to-r from-[#ff5c7a]/20 via-[#ff416c]/15 to-[#ff5c7a]/20 p-4 text-[#ff5c7a] shadow-xl animate-pulse">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[#ff5c7a]/30 border border-[#ff5c7a]/50 shrink-0 text-white">
                <ShieldAlert className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <span>🚨 バックドア・ブロック回避の危険性を検知しました</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#ff5c7a] text-white font-black">
                    {backdoorReport.backdoorsFound} 件の脆弱性
                  </span>
                </h3>
                <p className="text-xs text-[#e8ecf6]/90 mt-1">
                  登録されたブロックルールや管理アカウントに、検閲回避・特権昇格・ログ改ざん等の隠しバックドアが検出されています。
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsBackdoorAlertOpen(true)}
              className="px-4 py-2 rounded-lg bg-[#ff5c7a] hover:bg-[#ff416c] text-white font-extrabold text-xs shadow-lg transition cursor-pointer shrink-0 self-end md:self-center"
            >
              バックドア詳細と即時対処 →
            </button>
          </div>
        </div>
      )}

      {/* Threat Alert Box (Active suspicious restrictions) */}
      {suspiciousRestrictions.length > 0 && (
        <div className="rounded-xl border border-[#ff5c7a]/40 bg-[#ff5c7a]/10 p-4 text-[#ff5c7a] shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#ff5c7a]/20 border border-[#ff5c7a]/30 shrink-0">
                <ShieldAlert className="w-5 h-5 text-[#ff5c7a] animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <span>🚨 疑わしい制限を検知しました（低信頼度スコア）</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#ff5c7a]/20 text-[#ff5c7a] font-mono">
                    {suspiciousRestrictions.length} 件
                  </span>
                </h3>
                <p className="text-xs text-[#8b96b8] mt-1">
                  未検証アカウントによる制限や、管理者権限の不審な剥奪試行が検知されました。不正なロックダウンを防ぐため、権限レベルに関わらず誰でも即座に削除可能です。
                </p>

                <div className="mt-3 space-y-1.5">
                  {suspiciousRestrictions.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between bg-[#0f1420]/80 p-2.5 rounded-lg border border-[#ff5c7a]/20 text-xs"
                    >
                      <div>
                        <span className="font-bold text-white">{r.title}</span>
                        <span className="text-[#8b96b8] ml-2 font-mono">
                          (実行者: {r.appliedBy}, スコア: {r.credibilityScore}点)
                        </span>
                      </div>
                      <button
                        onClick={() => onNavigateTo('restrictions')}
                        className="text-xs text-[#ff5c7a] hover:underline font-semibold cursor-pointer"
                      >
                        制限管理で解除 →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Restrictions */}
        <div className="relative overflow-hidden rounded-xl border border-[#2a3550] bg-[#0f1420] p-4 shadow">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#5b8cff]" />
          <div className="flex items-center justify-between text-xs text-[#8b96b8] mb-1">
            <span>アクティブな制限数</span>
            <Lock className="w-4 h-4 text-[#5b8cff]" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">
            {activeRestrictions.length}
            <span className="text-xs text-[#8b96b8] font-normal ml-1">件稼働</span>
          </div>
          <div className="text-[11px] text-[#8b96b8] mt-2 flex items-center justify-between">
            <span>期限切れ: {restrictions.filter((r) => r.status === 'expired').length}件</span>
            <span className="text-[#5b8cff] cursor-pointer hover:underline" onClick={() => onNavigateTo('restrictions')}>
              詳細
            </span>
          </div>
        </div>

        {/* Card 2: Suspicious Restrictions */}
        <div className="relative overflow-hidden rounded-xl border border-[#2a3550] bg-[#0f1420] p-4 shadow">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#ff5c7a]" />
          <div className="flex items-center justify-between text-xs text-[#8b96b8] mb-1">
            <span>疑わしい制限（低スコア）</span>
            <AlertTriangle className="w-4 h-4 text-[#ff5c7a]" />
          </div>
          <div className="text-2xl font-bold text-[#ff5c7a] mt-1">
            {suspiciousRestrictions.length}
            <span className="text-xs text-[#8b96b8] font-normal ml-1">件検知</span>
          </div>
          <div className="text-[11px] text-[#8b96b8] mt-2 flex items-center justify-between">
            <span>信頼度40点未満</span>
            <span className="text-[#3ddc97]">誰でも削除可能</span>
          </div>
        </div>

        {/* Card 3: Verified Accounts */}
        <div className="relative overflow-hidden rounded-xl border border-[#2a3550] bg-[#0f1420] p-4 shadow">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#3ddc97]" />
          <div className="flex items-center justify-between text-xs text-[#8b96b8] mb-1">
            <span>検証済みアカウント数</span>
            <Users className="w-4 h-4 text-[#3ddc97]" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">
            {verifiedAccountsCount}
            <span className="text-xs text-[#8b96b8] font-normal ml-1">/ {accounts.length} アカウント</span>
          </div>
          <div className="text-[11px] text-[#8b96b8] mt-2 flex items-center justify-between">
            <span>未検証: {accounts.length - verifiedAccountsCount}件</span>
            <span className="text-[#5b8cff] cursor-pointer hover:underline" onClick={() => onNavigateTo('accounts')}>
              管理
            </span>
          </div>
        </div>

        {/* Card 4: Security Score */}
        <div className="relative overflow-hidden rounded-xl border border-[#2a3550] bg-[#0f1420] p-4 shadow">
          <div
            className="absolute top-0 left-0 w-1 h-full"
            style={{ backgroundColor: getScoreColor(securityScore) }}
          />
          <div className="flex items-center justify-between text-xs text-[#8b96b8] mb-1">
            <span>セキュリティ総合スコア</span>
            <ShieldCheck className="w-4 h-4 text-[#3ddc97]" />
          </div>
          <div className="text-2xl font-bold text-white mt-1 flex items-baseline gap-1">
            <span style={{ color: getScoreColor(securityScore) }}>{securityScore}</span>
            <span className="text-xs text-[#8b96b8]">/ 100点</span>
          </div>
          <div className="text-[11px] text-[#8b96b8] mt-2 flex items-center justify-between">
            <span style={{ color: getScoreColor(securityScore) }}>
              {securityScore >= 80 ? '健全・正常防護中' : securityScore >= 50 ? '要警戒' : '危険・侵入アラート'}
            </span>
            <span className="text-[#8b96b8]">リアルタイム算出</span>
          </div>
        </div>
      </div>

      {/* Middle Grid: Circular Gauge & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Circular Gauge Card */}
        <div className="rounded-xl border border-[#2a3550] bg-[#0f1420] p-5 flex flex-col items-center justify-center text-center">
          <div className="w-full flex items-center justify-between mb-2">
            <h3 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>🛡️ 防護ステータスゲージ</span>
            </h3>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: `${getScoreColor(securityScore)}20`,
                color: getScoreColor(securityScore),
              }}
            >
              {securityScore >= 80 ? 'LEVEL: NORMAL' : securityScore >= 50 ? 'LEVEL: WARNING' : 'LEVEL: CRITICAL'}
            </span>
          </div>

          <div className="relative w-36 h-36 my-3">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              {/* Background Circle */}
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#161d2e"
                strokeWidth="8"
              />
              {/* Animated Progress Circle */}
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={getScoreColor(securityScore)}
                strokeWidth="8"
                strokeDasharray={`${(securityScore / 100) * 264} 264`}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-extrabold text-white tracking-tight">{securityScore}</span>
              <span className="text-[10px] text-[#8b96b8] uppercase font-semibold">点</span>
            </div>
          </div>

          <div className="text-xs text-[#8b96b8] max-w-xs mt-1 leading-relaxed">
            {securityScore >= 80
              ? 'すべての多層暗号チェックサム及び認証制限はセキュアです。'
              : '低信頼度な制限または脅威アクティビティが検知されています。'}
          </div>

          <div className="mt-4 pt-3 border-t border-[#2a3550] w-full grid grid-cols-3 text-center text-xs">
            <div>
              <div className="text-[10px] text-[#8b96b8]">稼働状態</div>
              <div className="font-bold text-[#3ddc97]">正常</div>
            </div>
            <div>
              <div className="text-[10px] text-[#8b96b8]">検知異常</div>
              <div className="font-bold text-[#ffb547]">{threatAnalysis.activeThreatCount}件</div>
            </div>
            <div>
              <div className="text-[10px] text-[#8b96b8]">ログ保持</div>
              <div className="font-bold text-white">{logs.length}件</div>
            </div>
          </div>
        </div>

        {/* Right: Trend & Timeline charts */}
        <div className="lg:col-span-2 rounded-xl border border-[#2a3550] bg-[#0f1420] p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#5b8cff]" />
                <span>制限履歴と脅威検出トレンド (直近7日間)</span>
              </h3>
              <p className="text-xs text-[#8b96b8]">不正アクセス試行と多層防護ブロック数の推移</p>
            </div>
            <span className="text-xs px-2 py-1 rounded bg-[#161d2e] border border-[#2a3550] text-[#8b96b8] font-mono">
              リアルタイム更新
            </span>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-44 flex items-end gap-3 pt-6 pb-2 px-2 border-b border-[#2a3550]">
            {[
              { day: '09/20', safe: 4, threat: 0, label: '平常' },
              { day: '09/21', safe: 5, threat: 1, label: '軽度' },
              { day: '09/22', safe: 6, threat: 0, label: '平常' },
              { day: '09/23', safe: 4, threat: 3, label: '警告' },
              { day: '09/24', safe: 7, threat: 1, label: '平常' },
              { day: '09/25', safe: 5, threat: 5, label: '攻撃' },
              { day: '本日', safe: 8, threat: suspiciousRestrictions.length, label: '現在' },
            ].map((d, idx) => {
              const safeHeight = Math.min(100, (d.safe / 10) * 100);
              const threatHeight = Math.min(100, (d.threat / 5) * 80);

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-10 bg-[#0a0e1a] border border-[#2a3550] p-1.5 rounded text-[10px] text-white pointer-events-none whitespace-nowrap shadow-xl">
                    安全操作: {d.safe}件 / 脅威防御: {d.threat}件
                  </div>

                  <div className="w-full flex items-end justify-center gap-1 h-32">
                    {/* Safe op bar */}
                    <div
                      style={{ height: `${safeHeight}%` }}
                      className="w-1/2 max-w-[16px] bg-[#5b8cff]/30 rounded-t border-t-2 border-[#5b8cff] group-hover:bg-[#5b8cff]/50 transition-all"
                    />
                    {/* Threat bar */}
                    <div
                      style={{ height: `${threatHeight}%` }}
                      className={`w-1/2 max-w-[16px] rounded-t border-t-2 transition-all ${
                        d.threat > 2
                          ? 'bg-[#ff5c7a]/40 border-[#ff5c7a]'
                          : d.threat > 0
                          ? 'bg-[#ffb547]/40 border-[#ffb547]'
                          : 'bg-transparent border-transparent'
                      }`}
                    />
                  </div>
                  <span className="text-[11px] text-[#8b96b8] font-mono">{d.day}</span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-[#8b96b8] mt-3 pt-1">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#5b8cff]" />
                <span>通常管理操作</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#ff5c7a]" />
                <span>脅威遮断・不正制限検知</span>
              </span>
            </div>
            <span className="text-[#3ddc97] font-semibold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>自動修復＆CRC-32整合性維持</span>
            </span>
          </div>
        </div>
      </div>

      {/* Recent 5 Activity Logs */}
      <div className="rounded-xl border border-[#2a3550] bg-[#0f1420] p-5 shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#5b8cff]" />
            <h3 className="font-bold text-sm text-white">最新アクティビティログ（直近5件）</h3>
          </div>
          <button
            onClick={() => onNavigateTo('logs')}
            className="text-xs text-[#5b8cff] hover:underline font-semibold cursor-pointer"
          >
            完全なログテーブルを見る →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#2a3550] bg-[#161d2e]/50 text-[#8b96b8]">
                <th className="py-2.5 px-3">状態</th>
                <th className="py-2.5 px-3">タイムスタンプ</th>
                <th className="py-2.5 px-3">操作者</th>
                <th className="py-2.5 px-3">カテゴリ</th>
                <th className="py-2.5 px-3">操作内容</th>
                <th className="py-2.5 px-3">CRC-32暗号チェックサム</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a3550]/40">
              {recentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#161d2e]/40 transition">
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.status === 'success'
                          ? 'bg-[#3ddc97]/15 text-[#3ddc97]'
                          : log.status === 'failure'
                          ? 'bg-[#ff5c7a]/15 text-[#ff5c7a]'
                          : 'bg-[#ffb547]/15 text-[#ffb547]'
                      }`}
                    >
                      {log.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-[#8b96b8] font-mono">{log.timestamp}</td>
                  <td className="py-2.5 px-3 font-semibold text-white">{log.operatorId}</td>
                  <td className="py-2.5 px-3 text-[#5b8cff] font-medium">{log.category}</td>
                  <td className="py-2.5 px-3 text-[#e8ecf6] max-w-md truncate">{log.action}</td>
                  <td className="py-2.5 px-3 font-mono text-[11px]">
                    {log.tampered ? (
                      <span className="text-[#ff5c7a] font-bold flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>改ざん検知 ({log.checksum})</span>
                      </span>
                    ) : (
                      <span className="text-[#3ddc97] flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{log.checksum}</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
