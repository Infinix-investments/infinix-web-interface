'use client';

import React, { useState, useEffect } from 'react';
import { AdminProvider, useAdmin } from '@/context/admin-context';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { OverviewView } from '@/components/dashboard/overview-view';
import { ClientsView } from '@/components/clients/clients-view';
import { PlansView } from '@/components/plans/plans-view';
import { WithdrawalsView } from '@/components/withdrawals/withdrawals-view';
import { ReferralsView } from '@/components/referrals/referrals-view';
import { LevelsView } from '@/components/referrals/levels-view';
import { AuditView } from '@/components/audit/audit-view';
import { ReportsView } from '@/components/reports/reports-view';
import { AssignPlanModal } from '@/components/modals/assign-plan-modal';
import { NewClientModal } from '@/components/modals/new-client-modal';
import { AdminLogin } from '@/components/auth/admin-login';
import { AdminSettingsModal } from '@/components/modals/admin-settings-modal';

function AdminDeskContent() {
  const { activeTab } = useAdmin();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const auth = localStorage.getItem('infinix_admin_auth');
    setIsAuthenticated(auth === 'true');
  }, []);

  // Modal States
  const [assignModalClientId, setAssignModalClientId] = useState<string | null>(null);
  const [assignModalPlanId, setAssignModalPlanId] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const handleOpenAssignModal = (clientId?: string, planId?: string) => {
    setAssignModalClientId(clientId || null);
    setAssignModalPlanId(planId || null);
    setShowAssignModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('infinix_admin_auth');
    setIsAuthenticated(false);
  };

  // Wait for client-side storage hydration
  if (isAuthenticated === null) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#080C14]">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If not authenticated, render institutional login screen
  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#080C14] text-slate-100 font-sans">
      {/* Fixed Desktop Sidebar */}
      <Sidebar onOpenSettings={() => setShowSettingsModal(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onOpenNewClientModal={() => setShowNewClientModal(true)} />

        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#080C14]">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'overview' && (
              <OverviewView onOpenAssignModal={handleOpenAssignModal} />
            )}
            {activeTab === 'clients' && (
              <ClientsView
                onOpenAssignModal={handleOpenAssignModal}
                onOpenNewClientModal={() => setShowNewClientModal(true)}
              />
            )}
            {activeTab === 'plans' && (
              <PlansView onOpenAssignModal={handleOpenAssignModal} />
            )}
            {activeTab === 'withdrawals' && <WithdrawalsView />}
            {activeTab === 'referrals' && <ReferralsView />}
            {activeTab === 'levels' && <LevelsView />}
            {activeTab === 'reports' && (
              <ReportsView onOpenAssignModal={handleOpenAssignModal} />
            )}
            {activeTab === 'audit' && <AuditView />}
          </div>
        </main>
      </div>

      {/* Modals */}
      {showAssignModal && (
        <AssignPlanModal
          key={`${assignModalClientId || 'any'}-${assignModalPlanId || 'any'}`}
          clientId={assignModalClientId || undefined}
          planId={assignModalPlanId || undefined}
          onClose={() => {
            setShowAssignModal(false);
            setAssignModalClientId(null);
            setAssignModalPlanId(null);
          }}
        />
      )}

      {showNewClientModal && (
        <NewClientModal onClose={() => setShowNewClientModal(false)} />
      )}

      {showSettingsModal && (
        <AdminSettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminProvider>
      <AdminDeskContent />
    </AdminProvider>
  );
}
