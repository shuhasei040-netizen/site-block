import React, { useState } from 'react';
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
    <SecurityProvider>
      <AppContent />
    </SecurityProvider>
  );
}
