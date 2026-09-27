import { LogEntry, RestrictionItem, ThreatPatternCheck, UserAccount } from '../types/security';

export function analyzeThreatPatterns(
  logs: LogEntry[],
  restrictions: RestrictionItem[],
  accounts: UserAccount[]
): {
  patterns: ThreatPatternCheck[];
  activeThreatCount: number;
  criticalCount: number;
  anomaliesSummary: string[];
} {
  const now = Date.now();
  const pastHour = now - 60 * 60 * 1000;
  const past10Min = now - 10 * 60 * 1000;

  // Pattern 1: Same user applied >= 5 restrictions in 1 hour
  const restrictionsPastHour = restrictions.filter((r) => r.createdAt > pastHour);
  const userRestrictionCounts: Record<string, number> = {};
  for (const r of restrictionsPastHour) {
    userRestrictionCounts[r.appliedBy] = (userRestrictionCounts[r.appliedBy] || 0) + 1;
  }
  const isSpamLockdown = Object.values(userRestrictionCounts).some((count) => count >= 5);

  // Pattern 2: Non-admin user attempted privilege escalation or role change
  const privilegeEscalationLogs = logs.filter(
    (l) =>
      (l.action.includes('権限変更') || l.action.includes('管理者権限')) &&
      l.status === 'failure' &&
      l.category === 'ADMIN'
  );
  const isPrivilegeAttack = privilegeEscalationLogs.length > 0;

  // Pattern 3: Irregular hours (03:00 - 05:00) mass operations
  const nightOpsLogs = logs.filter((l) => {
    try {
      const match = l.timestamp.match(/ (\d{2}):/);
      if (match) {
        const hour = parseInt(match[1], 10);
        return hour >= 3 && hour <= 5;
      }
    } catch {
      // fallback
    }
    return false;
  });
  const isIrregularHoursOp = nightOpsLogs.length >= 8;

  // Pattern 4: Multiple simultaneous IPs for the same account
  const multiIpLogs = logs.filter(
    (l) => l.action.includes('異なるIP') || (l.details && l.details.includes('CONCURRENT_IP'))
  );
  const isMultiIpConcurrent = multiIpLogs.length > 0;

  // Pattern 5: Repeated login failures (>= 5 in 10 minutes)
  const recentFailedLogins = logs.filter(
    (l) =>
      l.category === 'AUTH' &&
      l.status === 'failure' &&
      new Date(l.timestamp.replace(' ', 'T')).getTime() > past10Min
  );
  const isLoginBruteForce = recentFailedLogins.length >= 5;

  // Pattern 6: Newly created account applied restrictions immediately (< 5 min)
  const isNewAccountRestricting = restrictions.some((r) => {
    const acc = accounts.find((a) => a.id === r.appliedBy);
    if (!acc) return false;
    const createdAtTime = new Date(acc.createdAt).getTime();
    return r.createdAt - createdAtTime < 5 * 60 * 1000;
  });

  // Pattern 7: Tamper attempt detected in logs
  const isTamperDetected = logs.some((l) => l.tampered === true);

  const patterns: ThreatPatternCheck[] = [
    {
      id: 'pattern-1',
      name: '短時間に複数の制限をかける（ロックダウンスパム）',
      severity: 'critical',
      status: isSpamLockdown ? 'triggered' : 'normal',
      description: '同一ユーザーが1時間以内に5件以上の制限を適用する異常な封鎖行動を検知',
      triggerCount: Object.values(userRestrictionCounts).filter((c) => c >= 5).length,
      iconName: 'ShieldAlert',
    },
    {
      id: 'pattern-2',
      name: '管理者以外による権限変更・奪取の試み',
      severity: 'critical',
      status: isPrivilegeAttack ? 'triggered' : 'normal',
      description: 'L1/L2の非管理者アカウントによる権限昇格または他者ロール改変の試みを検知',
      triggerCount: privilegeEscalationLogs.length,
      iconName: 'UserX',
    },
    {
      id: 'pattern-3',
      name: 'ログの改ざん・CRC-32不一致の試行',
      severity: 'critical',
      status: isTamperDetected ? 'triggered' : 'normal',
      description: '操作履歴データの改ざん、またはチェックサム不一致レコードを検知',
      triggerCount: logs.filter((l) => l.tampered).length,
      iconName: 'FileX',
    },
    {
      id: 'pattern-4',
      name: '不規則な時間帯（深夜3〜5時）の大量操作',
      severity: 'warning',
      status: isIrregularHoursOp ? 'triggered' : 'normal',
      description: '業務時間外である深夜3〜5時に異常なバッチ変更や操作が集中',
      triggerCount: nightOpsLogs.length,
      iconName: 'Moon',
    },
    {
      id: 'pattern-5',
      name: '異なるIPアドレスからの同時ログイン接続',
      severity: 'warning',
      status: isMultiIpConcurrent ? 'triggered' : 'normal',
      description: '同一ユーザーIDによる地理的に離れた複数IPからの同時アクセス・セッションを検知',
      triggerCount: multiIpLogs.length,
      iconName: 'Globe',
    },
    {
      id: 'pattern-6',
      name: 'ログイン試行の短時間連続失敗（総当たり・辞書攻撃）',
      severity: 'warning',
      status: isLoginBruteForce ? 'triggered' : 'normal',
      description: '10分以内に5回以上のログイン失敗を検知（ID列挙・パスワード試行）',
      triggerCount: recentFailedLogins.length,
      iconName: 'Key',
    },
    {
      id: 'pattern-7',
      name: '新規作成直後アカウントによる制限適用',
      severity: 'warning',
      status: isNewAccountRestricting ? 'triggered' : 'normal',
      description: '作成後5分以内の未成熟アカウントによるシステム制限・アクセス遮断の適用',
      triggerCount: isNewAccountRestricting ? 1 : 0,
      iconName: 'UserPlus',
    },
  ];

  const triggeredList = patterns.filter((p) => p.status === 'triggered');
  const criticalCount = triggeredList.filter((p) => p.severity === 'critical').length;
  const activeThreatCount = triggeredList.length;
  const anomaliesSummary = triggeredList.map((p) => p.name);

  return {
    patterns,
    activeThreatCount,
    criticalCount,
    anomaliesSummary,
  };
}
