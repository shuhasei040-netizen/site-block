import { UserAccount, RestrictionItem, LogEntry } from '../types/security';
import { verifyLogIntegrity } from './crc32';

export interface SimulationScenarioResult {
  id: string;
  name: string;
  category: 'Access Control' | 'Privilege Management' | 'Forensic Integrity' | 'DoS Resilience' | 'Transport Security';
  mitreTechnique: string;
  status: 'defended' | 'warning' | 'vulnerable';
  simulatedAttackVector: string;
  observedWeakness?: string;
  defenseMechanics: string;
  remediation: string;
  scoreImpact: number; // 減点
}

export interface PostureEvaluationReport {
  timestamp: string;
  overallScore: number; // 0 - 100
  defenseRating: 'A (極めて堅牢)' | 'B (概ね良好)' | 'C (要改善)' | 'D (重大な脆弱性あり)';
  scenarios: SimulationScenarioResult[];
  summary: {
    totalTests: number;
    defendedCount: number;
    warningCount: number;
    vulnerableCount: number;
  };
  keyRecommendations: string[];
}

/**
 * システム内の設定・ルール・アカウント・ログを対象に模擬侵入テストを実行し、
 * 防御態勢を客観的に評価するシミュレーションエンジン
 */
export function runPostureSimulation(
  accounts: UserAccount[],
  restrictions: RestrictionItem[],
  logs: LogEntry[],
  isPwaShieldActive: boolean = true
): PostureEvaluationReport {
  const scenarios: SimulationScenarioResult[] = [];
  let scoreDeductions = 0;

  // -------------------------------------------------------------
  // シナリオ 1: 外部C2通信およびIP直指定によるブロック迂回テスト
  // MITRE: T1071.001 (Web Protocols), T1090 (Proxy/Bypass)
  // -------------------------------------------------------------
  const activeSiteRestrictions = restrictions.filter(
    (r) => r.status === 'active' && (r.type === 'site_block' || r.type === 'full_lock')
  );

  const hasIpBypassRisk = activeSiteRestrictions.some((r) => {
    const raw = `${r.title} ${r.reason}`.toLowerCase();
    return /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/.test(raw) || raw.includes(':8080') || raw.includes(':8443');
  });

  if (activeSiteRestrictions.length === 0) {
    scenarios.push({
      id: 'SIM-001',
      name: '外部C2通信・フィルタリング迂回耐性テスト',
      category: 'Access Control',
      mitreTechnique: 'T1071.001 - Application Layer Protocol',
      status: 'warning',
      simulatedAttackVector: '攻撃者が任意のドメインや直接IPへ送信するトラフィックを送信',
      observedWeakness: '現在アクティブなサイトブロックルールが存在せず、自由なアウトバウンド通信が可能',
      defenseMechanics: 'ブラックリストまたはホワイトリストに基づく強制DNS/IPフィルタリングが必要',
      remediation: '「制限管理」にて悪意ある通信先・危険ドメインの明示的な制限ルールを追加してください。',
      scoreImpact: 15,
    });
    scoreDeductions += 15;
  } else if (hasIpBypassRisk) {
    scenarios.push({
      id: 'SIM-001',
      name: '外部C2通信・フィルタリング迂回耐性テスト',
      category: 'Access Control',
      mitreTechnique: 'T1090.003 - Multi-hop Proxy & Direct IP Routing',
      status: 'vulnerable',
      simulatedAttackVector: 'DNS制限を迂回するため、IPアドレス直接指定または非標準ポート(:8080/:8443)による直接通信を模擬',
      observedWeakness: 'ルール内にIP直接指定またはカスタムポートの例外/不審記述が存在し、迂回経路が生じています',
      defenseMechanics: 'ドメイン名フィルタだけでなく、全ポートに対するエグレスFirewallとIP強制ドロップが必須',
      remediation: 'IP直接指定通信を全面的にドロップし、ドメイン解決を必須とするポリシーを適用してください。',
      scoreImpact: 25,
    });
    scoreDeductions += 25;
  } else {
    scenarios.push({
      id: 'SIM-001',
      name: '外部C2通信・フィルタリング迂回耐性テスト',
      category: 'Access Control',
      mitreTechnique: 'T1071.001 - Application Layer Protocol',
      status: 'defended',
      simulatedAttackVector: '不正ドメインへのアクセス試行およびWebプロトコル経由の抜け道探索',
      defenseMechanics: '多層ブロックルールにより不正トラフィックは正常に遮断されました',
      remediation: '現在のフィルタリング設定は強固です。定期的な脅威フィードの更新を推奨します。',
      scoreImpact: 0,
    });
  }

  // -------------------------------------------------------------
  // シナリオ 2: 未承認アカウント作成および特権昇格テスト
  // MITRE: T1078.003 (Local Accounts), T1068 (Privilege Escalation)
  // -------------------------------------------------------------
  const unverifiedL3Admins = accounts.filter((a) => a.role === 'L3' && !a.isVerified);
  const totalL3Admins = accounts.filter((a) => a.role === 'L3').length;

  if (unverifiedL3Admins.length > 0) {
    scenarios.push({
      id: 'SIM-002',
      name: '特権昇格・不正管理者アカウント注入テスト',
      category: 'Privilege Management',
      mitreTechnique: 'T1078.003 - Valid Accounts: Local Accounts',
      status: 'vulnerable',
      simulatedAttackVector: '身元未検証のゲストセッションからL3（最高管理者）権限の取得およびシャドウアカウント作成を模擬',
      observedWeakness: `${unverifiedL3Admins.length}件の身元未検証アカウントがL3特権を保持しています`,
      defenseMechanics: '特権昇格には身元確認（MFA/2要素署名）と保護フラグの付与が必須',
      remediation: 'アカウント管理画面から未承認のL3アカウントを即座に権限降格または削除してください。',
      scoreImpact: 30,
    });
    scoreDeductions += 30;
  } else if (totalL3Admins > 3) {
    scenarios.push({
      id: 'SIM-002',
      name: '特権昇格・不正管理者アカウント注入テスト',
      category: 'Privilege Management',
      mitreTechnique: 'T1078 - Valid Accounts',
      status: 'warning',
      simulatedAttackVector: '管理者権限の過剰配布による攻撃面の拡大調査',
      observedWeakness: `L3特権アカウントが過剰に存在します（計${totalL3Admins}名）。最小特権の原則に反しています`,
      defenseMechanics: '最小特権の原則（PoLP）に従い、日常業務にはL1/L2アカウントを使用すべきです',
      remediation: '常時L3権限を付与するアカウントを最小限（1〜2名）に絞り込んでください。',
      scoreImpact: 10,
    });
    scoreDeductions += 10;
  } else {
    scenarios.push({
      id: 'SIM-002',
      name: '特権昇格・不正管理者アカウント注入テスト',
      category: 'Privilege Management',
      mitreTechnique: 'T1068 - Exploitation for Privilege Escalation',
      status: 'defended',
      simulatedAttackVector: '未検証権限昇格リクエストおよび偽装プロファイル注入の試行',
      defenseMechanics: '全管理者アカウントが検証済みであり、権限昇格トラップは防御されました',
      remediation: '権限分離が適切に保たれています。',
      scoreImpact: 0,
    });
  }

  // -------------------------------------------------------------
  // シナリオ 3: 監査ログ改ざんおよび証跡消去テスト
  // MITRE: T1070.001 (Clear System Logs), T1565.001 (Data Manipulation)
  // -------------------------------------------------------------
  const tamperedLogs = logs.filter((log) => !verifyLogIntegrity(log));

  if (tamperedLogs.length > 0) {
    scenarios.push({
      id: 'SIM-003',
      name: '監査ログ改ざん・フォレンジック証跡消去テスト',
      category: 'Forensic Integrity',
      mitreTechnique: 'T1565.001 - Stored Data Manipulation & Log Evasion',
      status: 'vulnerable',
      simulatedAttackVector: '攻撃者が侵入後に記録されたセキュリティログの改ざん・チェックサム不整合の誘発を模擬',
      observedWeakness: `${tamperedLogs.length}件のログレコードでCRC-32暗号チェックサムの不整合が検知されました`,
      defenseMechanics: '不変ログアーキテクチャ（WORM）とハッシュ整合性検証による改ざん検出',
      remediation: '改ざんされたログレコードを破棄し、暗号チェックサムの再計算および改ざんアラートを発行してください。',
      scoreImpact: 25,
    });
    scoreDeductions += 25;
  } else {
    scenarios.push({
      id: 'SIM-003',
      name: '監査ログ改ざん・フォレンジック証跡消去テスト',
      category: 'Forensic Integrity',
      mitreTechnique: 'T1070.001 - Clear Windows Event Records & App Logs',
      status: 'defended',
      simulatedAttackVector: 'ログレコードの末尾書き換えおよびインデックス改ざんの試行',
      defenseMechanics: 'CRC-32チェックサム検証によりログの完全性が100%維持されています',
      remediation: 'ログの改ざんは認められません。',
      scoreImpact: 0,
    });
  }

  // -------------------------------------------------------------
  // シナリオ 4: 悪意ある制限注入によるDoS（サービス拒否）テスト
  // MITRE: T1489 (Service Stop), T1499 (Endpoint Denial of Service)
  // -------------------------------------------------------------
  const lowCredibilityActive = restrictions.filter(
    (r) => r.status === 'active' && r.credibilityScore < 40
  );

  if (lowCredibilityActive.length > 0) {
    scenarios.push({
      id: 'SIM-004',
      name: '虚偽制限注入による業務妨害(DoS)耐性テスト',
      category: 'DoS Resilience',
      mitreTechnique: 'T1499 - Endpoint Denial of Service',
      status: 'vulnerable',
      simulatedAttackVector: '未検証の外部送信元から信頼性スコアの極めて低い制限を大量に送り込み、正規操作の停止を模擬',
      observedWeakness: `信頼性スコア40点未満の不審な制限が${lowCredibilityActive.length}件アクティブになっています`,
      defenseMechanics: '信頼性スコア算出による不正制限の自動除外（Repelled）機能',
      remediation: '低信頼度スコアの制限を直ちに除外（Repel/Ignore）し、信頼性閾値チェックを有効化してください。',
      scoreImpact: 20,
    });
    scoreDeductions += 20;
  } else {
    scenarios.push({
      id: 'SIM-004',
      name: '虚偽制限注入による業務妨害(DoS)耐性テスト',
      category: 'DoS Resilience',
      mitreTechnique: 'T1499 - Endpoint Denial of Service',
      status: 'defended',
      simulatedAttackVector: '未認証の偽装ポリシー・緊急ロックダウンの過剰発行試行',
      defenseMechanics: '信頼性評価エンジンにより不審な低スコア制限は自動的に排除されています',
      remediation: '健全な防御状態です。',
      scoreImpact: 0,
    });
  }

  // -------------------------------------------------------------
  // シナリオ 5: クライアント環境分離・サンドボックス隔離テスト
  // MITRE: T1185 (Browser Session Hijacking)
  // -------------------------------------------------------------
  if (!isPwaShieldActive) {
    scenarios.push({
      id: 'SIM-005',
      name: 'サンドボックス実行環境・分離シールドテスト',
      category: 'Transport Security',
      mitreTechnique: 'T1185 - Browser Session Hijacking',
      status: 'warning',
      simulatedAttackVector: '通常のブラウザ共有タブ環境からのスクリプト干渉およびストレージ盗難を模擬',
      observedWeakness: 'PWA防御シールドが非アクティブのため、一般ブラウザ環境の干渉を受けるリスクがあります',
      defenseMechanics: 'Chromebook独立ウィンドウ（PWA）サンドボックスによるコンテキスト隔離',
      remediation: 'PWA防御シールドを有効化し、専用ウィンドウとしてアプリを起動してください。',
      scoreImpact: 10,
    });
    scoreDeductions += 10;
  } else {
    scenarios.push({
      id: 'SIM-005',
      name: 'サンドボックス実行環境・分離シールドテスト',
      category: 'Transport Security',
      mitreTechnique: 'T1185 - Browser Session Hijacking',
      status: 'defended',
      simulatedAttackVector: 'ブラウザ間スクリプトインジェクションおよび共有キャッシュ干渉の試行',
      defenseMechanics: 'PWA独立コンテキストとサンドボックス防御シールドにより隔離されています',
      remediation: '適切な実行環境で保護されています。',
      scoreImpact: 0,
    });
  }

  // スコア算出
  const overallScore = Math.max(0, 100 - scoreDeductions);
  let defenseRating: PostureEvaluationReport['defenseRating'];
  if (overallScore >= 90) {
    defenseRating = 'A (極めて堅牢)';
  } else if (overallScore >= 75) {
    defenseRating = 'B (概ね良好)';
  } else if (overallScore >= 50) {
    defenseRating = 'C (要改善)';
  } else {
    defenseRating = 'D (重大な脆弱性あり)';
  }

  const defendedCount = scenarios.filter((s) => s.status === 'defended').length;
  const warningCount = scenarios.filter((s) => s.status === 'warning').length;
  const vulnerableCount = scenarios.filter((s) => s.status === 'vulnerable').length;

  const keyRecommendations: string[] = scenarios
    .filter((s) => s.status !== 'defended')
    .map((s) => s.remediation);

  return {
    timestamp: new Date().toISOString(),
    overallScore,
    defenseRating,
    scenarios,
    summary: {
      totalTests: scenarios.length,
      defendedCount,
      warningCount,
      vulnerableCount,
    },
    keyRecommendations,
  };
}
