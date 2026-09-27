import { RestrictionItem, SiteItem } from '../types/security';

export interface RouteSimulationStep {
  stepId: number;
  name: string;
  category: 'Protocol' | 'DNS & IP' | 'Domain Trust' | 'ACL Rules' | 'Tunneling';
  status: 'blocked' | 'warning' | 'open_bypass';
  description: string;
  attackVectorSimulated: string;
  defenseAnalysis: string;
  remediation: string;
}

export interface UrlRouteSimulationReport {
  targetUrl: string;
  hostname: string;
  protocol: string;
  port: string;
  timestamp: string;
  overallRouteStatus: 'securely_blocked' | 'monitored_safe' | 'bypass_risk_detected';
  riskScore: number; // 0 (安全) - 100 (極めて危険)
  steps: RouteSimulationStep[];
  pathVisual: {
    deviceLayer: 'protected' | 'risk';
    filterLayer: 'dropped' | 'allowed' | 'bypassed';
    destinationLayer: 'safe' | 'suspicious' | 'dangerous';
  };
  matchedRestrictions: string[];
  remediationActions: string[];
}

/**
 * 入力された対象URLに対して、デバイス・ローカルフィルタ・宛先間の通信経路に
 * 潜在的なバックドアやブロック回避の抜け道が存在しないかを安全にシミュレーション検証する
 */
export function simulateUrlPenetrationRoute(
  inputUrl: string,
  existingSites: SiteItem[],
  existingRestrictions: RestrictionItem[]
): UrlRouteSimulationReport {
  let normalized = inputUrl.trim();
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = `https://${normalized}`;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(normalized);
  } catch {
    parsedUrl = new URL('https://unknown-target.local');
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  const protocol = parsedUrl.protocol;
  const port = parsedUrl.port || (protocol === 'https:' ? '443' : '80');
  const pathname = parsedUrl.pathname;

  const steps: RouteSimulationStep[] = [];
  let riskScore = 0;
  const remediationActions: string[] = [];

  // 1. プロトコル整合性テスト (HTTP vs HTTPS / MitM)
  const isHttps = protocol === 'https:';
  if (!isHttps) {
    riskScore += 30;
    steps.push({
      stepId: 1,
      name: 'プロトコル暗号化・中間者侵入(MitM)耐性テスト',
      category: 'Protocol',
      status: 'open_bypass',
      description: '平文HTTP通信が指定されており、ローカルネットワーク上での盗聴・経路ハイジャックが可能です。',
      attackVectorSimulated: '端末〜ルーター間での平文セッション盗聴および偽装レスポンスのインジェクションを模擬',
      defenseAnalysis: '暗号化通信（TLS/HTTPS）が強制されていないため、通信経路上でデータが改ざんされるリスクがあります。',
      remediation: 'HTTPSによる強制暗号化（HSTS）を適用し、HTTPでのアクセスを全面遮断してください。',
    });
    remediationActions.push('HTTPアクセスを全面的に拒否し、HTTPSのみ許可するルールを設定');
  } else {
    steps.push({
      stepId: 1,
      name: 'プロトコル暗号化・中間者侵入(MitM)耐性テスト',
      category: 'Protocol',
      status: 'blocked',
      description: 'TLS暗号化プロトコル(HTTPS)が適用されており、通信経路上での盗聴・改ざん経路は封鎖されています。',
      attackVectorSimulated: 'トランスポート層でのセッション傍受および中間者パケット注入の試行',
      defenseAnalysis: 'TLSハンドシェイクによりエンドツーエンドの機密性が担保されています。',
      remediation: '設定は正常です。最新のTLS 1.3および強度の高い暗号スイートの利用を推奨します。',
    });
  }

  // 2. IP直打ちおよび非標準ポートバイパステスト
  const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.startsWith('[');
  const isNonStandardPort = port !== '80' && port !== '443';

  if (isIpAddress || isNonStandardPort) {
    riskScore += 35;
    steps.push({
      stepId: 2,
      name: 'IP直指定・ポート偽装によるDNSブロック迂回テスト',
      category: 'DNS & IP',
      status: 'open_bypass',
      description: `ドメイン名ではなくIP直接指定(${hostname})または非標準ポート(${port})が使用されており、一般的なDNS制限を素通りする抜け穴が存在します。`,
      attackVectorSimulated: 'DNS問い合わせを行わずにIPアドレス直接通信を行い、ホスト名ベースのフィルタリング回避を模擬',
      defenseAnalysis: 'ドメイン名フィルタ単体では遮断できず、IP層でのエグレスFirewallが必要です。',
      remediation: 'IP直接指定の通信をFirewallレベルでドロップし、ポート80/443以外の不正ポートを閉鎖してください。',
    });
    remediationActions.push(`IP直接通信(${hostname})および非標準ポート(${port})の強制遮断ルールを追加`);
  } else {
    steps.push({
      stepId: 2,
      name: 'IP直指定・ポート偽装によるDNSブロック迂回テスト',
      category: 'DNS & IP',
      status: 'blocked',
      description: '標準的な正規ドメイン解決が行われており、ポート偽装による迂回ルートは検出されませんでした。',
      attackVectorSimulated: '非標準ポート(:8080等)および直接IPルート探索の試行',
      defenseAnalysis: '標準Webポート経由で正規DNSリゾルバを経由するため、DNSフィルタの管理下にあります。',
      remediation: '現在のDNS経路は正常に保護されています。',
    });
  }

  // 3. ドメイン信頼性・ホモグラフ偽装テスト
  const isPunycode = hostname.startsWith('xn--') || /[^\u0000-\u007f]/.test(hostname);
  const hasSuspiciousKeywords = /(login|secure|verify|account|update|bank|apple|google|update-security)/.test(hostname) &&
    !hostname.endsWith('.google.com') && !hostname.endsWith('.apple.com');

  if (isPunycode || hasSuspiciousKeywords) {
    riskScore += 25;
    steps.push({
      stepId: 3,
      name: 'ホモグラフ文字・なりすましドメイン経路検証',
      category: 'Domain Trust',
      status: 'warning',
      description: '類似文字列や偽装キーワードが含まれており、正規サービスを騙ったフィッシング経路の疑いがあります。',
      attackVectorSimulated: '正規サイトを模倣した視覚的類似文字（Punycode）によるユーザー誘導および認証情報詐取を模擬',
      defenseAnalysis: 'ブラウザのアドレスバー表示を悪用したなりすまし攻撃の経路が残存しています。',
      remediation: '国際化ドメイン名（IDN）の自動解決を制限し、URLレピュテーションリストに登録してください。',
    });
    remediationActions.push('ホモグラフ・類似キーワードを含む疑わしいドメインの明示的ブロック');
  } else {
    steps.push({
      stepId: 3,
      name: 'ホモグラフ文字・なりすましドメイン経路検証',
      category: 'Domain Trust',
      status: 'blocked',
      description: '正規の英数字ドメイン名であり、ホモグラフ偽装の兆候は見られません。',
      attackVectorSimulated: 'IDNホモグラフ文字およびタイポスクワッティング経路の探索',
      defenseAnalysis: 'ドメイン構文の整合性が確認されました。',
      remediation: '定期的なWHOIS登録情報の監視を推奨します。',
    });
  }

  // 4. ローカルACL・既存制限ルールとの突合テスト
  const matchedSite = existingSites.find((s) => hostname.includes(s.url.toLowerCase()) || s.url.toLowerCase().includes(hostname));
  const activeRestrictions = existingRestrictions.filter((r) => r.status === 'active');
  const matchedRules: string[] = [];

  activeRestrictions.forEach((r) => {
    const raw = `${r.title} ${r.reason}`.toLowerCase();
    if (raw.includes(hostname) || (matchedSite && raw.includes(matchedSite.name.toLowerCase()))) {
      matchedRules.push(r.title);
    }
  });

  const isExplicitlyBlocked = matchedSite?.status === 'blocked' || matchedRules.length > 0;

  if (isExplicitlyBlocked) {
    steps.push({
      stepId: 4,
      name: '端末内アクセス制御リスト(ACL)突合・遮断耐性テスト',
      category: 'ACL Rules',
      status: 'blocked',
      description: `端末内のセキュリティルールにより、この宛先へのトラフィックは即座にドロップされます（一致ルール: ${matchedRules.join(', ') || matchedSite?.name}）。`,
      attackVectorSimulated: '登録済みブロックポリシーのすり抜け試行',
      defenseAnalysis: 'ローカルアクセス制御ルールが正常にヒットし、トラフィックは完全に遮断されました。',
      remediation: '防御状態は維持されています。',
    });
  } else {
    riskScore += 20;
    steps.push({
      stepId: 4,
      name: '端末内アクセス制御リスト(ACL)突合・遮断耐性テスト',
      category: 'ACL Rules',
      status: 'warning',
      description: '端末内のブロックリストおよび制限ルールに該当せず、このURLとの自由な双方向通信が可能な状態です。',
      attackVectorSimulated: '既存ACLの未定義領域（ブラックリストの隙間）を通じた通信確立の試行',
      defenseAnalysis: '現在の設定ではアクセスが許可されるため、悪意あるコンテンツを受信する経路が開いています。',
      remediation: '「サイト一覧」または「制限管理」から対象URLを明示的なブロック対象として登録してください。',
    });
    remediationActions.push(`「${hostname}」をサイトブロックリストに追加`);
  }

  // 5. 双方向トンネリング・バックグラウンド外部通信リスク
  const hasWebSocketOrTunnelingHint = pathname.includes('/ws') || pathname.includes('/socket') || pathname.includes('/api/tunnel') || pathname.includes('/proxy');

  if (hasWebSocketOrTunnelingHint) {
    riskScore += 25;
    steps.push({
      stepId: 5,
      name: '双方向トンネリング・C2セッション保持リスクテスト',
      category: 'Tunneling',
      status: 'open_bypass',
      description: 'WebSocketまたはプロキシトンネル用エンドポイントの兆候が検知され、持続的なバックグラウンド通信経路が確立される恐れがあります。',
      attackVectorSimulated: '常時接続WebSocketを用いたハートビート通信および外部C2コマンド受信を模擬',
      defenseAnalysis: '長寿命TCPコネクションを用いた検知回避経路が存在します。',
      remediation: 'WebSocket通信の宛先検査およびプロキシ接続の強制切断ポリシーを適用してください。',
    });
    remediationActions.push('持続的WebSocket接続の制限およびプロキシトンネル通信の監視強化');
  } else {
    steps.push({
      stepId: 5,
      name: '双方向トンネリング・C2セッション保持リスクテスト',
      category: 'Tunneling',
      status: 'blocked',
      description: '持続的トンネルや不正WebSocketの兆候は検知されず、標準的なステートレスHTTPリクエストとして処理されます。',
      attackVectorSimulated: '常時接続トンネルの確立試行',
      defenseAnalysis: '不正な持続接続経路は確認されませんでした。',
      remediation: '現在のトンネリング監視方針を維持してください。',
    });
  }

  // 総合ステータス決定
  let overallRouteStatus: UrlRouteSimulationReport['overallRouteStatus'];
  if (isExplicitlyBlocked && riskScore <= 20) {
    overallRouteStatus = 'securely_blocked';
  } else if (riskScore >= 40) {
    overallRouteStatus = 'bypass_risk_detected';
  } else {
    overallRouteStatus = 'monitored_safe';
  }

  const pathVisual = {
    deviceLayer: (riskScore >= 40 ? 'risk' : 'protected') as 'risk' | 'protected',
    filterLayer: (isExplicitlyBlocked ? 'dropped' : (riskScore >= 40 ? 'bypassed' : 'allowed')) as 'dropped' | 'allowed' | 'bypassed',
    destinationLayer: (riskScore >= 50 ? 'dangerous' : (riskScore >= 25 ? 'suspicious' : 'safe')) as 'dangerous' | 'suspicious' | 'safe',
  };

  return {
    targetUrl: normalized,
    hostname,
    protocol,
    port,
    timestamp: new Date().toISOString(),
    overallRouteStatus,
    riskScore: Math.min(100, riskScore),
    steps,
    pathVisual,
    matchedRestrictions: matchedRules,
    remediationActions: Array.from(new Set(remediationActions)),
  };
}
