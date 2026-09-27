import React, { useState } from 'react';
import {
  Search,
  Plus,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ExternalLink,
  Edit2,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Globe,
} from 'lucide-react';
import { SiteItem } from '../../types/security';
import { useSecurity } from '../../context/SecurityContext';
import { SiteModal } from '../modals/SiteModal';
import { SafeAccessModal } from '../modals/SafeAccessModal';

export const SitesTab: React.FC = () => {
  const { sites, currentUser, deleteSite, scanSingleSite, scanAllSites } = useSecurity();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'verified' | 'unverified' | 'warning'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [siteToEdit, setSiteToEdit] = useState<SiteItem | null>(null);
  const [selectedScanDetail, setSelectedScanDetail] = useState<SiteItem | null>(null);
  const [selectedSafeAccessSite, setSelectedSafeAccessSite] = useState<SiteItem | null>(null);

  const canEditOrDelete = currentUser?.role === 'L2' || currentUser?.role === 'L3';

  const filteredSites = sites.filter((site) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      site.name.toLowerCase().includes(q) ||
      site.url.toLowerCase().includes(q) ||
      site.createdBy.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (filterType === 'verified') return site.isVerified;
    if (filterType === 'unverified') return !site.isVerified;
    if (filterType === 'warning') return site.status === 'warning' || site.status === 'danger';

    return true;
  });

  const handleOpenAdd = () => {
    setSiteToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (site: SiteItem) => {
    setSiteToEdit(site);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`サイト「${name}」を監視対象から削除しますか？`)) {
      deleteSite(id);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Controls Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0f1420] border border-[#2a3550] p-4 rounded-xl">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#8b96b8]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="サイト名 / URL / 登録者で検索..."
              className="w-full rounded-lg border border-[#2a3550] bg-[#161d2e] pl-9 pr-3 py-2 text-xs text-white placeholder-[#8b96b8]/60 focus:border-[#5b8cff] focus:outline-none"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="rounded-lg border border-[#2a3550] bg-[#161d2e] px-3 py-2 text-xs text-white focus:border-[#5b8cff] focus:outline-none cursor-pointer"
          >
            <option value="all">すべてのサイト</option>
            <option value="verified">検証済みのみ</option>
            <option value="unverified">未検証のみ</option>
            <option value="warning">危険・警告のみ</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={scanAllSites}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#2a3550] bg-[#161d2e] hover:bg-[#2a3550] text-[#e8ecf6] text-xs font-semibold transition cursor-pointer"
            title="登録されているすべてのURLに対してマルウェア・不正リンク検査を実施"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#5b8cff]" />
            <span>全サイト一括スキャン</span>
          </button>

          {canEditOrDelete && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-[#5b8cff] to-[#7c5bff] text-white text-xs font-bold shadow-md hover:opacity-95 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>サイト追加</span>
            </button>
          )}
        </div>
      </div>

      {/* Sites Table */}
      <div className="rounded-xl border border-[#2a3550] bg-[#0f1420] overflow-hidden shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#2a3550] bg-[#161d2e]/80 text-[#8b96b8]">
                <th className="py-3 px-4">サイト名</th>
                <th className="py-3 px-4">URL</th>
                <th className="py-3 px-4">登録者</th>
                <th className="py-3 px-4">信頼度</th>
                <th className="py-3 px-4">状態</th>
                <th className="py-3 px-4">セキュリティスキャン</th>
                <th className="py-3 px-4 text-right">アクション</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a3550]/40">
              {filteredSites.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#8b96b8]">
                    該当するサイトが見つかりません
                  </td>
                </tr>
              ) : (
                filteredSites.map((site) => {
                  const scan = site.scanResults;
                  return (
                    <tr key={site.id} className="hover:bg-[#161d2e]/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{site.name}</div>
                        <div className="text-[11px] text-[#8b96b8]">{site.category}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 font-mono text-[#8b96b8]">
                          <span className="truncate max-w-xs">{site.url}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedSafeAccessSite(site)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#5b8cff]/15 hover:bg-[#5b8cff]/25 border border-[#5b8cff]/40 text-[#5b8cff] text-[11px] font-bold transition shrink-0 cursor-pointer shadow-sm active:scale-95"
                            title="安全確認のためにこのサイトにアクセス"
                          >
                            <Globe className="w-3.5 h-3.5" />
                            <span>安全確認アクセス</span>
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-white font-medium">{site.createdBy}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            site.isVerified
                              ? 'bg-[#3ddc97]/15 text-[#3ddc97] border border-[#3ddc97]/30'
                              : 'bg-[#ffb547]/15 text-[#ffb547] border border-[#ffb547]/30'
                          }`}
                        >
                          {site.isVerified ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              <span>検証済み</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3 h-3" />
                              <span>未検証</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            site.status === 'active'
                              ? 'bg-[#3ddc97]/15 text-[#3ddc97]'
                              : site.status === 'warning'
                              ? 'bg-[#ffb547]/15 text-[#ffb547]'
                              : 'bg-[#ff5c7a]/15 text-[#ff5c7a]'
                          }`}
                        >
                          {site.status === 'active' ? '正常' : site.status === 'warning' ? '警告' : '危険'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {scan ? (
                          <button
                            onClick={() => setSelectedScanDetail(site)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold border transition cursor-pointer ${
                              scan.level === 'safe'
                                ? 'bg-[#3ddc97]/10 border-[#3ddc97]/30 text-[#3ddc97] hover:bg-[#3ddc97]/20'
                                : scan.level === 'warning'
                                ? 'bg-[#ffb547]/10 border-[#ffb547]/30 text-[#ffb547] hover:bg-[#ffb547]/20'
                                : 'bg-[#ff5c7a]/10 border-[#ff5c7a]/30 text-[#ff5c7a] hover:bg-[#ff5c7a]/20'
                            }`}
                          >
                            {scan.level === 'safe' ? (
                              <ShieldCheck className="w-3.5 h-3.5" />
                            ) : (
                              <ShieldAlert className="w-3.5 h-3.5" />
                            )}
                            <span>
                              {scan.level === 'safe'
                                ? '安全 (100点)'
                                : scan.level === 'warning'
                                ? `警告 (${scan.score}点)`
                                : `危険 (${scan.score}点)`}
                            </span>
                          </button>
                        ) : (
                          <button
                            onClick={() => scanSingleSite(site.id)}
                            className="text-xs text-[#5b8cff] hover:underline cursor-pointer"
                          >
                            スキャン実行
                          </button>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {canEditOrDelete ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => scanSingleSite(site.id)}
                              className="p-1.5 rounded hover:bg-[#161d2e] text-[#8b96b8] hover:text-[#5b8cff] transition cursor-pointer"
                              title="URL再スキャン"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(site)}
                              className="p-1.5 rounded hover:bg-[#161d2e] text-[#8b96b8] hover:text-white transition cursor-pointer"
                              title="編集"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(site.id, site.name)}
                              className="p-1.5 rounded hover:bg-[#161d2e] text-[#8b96b8] hover:text-[#ff5c7a] transition cursor-pointer"
                              title="削除"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#8b96b8]">閲覧のみ</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scan Detail Dialog Modal */}
      {selectedScanDetail && selectedScanDetail.scanResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-[#2a3550] bg-[#0f1420] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl ${
                    selectedScanDetail.scanResults.level === 'safe'
                      ? 'bg-[#3ddc97]/15 text-[#3ddc97]'
                      : selectedScanDetail.scanResults.level === 'warning'
                      ? 'bg-[#ffb547]/15 text-[#ffb547]'
                      : 'bg-[#ff5c7a]/15 text-[#ff5c7a]'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    URLヒューリスティックスキャン診断結果
                  </h3>
                  <div className="text-xs text-[#8b96b8]">{selectedScanDetail.name}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedScanDetail(null)}
                className="text-[#8b96b8] hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#161d2e] rounded-xl p-4 border border-[#2a3550] space-y-3 mb-4 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-[#2a3550]">
                <span className="text-[#8b96b8]">対象URL:</span>
                <span className="font-mono text-white truncate max-w-xs">{selectedScanDetail.url}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#2a3550]">
                <span className="text-[#8b96b8]">安全性スコア:</span>
                <span
                  className={`font-bold font-mono text-sm ${
                    selectedScanDetail.scanResults.score >= 80
                      ? 'text-[#3ddc97]'
                      : selectedScanDetail.scanResults.score >= 50
                      ? 'text-[#ffb547]'
                      : 'text-[#ff5c7a]'
                  }`}
                >
                  {selectedScanDetail.scanResults.score} / 100点
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8b96b8]">診断時刻:</span>
                <span className="font-mono text-[#8b96b8]">{selectedScanDetail.scanResults.scannedAt}</span>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="font-bold text-xs text-white">検出された評価項目：</div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {selectedScanDetail.scanResults.issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-2 p-2.5 rounded-lg text-xs ${
                      selectedScanDetail.scanResults?.level === 'safe'
                        ? 'bg-[#3ddc97]/10 text-[#3ddc97]'
                        : 'bg-[#ff5c7a]/10 text-[#ffb8c5]'
                    }`}
                  >
                    {selectedScanDetail.scanResults?.level === 'safe' ? (
                      <CheckCircle className="w-4 h-4 shrink-0 text-[#3ddc97]" />
                    ) : (
                      <XCircle className="w-4 h-4 shrink-0 text-[#ff5c7a]" />
                    )}
                    <span>{issue}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const s = selectedScanDetail;
                  setSelectedScanDetail(null);
                  setSelectedSafeAccessSite(s);
                }}
                className="flex-1 py-2 rounded-lg bg-gradient-to-r from-[#5b8cff] to-[#7c5bff] text-xs font-bold text-white hover:opacity-95 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>このサイトへ安全確認アクセス</span>
              </button>
              <button
                onClick={() => setSelectedScanDetail(null)}
                className="px-4 py-2 rounded-lg bg-[#161d2e] border border-[#2a3550] hover:bg-[#2a3550] text-xs font-semibold text-white transition cursor-pointer"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Site Modal */}
      <SiteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        siteToEdit={siteToEdit}
      />

      {/* Safe Verification Access Modal */}
      <SafeAccessModal
        site={selectedSafeAccessSite}
        isOpen={!!selectedSafeAccessSite}
        onClose={() => setSelectedSafeAccessSite(null)}
      />
    </div>
  );
};
