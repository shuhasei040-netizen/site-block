import React, { useState } from 'react';
import { UserPlus, Users, Trash2, CheckCircle, AlertTriangle, ShieldAlert } from 'lucide-react';
import { UserAccount, UserRole } from '../../types/security';
import { useSecurity } from '../../context/SecurityContext';
import { AccountModal } from '../modals/AccountModal';

export const AccountsTab: React.FC = () => {
  const { accounts, currentUser, deleteAccount, updateAccountRole } = useSecurity();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isL3Admin = currentUser?.role === 'L3';

  const handleDelete = (acc: UserAccount) => {
    if (acc.isProtected) {
      alert('初期システム管理者アカウントは保護されているため削除できません。');
      return;
    }
    if (window.confirm(`アカウント「${acc.displayName} (${acc.id})」を完全に削除しますか？`)) {
      deleteAccount(acc.id);
    }
  };

  const handleRoleChange = (acc: UserAccount, newRole: UserRole) => {
    if (!isL3Admin) {
      alert('権限レベルの変更にはL3管理者権限が必要です。');
      return;
    }
    updateAccountRole(acc.id, newRole);
  };

  return (
    <div className="space-y-5">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0f1420] border border-[#2a3550] p-4 rounded-xl">
        <div>
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-[#5b8cff]" />
            <span>登録ユーザー・アカウント管理</span>
          </h3>
          <p className="text-xs text-[#8b96b8] mt-0.5">
            L1（閲覧者）/ L2（編集者）/ L3（管理者）の多段階アクセス制御
          </p>
        </div>

        {isL3Admin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-[#5b8cff] to-[#7c5bff] text-white text-xs font-bold shadow-md hover:opacity-95 transition cursor-pointer self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ アカウント登録</span>
          </button>
        )}
      </div>

      {/* Role explanation cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 rounded-lg border border-[#2a3550] bg-[#161d2e] text-xs">
          <div className="font-bold text-[#8b96b8] mb-1">L1: 閲覧者 (Viewer)</div>
          <div className="text-[11px] text-[#8b96b8]/80 leading-relaxed">
            ダッシュボードの閲覧のみ可能。サイトの追加編集、制限適用は不可。自身の操作ログのみ参照。
          </div>
        </div>
        <div className="p-3 rounded-lg border border-[#2a3550] bg-[#161d2e] text-xs">
          <div className="font-bold text-[#5b8cff] mb-1">L2: 編集者 (Editor)</div>
          <div className="text-[11px] text-[#8b96b8]/80 leading-relaxed">
            サイト情報の追加・編集・削除が可能。低信頼度（40点未満）の不正制限の削除が可能。権限変更は不可。
          </div>
        </div>
        <div className="p-3 rounded-lg border border-[#2a3550] bg-[#161d2e] text-xs">
          <div className="font-bold text-[#ff5c7a] mb-1">L3: 管理者 (Admin)</div>
          <div className="text-[11px] text-[#8b96b8]/80 leading-relaxed">
            全機能アクセス、制限の適用、アカウントの追加削除、ロール変更、セキュリティ設定、全ログ閲覧が可能。
          </div>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="rounded-xl border border-[#2a3550] bg-[#0f1420] overflow-hidden shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#2a3550] bg-[#161d2e]/80 text-[#8b96b8]">
                <th className="py-3 px-4">ユーザーID</th>
                <th className="py-3 px-4">表示名</th>
                <th className="py-3 px-4">権限レベル</th>
                <th className="py-3 px-4">信頼度ステータス</th>
                <th className="py-3 px-4">登録日</th>
                <th className="py-3 px-4 text-right">アクション</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a3550]/40">
              {accounts.map((acc) => {
                return (
                  <tr key={acc.id} className="hover:bg-[#161d2e]/40 transition">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-white flex items-center gap-1.5">
                        <span>{acc.id}</span>
                        {acc.isProtected && (
                          <span className="text-[10px] text-[#ffb547] bg-[#ffb547]/10 px-1.5 py-0.2 rounded border border-[#ffb547]/30">
                            保護中
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#e8ecf6] font-medium">{acc.displayName}</td>
                    <td className="py-3 px-4">
                      {isL3Admin && !acc.isProtected ? (
                        <select
                          value={acc.role}
                          onChange={(e) => handleRoleChange(acc, e.target.value as UserRole)}
                          className="bg-[#161d2e] border border-[#2a3550] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#5b8cff]"
                        >
                          <option value="L1">L1 閲覧者</option>
                          <option value="L2">L2 編集者</option>
                          <option value="L3">L3 管理者</option>
                        </select>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            acc.role === 'L3'
                              ? 'bg-[#ff5c7a]/15 text-[#ff5c7a]'
                              : acc.role === 'L2'
                              ? 'bg-[#5b8cff]/15 text-[#5b8cff]'
                              : 'bg-[#8b96b8]/15 text-[#8b96b8]'
                          }`}
                        >
                          {acc.role} ({acc.role === 'L3' ? '管理者' : acc.role === 'L2' ? '編集者' : '閲覧者'})
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          acc.isVerified
                            ? 'bg-[#3ddc97]/15 text-[#3ddc97] border border-[#3ddc97]/30'
                            : 'bg-[#ffb547]/15 text-[#ffb547] border border-[#ffb547]/30'
                        }`}
                      >
                        {acc.isVerified ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            <span>検証済み</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3" />
                            <span>未検証 (制限適用時に-40点)</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#8b96b8]">{acc.createdAt}</td>
                    <td className="py-3 px-4 text-right">
                      {acc.isProtected ? (
                        <span className="text-[11px] text-[#8b96b8]">初期管理者のため削除不可</span>
                      ) : isL3Admin ? (
                        <button
                          onClick={() => handleDelete(acc)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#ff5c7a]/15 hover:bg-[#ff5c7a]/25 text-[#ff5c7a] text-xs font-semibold border border-[#ff5c7a]/30 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>削除</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#8b96b8]">権限不足</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
