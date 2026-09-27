import { LogEntry } from '../types/security';

// Standard IEEE 802.3 CRC-32 table
let crcTable: Uint32Array | null = null;

function makeCRCTable(): Uint32Array {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
}

export function computeCRC32(str: string): string {
  if (!crcTable) {
    crcTable = makeCRCTable();
  }
  let crc = 0 ^ (-1);
  const utf8Bytes = new TextEncoder().encode(str);
  for (let i = 0; i < utf8Bytes.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ utf8Bytes[i]) & 0xff];
  }
  const result = ((crc ^ (-1)) >>> 0).toString(16).toUpperCase().padStart(8, '0');
  return result;
}

/**
 * Creates canonical payload string for log entry hashing:
 * id + timestamp + operatorId + category + action + status
 */
export function getLogCanonicalPayload(entry: Omit<LogEntry, 'checksum' | 'isTamperProof' | 'tampered'>): string {
  return `${entry.id}|${entry.timestamp}|${entry.operatorId}|${entry.category}|${entry.action}|${entry.status}`;
}

/**
 * Validates whether the log entry's checksum matches its contents.
 */
export function verifyLogIntegrity(entry: LogEntry): boolean {
  if (entry.tampered) return false;
  const canonical = getLogCanonicalPayload(entry);
  const expectedChecksum = computeCRC32(canonical);
  return entry.checksum === expectedChecksum;
}

/**
 * Formats current date as YYYY-MM-DD HH:mm:ss.SSS
 */
export function formatTimestamp(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}.${ms}`;
}
