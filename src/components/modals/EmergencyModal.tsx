import React, { useState } from 'react';
import {
  AlertOctagon,
  Key,
  CheckCircle,
  AlertTriangle,
  X,
  ShieldAlert,
  Wrench,
  Radio,
  RefreshCw,
  Lock,
  Unlock,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { useSecurity, MASTER_KEY } from '../../context/SecurityContext';
import { EmergencyPatchResult } from '../../utils/emergencyPatcher';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({ isOpen, onClose }) => {
  const {
    emergencyOverride,
    executeEmergencyPatch,
    restrictions,
    lastEmergencyPatchResult,
  } = useSecurity();

  const [activeTab, setActiveTab] = useState<'patch' | 'manualKey'>('patch');
  const [keyInput, setKeyInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPatching, setIsPatching] = useState(false);
  const [patchStage, setPatchStage] = useState<string>('');
  const [patchOutput, setPatchOutput] = useState<EmergencyPatchResult | null>(null);

  if (!isOpen) return null;

  const activeRestrictions = restrictions.filter((r) => r.status === 'active');
  const lockedRestrictions = activeRestrictions.filter(
    (r) => r.type === 'full_lock' || r.type === 'revoke_admin' || r.type === 'site_block' || r.type === 'api_freeze'
  );

  const handleManualOverride = (e: React.FormEvent) => {
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

  const handleExecuteEmergencyPatch = async () => {
    setIsPatching(true);
    setError(null);

    try {
      setPatchStage('1/3: 既存の通信経路（バックドア）を介した緊急遠隔検証アクセスを確立中...');
      await new Promise((resolve) => setTimeout(resolve, 600));

      setPatchStage('2/3: 迂回ポート・悪意あるロック制限・未検証特権を特定中...');
      await new Promise((resolve) => setTimeout(resolve, 600));

      setPatchStage('3/3: 脆弱性のパッチ適用（閉塞対応）と最高管理者アクセスの復旧を実行中...');
      const result = await executeEmergencyPatch();
      await new Promise((resolve) => setTimeout(resolve, 400));

      setPatchOutput(result);
      setSuccess(true);
    } catch (err) {
      setError('緊急遠隔検証アクセスまたはパッチ適用中にエラーが発生しました。');
    } finally {
      setIsPatching(false);
      setPatchStage('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-xl rounded-2xl border border-[#ff5c7a]/40 bg-[#0f1420] p-6 shadow-2xl space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8b96b8] hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 text-[#ff5c7a]">
          <div className="p-2.5 rounded-xl bg-[#ff5c7a]/15 border border-[#ff5c7a]/30">
            <AlertOctagon className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">🚨 緊急遠隔検証 ＆ 脆弱性閉塞パッチ適用</h3>
            <p className="text-xs text-[#8b96b8]">
              ロック制限下における緊急アクセス確立・バックドア通信経路の特定とパッチ閉塞対応
            </p>
          </div>
        </div>

        {/* Current Lock Status Alert */}
        <div className="p-3 rounded-xl bg-[#161d2e] border border-[#2a3550] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#ffb547]" />
            <span className="text-[#8b96b8]">現在の制限適用状況:</span>
            <span className="font-bold text-white font-mono">{activeRestrictions.length} 件稼働中</span>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            lockedRestrictions.length > 0
              ? 'bg-[#ff5c7a]/20 text-[#ff5c7a] border border-[#ff5c7a]/30 animate-pulse'
              : 'bg-[#3ddc97]/20 text-[#3ddc97] border border-[#3ddc97]/30'
          }`}>
            {lockedRestrictions.length > 0 ? `🚨 ${lockedRestrictions.length}件のロック稼働中` : '通常状態'}
          </span>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-lg bg-[#161d2e] p-1 border border-[#2a3550] text-xs">
          <button
            onClick={() => setActiveTab('patch')}
            className={`flex-1 py-1.5 rounded-md font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'patch'
                ? 'bg-gradient-to-r from-[#ff416c] to-[#ff5c7a] text-white shadow'
                : 'text-[#8b96b8] hover:text-white'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>緊急遠隔検証 ＆ パッチ閉塞</span>
          </button>
          <button
            onClick={() => setActiveTab('manualKey')}
            className={`flex-1 py-1.5 rounded-md font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'manualKey'
                ? 'bg-gradient-to-r from-[#ff416c] to-[#ff5c7a] text-white shadow'
                : 'text-[#8b96b8] hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>マスターキー手動解除</span>
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-[#ff5c7a]/15 border border-[#ff5c7a]/30 px-3 py-2 text-xs text-[#ff5c7a]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab 1: Emergency Remote Verification & Vulnerability Patching */}
        {activeTab === 'patch' && (
          <div className="space-y-4 text-xs">
            <p className="text-[#cbd5e1] leading-relaxed bg-[#161d2e] p-3 rounded-lg border border-[#2a3550]">
              対象サイトやハッカーによるロック制限下であっても、残存する通信経路（バックドア/管理プロトコル）を介して<strong>「緊急遠隔検証アクセス」</strong>を即座に確立します。検知された迂回ポートや悪意ある虚偽ロックに対して自動的に<strong>「脆弱性閉塞パッチ」</strong>を適用し、安全な運用状態へ復旧します。
            </p>

            {isPatching && (
              <div className="p-3.5 rounded-xl bg-[#ff5c7a]/10 border border-[#ff5c7a]/30 space-y-2 animate-fadeIn">
                <div className="flex items-center gap-2 text-[#ff5c7a] font-bold">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{patchStage}</span>
                </div>
                <div className="w-full bg-[#161d2e] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-[#ff416c] to-[#ff5c7a] h-full w-2/3 animate-pulse" />
                </div>
              </div>
            )}

            {patchOutput && (
              <div className="p-3.5 rounded-xl bg-[#3ddc97]/10 border border-[#3ddc97]/30 space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-between text-[#3ddc97] font-bold">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>緊急遠隔検証アクセス確立 ＆ 閉塞パッチ適用完了</span>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#3ddc97]/20 border border-[#3ddc97]/30">
                    Token: {patchOutput.verificationToken}
                  </span>
                </div>

                <div className="text-[11px] text-[#cbd5e1] space-y-1">
                  <div className="font-semibold text-white">適用された閉塞・復旧アクション（{patchOutput.actionsTaken.length}件）:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-[#94a3b8]">
                    {patchOutput.actionsTaken.map((act, i) => (
                      <li key={i}>{act}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-[#2a3550] bg-[#161d2e] hover:bg-[#2a3550] text-xs font-semibold text-[#e8ecf6] cursor-pointer"
              >
                閉じる
              </button>
              <button
                type="button"
                onClick={handleExecuteEmergencyPatch}
                disabled={isPatching}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold text-white shadow-lg cursor-pointer transition active:scale-95 ${
                  isPatching
                    ? 'bg-[#2a3550] cursor-not-allowed opacity-70'
                    : 'bg-gradient-to-r from-[#ff416c] to-[#ff5c7a] hover:opacity-95 shadow-[#ff5c7a]/25'
                }`}
              >
                <Radio className={`w-4 h-4 ${isPatching ? 'animate-spin' : 'animate-pulse'}`} />
                <span>{isPatching ? '緊急検証・パッチ適用中...' : '緊急遠隔検証 ＆ 閉塞パッチを実行'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Manual Master Key Override */}
        {activeTab === 'manualKey' && (
          <form onSubmit={handleManualOverride} className="space-y-4 text-xs">
            {success && (
              <div className="flex items-center gap-2 rounded-lg bg-[#3ddc97]/15 border border-[#3ddc97]/30 px-3 py-2 text-xs text-[#3ddc97]">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>✅ マスターキーによる緊急復旧が完了しました！全制限を強制無効化しました。</span>
              </div>
            )}

            <div>
              <label className="block font-semibold text-[#8b96b8] mb-1.5">
                シークレットマスターキー
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-2.5 w-4 h-4 text-[#8b96b8]" />
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="MASTER-2024-OVERRIDE"
                  className="w-full rounded-lg border border-[#2a3550] bg-[#161d2e] pl-9 pr-3 py-2 text-white placeholder-[#8b96b8]/50 focus:border-[#ff5c7a] focus:outline-none focus:ring-1 focus:ring-[#ff5c7a]"
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
        )}
      </div>
    </div>
  );
};
