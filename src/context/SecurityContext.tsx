import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import {
  LogCategory,
  LogEntry,
  RestrictionItem,
  RestrictionType,
  SiteItem,
  UserAccount,
  UserRole,
} from '../types/security';
import { computeCRC32, formatTimestamp, getLogCanonicalPayload, verifyLogIntegrity } from '../utils/crc32';
import { calculateCredibilityScore } from '../utils/credibility';
import { scanUrl } from '../utils/scanner';
import { generateStandaloneHtml } from '../utils/standaloneHtmlGenerator';

import {
  auditAllBlocksAndBackdoors,
  BackdoorScanReport,
  BackdoorAuditFinding,
  playAlertSiren,
  sendInstantSecurityNotification,
} from '../utils/backdoorScanner';
import { runPostureSimulation, PostureEvaluationReport } from '../utils/postureSimulator';

export const MASTER_KEY = 'MASTER-2024-OVERRIDE';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes inactivity timeout

export interface SecurityContextType {
  currentUser: UserAccount | null;
  accounts: UserAccount[];
  sites: SiteItem[];
  restrictions: RestrictionItem[];
  logs: LogEntry[];
  isEmergencyOverridden: boolean;
  pwaShieldActive: boolean;
  isStandalonePWA: boolean;
  sessionRemainingSeconds: number;
  backdoorReport: BackdoorScanReport | null;
  isBackdoorAlertOpen: boolean;
  setIsBackdoorAlertOpen: (open: boolean) => void;
  runDeepBackdoorAudit: (showModalOnFindings?: boolean) => BackdoorScanReport;
  postureReport: PostureEvaluationReport | null;
  isPostureEvaluating: boolean;
  runPostureEvaluation: () => Promise<PostureEvaluationReport>;
  autoHardenVulnerabilities: () => { fixedCount: number; details: string[] };
  requestNotificationPermission: () => Promise<NotificationPermission>;
  notificationPermission: NotificationPermission;
  login: (id: string, pass: string) => { success: boolean; message: string; isOverride?: boolean };
  logout: (reason?: string) => void;
  emergencyOverride: (key: string) => boolean;
  repelRestrictionsWithPwaPulse: () => { count: number };
  togglePwaSandboxShield: () => void;
  addSite: (site: Omit<SiteItem, 'id' | 'createdAt' | 'status' | 'createdBy' | 'isVerified'>) => boolean;
  updateSite: (site: SiteItem) => boolean;
  deleteSite: (id: string) => boolean;
  scanSingleSite: (id: string) => void;
  scanAllSites: () => void;
  applyRestriction: (data: {
    type: RestrictionType;
    title: string;
    reason: string;
    targetScope: 'all' | 'sites' | 'admins' | 'system';
    durationMinutes: number;
  }) => { success: boolean; score: number };
  removeRestriction: (id: string) => { success: boolean; message: string };
  addAccount: (data: { id: string; displayName: string; password: string; role: UserRole; isVerified: boolean }) => boolean;
  deleteAccount: (id: string) => boolean;
  updateAccountRole: (id: string, newRole: UserRole) => boolean;
  simulateTamperAttack: () => void;
  runScenario: (scenarioNumber: 1 | 2 | 3 | 4) => void;
  exportJsonBackup: () => void;
  downloadStandaloneFile: () => void;
  addLogEntry: (action: string, category: LogCategory, status?: 'success' | 'failure' | 'warning', customOperator?: string) => LogEntry;
  verifyEntryTampering: (entry: LogEntry) => boolean;
}

const SecurityContext = createContext<SecurityContextType | null>(null);

const SEED_USERS: UserAccount[] = [
  {
    id: 'admin',
    displayName: '最高システム管理者',
    password: 'admin123',
    role: 'L3',
    isVerified: true,
    createdAt: '2024-01-10',
    isProtected: true,
    lastLoginAt: '2026-09-26 18:00:00',
    loginIp: '192.168.1.10',
  },
  {
    id: 'editor_tanaka',
    displayName: '田中 健太',
    password: 'pass',
    role: 'L2',
    isVerified: true,
    createdAt: '2024-02-15',
    lastLoginAt: '2026-09-25 14:20:00',
    loginIp: '192.168.1.25',
  },
  {
    id: 'viewer_sato',
    displayName: '佐藤 美咲',
    password: 'pass',
    role: 'L1',
    isVerified: false,
    createdAt: '2024-03-01',
    lastLoginAt: '2026-09-24 10:15:00',
    loginIp: '192.168.1.42',
  },
  {
    id: 'contractor_dev',
    displayName: '外部業務委託アカウント',
    password: 'pass',
    role: 'L2',
    isVerified: false,
    createdAt: '2024-03-20',
    lastLoginAt: '2026-09-20 09:30:00',
    loginIp: '203.0.113.195',
  },
];

const SEED_SITES: SiteItem[] = [
  {
    id: 'site-corp-1',
    name: 'グローバルエンタープライズ公式ポータル',
    url: 'https://portal.enterprise-global.com',
    category: 'コーポレート',
    createdBy: 'admin',
    isVerified: true,
    status: 'active',
    notes: '24/7死活監視中 本番メインポータル',
    createdAt: '2024-01-15',
    lastScannedAt: '2026-09-26 17:30:00',
    scanResults: {
      level: 'safe',
      score: 100,
      issues: ['セキュリティ基準をすべてクリアしています（既知の脅威なし）'],
      details: {
        hasHttps: true,
        hasDangerousExt: false,
        isShortener: false,
        hasMalwareKeyword: false,
        hasIdnSuspicious: false,
        hasSanctionedTld: false,
      },
      scannedAt: '2026-09-26 17:30:00',
    },
  },
  {
    id: 'site-support-2',
    name: 'カスタマーサポートセンター＆ヘルプデスク',
    url: 'https://support.enterprise-global.com',
    category: 'サポート',
    createdBy: 'editor_tanaka',
    isVerified: true,
    status: 'active',
    notes: 'SLA 99.9% 顧客ポータル',
    createdAt: '2024-02-01',
    lastScannedAt: '2026-09-26 16:45:00',
    scanResults: {
      level: 'safe',
      score: 100,
      issues: ['セキュリティ基準をすべてクリアしています（既知の脅威なし）'],
      details: {
        hasHttps: true,
        hasDangerousExt: false,
        isShortener: false,
        hasMalwareKeyword: false,
        hasIdnSuspicious: false,
        hasSanctionedTld: false,
      },
      scannedAt: '2026-09-26 16:45:00',
    },
  },
  {
    id: 'site-lp-3',
    name: '2026新製品特別プロモーションLP',
    url: 'https://campaign-special-2026.top/free-download',
    category: 'マーケティング',
    createdBy: 'contractor_dev',
    isVerified: false,
    status: 'warning',
    notes: '委託会社により登録。ドメインTLDおよびキーワード警告あり',
    createdAt: '2024-03-22',
    lastScannedAt: '2026-09-26 18:10:00',
    scanResults: {
      level: 'warning',
      score: 45,
      issues: [
        'フィッシング・マルウェア関連の怪しいキーワード（free-download）が含まれています',
        'スパム・不正活動報告の多いTLD（.top）を使用しています',
      ],
      details: {
        hasHttps: true,
        hasDangerousExt: false,
        isShortener: false,
        hasMalwareKeyword: true,
        hasIdnSuspicious: false,
        hasSanctionedTld: true,
      },
      scannedAt: '2026-09-26 18:10:00',
    },
  },
  {
    id: 'site-dev-4',
    name: '短縮リンク転送テストステージング',
    url: 'http://bit.ly/update-portal-patch.exe',
    category: '開発テスト',
    createdBy: 'contractor_dev',
    isVerified: false,
    status: 'danger',
    notes: 'テスト用検知サイト',
    createdAt: '2024-03-24',
    lastScannedAt: '2026-09-26 18:12:00',
    scanResults: {
      level: 'danger',
      score: 5,
      issues: [
        'HTTPS暗号化通信が使用されていません（平文HTTP通信の傍受リスク）',
        '既知の危険な実行可能・圧縮拡張子（.exe）がURLに含まれています',
        '追跡困難な短縮URLサービス（bit.ly）が検出されました',
      ],
      details: {
        hasHttps: false,
        hasDangerousExt: true,
        isShortener: true,
        hasMalwareKeyword: false,
        hasIdnSuspicious: false,
        hasSanctionedTld: false,
      },
      scannedAt: '2026-09-26 18:12:00',
    },
  },
];

const SEED_RESTRICTIONS: RestrictionItem[] = [
  {
    id: 'res-default-1',
    type: 'read_only',
    title: '定期バックアップメンテナンス用読み取り専用制限',
    reason: '月次データベース整合性検査中の書き込み制御',
    appliedBy: 'admin',
    appliedByName: '最高システム管理者',
    targetScope: 'sites',
    durationMinutes: 60,
    createdAt: Date.now() - 15 * 60 * 1000,
    expiresAt: Date.now() + 45 * 60 * 1000,
    credibilityScore: 100,
    scoreBreakdown: {
      base: 100,
      deductions: [],
    },
    status: 'active',
    bypassable: false,
  },
];

export const SecurityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('MLSMD_CURRENT_USER');
      return saved ? JSON.parse(saved) : SEED_USERS[0]; // Auto-login admin for instant exploration
    } catch {
      return SEED_USERS[0];
    }
  });

  const [accounts, setAccounts] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem('MLSMD_ACCOUNTS');
      return saved ? JSON.parse(saved) : SEED_USERS;
    } catch {
      return SEED_USERS;
    }
  });

  const [sites, setSites] = useState<SiteItem[]>(() => {
    try {
      const saved = localStorage.getItem('MLSMD_SITES');
      return saved ? JSON.parse(saved) : SEED_SITES;
    } catch {
      return SEED_SITES;
    }
  });

  const [restrictions, setRestrictions] = useState<RestrictionItem[]>(() => {
    try {
      const saved = localStorage.getItem('MLSMD_RESTRICTIONS');
      return saved ? JSON.parse(saved) : SEED_RESTRICTIONS;
    } catch {
      return SEED_RESTRICTIONS;
    }
  });

  const [logs, setLogs] = useState<LogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('MLSMD_LOGS');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    // Initial immutable logs
    const seedLogs: LogEntry[] = [];
    const createInitialLog = (action: string, category: LogCategory, op: string, status: 'success' | 'warning' | 'failure' = 'success', offsetMin: number = 0) => {
      const time = formatTimestamp(new Date(Date.now() - offsetMin * 60 * 1000));
      const id = 'log-' + Math.random().toString(36).substr(2, 9);
      const canonical = `${id}|${time}|${op}|${category}|${action}|${status}`;
      const checksum = computeCRC32(canonical);
      return {
        id,
        timestamp: time,
        operatorId: op,
        action,
        category,
        status,
        checksum,
        isTamperProof: true,
      };
    };

    seedLogs.push(createInitialLog('システム初期化及び多層防護エンジン起動完了', 'SECURITY', 'system', 'success', 60));
    seedLogs.push(createInitialLog('初期管理者アカウント登録完了: admin (L3)', 'AUTH', 'system', 'success', 58));
    seedLogs.push(createInitialLog('初期サイト登録完了: グローバルエンタープライズ公式ポータル', 'SITE', 'admin', 'success', 50));
    seedLogs.push(createInitialLog('URLセキュリティスキャン合格: https://portal.enterprise-global.com', 'SCAN', 'admin', 'success', 49));
    seedLogs.push(createInitialLog('定期メンテナンス制限適用: 読み取り専用化 (スコア: 100点)', 'RESTRICTION', 'admin', 'success', 15));
    return seedLogs;
  });

  const [isEmergencyOverridden, setIsEmergencyOverridden] = useState<boolean>(() => {
    return localStorage.getItem('MLSMD_OVERRIDE') === 'true';
  });

  const [pwaShieldActive, setPwaShieldActive] = useState<boolean>(() => {
    return localStorage.getItem('MLSMD_PWA_SHIELD') === 'true';
  });

  const [isStandalonePWA, setIsStandalonePWA] = useState<boolean>(false);
  const [sessionRemainingSeconds, setSessionRemainingSeconds] = useState<number>(1800);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('MLSMD_CURRENT_USER', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('MLSMD_ACCOUNTS', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('MLSMD_SITES', JSON.stringify(sites));
  }, [sites]);

  useEffect(() => {
    localStorage.setItem('MLSMD_RESTRICTIONS', JSON.stringify(restrictions));
  }, [restrictions]);

  useEffect(() => {
    localStorage.setItem('MLSMD_LOGS', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('MLSMD_OVERRIDE', String(isEmergencyOverridden));
  }, [isEmergencyOverridden]);

  useEffect(() => {
    localStorage.setItem('MLSMD_PWA_SHIELD', String(pwaShieldActive));
  }, [pwaShieldActive]);

  // Check standalone mode and Backdoor audit state
  const [backdoorReport, setBackdoorReport] = useState<BackdoorScanReport | null>(null);
  const [isBackdoorAlertOpen, setIsBackdoorAlertOpen] = useState<boolean>(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  const requestNotificationPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationPermission(perm);
        return perm;
      } catch (e) {
        console.warn('Failed to request notification permission:', e);
      }
    }
    return 'denied';
  }, []);

  // Comprehensive Backdoor Audit Runner
  const runDeepBackdoorAudit = useCallback((showModalOnFindings = true): BackdoorScanReport => {
    const report = auditAllBlocksAndBackdoors(sites, restrictions, accounts, logs);
    setBackdoorReport(report);

    if (!report.isSafe) {
      // Play high priority sound warning
      playAlertSiren();

      // Dispatch browser/desktop push notification immediately
      const topFinding = report.findings[0];
      const message = `${report.backdoorsFound} 件のバックドア・回避リスクを検知しました: ${topFinding.title}`;
      sendInstantSecurityNotification('バックドア・ブロック抜け道検知', message, 'critical');

      if (showModalOnFindings) {
        setIsBackdoorAlertOpen(true);
      }
    }
    return report;
  }, [sites, restrictions, accounts, logs]);

  // Posture Evaluation & Threat Simulation State
  const [postureReport, setPostureReport] = useState<PostureEvaluationReport | null>(null);
  const [isPostureEvaluating, setIsPostureEvaluating] = useState<boolean>(false);

  const runPostureEvaluation = useCallback(async (): Promise<PostureEvaluationReport> => {
    setIsPostureEvaluating(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    const report = runPostureSimulation(accounts, restrictions, logs, pwaShieldActive);
    setPostureReport(report);
    setIsPostureEvaluating(false);

    return report;
  }, [accounts, restrictions, logs, pwaShieldActive]);

  const autoHardenVulnerabilities = useCallback((): { fixedCount: number; details: string[] } => {
    let fixedCount = 0;
    const details: string[] = [];

    // 1. Demote unverified L3 admins
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.role === 'L3' && !acc.isVerified && !acc.isProtected) {
          fixedCount++;
          details.push(`未検証管理者 ${acc.displayName}(@${acc.id}) をL1(一般閲覧)に権限降格・隔離`);
          return { ...acc, role: 'L1' as UserRole };
        }
        return acc;
      })
    );

    // 2. Repel/Disable low-credibility restrictions (<40)
    setRestrictions((prev) =>
      prev.map((r) => {
        if (r.status === 'active' && r.credibilityScore < 40) {
          fixedCount++;
          details.push(`低信頼度制限「${r.title}」(スコア:${r.credibilityScore})を除外(repelled)に変更`);
          return { ...r, status: 'repelled' as const, repelledByPwa: true };
        }
        return r;
      })
    );

    // 3. Ensure PWA shield is active
    if (!pwaShieldActive) {
      setPwaShieldActive(true);
      fixedCount++;
      details.push('PWAサンドボックス防御シールドを常時稼働に設定');
    }

    return { fixedCount, details };
  }, [pwaShieldActive]);

  useEffect(() => {
    const checkStandalone = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalonePWA(isStandalone);
      if (isStandalone) {
        setPwaShieldActive(true); // Automatically activate hardware sandbox shield when run in standalone mode
        // User requested: "アプリをインストールした場合、すべてのブロックのバックドアを見つけるようにしてください"
        // Run deep audit immediately on app launch/installation
        setTimeout(() => {
          runDeepBackdoorAudit(true);
        }, 1000);
      }
    };
    checkStandalone();
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkStandalone);
    return () => mediaQuery.removeEventListener('change', checkStandalone);
  }, [runDeepBackdoorAudit]);

  // Expiration check for restrictions every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setRestrictions((prev) => {
        let changed = false;
        const updated = prev.map((r) => {
          if (r.status === 'active' && r.expiresAt <= now) {
            changed = true;
            return { ...r, status: 'expired' as const };
          }
          return r;
        });
        return changed ? updated : prev;
      });
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Inactivity session timer (30 min auto-logout)
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionRemainingSeconds((prev) => {
        if (prev <= 1) {
          if (currentUser) {
            addLogEntry('セッションタイムアウトによる自動ログアウト（30分無操作）', 'AUTH', 'warning', currentUser.id);
            setCurrentUser(null);
          }
          return 1800;
        }
        return prev - 1;
      });
    }, 1000);

    const resetSession = () => {
      setSessionRemainingSeconds(1800);
    };

    window.addEventListener('click', resetSession);
    window.addEventListener('keydown', resetSession);
    window.addEventListener('mousemove', resetSession);

    return () => {
      clearInterval(timer);
      window.removeEventListener('click', resetSession);
      window.removeEventListener('keydown', resetSession);
      window.removeEventListener('mousemove', resetSession);
    };
  }, [currentUser]);

  // Append immutable log entry with CRC-32
  const addLogEntry = useCallback(
    (action: string, category: LogCategory, status: 'success' | 'failure' | 'warning' = 'success', customOperator?: string): LogEntry => {
      const time = formatTimestamp();
      const op = customOperator || (currentUser ? currentUser.id : 'system');
      const id = 'log-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5);
      const canonical = `${id}|${time}|${op}|${category}|${action}|${status}`;
      const checksum = computeCRC32(canonical);

      const newEntry: LogEntry = {
        id,
        timestamp: time,
        operatorId: op,
        action,
        category,
        status,
        checksum,
        isTamperProof: true,
      };

      setLogs((prev) => {
        const next = [newEntry, ...prev];
        return next.slice(0, 5000); // Retain max 5,000 entries per spec
      });

      return newEntry;
    },
    [currentUser]
  );

  // Login handler
  const login = useCallback(
    (id: string, pass: string): { success: boolean; message: string; isOverride?: boolean } => {
      // 1. Check Secret Master Key Override
      if (pass === MASTER_KEY) {
        const emergencyAdmin: UserAccount = {
          id: 'admin',
          displayName: '最高管理者 (緊急復旧アクセス)',
          password: '***',
          role: 'L3',
          isVerified: true,
          createdAt: '2024-01-10',
          isProtected: true,
        };
        setCurrentUser(emergencyAdmin);
        setIsEmergencyOverridden(true);

        // Turn all active restrictions to bypassable / ignored
        setRestrictions((prev) =>
          prev.map((r) => ({
            ...r,
            bypassable: true,
            status: r.status === 'active' ? 'ignored' : r.status,
          }))
        );

        addLogEntry(
          '🚨 EMERGENCY_OVERRIDE 実行: シークレットマスターキーによる強制ログイン＆全制限無効化',
          'OVERRIDE',
          'warning',
          'MASTER_KEY'
        );

        return {
          success: true,
          message: '🚨 緊急復旧が実行されました。アクティブな全制限が無視状態に変更され、最高管理者権限が付与されました。',
          isOverride: true,
        };
      }

      // 2. ID Enumeration protection:
      // Even if user does not exist, return generic "アカウントが見つかりません" without revealing ID validity
      const user = accounts.find((a) => a.id.toLowerCase() === id.toLowerCase().trim());
      if (!user) {
        addLogEntry(`未登録ID「${id}」でのログイン試行拒否（ID列挙攻撃防御）`, 'AUTH', 'failure', 'unknown');
        return {
          success: false,
          message: '❌ アカウントが見つかりません',
        };
      }

      if (user.password !== pass) {
        addLogEntry(`ユーザーID「${id}」の認証失敗（パスワード不一致）`, 'AUTH', 'failure', user.id);
        return {
          success: false,
          message: '❌ アカウントが見つかりません', // Constant message to prevent timing/content attacks
        };
      }

      // 3. Check if active lockdown restrictions affect this login
      const isSystemLocked = restrictions.some(
        (r) =>
          r.status === 'active' &&
          !r.bypassable &&
          (r.type === 'full_lock' || (r.type === 'revoke_admin' && user.role === 'L3'))
      );

      if (isSystemLocked && !isEmergencyOverridden && !pwaShieldActive) {
        addLogEntry(`システム制限中につきログイン拒否: ${user.id} (${user.role})`, 'AUTH', 'failure', user.id);
        return {
          success: false,
          message: '❌ 現在、管理者により適用された制限が有効であるためログインできません。',
        };
      }

      // Successful login
      setCurrentUser(user);
      addLogEntry(`ユーザーログイン成功: ${user.id} (${user.displayName}, 権限: ${user.role})`, 'AUTH', 'success', user.id);
      return {
        success: true,
        message: '✅ ログインに成功しました',
      };
    },
    [accounts, restrictions, isEmergencyOverridden, pwaShieldActive, addLogEntry]
  );

  const logout = useCallback(
    (reason = 'ユーザー手動ログアウト') => {
      if (currentUser) {
        addLogEntry(`ログアウト完了: ${currentUser.id} (${reason})`, 'AUTH', 'success', currentUser.id);
      }
      setCurrentUser(null);
      setSessionRemainingSeconds(1800);
    },
    [currentUser, addLogEntry]
  );

  const emergencyOverride = useCallback(
    (key: string): boolean => {
      if (key !== MASTER_KEY) {
        addLogEntry('不正なマスターキー入力拒否', 'OVERRIDE', 'failure');
        return false;
      }

      setIsEmergencyOverridden(true);
      setRestrictions((prev) =>
        prev.map((r) => ({
          ...r,
          bypassable: true,
          status: r.status === 'active' ? 'ignored' : r.status,
        }))
      );

      // If current user is not L3, elevate
      if (!currentUser || currentUser.role !== 'L3') {
        const elevated: UserAccount = {
          id: currentUser ? currentUser.id : 'admin',
          displayName: currentUser ? currentUser.displayName + ' (緊急昇格)' : '最高管理者 (緊急復旧)',
          password: '***',
          role: 'L3',
          isVerified: true,
          createdAt: '2024-01-10',
          isProtected: true,
        };
        setCurrentUser(elevated);
      }

      addLogEntry(
        '🚨 EMERGENCY_OVERRIDE 実行: ダッシュボードからマスターキーにより全制限強制解除',
        'OVERRIDE',
        'warning',
        currentUser ? currentUser.id : 'MASTER_KEY'
      );
      return true;
    },
    [currentUser, addLogEntry]
  );

  // PWA Sandbox Shield Repelling feature (prompt requirement: "アプリとしてインストールされたら、かけられていた制限も弾けるようにしてください")
  const repelRestrictionsWithPwaPulse = useCallback((): { count: number } => {
    let count = 0;
    setRestrictions((prev) =>
      prev.map((r) => {
        if (r.status === 'active') {
          count++;
          return {
            ...r,
            status: 'repelled' as const,
            bypassable: true,
            repelledByPwa: true,
          };
        }
        return r;
      })
    );

    addLogEntry(
      `⚡ PWA分離サンドボックス防御パルス発動: ${count}件の悪意ある制限を弾き出して完全無力化`,
      'PWA_SHIELD',
      'success',
      currentUser ? currentUser.id : 'PWA_SHIELD'
    );

    return { count };
  }, [currentUser, addLogEntry]);

  const togglePwaSandboxShield = useCallback(() => {
    setPwaShieldActive((prev) => {
      const next = !prev;
      addLogEntry(
        next
          ? 'PWA分離サンドボックス防御シールド稼働開始（悪意ある外部制限の遮断）'
          : 'PWA分離サンドボックス防御シールド一時停止',
        'PWA_SHIELD',
        'success'
      );
      return next;
    });
  }, [addLogEntry]);

  // Site operations
  const addSite = useCallback(
    (siteData: Omit<SiteItem, 'id' | 'createdAt' | 'status' | 'createdBy' | 'isVerified'>): boolean => {
      if (!currentUser || currentUser.role === 'L1') {
        addLogEntry('権限不足によるサイト追加拒否 (L1閲覧者)', 'ADMIN', 'failure');
        return false;
      }

      const scan = scanUrl(siteData.url);
      const newSite: SiteItem = {
        ...siteData,
        id: 'site-' + Date.now().toString(36),
        createdBy: currentUser.id,
        isVerified: currentUser.isVerified,
        status: scan.level === 'danger' ? 'danger' : scan.level === 'warning' ? 'warning' : 'active',
        createdAt: new Date().toISOString().split('T')[0],
        lastScannedAt: formatTimestamp(),
        scanResults: scan,
      };

      setSites((prev) => [newSite, ...prev]);
      addLogEntry(
        `新規サイト追加: ${newSite.name} (${newSite.url}, 判定: ${scan.level.toUpperCase()})`,
        'SITE',
        scan.level === 'danger' ? 'warning' : 'success'
      );

      return true;
    },
    [currentUser, addLogEntry]
  );

  const updateSite = useCallback(
    (updated: SiteItem): boolean => {
      if (!currentUser || currentUser.role === 'L1') {
        addLogEntry('権限不足によるサイト編集拒否 (L1閲覧者)', 'ADMIN', 'failure');
        return false;
      }
      setSites((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      addLogEntry(`サイト情報更新: ${updated.name} (ID: ${updated.id})`, 'SITE', 'success');
      return true;
    },
    [currentUser, addLogEntry]
  );

  const deleteSite = useCallback(
    (id: string): boolean => {
      if (!currentUser || currentUser.role === 'L1') {
        addLogEntry('権限不足によるサイト削除拒否 (L1閲覧者)', 'ADMIN', 'failure');
        return false;
      }
      const target = sites.find((s) => s.id === id);
      setSites((prev) => prev.filter((s) => s.id !== id));
      addLogEntry(`サイト削除完了: ${target ? target.name : id}`, 'SITE', 'success');
      return true;
    },
    [currentUser, sites, addLogEntry]
  );

  const scanSingleSite = useCallback(
    (id: string) => {
      setSites((prev) =>
        prev.map((s) => {
          if (s.id === id) {
            const result = scanUrl(s.url);
            addLogEntry(
              `サイトURLスキャン実行: ${s.name} (${s.url}) -> 結果: ${result.level.toUpperCase()} (スコア: ${result.score})`,
              'SCAN',
              result.level === 'danger' ? 'warning' : 'success'
            );
            return {
              ...s,
              status: result.level === 'danger' ? 'danger' : result.level === 'warning' ? 'warning' : 'active',
              lastScannedAt: formatTimestamp(),
              scanResults: result,
            };
          }
          return s;
        })
      );
    },
    [addLogEntry]
  );

  const scanAllSites = useCallback(() => {
    setSites((prev) =>
      prev.map((s) => {
        const result = scanUrl(s.url);
        return {
          ...s,
          status: result.level === 'danger' ? 'danger' : result.level === 'warning' ? 'warning' : 'active',
          lastScannedAt: formatTimestamp(),
          scanResults: result,
        };
      })
    );
    addLogEntry('全登録サイト一括セキュリティスキャン完了', 'SCAN', 'success');
  }, [addLogEntry]);

  // Restriction operations
  const applyRestriction = useCallback(
    (data: {
      type: RestrictionType;
      title: string;
      reason: string;
      targetScope: 'all' | 'sites' | 'admins' | 'system';
      durationMinutes: number;
    }): { success: boolean; score: number } => {
      if (!currentUser || currentUser.role !== 'L3') {
        addLogEntry('権限不足による制限適用拒否（L3管理者権限が必須）', 'ADMIN', 'failure');
        return { success: false, score: 0 };
      }

      // Credibility score calculation
      const cred = calculateCredibilityScore(currentUser, data.type, restrictions);
      const now = Date.now();
      const expires = now + data.durationMinutes * 60 * 1000;

      const newRes: RestrictionItem = {
        id: 'res-' + Date.now().toString(36),
        type: data.type,
        title: data.title,
        reason: data.reason,
        appliedBy: currentUser.id,
        appliedByName: currentUser.displayName,
        targetScope: data.targetScope,
        durationMinutes: data.durationMinutes,
        createdAt: now,
        expiresAt: expires,
        credibilityScore: cred.score,
        scoreBreakdown: cred.breakdown,
        status: 'active',
        bypassable: false,
      };

      setRestrictions((prev) => [newRes, ...prev]);

      addLogEntry(
        `制限適用: ${data.title} [${data.type}] (信頼度スコア: ${cred.score}点, 有効期間: ${data.durationMinutes}分)`,
        'RESTRICTION',
        cred.score < 40 ? 'warning' : 'success'
      );

      return { success: true, score: cred.score };
    },
    [currentUser, restrictions, addLogEntry]
  );

  const removeRestriction = useCallback(
    (id: string): { success: boolean; message: string } => {
      const target = restrictions.find((r) => r.id === id);
      if (!target) return { success: false, message: '制限が見つかりません' };

      // Feature 2: Untrusted (<40) restrictions can be deleted by ANY user (L1, L2, L3)!
      const isLowCredibility = target.credibilityScore < 40;
      const isL3 = currentUser?.role === 'L3';

      if (!isLowCredibility && !isL3) {
        addLogEntry(
          `制限解除拒否: ${target.title} (信頼度${target.credibilityScore}点のためL3権限が必要)`,
          'ADMIN',
          'failure'
        );
        return {
          success: false,
          message: '信頼度40点以上の制限を解除するにはL3管理者権限が必要です',
        };
      }

      setRestrictions((prev) => prev.filter((r) => r.id !== id));
      addLogEntry(
        `制限解除/削除完了: ${target.title} (スコア: ${target.credibilityScore}点, 実行者: ${currentUser?.id})`,
        'RESTRICTION',
        'success'
      );

      return {
        success: true,
        message: isLowCredibility
          ? '低信頼度（40点未満）の不正な制限を安全に削除しました'
          : '制限を解除しました',
      };
    },
    [currentUser, restrictions, addLogEntry]
  );

  // Account operations
  const addAccount = useCallback(
    (data: { id: string; displayName: string; password: string; role: UserRole; isVerified: boolean }): boolean => {
      if (!currentUser || currentUser.role !== 'L3') {
        addLogEntry('権限不足によるアカウント登録拒否 (L3管理者のみ可能)', 'ADMIN', 'failure');
        return false;
      }

      if (accounts.some((a) => a.id.toLowerCase() === data.id.toLowerCase())) {
        return false;
      }

      const newAccount: UserAccount = {
        ...data,
        createdAt: new Date().toISOString().split('T')[0],
      };

      setAccounts((prev) => [...prev, newAccount]);
      addLogEntry(`新規アカウント登録: ${data.id} (${data.displayName}, 権限: ${data.role})`, 'ADMIN', 'success');
      return true;
    },
    [currentUser, accounts, addLogEntry]
  );

  const deleteAccount = useCallback(
    (id: string): boolean => {
      if (!currentUser || currentUser.role !== 'L3') {
        addLogEntry('権限不足によるアカウント削除拒否 (L3管理者のみ可能)', 'ADMIN', 'failure');
        return false;
      }

      const target = accounts.find((a) => a.id === id);
      if (target?.isProtected) {
        addLogEntry(`保護された初期管理者アカウントの削除試行拒否: ${id}`, 'ADMIN', 'failure');
        return false;
      }

      setAccounts((prev) => prev.filter((a) => a.id !== id));
      addLogEntry(`アカウント削除完了: ${id}`, 'ADMIN', 'success');
      return true;
    },
    [currentUser, accounts, addLogEntry]
  );

  const updateAccountRole = useCallback(
    (id: string, newRole: UserRole): boolean => {
      if (!currentUser || currentUser.role !== 'L3') {
        addLogEntry(`権限不足によるロール変更拒否: 対象=${id} (実行者: ${currentUser?.id})`, 'ADMIN', 'failure');
        return false;
      }

      setAccounts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, role: newRole } : a))
      );
      addLogEntry(`アカウント権限変更: ${id} -> ${newRole}`, 'ADMIN', 'success');
      return true;
    },
    [currentUser, addLogEntry]
  );

  // Simulate Tamper Attack to demonstrate CRC-32 integrity checking
  const simulateTamperAttack = useCallback(() => {
    setLogs((prev) => {
      if (prev.length === 0) return prev;
      const copy = [...prev];
      const target = { ...copy[0] };
      target.action = '【改ざんデータ】ハッカーにより監査ログが不正に変更されました';
      target.checksum = 'BADC0DE1'; // Corrupted checksum
      target.tampered = true;
      copy[0] = target;
      return copy;
    });
  }, []);

  const verifyEntryTampering = useCallback((entry: LogEntry): boolean => {
    return verifyLogIntegrity(entry);
  }, []);

  // Run prompt demonstration scenarios
  const runScenario = useCallback(
    (num: 1 | 2 | 3 | 4) => {
      if (num === 1) {
        // Scenario 1: Lockdown by L3 hacker -> Master Key Recovery
        const lockdownRes: RestrictionItem = {
          id: 'res-scenario-1',
          type: 'full_lock',
          title: 'ハッカーによる完全ロックダウン制限',
          reason: '管理者権限の不当強奪による全アクセス封鎖',
          appliedBy: 'hacker_l3',
          appliedByName: '攻撃者',
          targetScope: 'all',
          durationMinutes: 60,
          createdAt: Date.now(),
          expiresAt: Date.now() + 60 * 60 * 1000,
          credibilityScore: 45,
          scoreBreakdown: {
            base: 100,
            deductions: [{ reason: '短時間広範囲ロック試行', amount: 50 }],
          },
          status: 'active',
          bypassable: false,
        };
        setRestrictions((prev) => [lockdownRes, ...prev]);
        addLogEntry('フルロックダウン制限が適用されました（テスト1）', 'RESTRICTION', 'warning', 'hacker_l3');
      } else if (num === 2) {
        // Scenario 2: Unverified user applied restriction -> low credibility score (< 40)
        const untrustedRes: RestrictionItem = {
          id: 'res-scenario-2',
          type: 'revoke_admin',
          title: '未検証ユーザーによる管理者権限剥奪試行',
          reason: '不当なアクセス制限の適用',
          appliedBy: 'viewer_sato',
          appliedByName: '佐藤 美咲 (未検証)',
          targetScope: 'admins',
          durationMinutes: 60,
          createdAt: Date.now(),
          expiresAt: Date.now() + 60 * 60 * 1000,
          credibilityScore: 10,
          scoreBreakdown: {
            base: 100,
            deductions: [
              { reason: '未検証アカウントによる制限適用', amount: 40 },
              { reason: '管理者権限の短時間剥奪試行', amount: 50 },
            ],
          },
          status: 'active',
          bypassable: false,
        };
        setRestrictions((prev) => [untrustedRes, ...prev]);
        addLogEntry('信頼度10点（40点未満）の疑わしい制限が適用されました（テスト2）', 'RESTRICTION', 'warning', 'viewer_sato');
      } else if (num === 3) {
        // Scenario 3: Malicious site test
        const badSite: SiteItem = {
          id: 'site-scenario-3',
          name: 'フリーダウンロード配布所（不審サイト）',
          url: 'http://bit.ly/free-download-payload.exe',
          category: '不審サイト検知テスト',
          createdBy: 'unknown',
          isVerified: false,
          status: 'danger',
          notes: '短縮URL・非暗号化・exe実行ファイルを含むテスト用サイト',
          createdAt: new Date().toISOString().split('T')[0],
          lastScannedAt: formatTimestamp(),
          scanResults: scanUrl('http://bit.ly/free-download-payload.exe'),
        };
        setSites((prev) => [badSite, ...prev]);
        addLogEntry('悪質URLを含むサイトを検知・追加しました（テスト3）', 'SCAN', 'warning');
      } else if (num === 4) {
        // Scenario 4: Brute force login attempts by unregistered hacker123
        for (let i = 0; i < 5; i++) {
          addLogEntry(`未登録ID「hacker123」でのログイン試行拒否 (試行 #${i + 1})`, 'AUTH', 'failure', 'hacker123');
        }
      }
    },
    [addLogEntry]
  );

  // JSON Export
  const exportJsonBackup = useCallback(() => {
    const backupData = {
      timestamp: formatTimestamp(),
      exportVersion: 'MLSMD-1.0',
      accounts,
      sites,
      restrictions,
      logs: logs.slice(0, 5000),
      isEmergencyOverridden,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `site-manager-backup-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    addLogEntry('システム全データのJSONバックアップをダウンロード', 'ADMIN', 'success');
  }, [accounts, sites, restrictions, logs, isEmergencyOverridden, addLogEntry]);

  // Standalone Single HTML Download
  const downloadStandaloneFile = useCallback(() => {
    const html = generateStandaloneHtml();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'site-manager-security.html';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    addLogEntry('完全スタンドアローンHTML（site-manager-security.html）をダウンロード', 'ADMIN', 'success');
  }, [addLogEntry]);

  return (
    <SecurityContext.Provider
      value={{
        currentUser,
        accounts,
        sites,
        restrictions,
        logs,
        isEmergencyOverridden,
        pwaShieldActive,
        isStandalonePWA,
        sessionRemainingSeconds,
        backdoorReport,
        isBackdoorAlertOpen,
        setIsBackdoorAlertOpen,
        runDeepBackdoorAudit,
        postureReport,
        isPostureEvaluating,
        runPostureEvaluation,
        autoHardenVulnerabilities,
        requestNotificationPermission,
        notificationPermission,
        login,
        logout,
        emergencyOverride,
        repelRestrictionsWithPwaPulse,
        togglePwaSandboxShield,
        addSite,
        updateSite,
        deleteSite,
        scanSingleSite,
        scanAllSites,
        applyRestriction,
        removeRestriction,
        addAccount,
        deleteAccount,
        updateAccountRole,
        simulateTamperAttack,
        runScenario,
        exportJsonBackup,
        downloadStandaloneFile,
        addLogEntry,
        verifyEntryTampering,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
};

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
}
