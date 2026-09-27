import React, { useState, useEffect } from 'react';
import { Globe, X, AlertTriangle, ShieldCheck } from 'lucide-react';
import { SiteItem } from '../../types/security';
import { useSecurity } from '../../context/SecurityContext';

interface SiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteToEdit?: SiteItem | null;
}

export const SiteModal: React.FC<SiteModalProps> = ({ isOpen, onClose, siteToEdit }) => {
  const { addSite, updateSite } = useSecurity();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('コーポレート');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (siteToEdit) {
      setName(siteToEdit.name);
      setUrl(siteToEdit.url);
      setCategory(siteToEdit.category || 'コーポレート');
      setNotes(siteToEdit.notes || '');
    } else {
      setName('');
      setUrl('https://');
      setCategory('コーポレート');
      setNotes('');
    }
    setError(null);
  }, [siteToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !url.trim()) {
      setError('サイト名とURLは必須項目です');
      return;
    }

    if (siteToEdit) {
      updateSite({
        ...siteToEdit,
        name: name.trim(),
        url: url.trim(),
        category,
        notes: notes.trim(),
      });
    } else {
      const ok = addSite({
        name: name.trim(),
        url: url.trim(),
        category,
        notes: notes.trim(),
      });
      if (!ok) {
        setError('サイトの追加に失敗しました（権限不足：L2/L3権限が必要です）');
        return;
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-[#2a3550] bg-[#0f1420] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8b96b8] hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-[#5b8cff]/15 border border-[#5b8cff]/30 text-[#5b8cff]">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {siteToEdit ? 'サイト情報編集' : '新規管理サイト追加'}
            </h3>
            <p className="text-xs text-[#8b96b8]">登録時に自動でURLヒューリスティックスキャンを実施します</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-[#ff5c7a]/15 border border-[#ff5c7a]/30 px-3 py-2 text-xs text-[#ff5c7a]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#8b96b8] mb-1">サイト名 (必須)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 会員マイページポータル"
              className="w-full rounded-lg border border-[#2a3550] bg-[#161d2e] px-3 py-2 text-xs text-white placeholder-[#8b96b8]/50 focus:border-[#5b8cff] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8b96b8] mb-1">URL (必須)</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full rounded-lg border border-[#2a3550] bg-[#161d2e] px-3 py-2 text-xs text-white placeholder-[#8b96b8]/50 focus:border-[#5b8cff] focus:outline-none"
              required
            />
            <p className="text-[11px] text-[#8b96b8] mt-1">
              ※ HTTPS推奨。危険な拡張子（.exe等）や短縮URLは警告対象になります。
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8b96b8] mb-1">カテゴリー</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-[#2a3550] bg-[#161d2e] px-3 py-2 text-xs text-white focus:border-[#5b8cff] focus:outline-none"
            >
              <option value="コーポレート">コーポレート</option>
              <option value="サービス/プロダクト">サービス/プロダクト</option>
              <option value="サポート">サポート</option>
              <option value="マーケティング">マーケティング</option>
              <option value="内部ツール">内部ツール</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8b96b8] mb-1">備考・メモ</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="SLA条件、監視担当者などのメモ"
              className="w-full rounded-lg border border-[#2a3550] bg-[#161d2e] px-3 py-2 text-xs text-white placeholder-[#8b96b8]/50 focus:border-[#5b8cff] focus:outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#2a3550] bg-[#161d2e] hover:bg-[#2a3550] text-xs font-semibold text-[#e8ecf6] cursor-pointer"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#5b8cff] to-[#7c5bff] hover:opacity-95 text-xs font-bold text-white shadow-lg cursor-pointer"
            >
              {siteToEdit ? '変更を保存' : 'サイトを登録'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
