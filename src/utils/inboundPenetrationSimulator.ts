export interface InboundVectorResult {
  id: string;
  vectorName: string;
  category: 'Drive-by Download' | 'Persistence' | 'Storage Hijack' | 'Lateral Scan' | 'Permission Abuse';
  simulatedPayload: string;
  entryPoint: string;
  barrierHit: 'Network ACL' | 'PWA Sandbox' | 'OS Security Layer' | 'None (Breached)';
  defenseStatus: 'contained' | 'sandboxed' | 'exposed';
  impactAnalysis: string;
  containmentMechanism: string;
  hardeningFix: string;
}

export interface InboundPenetrationReport {
  targetUrl: string;
  hostname: string;
  timestamp: string;
  containmentRating: '堅牢に封じ込め (Fully Contained)' | 'サンドボックス隔離中 (Isolated)' | '端末侵入リスクあり (Exposed)';
  overallDefensePower: number; // 0 - 100
  vectors: InboundVectorResult[];
  layerStatus: {
    networkPerimeter: 'blocked' | 'passed';
    pwaSandbox: 'active_intercept' | 'neutral';
    osStorageShield: 'protected' | 'risk';
  };
  executiveSummary: string;
}

/**
 * 外部サイトからデバイス内部への侵入ルートを安全に模擬検証・実証するシミュレータ
 */
export function simulateInboundDevicePenetration(
  inputUrl: string,
  isPwaShieldActive: boolean = true,
  isSiteBlocked: boolean = false
): InboundPenetrationReport {
  let normalized = inputUrl.trim();
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = `https://${normalized}`;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(normalized);
  } catch {
    parsedUrl = new URL('https://suspicious-inbound-origin.net');
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  const pathname = parsedUrl.pathname.toLowerCase();

  const vectors: InboundVectorResult[] = [];
  let scoreDeductions = 0;

  // 1. ドライブバイ・ダウンロード侵入ルート
  const hasDangerousExt = /\.(exe|scr|bat|cmd|vbs|apk|jar|msi|iso|ps1)$/.test(pathname) ||
    pathname.includes('download') || pathname.includes('setup');

  if (isSiteBlocked) {
    vectors.push({
      id: 'INB-01',
      vectorName: 'ドライブバイ・ダウンロード強制配信ルート',
      category: 'Drive-by Download',
      simulatedPayload: '未検証のバイナリパッケージ（.exe/.apk）のバックグラウンド自動ダウンロード要求',
      entryPoint: 'ブラウザダウンロードマネージャ / Content-Disposition',
      barrierHit: 'Network ACL',
      defenseStatus: 'contained',
      impactAnalysis: 'ネットワーク層でドメイン自体が遮断されているため、ダウンロードストリームは開始されません。',
      containmentMechanism: 'エグレスACLによるHTTPセッション即時ドロップ',
      hardeningFix: '防御は有効です。不要なファイル拡張子のブラウザ保存制限ポリシーを維持してください。',
    });
  } else if (hasDangerousExt) {
    scoreDeductions += 25;
    vectors.push({
      id: 'INB-01',
      vectorName: 'ドライブバイ・ダウンロード強制配信ルート',
      category: 'Drive-by Download',
      simulatedPayload: '疑わしい実行可能ファイルパスへの自動リダイレクトおよびダウンロード試行',
      entryPoint: 'ブラウザダウンロードマネージャ / Content-Disposition',
      barrierHit: isPwaShieldActive ? 'PWA Sandbox' : 'None (Breached)',
      defenseStatus: isPwaShieldActive ? 'sandboxed' : 'exposed',
      impactAnalysis: isPwaShieldActive
        ? 'PWAサンドボックスにより直接のファイル実行は防止されますが、保存プロンプトが表示される危険があります。'
        : '端末のローカルストレージへ直接危険ファイルが保存され、誤実行のリスクが生じます。',
      containmentMechanism: isPwaShieldActive
        ? 'PWA独立コンテキストによるシェル実行権限の遮断'
        : '保護機能未稼働',
      hardeningFix: 'PWAサンドボックス防御シールドを常時稼働させ、疑わしい拡張子を含むURLを即時遮断してください。',
    });
  } else {
    vectors.push({
      id: 'INB-01',
      vectorName: 'ドライブバイ・ダウンロード強制配信ルート',
      category: 'Drive-by Download',
      simulatedPayload: 'ファイルダウンロードトリガーの探索',
      entryPoint: 'DOMアンカー要素（download属性）の自動クリック',
      barrierHit: isPwaShieldActive ? 'PWA Sandbox' : 'OS Security Layer',
      defenseStatus: 'contained',
      impactAnalysis: '危険な実行ファイル配信の兆候は検出されず、標準のWebリソースとして処理されます。',
      containmentMechanism: 'ダウンロードトリガーの検証とサンドボックス制約',
      hardeningFix: '現状のセキュリティ設定を継続してください。',
    });
  }

  // 2. 悪意あるService Worker / バックグラウンド常駐ルート
  const hasServiceWorkerRisk = hostname.includes('push') || hostname.includes('service') || pathname.includes('sw.js');

  if (isSiteBlocked) {
    vectors.push({
      id: 'INB-02',
      vectorName: 'Service Worker悪用・バックグラウンド常駐ルート',
      category: 'Persistence',
      simulatedPayload: '外部スクリプトのバックグラウンド登録および永続的オフラインキャッシュの確保試行',
      entryPoint: 'navigator.serviceWorker.register() API',
      barrierHit: 'Network ACL',
      defenseStatus: 'contained',
      impactAnalysis: 'サイト全体がブロックされているため、スクリプトの取得自体が失敗し常駐化は成立しません。',
      containmentMechanism: 'ACLによるService Workerスクリプト取得の拒否',
      hardeningFix: 'ブロック状態を維持してください。',
    });
  } else if (hasServiceWorkerRisk) {
    scoreDeductions += 20;
    vectors.push({
      id: 'INB-02',
      vectorName: 'Service Worker悪用・バックグラウンド常駐ルート',
      category: 'Persistence',
      simulatedPayload: 'バックグラウンド同期(Background Sync)を利用した端末アイドル時の外部通信セッション維持',
      entryPoint: 'navigator.serviceWorker.register() API',
      barrierHit: isPwaShieldActive ? 'PWA Sandbox' : 'None (Breached)',
      defenseStatus: isPwaShieldActive ? 'sandboxed' : 'exposed',
      impactAnalysis: isPwaShieldActive
        ? 'PWA独自のスコープ隔離により、他のアプリケーションやタブへの影響は封じ込められています。'
        : 'ブラウザバックグラウンドにワーカーが常駐し、タブを閉じても通信が継続するリスクがあります。',
      containmentMechanism: 'PWAコンテナ境界によるスコープ制限',
      hardeningFix: '信頼されていない外部ドメインに対するService Worker登録権限をブラウザ設定で制限してください。',
    });
  } else {
    vectors.push({
      id: 'INB-02',
      vectorName: 'Service Worker悪用・バックグラウンド常駐ルート',
      category: 'Persistence',
      simulatedPayload: '正規Webページのロードとキャッシュの整合性点検',
      entryPoint: 'Cache API / Service Worker スコープ',
      barrierHit: 'PWA Sandbox',
      defenseStatus: 'contained',
      impactAnalysis: '不正なバックグラウンド常駐スクリプトの試行は認められませんでした。',
      containmentMechanism: 'オリジン分離ポリシー',
      hardeningFix: '定期的なService Worker登録一覧の点検を行ってください。',
    });
  }

  // 3. ローカルストレージ改ざん・セッション汚染ルート
  if (isSiteBlocked) {
    vectors.push({
      id: 'INB-03',
      vectorName: '端末DOMストレージ・セッション汚染ルート',
      category: 'Storage Hijack',
      simulatedPayload: 'ローカル端末上のCookie/LocalStorage/IndexedDBへの不正アクセスおよびセッション書き換え',
      entryPoint: 'Document.cookie / window.localStorage',
      barrierHit: 'Network ACL',
      defenseStatus: 'contained',
      impactAnalysis: '対象オリジンへの到達が遮断されているため、端末ストレージへのアクセス機会はありません。',
      containmentMechanism: 'ネットワークレイヤー完全遮断',
      hardeningFix: '現在のブロック設定を維持してください。',
    });
  } else {
    if (!isPwaShieldActive) {
      scoreDeductions += 20;
      vectors.push({
        id: 'INB-03',
        vectorName: '端末DOMストレージ・セッション汚染ルート',
        category: 'Storage Hijack',
        simulatedPayload: 'クロスオリジンスクリプトによる共有ブラウザコンテキストからのストレージ盗難試行',
        entryPoint: '共有ブラウザCookieプール / サードパーティストレージ',
        barrierHit: 'None (Breached)',
        defenseStatus: 'exposed',
        impactAnalysis: '一般ブラウザの共有タブ空間では、クロスサイトトラッキングやストレージの漏洩リスクが高まります。',
        containmentMechanism: 'Same-Origin Policyのみ（追加保護なし）',
        hardeningFix: 'PWAサンドボックス防御シールドを有効化し、専用の分離プロセス環境で実行してください。',
      });
    } else {
      vectors.push({
        id: 'INB-03',
        vectorName: '端末DOMストレージ・セッション汚染ルート',
        category: 'Storage Hijack',
        simulatedPayload: 'PWA独立環境への侵入およびストレージ漏洩の試行',
        entryPoint: '専用PWAサンドボックス・ストレージパーティション',
        barrierHit: 'PWA Sandbox',
        defenseStatus: 'sandboxed',
        impactAnalysis: 'PWA専用の独立コンテキストにより、一般タブのCookieやセッションから完全に隔離されています。',
        containmentMechanism: 'プロセス単位のストレージパーティショニング',
        hardeningFix: 'PWA独立ウィンドウでの実行を継続してください。',
      });
    }
  }

  // 4. ローカルネットワーク（Intranet/127.0.0.1）探索ルート
  const isPrivateOrLoopback = /^(127\.|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|localhost)/.test(hostname);

  if (isPrivateOrLoopback) {
    scoreDeductions += 30;
    vectors.push({
      id: 'INB-04',
      vectorName: '内部ネットワーク(Intranet/Loopback)探索ルート',
      category: 'Lateral Scan',
      simulatedPayload: 'WebRTC / fetch() を用いたLAN内デバイスおよびローカルポート(8080/5432/3000)のスキャン',
      entryPoint: '内部IP直接指定 / WebRTC STUN探索',
      barrierHit: isSiteBlocked ? 'Network ACL' : 'None (Breached)',
      defenseStatus: isSiteBlocked ? 'contained' : 'exposed',
      impactAnalysis: isSiteBlocked
        ? '内部アドレス宛の通信がローカルルールで遮断されており、LAN内機器の露出は防止されています。'
        : '外部Webページから端末内ローカルサービス（127.0.0.1）へのピボット（足場化）が可能な状態です。',
      containmentMechanism: isSiteBlocked ? '内部アドレスアクセス禁止ACL' : '未保護',
      hardeningFix: 'ローカルループバックおよびプライベートIPへの直接アクセスを即時ブロックしてください。',
    });
  } else {
    vectors.push({
      id: 'INB-04',
      vectorName: '内部ネットワーク(Intranet/Loopback)探索ルート',
      category: 'Lateral Scan',
      simulatedPayload: 'パブリックIPから端末内サービスへのクロスオリジンリクエスト送信の試行',
      entryPoint: 'Private Network Access (PNA) 検証',
      barrierHit: 'OS Security Layer',
      defenseStatus: 'contained',
      impactAnalysis: 'Private Network Access (PNA) ポリシーにより、公衆網からローカルLANへの不正通信は阻止されます。',
      containmentMechanism: 'ブラウザPNAプリフライトチェック',
      hardeningFix: 'LAN内への通信を許可しないデフォルトポリシーを維持してください。',
    });
  }

  // 5. 偽装パーミッション詐取ルート
  vectors.push({
    id: 'INB-05',
    vectorName: '偽装パーミッション・端末センサー詐取ルート',
    category: 'Permission Abuse',
    simulatedPayload: 'システム通知・位置情報・マイクへの偽装アクセス要求の連続発行試行',
    entryPoint: 'Notification.requestPermission() / navigator.permissions',
    barrierHit: 'PWA Sandbox',
    defenseStatus: 'contained',
    impactAnalysis: '悪意ある権限要求はPWAセキュリティシールドおよびユーザー明示的同意プロンプトで遮断されます。',
    containmentMechanism: '厳格なユーザー操作連動プロンプトと権限隔離',
    hardeningFix: '不要なWebサイトに対する通知およびハードウェア権限を常に「拒否」に設定してください。',
  });

  const overallDefensePower = Math.max(0, 100 - scoreDeductions);
  let containmentRating: InboundPenetrationReport['containmentRating'];
  if (overallDefensePower >= 85) {
    containmentRating = '堅牢に封じ込め (Fully Contained)';
  } else if (overallDefensePower >= 60) {
    containmentRating = 'サンドボックス隔離中 (Isolated)';
  } else {
    containmentRating = '端末侵入リスクあり (Exposed)';
  }

  const layerStatus = {
    networkPerimeter: isSiteBlocked ? ('blocked' as const) : ('passed' as const),
    pwaSandbox: isPwaShieldActive ? ('active_intercept' as const) : ('neutral' as const),
    osStorageShield: overallDefensePower >= 70 ? ('protected' as const) : ('risk' as const),
  };

  const executiveSummary = overallDefensePower >= 85
    ? `対象サイト（${hostname}）から端末への全インバウンド侵入ルートは、多層防御（ACL・サンドボックス・オリジン分離）によって完全に遮断・封じ込められています。`
    : `対象サイト（${hostname}）からの通信において、${scoreDeductions}点の脆弱性が実証されました。PWA防御シールドの稼働および対象URLの即時遮断を強く推奨します。`;

  return {
    targetUrl: normalized,
    hostname,
    timestamp: new Date().toISOString(),
    containmentRating,
    overallDefensePower,
    vectors,
    layerStatus,
    executiveSummary,
  };
}
