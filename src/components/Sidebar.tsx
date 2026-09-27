import React from 'react';
import {
  LayoutDashboard,
  Globe,
  Lock,
  Users,
  ShieldCheck,
  FileText,
  Settings,
  LogOut,
  Shield,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';

export type TabKey =
  | 'dashboard'
  | 'sites'
  | 'restrictions'
  | 'accounts'
  | 'audit'
  | 'logs'
  | 'settings';

interface SidebarProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { currentUser, logout, isEmergencyOverridden } = useSecurity();

  const navItems = [
    { key: 'dashboard' as TabKey, label: 'ダッシュボード', icon: LayoutDashboard },
    { key: 'sites' as TabKey, label: 'サイト一覧', icon: Globe },
    { key: 'restrictions' as TabKey, label: '制限管理', icon: Lock },
    { key: 'accounts' as TabKey, label: 'アカウント管理', icon: Users },
    { key: 'audit' as TabKey, label: 'セキュリティ監査', icon: ShieldCheck },
    { key: 'logs' as TabKey, label: 'アクティビティログ', icon: FileText },
    { key: 'settings' as TabKey, label: 'システム設定', icon: Settings },
  ];

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'L3':
        return 'L3 管理者';
      case 'L2':
        return 'L2 編集者';
      case 'L1':
        return 'L1 閲覧者';
      default:
        return 'ゲスト';
    }
  };

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'L3':
        return 'bg-[#ff5c7a]/20 text-[#ff5c7a] border-[#ff5c7a]/40';
      case 'L2':
        return 'bg-[#5b8cff]/20 text-[#5b8cff] border-[#5b8cff]/40';
      case 'L1':
      default:
        return 'bg-[#8b96b8]/20 text-[#8b96b8] border-[#8b96b8]/40';
    }
  };

  return (
    <aside className="w-64 bg-[#0f1420] border-r border-[#2a3550] flex flex-col shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#2a3550] flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5b8cff] to-[#7c5bff] flex items-center justify-center shadow-lg shadow-[#5b8cff]/20 text-xl shrink-0">
          🛡️
        </div>
        <div>
          <div className="font-bold text-sm tracking-wide text-white flex items-center gap-1.5">
            <span>Guardian Multi-Layer</span>
          </div>
          <div className="text-[11px] text-[#8b96b8] tracking-wider uppercase font-medium">
            MLSMD System v2.4
          </div>
        </div>
      </div>

      {/* Emergency Mode Notification Tag */}
      {isEmergencyOverridden && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-[#ffb547]/10 border border-[#ffb547]/30 text-[#ffb547] text-[11px] flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 animate-bounce" />
          <span className="font-semibold">マスターキー復旧モード稼働中</span>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onSelectTab(item.key)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-left ${
                isActive
                  ? 'bg-[#161d2e] text-[#5b8cff] border-l-4 border-[#5b8cff] shadow-sm'
                  : 'text-[#8b96b8] hover:bg-[#161d2e]/60 hover:text-[#e8ecf6]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#5b8cff]' : 'text-[#8b96b8]'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Current User Info Profile */}
      <div className="p-4 border-t border-[#2a3550] bg-[#0a0e1a]/40">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#5b8cff] to-[#7c5bff] flex items-center justify-center text-white font-bold text-xs shadow-md">
            {currentUser ? currentUser.displayName.charAt(0) : '?'}
          </div>
          <div className="overflow-hidden flex-1">
            <div className="font-bold text-xs text-white truncate">
              {currentUser?.displayName || '未ログイン'}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${getRoleBadgeStyle(
                  currentUser?.role
                )}`}
              >
                {getRoleLabel(currentUser?.role)}
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold flex items-center gap-0.5 ${
                  currentUser?.isVerified
                    ? 'bg-[#3ddc97]/15 text-[#3ddc97] border-[#3ddc97]/30'
                    : 'bg-[#ffb547]/15 text-[#ffb547] border-[#ffb547]/30'
                }`}
              >
                {currentUser?.isVerified ? (
                  <>
                    <CheckCircle className="w-2.5 h-2.5" />
                    <span>検証済</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-2.5 h-2.5" />
                    <span>未検証</span>
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => logout()}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border border-[#2a3550] bg-[#161d2e] hover:bg-[#2a3550] text-[#8b96b8] hover:text-[#ff5c7a] text-xs font-semibold transition cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>ログアウト</span>
        </button>
      </div>
    </aside>
  );
};
