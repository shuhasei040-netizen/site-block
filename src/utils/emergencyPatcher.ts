import { RestrictionItem, UserAccount, SiteItem, LogEntry } from '../types/security';

export interface BackdoorVulnerabilityItem {
  id: string;
  name: string;
  category: 'Port Bypass' | 'Malicious Lock' | 'Privilege Escalation' | 'DNS Leak';
  severity: 'critical' | 'high' | 'medium';
  exposedRoute: string;
  patchAction: string;
}

export interface EmergencyPatchResult {
  success: boolean;
  timestamp: string;
  verificationToken: string;
  patchedVulnerabilities: BackdoorVulnerabilityItem[];
  actionsTaken: string[];
  restoredPrivileges: boolean;
  clearedRestrictionsCount: number;
}

/**
 * ロック制限下において、緊急遠隔検証アクセスを確立し、
 * 既存のバックドア通信経路を特定して脆弱性パッチ（閉塞）を適用する
 */
export function executeEmergencyVerificationAndPatch(
  restrictions: RestrictionItem[],
  accounts: UserAccount[],
  sites: SiteItem[]
): {
  patchedRestrictions: RestrictionItem[];
  patchedAccounts: UserAccount[];
  patchResult: EmergencyPatchResult;
} {
  const token = `EMERG-ACCESS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const vulnerabilities: BackdoorVulnerabilityItem[] = [];
  const actionsTaken: string[] = [];

  // 1. 既存のバックドア・迂回通信経路の検査
  const patchedRestrictions = restrictions.map((r) => {
    // 信頼性スコア40未満の悪意ある虚偽ロック制限
    if (r.status === 'active' && r.credibilityScore < 40) {
      vulnerabilities.push({
        id: `VULN-LOCK-${r.id}`,
        name: `悪意ある虚偽ロック制限: ${r.title}`,
        category: 'Malicious Lock',
        severity: 'critical',
        exposedRoute: `制限ID: ${r.id} (信頼度:${r.credibilityScore})`,
        patchAction: '不当なロック制限を無効化（repelled）し、正常運用を復旧',
      });
      actionsTaken.push(`不審なロック制限「${r.title}」を閉塞・無効化`);
      return { ...r, status: 'repelled' as const, repelledByPwa: true };
    }

    // IP直打ちや非標準ポートの迂回バックドアを含む制限ルールの閉塞修復
    const raw = `${r.title} ${r.reason}`.toLowerCase();
    if (r.status === 'active' && (raw.includes(':8080') || raw.includes(':8443') || /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/.test(raw))) {
      vulnerabilities.push({
        id: `VULN-ROUTE-${r.id}`,
        name: `IP直指定/非標準ポート迂回バックドア: ${r.title}`,
        category: 'Port Bypass',
        severity: 'high',
        exposedRoute: raw.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?\b/)?.[0] || 'カスタムポート通信',
        patchAction: '迂回ポート・例外IP通信経路を全面閉鎖・ドロップパッチ適用',
      });
      actionsTaken.push(`迂回通信経路を含むルール「${r.title}」に閉塞パッチを適用`);
      return {
        ...r,
        title: `${r.title} [PATCHED: 迂回ポート閉塞済]`,
        reason: `${r.reason} (緊急パッチ適用: IP直打ちおよび非標準ポート通信を全面閉鎖)`,
      };
    }

    return r;
  });

  // 2. 未承認・未検証アカウントの特権バックドア閉塞
  let restoredPrivileges = false;
  const patchedAccounts = accounts.map((acc) => {
    if (acc.role === 'L3' && !acc.isVerified && !acc.isProtected) {
      vulnerabilities.push({
        id: `VULN-ADMIN-${acc.id}`,
        name: `未検証特権管理者バックドア: ${acc.displayName} (@${acc.id})`,
        category: 'Privilege Escalation',
        severity: 'critical',
        exposedRoute: `User ID: ${acc.id} (Role: L3)`,
        patchAction: 'L3権限を剥奪し、一般閲覧(L1)へ降格・隔離',
      });
      actionsTaken.push(`未検証管理者 @${acc.id} の特権を剥奪・隔離`);
      return { ...acc, role: 'L1' as const };
    }
    if (acc.id === 'admin' && acc.role !== 'L3') {
      restoredPrivileges = true;
      actionsTaken.push('正規管理者 admin のL3最高権限を復旧');
      return { ...acc, role: 'L3' as const };
    }
    return acc;
  });

  // 3. 総合結果レポートの生成
  const patchResult: EmergencyPatchResult = {
    success: true,
    timestamp: new Date().toISOString(),
    verificationToken: token,
    patchedVulnerabilities: vulnerabilities,
    actionsTaken,
    restoredPrivileges,
    clearedRestrictionsCount: vulnerabilities.filter((v) => v.category === 'Malicious Lock').length,
  };

  return {
    patchedRestrictions,
    patchedAccounts,
    patchResult,
  };
}
