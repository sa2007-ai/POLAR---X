import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { QuickSOSModal } from '../polar/QuickSOSModal';
import { NetworkStatusBanner } from '../pwa/NetworkStatusBanner';
import { FirebaseConnectionBanner } from '../common/FirebaseConnectionBanner';
import { MobileFieldToolbar } from './MobileFieldToolbar';
import { ConflictResolutionModal } from '../offline/ConflictResolutionModal';
import { conflictService } from '../../services/offline/conflictService';
import { SyncConflictRecord } from '../../services/offline/offlineDb';

export const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [conflicts, setConflicts] = useState<SyncConflictRecord[]>([]);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchConflicts = async () => {
      try {
        const openConflicts = await conflictService.getOpenConflicts();
        if (isMounted) setConflicts(openConflicts);
      } catch (err) {
        console.error('Failed to load conflicts:', err);
      }
    };

    void fetchConflicts();
    const interval = setInterval(() => {
      void fetchConflicts();
    }, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleConflictResolved = async () => {
    try {
      const openConflicts = await conflictService.getOpenConflicts();
      setConflicts(openConflicts);
    } catch (err) {
      console.error('Failed to reload conflicts:', err);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#070d1e] text-slate-100 font-sans overflow-x-hidden pb-16 lg:pb-0">
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Network & PWA Offline Status Banner */}
        <NetworkStatusBanner onOpenConflicts={() => setIsConflictModalOpen(true)} />

        {/* Firebase Cloud Connection Status Banner */}
        <FirebaseConnectionBanner />

        {/* Topbar */}
        <Topbar onMobileMenuClick={() => setMobileOpen(true)} />

        {/* Page Viewport Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Field Operations Toolbar */}
      <MobileFieldToolbar />

      {/* Global Quick SOS Modal */}
      <QuickSOSModal />

      {/* Operational Concurrency Conflict Modal */}
      <ConflictResolutionModal
        conflicts={conflicts}
        isOpen={isConflictModalOpen}
        onClose={() => setIsConflictModalOpen(false)}
        onResolved={handleConflictResolved}
      />
    </div>
  );
};
