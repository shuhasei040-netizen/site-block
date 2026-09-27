import React, { useState } from 'react';
import { AlertOctagon, Key, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { useSecurity, MASTER_KEY } from '../../context/SecurityContext';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({ isOpen, onClose }) => {
  const { emergencyOverride } = useSecurity();
  const [keyInput, setKeyInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleExecute = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const ok = emergencyOverride(keyInput.trim());
    if (ok) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setKeyInput('');
        onClose();
      }, 1500);
    } else {
      setError('マスターキーが一致しません。正しい緊急シークレットキーを入力してください。');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-[#ff5c7a]/40 bg-[#0f1420] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8b96b8] hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 text-[#ff5c7a] mb-4">
          <div className="p-2.5 rounded-xl bg-[#ff5c7a]/15 border border-[#ff5c7a]/30">
            <AlertOctagon className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">🚨 緊急復旧（EMERGENCY OVERRIDE）</h3>
            <p className="text-xs text-[#8b96b8]">ハッカーによる完全ロックダウン・管理者権限剥奪からの強制脱出</p>
          </div>
        </div>

        <p className="text-xs text-[#e8ecf6] leading-relaxed mb-4 bg-[#161d2e] p-3 rounded-lg border border-[#2a3550]">
          最高レベルのシークレットマスターキーを入力すると、現在有効なすべての制限が<strong>「無視モード（bypassable = true）」</strong>に変更され、即座に最高管理者アクセスが回復します。この操作は改ざん不可監査ログに永続記録されます。
        </p>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-[#ff5c7a]/15 border border-[#ff5c7a]/30 px-3 py-2 text-xs text-[#ff5c7a]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-[#3ddc97]/15 border border-[#3ddc97]/30 px-3 py-2 text-xs text-[#3ddc97]">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>✅ 緊急復旧が実行されました！全制限を強制無効化しました。</span>
          </div>
        )}

        <form onSubmit={handleExecute} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#8b96b8] mb-1.5">
              シークレットマスターキー
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-2.5 w-4 h-4 text-[#8b96b8]" />
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="MASTER-2024-OVERRIDE"
                className="w-full rounded-lg border border-[#2a3550] bg-[#161d2e] pl-9 pr-3 py-2 text-xs text-white placeholder-[#8b96b8]/50 focus:border-[#ff5c7a] focus:outline-none focus:ring-1 focus:ring-[#ff5c7a]"
                required
              />
            </div>
            <div className="mt-1 flex justify-between items-center text-[11px] text-[#8b96b8]">
              <span>テスト用マスターキー：</span>
              <button
                type="button"
                onClick={() => setKeyInput(MASTER_KEY)}
                className="text-[#ffb547] underline hover:text-white cursor-pointer"
              >
                自動入力 ({MASTER_KEY})
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#2a3550] bg-[#161d2e] hover:bg-[#2a3550] text-xs font-semibold text-[#e8ecf6] cursor-pointer"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-[#ff416c] to-[#ff5c7a] hover:opacity-95 text-xs font-bold text-white shadow-lg cursor-pointer"
            >
              <AlertOctagon className="w-4 h-4" />
              <span>緊急復旧を実行</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
