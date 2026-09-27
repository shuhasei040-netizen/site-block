import { RestrictionItem, ScoreDeduction, UserAccount } from '../types/security';

export interface CredibilityCalculationResult {
  score: number;
  breakdown: {
    base: number;
    deductions: ScoreDeduction[];
  };
  level: 'trusted' | 'medium' | 'untrusted';
  levelLabel: string;
}

export function calculateCredibilityScore(
  operator: UserAccount,
  restrictionType: string,
  existingRestrictions: RestrictionItem[],
  isMassRevokeAttempt: boolean = false
): CredibilityCalculationResult {
  const base = 100;
  const deductions: ScoreDeduction[] = [];

  // Check 1: Verified account status
  if (!operator.isVerified) {
    deductions.push({
      reason: '未検証アカウントによる制限適用',
      amount: 40,
    });
  }

  // Check 2: Past 24h restrictions by same user
  const now = Date.now();
  const past24h = now - 24 * 60 * 60 * 1000;
  const recentByUser = existingRestrictions.filter(
    (r) => r.appliedBy === operator.id && r.createdAt > past24h
  );

  if (recentByUser.length >= 4) {
    // Current one makes it 5 or more
    deductions.push({
      reason: '24時間以内に5回以上の制限を適用（スパム判定）',
      amount: 30,
    });
  }

  // Check 3: Short timeframe mass lockout or admin revocation
  if (isMassRevokeAttempt || restrictionType === 'revoke_admin') {
    deductions.push({
      reason: '管理者権限の短時間剥奪・広範囲ロック試行（ハッカー判定）',
      amount: 50,
    });
  }

  const totalDeduction = deductions.reduce((sum, d) => sum + d.amount, 0);
  const score = Math.max(0, Math.min(100, base - totalDeduction));

  let level: 'trusted' | 'medium' | 'untrusted' = 'trusted';
  let levelLabel = '信頼できる制限';

  if (score < 40) {
    level = 'untrusted';
    levelLabel = '信頼できない制限（低スコア・削除可能）';
  } else if (score < 70) {
    level = 'medium';
    levelLabel = '中程度の信頼度';
  }

  return {
    score,
    breakdown: {
      base,
      deductions,
    },
    level,
    levelLabel,
  };
}
