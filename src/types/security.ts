export type UserRole = 'L1' | 'L2' | 'L3';

export interface UserAccount {
  id: string;
  displayName: string;
  password: string; // Plaintext for demo as permitted in prompt
  role: UserRole;
  isVerified: boolean;
  createdAt: string;
  isProtected?: boolean; // admin cannot be deleted
  lastLoginAt?: string;
  loginIp?: string;
}

export type RestrictionType =
  | 'full_lock'       // システム完全ロックダウン
  | 'read_only'       // 読み取り専用化
  | 'revoke_admin'    // 管理者権限剥奪
  | 'site_block'      // サイトアクセス制限
  | 'api_freeze';     // API・操作凍結

export interface ScoreDeduction {
  reason: string;
  amount: number;
}

export interface RestrictionItem {
  id: string;
  type: RestrictionType;
  title: string;
  reason: string;
  appliedBy: string;
  appliedByName?: string;
  targetScope: 'all' | 'sites' | 'admins' | 'system';
  durationMinutes: number;
  createdAt: number; // timestamp ms
  expiresAt: number; // timestamp ms
  credibilityScore: number; // 0 - 100
  scoreBreakdown: {
    base: number;
    deductions: ScoreDeduction[];
  };
  status: 'active' | 'ignored' | 'expired' | 'repelled';
  bypassable: boolean;
  repelledByPwa?: boolean;
}

export interface ScanDetailResult {
  hasHttps: boolean;
  hasDangerousExt: boolean;
  isShortener: boolean;
  hasMalwareKeyword: boolean;
  hasIdnSuspicious: boolean;
  hasSanctionedTld: boolean;
}

export interface ScanResult {
  level: 'safe' | 'warning' | 'danger';
  score: number;
  issues: string[];
  details: ScanDetailResult;
  scannedAt: string;
}

export interface SiteItem {
  id: string;
  name: string;
  url: string;
  category: string;
  createdBy: string;
  isVerified: boolean;
  status: 'active' | 'warning' | 'danger' | 'maintenance';
  notes: string;
  createdAt: string;
  lastScannedAt?: string;
  scanResults?: ScanResult;
}

export type LogCategory =
  | 'AUTH'
  | 'SITE'
  | 'RESTRICTION'
  | 'ADMIN'
  | 'OVERRIDE'
  | 'SCAN'
  | 'PWA_SHIELD'
  | 'SECURITY';

export interface LogEntry {
  id: string;
  timestamp: string; // YYYY-MM-DD HH:mm:ss.SSS
  operatorId: string;
  action: string;
  category: LogCategory;
  status: 'success' | 'failure' | 'warning';
  checksum: string; // CRC-32 Hex
  isTamperProof: boolean;
  tampered?: boolean; // UI flag when simulation tampered
  details?: string;
}

export interface ThreatPatternCheck {
  id: string;
  name: string;
  severity: 'critical' | 'warning' | 'info';
  status: 'triggered' | 'normal';
  description: string;
  triggerCount: number;
  lastTriggered?: string;
  iconName: string;
}
