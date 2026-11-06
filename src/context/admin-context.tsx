'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '@/services/api';
import {
  ClientProfile,
  InvestmentPlanConfig,
  WithdrawalRecord,
  AuditLogItem,
  ReferralRecord,
  ReferralLevelTier,
} from '@/types/admin';
import {
  INITIAL_CLIENTS,
  INITIAL_PLANS,
  INITIAL_WITHDRAWALS,
  INITIAL_AUDIT_LOGS,
  INITIAL_REFERRALS,
  INITIAL_REFERRAL_TIERS,
} from '@/data/initial-data';

export type AdminTab =
  | 'overview'
  | 'clients'
  | 'plans'
  | 'withdrawals'
  | 'referrals'
  | 'levels'
  | 'audit';

interface AdminContextType {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  clients: ClientProfile[];
  plans: InvestmentPlanConfig[];
  withdrawals: WithdrawalRecord[];
  referrals: ReferralRecord[];
  referralTiers: ReferralLevelTier[];
  auditLogs: AuditLogItem[];
  verifyClientPhone: (clientId: string) => { success: boolean; message: string };
  assignPlanToClient: (
    clientId: string,
    planId: string,
    amount: number,
    startDate?: string
  ) => { success: boolean; message: string };
  revokeClientPlan: (clientId: string) => { success: boolean; message: string };
  approveWithdrawal: (withdrawalId: string) => { success: boolean; message: string };
  rejectWithdrawal: (withdrawalId: string, reason: string) => { success: boolean; message: string };
  disburseReferralCommission: (referralId: string) => { success: boolean; message: string };
  updateReferralTier: (
    level: number,
    updates: Partial<ReferralLevelTier>
  ) => { success: boolean; message: string };
  addNewClient: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    bankAccount: string;
    autoAssign14MPlan?: boolean;
    allocatedAmount?: number;
    referredByCode?: string;
  }) => { success: boolean; message: string; clientId: string };
  stats: {
    totalAum: number;
    activeInvestorsCount: number;
    pendingPhoneCount: number;
    pendingWithdrawalCount: number;
    pendingWithdrawalTotal: number;
    monthlyLiabilityTotal: number;
    totalReferralsCount: number;
    activeReferralsCount: number;
    monthlyReferralCommissionTotal: number;
  };
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [clients, setClients] = useState<ClientProfile[]>(INITIAL_CLIENTS);
  const [plans, setPlans] = useState<InvestmentPlanConfig[]>(INITIAL_PLANS);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>(INITIAL_WITHDRAWALS);
  const [referrals, setReferrals] = useState<ReferralRecord[]>(INITIAL_REFERRALS);
  const [referralTiers, setReferralTiers] = useState<ReferralLevelTier[]>(INITIAL_REFERRAL_TIERS);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(INITIAL_AUDIT_LOGS);

  // Synchronize state with unified Fastify + MongoDB backend server
  useEffect(() => {
    let isMounted = true;
    async function loadServerData() {
      try {
        const [cRes, pRes, wRes, rRes, tRes, aRes] = await Promise.allSettled([
          api.getClients(),
          api.getPlans(),
          api.getWithdrawals(),
          api.getReferrals(),
          api.getReferralTiers(),
          api.getAuditLogs(),
        ]);

        if (isMounted && cRes.status === 'fulfilled' && cRes.value.success && cRes.value.data?.length) {
          setClients(cRes.value.data);
        }
        if (isMounted && pRes.status === 'fulfilled' && pRes.value.success && pRes.value.data?.length) {
          setPlans(pRes.value.data);
        }
        if (isMounted && wRes.status === 'fulfilled' && wRes.value.success && wRes.value.data?.length) {
          setWithdrawals(wRes.value.data);
        }
        if (isMounted && rRes.status === 'fulfilled' && rRes.value.success && rRes.value.data?.length) {
          setReferrals(rRes.value.data);
        }
        if (isMounted && tRes.status === 'fulfilled' && tRes.value.success && tRes.value.data?.length) {
          setReferralTiers(tRes.value.data);
        }
        if (isMounted && aRes.status === 'fulfilled' && aRes.value.success && aRes.value.data?.length) {
          setAuditLogs(aRes.value.data);
        }
      } catch {
        // Fallback gracefully to initial local data
      }
    }
    loadServerData();
    return () => {
      isMounted = false;
    };
  }, []);

  const addAuditLog = (
    action: string,
    category: AuditLogItem['category'],
    details: string
  ) => {
    const newLog: AuditLogItem = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      adminName: 'Chief Wealth Admin (Altaf)',
      action,
      category,
      details,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // 1. VERIFY CLIENT PHONE
  const verifyClientPhone = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return { success: false, message: 'Client not found.' };

    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? {
              ...c,
              isPhoneVerified: true,
              kycStatus: 'verified',
            }
          : c
      )
    );

    addAuditLog(
      'Phone OTP Verified',
      'client_verification',
      `Manual phone verification authorized for ${client.firstName} ${client.lastName} (${client.phone}). User unlocked for plan assignment.`
    );

    api.updateClient(clientId, { isPhoneVerified: true, kycStatus: 'verified' }).catch(() => {});

    return {
      success: true,
      message: `Phone number for ${client.firstName} ${client.lastName} successfully verified! You may now assign an investment plan.`,
    };
  };

  // 2. ASSIGN INVESTMENT PLAN (Defaults to 14-Month 15% Return Accelerator)
  const assignPlanToClient = (
    clientId: string,
    planId: string,
    amount: number,
    startDate?: string
  ) => {
    const client = clients.find((c) => c.id === clientId);
    const plan = plans.find((p) => p.id === planId) || plans[0];

    if (!client) return { success: false, message: 'Client not found.' };
    if (!client.isPhoneVerified) {
      return {
        success: false,
        message: 'Client phone number must be verified before assigning an investment plan.',
      };
    }

    const today = startDate || new Date().toISOString().split('T')[0];

    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? {
              ...c,
              assignedPlanId: plan.id,
              assignedPlanName: plan.planName,
              assignedPlanAmount: amount,
              assignedPlanStartDate: today,
              assignedPlanStatus: 'active',
              totalAum: amount,
              currentMonthIndex: 1,
              currentMonthWithdrawn: false,
            }
          : c
      )
    );

    // If client was referred by someone, update referral record to active
    setReferrals((prev) =>
      prev.map((r) => {
        if (r.refereeId === clientId) {
          const comm = (amount * r.commissionRatePct) / 100;
          return {
            ...r,
            status: 'active',
            capitalAmount: amount,
            planName: plan.planName,
            monthlyCommissionAmount: comm,
          };
        }
        return r;
      })
    );

    addAuditLog(
      'Investment Plan Assigned',
      'plan_assignment',
      `Assigned "${plan.planName}" with ₹${amount.toLocaleString('en-IN')} capital to ${client.firstName} ${client.lastName}. Monthly distribution: 15% (₹${((amount * 15) / 100).toLocaleString('en-IN')}).`
    );

    api.assignPlan(clientId, plan.id, amount, 'Chief Wealth Admin (Altaf)').catch(() => {});

    return {
      success: true,
      message: `"${plan.planName}" allocated to ${client.firstName} ${client.lastName} with ₹${amount.toLocaleString('en-IN')} capital!`,
    };
  };

  // 3. REVOKE PLAN
  const revokeClientPlan = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return { success: false, message: 'Client not found.' };

    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? {
              ...c,
              assignedPlanId: null,
              assignedPlanName: undefined,
              assignedPlanAmount: undefined,
              assignedPlanStartDate: undefined,
              assignedPlanStatus: 'pending_assignment',
              totalAum: 0,
            }
          : c
      )
    );

    addAuditLog(
      'Plan Revoked',
      'plan_assignment',
      `Revoked active investment plan from ${client.firstName} ${client.lastName}.`
    );

    return {
      success: true,
      message: `Investment plan revoked for ${client.firstName} ${client.lastName}.`,
    };
  };

  // 4. APPROVE MONTHLY WITHDRAWAL
  const approveWithdrawal = (withdrawalId: string) => {
    const wd = withdrawals.find((w) => w.id === withdrawalId);
    if (!wd) return { success: false, message: 'Withdrawal record not found.' };

    const utr = `CMS-${Date.now().toString().slice(-8)}`;
    const today = new Date().toISOString().split('T')[0];

    setWithdrawals((prev) =>
      prev.map((w) =>
        w.id === withdrawalId
          ? {
              ...w,
              status: 'disbursed',
              disbursedDate: today,
              utrReference: utr,
            }
          : w
      )
    );

    // Update client withdrawal status
    setClients((prev) =>
      prev.map((c) =>
        c.id === wd.clientId
          ? {
              ...c,
              currentMonthWithdrawn: true,
              lastWithdrawalDate: today,
            }
          : c
      )
    );

    addAuditLog(
      'Disbursement Approved & Transferred',
      'withdrawal_approval',
      `Approved monthly payout of ₹${wd.amount.toLocaleString('en-IN')} for ${wd.clientName} (${wd.bankAccount}). UTR: ${utr}. Non-withdrawal fee waived.`
    );

    api.updateWithdrawalStatus(withdrawalId, 'disbursed', utr, 'Disbursed via bank transfer', 'Chief Wealth Admin (Altaf)').catch(() => {});

    return {
      success: true,
      message: `Payout of ₹${wd.amount.toLocaleString('en-IN')} approved and disbursed to ${wd.bankAccount}! UTR: ${utr}`,
    };
  };

  // 5. REJECT WITHDRAWAL
  const rejectWithdrawal = (withdrawalId: string, reason: string) => {
    const wd = withdrawals.find((w) => w.id === withdrawalId);
    if (!wd) return { success: false, message: 'Withdrawal record not found.' };

    setWithdrawals((prev) =>
      prev.map((w) =>
        w.id === withdrawalId
          ? {
              ...w,
              status: 'rejected',
              notes: `Rejected: ${reason}`,
            }
          : w
      )
    );

    addAuditLog(
      'Disbursement Rejected',
      'withdrawal_approval',
      `Rejected withdrawal request #${wd.id} for ${wd.clientName}. Reason: ${reason}`
    );

    return {
      success: true,
      message: `Withdrawal request #${wd.id} marked as rejected.`,
    };
  };

  // 6. DISBURSE REFERRAL COMMISSION
  const disburseReferralCommission = (referralId: string) => {
    const ref = referrals.find((r) => r.id === referralId);
    if (!ref) return { success: false, message: 'Referral record not found.' };

    const utr = `CMS-REF-${Date.now().toString().slice(-7)}`;

    setReferrals((prev) =>
      prev.map((r) =>
        r.id === referralId
          ? {
              ...r,
              totalEarnedAmount: r.totalEarnedAmount + r.monthlyCommissionAmount,
            }
          : r
      )
    );

    addAuditLog(
      'Referral Incentive Disbursed',
      'referral_management',
      `Disbursed monthly referral yield of ₹${ref.monthlyCommissionAmount.toLocaleString('en-IN')} (Level ${ref.level}) to ${ref.referrerName}. UTR: ${utr}.`
    );

    return {
      success: true,
      message: `Referral commission of ₹${ref.monthlyCommissionAmount.toLocaleString('en-IN')} successfully settled to ${ref.referrerName}!`,
    };
  };

  // 7. UPDATE REFERRAL LEVEL TIER
  const updateReferralTier = (
    level: number,
    updates: Partial<ReferralLevelTier>
  ) => {
    setReferralTiers((prev) =>
      prev.map((t) => (t.level === level ? { ...t, ...updates } : t))
    );

    addAuditLog(
      'Referral Tier Updated',
      'referral_management',
      `Updated parameters for Referral Level ${level} (${updates.commissionPct !== undefined ? `Commission: ${updates.commissionPct}%` : ''}).`
    );

    return {
      success: true,
      message: `Referral Level ${level} parameters updated successfully!`,
    };
  };

  // 8. ADD NEW CLIENT DIRECTLY
  const addNewClient = (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    bankAccount: string;
    autoAssign14MPlan?: boolean;
    allocatedAmount?: number;
    referredByCode?: string;
  }) => {
    const newId = `c-${Date.now().toString().slice(-4)}`;
    const today = new Date().toISOString().split('T')[0];
    const amount = data.allocatedAmount || 1000000;
    const refCode = `INF-${data.firstName.toUpperCase()}${newId.slice(-3)}`;

    const newClient: ClientProfile = {
      id: newId,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      isPhoneVerified: true,
      kycStatus: 'verified',
      assignedPlanId: data.autoAssign14MPlan ? 'plan-14m-15pct' : null,
      assignedPlanName: data.autoAssign14MPlan
        ? 'INFINIX 14-Month Wealth Accelerator'
        : undefined,
      assignedPlanAmount: data.autoAssign14MPlan ? amount : undefined,
      assignedPlanStartDate: data.autoAssign14MPlan ? today : undefined,
      assignedPlanStatus: data.autoAssign14MPlan ? 'active' : 'pending_assignment',
      currentMonthIndex: 1,
      currentMonthWithdrawn: false,
      bankAccount: data.bankAccount.trim() || 'HDFC Bank ••••4412',
      totalAum: data.autoAssign14MPlan ? amount : 0,
      joinedDate: today,
      notes: 'Manually enrolled by Chief Wealth Admin via Web Desk.',
      referralCode: refCode,
      referredByCode: data.referredByCode,
    };

    setClients((prev) => [newClient, ...prev]);

    // If referred by a client, create referral record
    if (data.referredByCode) {
      const referrer = clients.find((c) => c.referralCode === data.referredByCode);
      if (referrer) {
        const comm = data.autoAssign14MPlan ? (amount * 2.0) / 100 : 0;
        const newRef: ReferralRecord = {
          id: `ref-${Date.now().toString().slice(-4)}`,
          referrerId: referrer.id,
          referrerName: `${referrer.firstName} ${referrer.lastName}`,
          referrerCode: referrer.referralCode || 'INF-ADMIN',
          refereeId: newId,
          refereeName: `${newClient.firstName} ${newClient.lastName}`,
          refereeEmail: newClient.email,
          refereePhone: newClient.phone,
          level: 1,
          planName: data.autoAssign14MPlan
            ? 'INFINIX 14-Month Wealth Accelerator'
            : 'Pending Plan Allocation',
          capitalAmount: data.autoAssign14MPlan ? amount : 0,
          commissionRatePct: 2.0,
          monthlyCommissionAmount: comm,
          totalEarnedAmount: comm,
          status: data.autoAssign14MPlan ? 'active' : 'pending_activation',
          dateJoined: today,
        };
        setReferrals((prev) => [newRef, ...prev]);
      }
    }

    addAuditLog(
      'New Client Onboarded',
      'client_verification',
      `Enrolled new investor ${newClient.firstName} ${newClient.lastName} (${newClient.email}) with ${
        data.autoAssign14MPlan
          ? `INFINIX 14-Month 15% Return Accelerator (₹${amount.toLocaleString('en-IN')})`
          : 'Pending Plan Assignment'
      }.`
    );

    api.createClient({
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      bankAccount: data.bankAccount.trim(),
      isPhoneVerified: true,
      kycStatus: 'verified',
      assignedPlanId: data.autoAssign14MPlan ? 'plan-14m-15pct' : null,
      assignedPlanAmount: data.autoAssign14MPlan ? amount : 0,
      referredByCode: data.referredByCode,
    }).catch(() => {});

    return {
      success: true,
      message: `Investor ${newClient.firstName} ${newClient.lastName} successfully enrolled!`,
      clientId: newId,
    };
  };

  // COMPUTED STATS
  const stats = useMemo(() => {
    const totalAum = clients.reduce((acc, c) => acc + (c.assignedPlanAmount || 0), 0);
    const activeInvestorsCount = clients.filter(
      (c) => c.assignedPlanStatus === 'active'
    ).length;
    const pendingPhoneCount = clients.filter((c) => !c.isPhoneVerified).length;

    const pendingWithdrawals = withdrawals.filter((w) => w.status === 'pending_approval');
    const pendingWithdrawalCount = pendingWithdrawals.length;
    const pendingWithdrawalTotal = pendingWithdrawals.reduce(
      (acc, w) => acc + w.amount,
      0
    );

    // Monthly disbursement liability = 15% of all active assigned capital
    const monthlyLiabilityTotal = clients
      .filter((c) => c.assignedPlanStatus === 'active')
      .reduce((acc, c) => acc + ((c.assignedPlanAmount || 0) * 15) / 100, 0);

    const totalReferralsCount = referrals.length;
    const activeReferralsCount = referrals.filter((r) => r.status === 'active').length;
    const monthlyReferralCommissionTotal = referrals
      .filter((r) => r.status === 'active')
      .reduce((acc, r) => acc + r.monthlyCommissionAmount, 0);

    return {
      totalAum,
      activeInvestorsCount,
      pendingPhoneCount,
      pendingWithdrawalCount,
      pendingWithdrawalTotal,
      monthlyLiabilityTotal,
      totalReferralsCount,
      activeReferralsCount,
      monthlyReferralCommissionTotal,
    };
  }, [clients, withdrawals, referrals]);

  return (
    <AdminContext.Provider
      value={{
        activeTab,
        setActiveTab,
        clients,
        plans,
        withdrawals,
        referrals,
        referralTiers,
        auditLogs,
        verifyClientPhone,
        assignPlanToClient,
        revokeClientPlan,
        approveWithdrawal,
        rejectWithdrawal,
        disburseReferralCommission,
        updateReferralTier,
        addNewClient,
        stats,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
