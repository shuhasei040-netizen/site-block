import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Key,
  Clock,
  PlayCircle,
  FileCode,
  Download,
  CheckCircle,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { useSecurity, MASTER_KEY } from '../../context/SecurityContext';

export const SettingsTab: React.FC<{ onNavigateTo: (tab: any) => void }> = ({ onNavigateTo }) => {
  const {
    sessionRemainingSeconds,
    runScenario,
    downloadStandaloneFile,
    exportJsonBackup,
    pwaShieldActive,
    togglePwaSandboxShield,
    isStandalonePWA,
    repelRestrictionsWithPwaPulse,
  } = useSecurity();

  const [scenarioExecuted, setScenarioExecuted] = useState<string | null>(null);

  const handleRun = (num: 1 | 2 | 3 | 4, name: string, targetTab: string) => {
    runScenario(num);
    setScenarioExecuted(`${name} を実行しました。各画面へ移動して結果を確認できます。`);
    setTimeout(() => {
      onNavigateTo(targetTab);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {scenarioExecuted && (
        <div className="p-4 rounded-xl bg-[#3ddc97]/15 border border-[#3ddc97]/40 text-[#3ddc97] text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{scenarioExecuted}</span>
        </div>
      )}

      {/* Test Scenarios Runner Panel */}
      <div className="rounded-xl border border-[#2a3550] bg-[#0f1420] p-6 shadow">
        <div className="flex items-center gap-2.5 mb-2">
          <PlayCircle className="w-5 h-5 text-[#5b8cff]" />
          <h3 className="font-bold text-sm text-white">
            🧪 要件仕様テストシナリオのワンクリック実証実行
          </h3>
        </div>
        <p className="text-xs text-[#8b96b8] mb-5">
          仕様書に定義された4つのセキュリティ検証シナリオを瞬時にロードし、防護エンジンの挙動を体験できます：
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Test 1 */}
          <div className="p-4 rounded-xl border border-[#2a3550] bg-[#161d2e] flex flex-col justify-between">
            <div>
              <div className="font-bold text-xs text-white flex items-center justify-between mb-1.5">
                <span>テスト1：ハッカー権限強奪＆マスターキー復旧</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#ff5c7a]/20 text-[#ff5c7a] font-bold">
                  緊急脱出
                </span>
              </div>
              <p className="text-[11px] text-[#8b96b8] leading-relaxed mb-3">
                ハッカーが管理者権限でシステム全体に「フルロックダウン」を適用。マスターキー <code>{MASTER_KEY}</code> を使ってロックを無視状態（bypassable）へと強制復旧します。
              </p>
            </div>
            <button
              onClick={() => handleRun(1, 'テスト1（フルロックダウン適用）', 'restrictions')}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[#ff5c7a]/20 hover:bg-[#ff5c7a]/30 border border-[#ff5c7a]/40 text-[#ff5c7a] text-xs font-bold transition cursor-pointer"
            >
              <span>テスト1を実行（ロックダウン適用）</span>
            </button>
          </div>

          {/* Test 2 */}
          <div className="p-4 rounded-xl border border-[#2a3550] bg-[#161d2e] flex flex-col justify-between">
            <div>
              <div className="font-bold text-xs text-white flex items-center justify-between mb-1.5">
                <span>テスト2：悪質ユーザーの低信頼度制限＆削除検証</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#ffb547]/20 text-[#ffb547] font-bold">
                  内部脅威対策
                </span>
              </div>
              <p className="text-[11px] text-[#8b96b8] leading-relaxed mb-3">
                未検証アカウント（viewer_sato）が不当な制限を適用。信頼度スコアが10点（40点未満）と算出され、L1/L2の一般ユーザーでも削除可能になる仕様を検証。
              </p>
            </div>
            <button
              onClick={() => handleRun(2, 'テスト2（低信頼度制限の追加）', 'restrictions')}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[#ffb547]/20 hover:bg-[#ffb547]/30 border border-[#ffb547]/40 text-[#ffb547] text-xs font-bold transition cursor-pointer"
            >
              <span>テスト2を実行（低信頼度制限追加）</span>
            </button>
          </div>

          {/* Test 3 */}
          <div className="p-4 rounded-xl border border-[#2a3550] bg-[#161d2e] flex flex-col justify-between">
            <div>
              <div className="font-bold text-xs text-white flex items-center justify-between mb-1.5">
                <span>テスト3：危険URLスキャン（短縮URL・.exe）</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#5b8cff]/20 text-[#5b8cff] font-bold">
                  マルウェア検査
                </span>
              </div>
              <p className="text-[11px] text-[#8b96b8] leading-relaxed mb-3">
                不審なURL（http://bit.ly/free-download-payload.exe）をサイト一覧に追加。ヒューリスティックスキャナが「危険（Danger）」と判定する動作を検証。
              </p>
            </div>
            <button
              onClick={() => handleRun(3, 'テスト3（危険URLサイトの登録）', 'sites')}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[#5b8cff]/20 hover:bg-[#5b8cff]/30 border border-[#5b8cff]/40 text-[#5b8cff] text-xs font-bold transition cursor-pointer"
            >
              <span>テスト3を実行（悪質サイト追加）</span>
            </button>
          </div>

          {/* Test 4 */}
          <div className="p-4 rounded-xl border border-[#2a3550] bg-[#161d2e] flex flex-col justify-between">
            <div>
              <div className="font-bold text-xs text-white flex items-center justify-between mb-1.5">
                <span>テスト4：未登録ID「hacker123」ブルートフォース</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#3ddc97]/20 text-[#3ddc97] font-bold">
                  ID列挙防御
                </span>
              </div>
              <p className="text-[11px] text-[#8b96b8] leading-relaxed mb-3">
                存在しないID「hacker123」による連続ログイン試行を生成。「アカウントが見つかりません」と一律応答し、セキュリティ監査タブで総当たり攻撃を検知。
              </p>
            </div>
            <button
              onClick={() => handleRun(4, 'テスト4（ブルートフォース攻撃検知）', 'audit')}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[#3ddc97]/20 hover:bg-[#3ddc97]/30 border border-[#3ddc97]/40 text-[#3ddc97] text-xs font-bold transition cursor-pointer"
            >
              <span>テスト4を実行（攻撃ログ注入）</span>
            </button>
          </div>
        </div>
      </div>

      {/* Standalone HTML Export & System Policy Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Standalone HTML Download */}
        <div className="rounded-xl border border-[#2a3550] bg-[#0f1420] p-6 shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <FileCode className="w-5 h-5 text-[#5b8cff]" />
              <h3 className="font-bold text-sm text-white">
                📦 単一HTML納品物（site-manager-security.html）
              </h3>
            </div>
            <p className="text-xs text-[#8b96b8] leading-relaxed mb-4">
              プロンプト仕様で求められている<strong>「単一HTML完結ファイル」</strong>を即座に生成してブラウザからダウンロードします。外部サーバー不要で <code>file://</code> でも直接動作します。
            </p>

            <div className="p-3 rounded-lg bg-[#161d2e] border border-[#2a3550] text-[11px] text-[#8b96b8] space-y-1 mb-4">
              <div>• ファイル名：<code>site-manager-security.html</code></div>
              <div>• 構成：HTML + CSS + JavaScript 全て内蔵（外部依存なし）</div>
              <div>• ローカルストレージ自動永続化</div>
            </div>
          </div>

          <button
            onClick={downloadStandaloneFile}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-[#5b8cff] to-[#7c5bff] text-white text-xs font-bold shadow-lg hover:opacity-95 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>完全スタンドアローンHTMLをダウンロード</span>
          </button>
        </div>

        {/* Right: Security Policies & Master Key status */}
        <div className="rounded-xl border border-[#2a3550] bg-[#0f1420] p-6 shadow">
          <div className="flex items-center gap-2.5 mb-3">
            <Shield className="w-5 h-5 text-[#ffb547]" />
            <h3 className="font-bold text-sm text-white">システムセキュリティ防護ポリシー</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-[#161d2e] border border-[#2a3550]">
              <div className="font-bold text-white flex items-center gap-2 mb-1">
                <Key className="w-3.5 h-3.5 text-[#ffb547]" />
                <span>シークレットマスターキー状態</span>
              </div>
              <div className="text-[11px] text-[#8b96b8]">
                キー値：<code className="text-[#ffb547] font-bold">{MASTER_KEY}</code><br />
                保護状態：メモリ内隔離・変更にはL3最高管理者権限が必要
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#161d2e] border border-[#2a3550]">
              <div className="font-bold text-white flex items-center gap-2 mb-1">
                <Clock className="w-3.5 h-3.5 text-[#5b8cff]" />
                <span>無操作セッションタイムアウト</span>
              </div>
              <div className="text-[11px] text-[#8b96b8]">
                残り時間：<strong className="text-white font-mono">{Math.floor(sessionRemainingSeconds / 60)}分 {sessionRemainingSeconds % 60}秒</strong> (30分無操作で自動ログアウト)
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#161d2e] border border-[#2a3550]">
              <div className="font-bold text-white flex items-center gap-2 mb-1">
                <Zap className="w-3.5 h-3.5 text-[#3ddc97]" />
                <span>PWA分離サンドボックス防御</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#8b96b8] mt-1">
                <span>シールド稼働：{pwaShieldActive ? 'アクティブ（迎撃中）' : '停止中'}</span>
                <button
                  onClick={togglePwaSandboxShield}
                  className="text-xs text-[#5b8cff] underline cursor-pointer"
                >
                  切り替え
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
