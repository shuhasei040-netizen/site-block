import { ScanResult } from '../types/security';
import { formatTimestamp } from './crc32';

const DANGEROUS_EXTENSIONS = ['.exe', '.scr', '.bat', '.cmd', '.vbs', '.zip', '.rar', '.msi', '.apk', '.bin'];
const URL_SHORTENERS = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly', 'rebrand.ly', 'bl.ink'];
const MALWARE_KEYWORDS = ['free-download', 'login-verify', 'account-update', 'bank-secure', 'win-prize', 'crack', 'keygen', 'payload', 'phish'];
const SUSPICIOUS_TLDS = ['.ru', '.top', '.xyz', '.su', '.tk', '.ml', '.ga', '.cf', '.buzz', '.work'];

export function scanUrl(urlStr: string): ScanResult {
  const issues: string[] = [];
  const lowerUrl = urlStr.toLowerCase().trim();

  let hasHttps = false;
  let hasDangerousExt = false;
  let isShortener = false;
  let hasMalwareKeyword = false;
  let hasIdnSuspicious = false;
  let hasSanctionedTld = false;

  let penalty = 0;

  // 1. HTTPS Check
  if (lowerUrl.startsWith('https://')) {
    hasHttps = true;
  } else {
    hasHttps = false;
    penalty += 20;
    issues.push('HTTPS暗号化通信が使用されていません（平文HTTP通信の傍受リスク）');
  }

  // 2. Dangerous Extension Check
  for (const ext of DANGEROUS_EXTENSIONS) {
    if (lowerUrl.includes(ext)) {
      hasDangerousExt = true;
      penalty += 40;
      issues.push(`既知の危険な実行可能・圧縮拡張子（${ext}）がURLに含まれています`);
      break;
    }
  }

  // 3. URL Shortener Check
  for (const shortener of URL_SHORTENERS) {
    if (lowerUrl.includes(shortener)) {
      isShortener = true;
      penalty += 35;
      issues.push(`追跡困難な短縮URLサービス（${shortener}）が検出されました`);
      break;
    }
  }

  // 4. Malware Keywords Check
  for (const kw of MALWARE_KEYWORDS) {
    if (lowerUrl.includes(kw)) {
      hasMalwareKeyword = true;
      penalty += 30;
      issues.push(`フィッシング・マルウェア関連の怪しいキーワード（${kw}）が含まれています`);
      break;
    }
  }

  // 5. IDN (Punycode) Check
  if (lowerUrl.includes('xn--')) {
    hasIdnSuspicious = true;
    penalty += 35;
    issues.push('IDN国際化ドメイン（Punycode xn--）が検出されました（同形文字詐欺ホモグラフ攻撃の危険）');
  }

  // 6. Suspicious TLD Check
  for (const tld of SUSPICIOUS_TLDS) {
    if (lowerUrl.includes(tld)) {
      hasSanctionedTld = true;
      penalty += 25;
      issues.push(`スパム・不正活動報告の多いTLD（${tld}）を使用しています`);
      break;
    }
  }

  const score = Math.max(0, 100 - penalty);
  let level: 'safe' | 'warning' | 'danger' = 'safe';

  if (score < 45 || hasDangerousExt || (isShortener && !hasHttps)) {
    level = 'danger';
  } else if (score < 80 || issues.length > 0) {
    level = 'warning';
  }

  return {
    level,
    score,
    issues: issues.length > 0 ? issues : ['セキュリティ基準をすべてクリアしています（既知の脅威なし）'],
    details: {
      hasHttps,
      hasDangerousExt,
      isShortener,
      hasMalwareKeyword,
      hasIdnSuspicious,
      hasSanctionedTld,
    },
    scannedAt: formatTimestamp(),
  };
}
