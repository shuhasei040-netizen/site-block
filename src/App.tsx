import React, { useState, Component, ErrorInfo, ReactNode } from 'react';
import { SecurityProvider, useSecurity } from './context/SecurityContext';
import { Sidebar, TabKey } from './components/Sidebar';
import { Header } from './components/Header';
import { PWASandboxShield } from './components/PWASandboxShield';
import { LoginModal } from './components/LoginModal';
import { EmergencyModal } from './components/modals/EmergencyModal';
import { BackdoorAlertModal } from './components/modals/BackdoorAlertModal';
import { DashboardTab } from './components/tabs/DashboardTab';
import { SitesTab } from './components/tabs/SitesTab';
import { RestrictionsTab } from './components/tabs/RestrictionsTab';
import { AccountsTab } from './components/tabs/AccountsTab';
import { AuditTab } from './components/tabs/AuditTab';
import { LogsTab } from './components/tabs/LogsTab';
import { SettingsTab } from './components/tabs/SettingsTab';
import { RemoteRecoveryModal } from './components/modals/RemoteRecoveryModal';
import { AlertOctagon, RefreshCw, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error.message || '予期せぬエラーが発生しました' };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleResetStorage = () => {
    try {
      localStorage.removeItem('MLSMD_CURRENT_USER');
      localStorage.removeItem('MLSMD_RESTRICTIONS');
      localStorage.removeItem('MLSMD_ACCOUNTS');
      localStorage.removeItem('MLSMD_OVERRIDE');
    } catch (e) {
      console.warn(e);
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-screen flex items-center justify-center bg-[#0a0e1a] text-[#e8ecf6] p-6">
          <div className="max-w-md w-full p-6 rounded-2xl bg-[#0f1420] border border-[#ff5c7a]/40 shadow-2xl text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-[#ff5c7a]/20 border border-[#ff5c7a]/40 flex items-center justify-center text-[#ff5c7a]">
              <AlertOctagon className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">🚨 システム自己修復・緊急復旧</h2>
              <p className="text-xs text-[#8b96b8] mt-1">
                画面レンダリング中に例外を検知しました。黒画面を防ぐためフェイルセーフモードで保護されています。
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[#161d2e] border border-[#2a3550] text-[11px] text-[#ff5c7a] font-mono break-all text-left">
              {this.state.errorMessage}
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#5b8cff] to-[#7c5bff] text-xs font-bold text-white hover:opacity-90 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>画面を再読み込み</span>
              </button>
              <button
                onClick={this.handleResetStorage}
                className="w-full py-2.5 rounded-lg border border-[#ff5c7a]/40 bg-[#ff5c7a]/10 hover:bg-[#ff5c7a]/20 text-xs font-bold text-[#ff5c7a] transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>キャッシュ・制限状態をリセットして即座に復旧</span>
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const {
    currentUser,
    backdoorReport,
    isBackdoorAlertOpen,
    setIsBackdoorAlertOpen,
    runDeepBackdoorAudit,
    notificationPermission,
    requestNotificationPermission,
  } = useSecurity();
  const [currentTab, setCurrentTab] = useState<TabKey>('dashboard');
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isRemoteRecoveryOpen, setIsRemoteRecoveryOpen] = useState(false);

  // If not logged in, show the full login screen
  if (!currentUser) {
    return <LoginModal />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0a0e1a] text-[#e8ecf6]">
      {/* Left Navigation Sidebar */}
      <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)}
          onOpenRemoteRecovery={() => setIsRemoteRecoveryOpen(true)}
        />

        {/* Content Scroll View */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* PWA Sandbox Shield (Blast restrictions) */}
          <PWASandboxShield />

          {/* Active Tab View */}
          {currentTab === 'dashboard' && <DashboardTab onNavigateTo={setCurrentTab} />}
          {currentTab === 'sites' && <SitesTab />}
          {currentTab === 'restrictions' && <RestrictionsTab />}
          {currentTab === 'accounts' && <AccountsTab />}
          {currentTab === 'audit' && <AuditTab />}
          {currentTab === 'logs' && <LogsTab />}
          {currentTab === 'settings' && <SettingsTab onNavigateTo={setCurrentTab} />}
        </main>
      </div>

      {/* Emergency Override Modal */}
      <EmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
      />

      {/* Remote Verification & Rapid Backdoor Recovery Modal */}
      <RemoteRecoveryModal
        isOpen={isRemoteRecoveryOpen}
        onClose={() => setIsRemoteRecoveryOpen(false)}
      />

      {/* Backdoor & Evasion Audit Alert Modal */}
      <BackdoorAlertModal
        report={backdoorReport}
        isOpen={isBackdoorAlertOpen}
        onClose={() => setIsBackdoorAlertOpen(false)}
        onRescan={() => runDeepBackdoorAudit(true)}
        notificationPermission={notificationPermission}
        onRequestNotification={requestNotificationPermission}
      />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <SecurityProvider>
        <AppContent />
      </SecurityProvider>
    </ErrorBoundary>
  );
}
