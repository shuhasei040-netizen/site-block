import { LogEntry, RestrictionItem, SiteItem, UserAccount } from '../types/security';

export interface BackdoorAuditFinding {
  id: string;
  category: 'RULE_BYPASS' | 'ROGUE_ADMIN' | 'UNAUTHORIZED_EXCEPTION' | 'CREDENTIAL_EXPOSURE' | 'TAMPER_DRIFT';
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  description: string;
  target: string;
  remediation: string;
  detectedAt: string;
  autoHealed?: boolean;
}

export interface BackdoorScanReport {
  scannedAt: string;
  totalChecks: number;
  backdoorsFound: number;
  criticalCount: number;
  isSafe: boolean;
  findings: BackdoorAuditFinding[];
}

/**
 * Audio Synthesizer for high-priority security alerts
 */
export function playAlertSiren(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.18);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.36);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.54);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    // Audio autoplay might be blocked before first interaction
  }
}

/**
 * Dispatches OS/Browser Desktop Notification if granted
 */
export async function sendInstantSecurityNotification(
  title: string,
  body: string,
  urgency: 'critical' | 'warning' = 'critical'
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  try {
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission === 'granted') {
      const icon = urgency === 'critical' ? '/icon.svg' : '/icon.svg';
      const notification = new Notification(`🚨 [MLSMD 警報] ${title}`, {
        body,
        icon,
        badge: '/icon.svg',
        tag: 'backdoor-alert-' + Date.now(),
        requireInteraction: urgency === 'critical',
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      return true;
    }
  } catch (e) {
    console.warn('Desktop Notification error:', e);
  }
  return false;
}

/**
 * Deep Inspection Engine: Scans all blocks, rules, sites, logs, and accounts
 * for any hidden backdoors, unauthorized escape hatches, bypass routes, or vulnerabilities.
 */
export function auditAllBlocksAndBackdoors(
  sites: SiteItem[],
  restrictions: RestrictionItem[],
  accounts: UserAccount[],
  logs: LogEntry[]
): BackdoorScanReport {
  const findings: BackdoorAuditFinding[] = [];
  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

  // 1. Check for Unauthorized / Unverified Admin Accounts (Rogue Admin backdoor)
  for (const account of accounts) {
    if (account.role === 'L3' && !account.isVerified && !account.isProtected) {
      findings.push({
        id: `backdoor-rogue-admin-${account.id}`,
        category: 'ROGUE_ADMIN',
        title: `未認可の特権管理者アカウントが存在します (${account.id})`,
        severity: 'CRITICAL',
        description: `管理者(L3)権限を持つ「${account.displayName}」が身元未検証のまま登録されています。バックドアとして特権昇格されている可能性があります。`,
        target: `アカウント: ${account.id} (${account.displayName})`,
        remediation: 'アカウント管理で未検証管理者を削除または閲覧者(L1)へ降格してください。',
        detectedAt: nowStr,
      });
    }
  }

  // 2. Check for Weak or Default Passwords on Privileged Users (Credential Exposure)
  const weakPasswords = ['admin', 'password', '123456', 'root', 'admin123', 'toor', 'test'];
  for (const account of accounts) {
    if (account.role === 'L3' && weakPasswords.includes(account.password.toLowerCase())) {
      findings.push({
        id: `backdoor-weak-pwd-${account.id}`,
        category: 'CREDENTIAL_EXPOSURE',
        title: `特権管理者のパスワードが脆弱・推測可能です (${account.id})`,
        severity: 'HIGH',
        description: `推測が容易な初期既定値（${account.password}）が設定されています。ブルートフォースや辞書攻撃による侵入バックドアとなります。`,
        target: `アカウント: ${account.id}`,
        remediation: '安全で強固なパスワードに変更してください。',
        detectedAt: nowStr,
      });
    }
  }

  // 3. Inspect Blocked Sites for Hidden Evasion / Bypass Backdoors
  // e.g. IP direct access, Punycode tricks, port bypasses, query bypasses
  for (const site of sites) {
    const rawUrl = site.url.toLowerCase();

    // Check for IP literal bypass (e.g., http://127.0.0.1 or http://192.168... or hex/octal ip)
    const ipMatch = rawUrl.match(/https?:\/\/(?:(\d{1,3}\.){3}\d{1,3}|0x[0-9a-f]+|localhost)/i);
    if (ipMatch) {
      findings.push({
        id: `backdoor-site-ip-${site.id}`,
        category: 'RULE_BYPASS',
        title: `IP直指定によるドメインブロック回避バックドア (${site.name})`,
        severity: 'HIGH',
        description: `URLにIPアドレス（${ipMatch[0]}）が直指定されており、ドメイン名ブラックリストやDNS検閲をすり抜けるバックドア構造です。`,
        target: site.url,
        remediation: 'ホスト名ベースの正規ドメインフィルタまたはFQDNで制限してください。',
        detectedAt: nowStr,
      });
    }

    // Check for Non-Standard Ports (e.g. :8080, :8888, :8443, :4444)
    const portMatch = rawUrl.match(/https?:\/\/[^/:]+:(\d+)/);
    if (portMatch) {
      const port = parseInt(portMatch[1], 10);
      if (port !== 80 && port !== 443) {
        findings.push({
          id: `backdoor-site-port-${site.id}`,
          category: 'RULE_BYPASS',
          title: `非標準ポート経由のファイアウォールバイパス (${site.name})`,
          severity: 'MEDIUM',
          description: `標準ポート(80/443)以外のポート :${port} が指定されています。プロキシやファイアウォールの遮断ルールを迂回する隠し通路の可能性があります。`,
          target: site.url,
          remediation: 'ポート番号を遮断対象に含めるか、標準HTTPS通信のみを許可してください。',
          detectedAt: nowStr,
        });
      }
    }

    // Check for Punycode homograph attacks
    if (rawUrl.includes('xn--')) {
      findings.push({
        id: `backdoor-site-punycode-${site.id}`,
        category: 'RULE_BYPASS',
        title: `Punycode同形文字詐欺によるブロック偽装 (${site.name})`,
        severity: 'CRITICAL',
        description: `国際化ドメイン名（xn--）が用いられており、視覚的に正規ドメインを偽装してブロックフィルターをすり抜けるバックドアです。`,
        target: site.url,
        remediation: '該当サイトを直ちにブラックリストへ登録し隔離してください。',
        detectedAt: nowStr,
      });
    }

    // Check for dangerous dangerous executable extensions or scripts
    const dangerExts = ['.exe', '.bat', '.cmd', '.vbs', '.ps1', '.sh', '.msi', '.bin'];
    for (const ext of dangerExts) {
      if (rawUrl.includes(ext)) {
        findings.push({
          id: `backdoor-site-ext-${site.id}-${ext}`,
          category: 'RULE_BYPASS',
          title: `悪意ある実行ファイル配布リンク (${ext})`,
          severity: 'CRITICAL',
          description: `ブロック対象または管理対象サイト内に直接実行可能ファイル（${ext}）へのパスが含まれています。バックドアマルウェア感染の恐れがあります。`,
          target: site.url,
          remediation: '即時遮断を実行し、サイト状態を「危険(danger)」に更新してください。',
          detectedAt: nowStr,
        });
      }
    }
  }

  // 4. Audit Active Restrictions for Untrusted Rogue Lockdowns (Denial of Service Backdoor)
  for (const restriction of restrictions) {
    if (restriction.status === 'active' && restriction.credibilityScore < 40) {
      findings.push({
        id: `backdoor-untrusted-lockdown-${restriction.id}`,
        category: 'UNAUTHORIZED_EXCEPTION',
        title: `低信頼度・不審なシステム制限（業務妨害バックドア）`,
        severity: 'CRITICAL',
        description: `信頼性スコア${restriction.credibilityScore}点の異常制限「${restriction.title}」が適用されています。侵入者による正常アクセスの妨害バックドアです。`,
        target: `制限ID: ${restriction.id} (${restriction.title})`,
        remediation: '「不正制限を弾き出す」ボタンまたは緊急復旧で直ちに無効化してください。',
        detectedAt: nowStr,
      });
    }
  }

  // 5. Inspect Log Tampering (Audit Trail Erasure Backdoor)
  const tamperedLogs = logs.filter((l) => l.tampered === true);
  if (tamperedLogs.length > 0) {
    findings.push({
      id: 'backdoor-log-tampering',
      category: 'TAMPER_DRIFT',
      title: `監査ログの改ざん・証跡消去の痕跡 (${tamperedLogs.length}件)`,
      severity: 'CRITICAL',
      description: `CRC-32暗号チェックサムが破られた不整合ログが存在します。攻撃者が侵入経路（バックドア）を隠蔽するためにログを改ざんした証拠です。`,
      target: `ログID: ${tamperedLogs.map((l) => l.id).join(', ')}`,
      remediation: 'バックアップからログ整合性を検証し、マスターキーでセッションを再封鎖してください。',
      detectedAt: nowStr,
    });
  }

  const criticalCount = findings.filter((f) => f.severity === 'CRITICAL').length;
  const isSafe = findings.length === 0;

  return {
    scannedAt: nowStr,
    totalChecks: accounts.length + sites.length + restrictions.length + logs.length + 10,
    backdoorsFound: findings.length,
    criticalCount,
    isSafe,
    findings,
  };
}
