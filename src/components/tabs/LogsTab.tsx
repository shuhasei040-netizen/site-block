import React, { useState } from 'react';
import {
  FileText,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Shield,
  Zap,
} from 'lucide-react';
import { LogCategory, LogEntry } from '../../types/security';
import { useSecurity } from '../../context/SecurityContext';

export const LogsTab: React.FC = () => {
  const { logs, currentUser, simulateTamperAttack, exportJsonBackup, verifyEntryTampering } = useSecurity();

  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // L1 can only view their own logs per spec
  const isL1Viewer = currentUser?.role === 'L1';

  const visibleLogs = logs.filter((log) => {
    if (isL1Viewer && log.operatorId !== currentUser?.id) {
      return false;
    }
    if (categoryFilter !== 'ALL' && log.category !== categoryFilter) {
      return false;
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        log.action.toLowerCase().includes(q) ||
        log.operatorId.toLowerCase().includes(q) ||
        log.checksum.toLowerCase().includes(q) ||
        log.timestamp.includes(q);
      if (!match) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(visibleLogs.length / pageSize));
  const currentPageLogs = visibleLogs.slice((page - 1) * pageSize, page * pageSize);

  const getCategoryColor = (cat: LogCategory) => {
    switch (cat) {
      case 'AUTH':
        return 'text-[#5b8cff] bg-[#5b8cff]/10 border-[#5b8cff]/30';
      case 'RESTRICTION':
        return 'text-[#ff5c7a] bg-[#ff5c7a]/10 border-[#ff5c7a]/30';
      case 'SITE':
        return 'text-[#3ddc97] bg-[#3ddc97]/10 border-[#3ddc97]/30';
      case 'OVERRIDE':
        return 'text-[#ffb547] bg-[#ffb547]/10 border-[#ffb547]/30';
      case 'SCAN':
        return 'text-[#7c5bff] bg-[#7c5bff]/10 border-[#7c5bff]/30';
      case 'PWA_SHIELD':
        return 'text-[#3ddc97] bg-[#3ddc97]/15 border-[#3ddc97]/40';
      default:
        return 'text-[#8b96b8] bg-[#8b96b8]/10 border-[#8b96b8]/30';
    }
  };

  return (
    <div className="space-y-5">
      {/* Control bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#0f1420] border border-[#2a3550] p-4 rounded-xl">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#8b96b8]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="操作内容 / 操作者 / ハッシュ値で検索..."
              className="w-full rounded-lg border border-[#2a3550] bg-[#161d2e] pl-9 pr-3 py-2 text-xs text-white placeholder-[#8b96b8]/60 focus:border-[#5b8cff] focus:outline-none"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-[#2a3550] bg-[#161d2e] px-3 py-2 text-xs text-white focus:border-[#5b8cff] focus:outline-none cursor-pointer"
          >
            <option value="ALL">全カテゴリ</option>
            <option value="AUTH">認証 (AUTH)</option>
            <option value="SITE">サイト管理 (SITE)</option>
            <option value="RESTRICTION">制限適用 (RESTRICTION)</option>
            <option value="OVERRIDE">緊急復旧 (OVERRIDE)</option>
            <option value="SCAN">スキャン (SCAN)</option>
            <option value="ADMIN">管理者操作 (ADMIN)</option>
            <option value="PWA_SHIELD">PWA防護 (PWA_SHIELD)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={simulateTamperAttack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#ff5c7a]/40 bg-[#ff5c7a]/10 hover:bg-[#ff5c7a]/20 text-[#ff5c7a] text-xs font-semibold transition cursor-pointer"
            title="最新ログの内容を意図的に改ざんし、CRC-32チェックサム不一致検知をテストします"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>改ざん検知テスト実行</span>
          </button>

          <button
            onClick={exportJsonBackup}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-[#5b8cff] to-[#7c5bff] text-white text-xs font-bold shadow-md hover:opacity-95 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>JSONエクスポート</span>
          </button>
        </div>
      </div>

      {isL1Viewer && (
        <div className="p-3 rounded-lg bg-[#5b8cff]/10 border border-[#5b8cff]/30 text-xs text-[#5b8cff]">
          ※ L1閲覧者権限のため、ご自身のアカウント（{currentUser?.id}）に関連するログのみが表示されています。
        </div>
      )}

      {/* Logs Table */}
      <div className="rounded-xl border border-[#2a3550] bg-[#0f1420] overflow-hidden shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#2a3550] bg-[#161d2e]/80 text-[#8b96b8]">
                <th className="py-3 px-3 w-16">状態</th>
                <th className="py-3 px-3 w-48">タイムスタンプ (ミリ秒)</th>
                <th className="py-3 px-3 w-28">操作者ID</th>
                <th className="py-3 px-3 w-28">カテゴリ</th>
                <th className="py-3 px-3">操作内容 (Action)</th>
                <th className="py-3 px-3 w-32">CRC-32ハッシュ</th>
                <th className="py-3 px-3 w-40 text-right">改ざん検知</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a3550]/40">
              {currentPageLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#8b96b8]">
                    条件に一致するログは見つかりませんでした
                  </td>
                </tr>
              ) : (
                currentPageLogs.map((log) => {
                  const isTampered = log.tampered || !verifyEntryTampering(log);
                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-[#161d2e]/40 transition ${
                        isTampered ? 'bg-[#ff5c7a]/10' : ''
                      }`}
                    >
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center justify-center w-2.5 h-2.5 rounded-full ${
                            log.status === 'success'
                              ? 'bg-[#3ddc97]'
                              : log.status === 'failure'
                              ? 'bg-[#ff5c7a]'
                              : 'bg-[#ffb547]'
                          }`}
                          title={log.status}
                        />
                      </td>
                      <td className="py-3 px-3 font-mono text-[#8b96b8] text-[11px]">
                        {log.timestamp}
                      </td>
                      <td className="py-3 px-3 font-bold text-white">{log.operatorId}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getCategoryColor(
                            log.category
                          )}`}
                        >
                          {log.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#e8ecf6] max-w-md">
                        <span className={isTampered ? 'text-[#ff5c7a] font-bold' : ''}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-[#8b96b8]">
                        <code className="bg-[#161d2e] px-1.5 py-0.5 rounded border border-[#2a3550]">
                          {log.checksum}
                        </code>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {isTampered ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#ff5c7a]/20 text-[#ff5c7a] border border-[#ff5c7a]/40 animate-pulse">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>✗ 改ざん検知</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#3ddc97]/15 text-[#3ddc97] border border-[#3ddc97]/30">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>✓ 正常 (改ざん無)</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#2a3550] bg-[#161d2e]/50 text-xs text-[#8b96b8]">
          <div>
            全 {visibleLogs.length} 件中 {(page - 1) * pageSize + 1} -{' '}
            {Math.min(page * pageSize, visibleLogs.length)} 件を表示中 (最大5,000件保持)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded border border-[#2a3550] bg-[#0f1420] hover:bg-[#161d2e] disabled:opacity-40 disabled:pointer-events-none cursor-pointer text-white"
            >
              前へ
            </button>
            <span className="font-mono text-white">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 rounded border border-[#2a3550] bg-[#0f1420] hover:bg-[#161d2e] disabled:opacity-40 disabled:pointer-events-none cursor-pointer text-white"
            >
              次へ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
