"use client";

import { INITIAL_PLANS, INITIAL_REFERRAL_TIERS } from "@/data/initial-data";
import { api } from "@/services/api";
import {
  AuditLogItem,
  ClientProfile,
  InvestmentPlanConfig,
  ReferralLevelTier,
  ReferralRecord,
  WithdrawalRecord,
} from "@/types/admin";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type AdminTab =
  | "overview"
  | "clients"
  | "plans"
  | "withdrawals"
  | "referrals"
  | "levels"
  | "audit";

interface AdminContextType {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  clients: ClientProfile[];
  plans: InvestmentPlanConfig[];
  withdrawals: WithdrawalRecord[];
  referrals: ReferralRecord[];
  referralTiers: ReferralLevelTier[];
  auditLogs: AuditLogItem[];
  verifyClientPhone: (clientId: string) => {
    success: boolean;
    message: string;
  };
  assignPlanToClient: (
    clientId: string,
    planId: string,
    amount: number,
    startDate?: string,
    paymentReference?: string,
  ) => { success: boolean; message: string };
  revokeClientPlan: (clientId: string) => { success: boolean; message: string };
  createPlan: (data: Partial<InvestmentPlanConfig>) => Promise<{
    success: boolean;
    message: string;
    plan?: InvestmentPlanConfig;
  }>;
  updatePlan: (
    id: string,
    updates: Partial<InvestmentPlanConfig>,
  ) => Promise<{ success: boolean; message: string }>;
  deletePlan: (id: string) => Promise<{ success: boolean; message: string }>;
  approveWithdrawal: (
    withdrawalId: string,
    customUtr?: string,
  ) => { success: boolean; message: string };
  rejectWithdrawal: (
    withdrawalId: string,
    reason: string,
  ) => { success: boolean; message: string };
  disburseReferralCommission: (referralId: string) => {
    success: boolean;
    message: string;
  };
  updateReferralTier: (
    level: number,
    updates: Partial<ReferralLevelTier>,
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
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [plans, setPlans] = useState<InvestmentPlanConfig[]>(INITIAL_PLANS);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [referralTiers, setReferralTiers] = useState<ReferralLevelTier[]>(
    INITIAL_REFERRAL_TIERS,
  );
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

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

        if (
          isMounted &&
          cRes.status === "fulfilled" &&
          cRes.value.success &&
          Array.isArray(cRes.value.data)
        ) {
          setClients(cRes.value.data);
        }
        if (
          isMounted &&
          pRes.status === "fulfilled" &&
          pRes.value.success &&
          Array.isArray(pRes.value.data) &&
          pRes.value.data.length
        ) {
          setPlans(pRes.value.data);
        }
        if (
          isMounted &&
          wRes.status === "fulfilled" &&
          wRes.value.success &&
          Array.isArray(wRes.value.data)
        ) {
          setWithdrawals(wRes.value.data);
        }
        if (
          isMounted &&
          rRes.status === "fulfilled" &&
          rRes.value.success &&
          Array.isArray(rRes.value.data)
        ) {
          setReferrals(rRes.value.data);
        }
        if (
          isMounted &&
          tRes.status === "fulfilled" &&
          tRes.value.success &&
          Array.isArray(tRes.value.data) &&
          tRes.value.data.length
        ) {
          setReferralTiers(tRes.value.data);
        }
        if (
          isMounted &&
          aRes.status === "fulfilled" &&
          aRes.value.success &&
          Array.isArray(aRes.value.data)
        ) {
          setAuditLogs(aRes.value.data);
        }
      } catch {
        // Fallback gracefully to empty state
      }
    }
    loadServerData();
    return () => {
      isMounted = false;
    };
  }, []);

  const addAuditLog = (
    action: string,
    category: AuditLogItem["category"],
    details: string,
  ) => {
    const newLog: AuditLogItem = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
      adminName: "Chief Wealth Admin (Altaf)",
      action,
      category,
      details,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // 1. VERIFY CLIENT PHONE
  const verifyClientPhone = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return { success: false, message: "Client not found." };

    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? {
              ...c,
              isPhoneVerified: true,
              kycStatus: "verified",
            }
          : c,
      ),
    );

    addAuditLog(
      "Phone OTP Verified",
      "client_verification",
      `Manual phone verification authorized for ${client.firstName} ${client.lastName} (${client.phone}). User unlocked for plan assignment.`,
    );

    api
      .updateClient(clientId, { isPhoneVerified: true, kycStatus: "verified" })
      .catch(() => {});

    return {
      success: true,
      message: `Phone number for ${client.firstName} ${client.lastName} successfully verified! You may now assign an investment plan.`,
    };
  };

  // 2. ASSIGN INVESTMENT PLAN
  const assignPlanToClient = (
    clientId: string,
    planId: string,
    amount: number,
    startDate?: string,
    paymentReference?: string,
  ) => {
    const client = clients.find((c) => c.id === clientId);
    const plan =
      plans.find((p) => p.id === planId) ||
      plans.find((p) => (p as any).planId === planId) ||
      plans[0];

    if (!client) return { success: false, message: "Client not found." };
    if (!client.isPhoneVerified) {
      return {
        success: false,
        message:
          "Client phone number must be verified before assigning an investment plan.",
      };
    }

    const today = startDate || new Date().toISOString().split("T")[0];

    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? {
              ...c,
              assignedPlanId: plan.id,
              assignedPlanName: plan.planName,
              assignedPlanAmount: amount,
              assignedPlanStartDate: today,
              assignedPlanStatus: "active",
              totalAum: amount,
              currentMonthIndex: 1,
              currentMonthWithdrawn: false,
              paymentVerified: true,
              paymentReference: paymentReference || "Bank Escrow Verified",
            }
          : c,
      ),
    );

    // If client was referred by someone, update referral record to active
    setReferrals((prev) =>
      prev.map((r) => {
        if (r.refereeId === clientId) {
          const comm = (amount * r.commissionRatePct) / 100;
          return {
            ...r,
            status: "active",
            capitalAmount: amount,
            planName: plan.planName,
            monthlyCommissionAmount: comm,
          };
        }
        return r;
      }),
    );

    addAuditLog(
      "Investment Plan Activated",
      "plan_assignment",
      `Payment verified & activated "${plan.planName}" with ${amount.toLocaleString("en-US")} USDT capital for ${client.firstName} ${client.lastName}. Ref: ${paymentReference || "Direct USDT Verification"}.`,
    );

    api
      .assignPlan(
        clientId,
        plan.id,
        amount,
        "Chief Wealth Admin (Altaf)",
        today,
        paymentReference,
        plan.planName,
      )
      .catch(() => {});

    return {
      success: true,
      message: `Payment verified! "${plan.planName}" is now ACTIVE for ${client.firstName} ${client.lastName} with ${amount.toLocaleString("en-US")} USDT capital.`,
    };
  };

  // CREATE PLAN
  const createPlan = async (data: Partial<InvestmentPlanConfig>) => {
    const planId = `plan-${Date.now().toString().slice(-4)}`;
    const monthlyReturnPct = data.monthlyReturnPct ?? 15.0;
    const dailyReturnPct = data.dailyReturnPct ?? 0.5;
    const durationMonths = data.durationMonths ?? 14;
    const grossTotalReturnPct =
      data.grossTotalReturnPct ?? monthlyReturnPct * durationMonths;

    const newPlan: InvestmentPlanConfig = {
      id: planId,
      planName: data.planName || "New Structured Wealth Plan",
      description: data.description || "",
      monthlyReturnPct,
      dailyReturnPct,
      durationMonths,
      capitalReturnMonthlyPct: parseFloat((monthlyReturnPct / 2).toFixed(2)),
      profitMonthlyPct: parseFloat((monthlyReturnPct / 2).toFixed(2)),
      grossTotalReturnPct,
      netProfitPct: data.netProfitPct ?? grossTotalReturnPct - 100,
      minInvestment:
        data.minInvestment !== undefined ? data.minInvestment : 100,
      maxInvestment: data.maxInvestment ?? 10000000,
      isDefault: !!data.isDefault,
      status: data.status || "active",
    };

    if (newPlan.isDefault) {
      setPlans((prev) => prev.map((p) => ({ ...p, isDefault: false })));
    }

    setPlans((prev) => [newPlan, ...prev]);

    addAuditLog(
      "Plan Created",
      "plan_config",
      `Created new plan: ${newPlan.planName} (${newPlan.monthlyReturnPct}%/mo, ${dailyReturnPct}%/day for ${newPlan.durationMonths}M)`,
    );

    api.createPlan({ ...newPlan, planId }).catch(() => {});

    return {
      success: true,
      message: `Plan "${newPlan.planName}" created successfully!`,
      plan: newPlan,
    };
  };

  // UPDATE PLAN
  const updatePlan = async (
    id: string,
    updates: Partial<InvestmentPlanConfig>,
  ) => {
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, ...updates };
          if (
            updates.monthlyReturnPct !== undefined ||
            updates.durationMonths !== undefined
          ) {
            const m = updates.monthlyReturnPct ?? p.monthlyReturnPct;
            const d = updates.durationMonths ?? p.durationMonths;
            if (!updates.grossTotalReturnPct) {
              updated.grossTotalReturnPct = m * d;
            }
          }
          return updated;
        }
        if (updates.isDefault) {
          return { ...p, isDefault: false };
        }
        return p;
      }),
    );

    addAuditLog(
      "Plan Modified",
      "plan_config",
      `Modified plan ${id} configuration`,
    );

    api.updatePlan(id, updates).catch(() => {});

    return {
      success: true,
      message: "Plan updated successfully!",
    };
  };

  // DELETE PLAN
  const deletePlan = async (id: string) => {
    const target = plans.find((p) => p.id === id);
    if (!target) return { success: false, message: "Plan not found." };

    if (plans.length <= 1) {
      return {
        success: false,
        message: "Cannot delete the only available wealth plan.",
      };
    }

    setPlans((prev) => prev.filter((p) => p.id !== id));

    addAuditLog(
      "Plan Removed",
      "plan_config",
      `Deleted plan ${target.planName} (${id})`,
    );

    api.deletePlan(id).catch(() => {});

    return {
      success: true,
      message: `Plan "${target.planName}" has been removed.`,
    };
  };

  // 3. REVOKE PLAN
  const revokeClientPlan = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return { success: false, message: "Client not found." };

    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? {
              ...c,
              assignedPlanId: null,
              assignedPlanName: undefined,
              assignedPlanAmount: undefined,
              assignedPlanStartDate: undefined,
              assignedPlanStatus: "pending_assignment",
              totalAum: 0,
            }
          : c,
      ),
    );

    // Also update any referral record where this client was referee to pending status
    setReferrals((prev) =>
      prev.map((r) =>
        r.refereeId === clientId
          ? {
              ...r,
              status: "pending",
              capitalAmount: 0,
              monthlyCommissionAmount: 0,
            }
          : r,
      ),
    );

    addAuditLog(
      "Plan Revoked",
      "plan_assignment",
      `Revoked active investment plan from ${client.firstName} ${client.lastName}.`,
    );

    api.revokePlan(clientId, "Chief Wealth Admin (Altaf)").catch((err) => {
      console.error("Failed to revoke plan on server:", err);
    });

    return {
      success: true,
      message: `Investment plan revoked for ${client.firstName} ${client.lastName}.`,
    };
  };

  // 4. APPROVE MONTHLY WITHDRAWAL
  const approveWithdrawal = (withdrawalId: string, customUtr?: string) => {
    const wd = withdrawals.find((w) => w.id === withdrawalId);
    if (!wd) return { success: false, message: "Withdrawal record not found." };

    const utr = customUtr?.trim() || `CMS-${Date.now().toString().slice(-8)}`;
    const today = new Date().toISOString().split("T")[0];

    setWithdrawals((prev) =>
      prev.map((w) =>
        w.id === withdrawalId
          ? {
              ...w,
              status: "disbursed",
              disbursedDate: today,
              utrReference: utr,
            }
          : w,
      ),
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
          : c,
      ),
    );

    addAuditLog(
      "Disbursement Approved & Transferred",
      "withdrawal_approval",
      `Approved monthly payout of ${wd.amount.toLocaleString("en-US")} USDT for ${wd.clientName} (${wd.bankAccount}). TX: ${utr}. Non-withdrawal fee waived.`,
    );

    api
      .updateWithdrawalStatus(
        withdrawalId,
        "disbursed",
        utr,
        "Disbursed via USDT transfer",
        "Chief Wealth Admin (Altaf)",
      )
      .catch(() => {});

    return {
      success: true,
      message: `Payout of ${wd.amount.toLocaleString("en-US")} USDT approved and disbursed to ${wd.bankAccount}! TX: ${utr}`,
    };
  };

  // 5. REJECT WITHDRAWAL
  const rejectWithdrawal = (withdrawalId: string, reason: string) => {
    const wd = withdrawals.find((w) => w.id === withdrawalId);
    if (!wd) return { success: false, message: "Withdrawal record not found." };

    setWithdrawals((prev) =>
      prev.map((w) =>
        w.id === withdrawalId
          ? {
              ...w,
              status: "rejected",
              notes: `Rejected: ${reason}`,
            }
          : w,
      ),
    );

    addAuditLog(
      "Disbursement Rejected",
      "withdrawal_approval",
      `Rejected withdrawal request #${wd.id} for ${wd.clientName}. Reason: ${reason}`,
    );

    return {
      success: true,
      message: `Withdrawal request #${wd.id} marked as rejected.`,
    };
  };

  // 6. DISBURSE REFERRAL COMMISSION
  const disburseReferralCommission = (referralId: string) => {
    const ref = referrals.find((r) => r.id === referralId);
    if (!ref) return { success: false, message: "Referral record not found." };

    const utr = `CMS-REF-${Date.now().toString().slice(-7)}`;

    setReferrals((prev) =>
      prev.map((r) =>
        r.id === referralId
          ? {
              ...r,
              totalEarnedAmount:
                r.totalEarnedAmount + r.monthlyCommissionAmount,
            }
          : r,
      ),
    );

    addAuditLog(
      "Referral Incentive Disbursed",
      "referral_management",
      `Disbursed monthly referral yield of ${ref.monthlyCommissionAmount.toLocaleString("en-US")} USDT (Level ${ref.level}) to ${ref.referrerName}. TX: ${utr}.`,
    );

    return {
      success: true,
      message: `Referral commission of ${ref.monthlyCommissionAmount.toLocaleString("en-US")} USDT successfully settled to ${ref.referrerName}!`,
    };
  };

  // 7. UPDATE REFERRAL LEVEL TIER
  const updateReferralTier = (
    level: number,
    updates: Partial<ReferralLevelTier>,
  ) => {
    setReferralTiers((prev) =>
      prev.map((t) => (t.level === level ? { ...t, ...updates } : t)),
    );

    addAuditLog(
      "Referral Tier Updated",
      "referral_management",
      `Updated parameters for Referral Level ${level} (${updates.commissionPct !== undefined ? `Commission: ${updates.commissionPct}%` : ""}).`,
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
    const today = new Date().toISOString().split("T")[0];
    const amount = data.allocatedAmount || 1000;
    const refCode = `INF-${data.firstName.toUpperCase()}${newId.slice(-3)}`;

    const newClient: ClientProfile = {
      id: newId,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      isPhoneVerified: true,
      kycStatus: "verified",
      assignedPlanId: data.autoAssign14MPlan ? "plan-14m-15pct" : null,
      assignedPlanName: data.autoAssign14MPlan
        ? "INFINIX 14-Month Wealth Accelerator"
        : undefined,
      assignedPlanAmount: data.autoAssign14MPlan ? amount : undefined,
      assignedPlanStartDate: data.autoAssign14MPlan ? today : undefined,
      assignedPlanStatus: data.autoAssign14MPlan
        ? "active"
        : "pending_assignment",
      currentMonthIndex: 1,
      currentMonthWithdrawn: false,
      bankAccount: data.bankAccount.trim() || "",
      totalAum: data.autoAssign14MPlan ? amount : 0,
      joinedDate: today,
      notes: "Manually enrolled by Chief Wealth Admin via Web Desk.",
      referralCode: refCode,
      referredByCode: data.referredByCode,
    };

    setClients((prev) => [newClient, ...prev]);

    // If referred by a client, create referral record
    if (data.referredByCode) {
      const referrer = clients.find(
        (c) => c.referralCode === data.referredByCode,
      );
      if (referrer) {
        const comm = data.autoAssign14MPlan ? (amount * 2.0) / 100 : 0;
        const newRef: ReferralRecord = {
          id: `ref-${Date.now().toString().slice(-4)}`,
          referrerId: referrer.id,
          referrerName: `${referrer.firstName} ${referrer.lastName}`,
          referrerCode: referrer.referralCode || "INF-ADMIN",
          refereeId: newId,
          refereeName: `${newClient.firstName} ${newClient.lastName}`,
          refereeEmail: newClient.email,
          refereePhone: newClient.phone,
          level: 1,
          planName: data.autoAssign14MPlan
            ? "INFINIX 14-Month Wealth Accelerator"
            : "Pending Plan Allocation",
          capitalAmount: data.autoAssign14MPlan ? amount : 0,
          commissionRatePct: 2.0,
          monthlyCommissionAmount: comm,
          totalEarnedAmount: comm,
          status: data.autoAssign14MPlan ? "active" : "pending_activation",
          dateJoined: today,
        };
        setReferrals((prev) => [newRef, ...prev]);
      }
    }

    addAuditLog(
      "New Client Onboarded",
      "client_verification",
      `Enrolled new investor ${newClient.firstName} ${newClient.lastName} (${newClient.email}) with ${
        data.autoAssign14MPlan
          ? `INFINIX 14-Month 15% Return Accelerator (${amount.toLocaleString("en-US")} USDT)`
          : "Pending Plan Assignment"
      }.`,
    );

    api
      .createClient({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim(),
        phone: data.phone.trim(),
        bankAccount: data.bankAccount.trim(),
        isPhoneVerified: true,
        kycStatus: "verified",
        assignedPlanId: data.autoAssign14MPlan ? "plan-14m-15pct" : null,
        assignedPlanAmount: data.autoAssign14MPlan ? amount : 0,
        referredByCode: data.referredByCode,
      })
      .catch(() => {});

    return {
      success: true,
      message: `Investor ${newClient.firstName} ${newClient.lastName} successfully enrolled!`,
      clientId: newId,
    };
  };

  // COMPUTED STATS
  const stats = useMemo(() => {
    const totalAum = clients.reduce(
      (acc, c) => acc + (c.assignedPlanAmount || 0),
      0,
    );
    const activeInvestorsCount = clients.filter(
      (c) => c.assignedPlanStatus === "active",
    ).length;
    const pendingPhoneCount = clients.filter((c) => !c.isPhoneVerified).length;

    const pendingWithdrawals = withdrawals.filter(
      (w) => w.status === "pending_approval",
    );
    const pendingWithdrawalCount = pendingWithdrawals.length;
    const pendingWithdrawalTotal = pendingWithdrawals.reduce(
      (acc, w) => acc + w.amount,
      0,
    );

    // Monthly disbursement liability = 15% of all active assigned capital
    const monthlyLiabilityTotal = clients
      .filter((c) => c.assignedPlanStatus === "active")
      .reduce((acc, c) => acc + ((c.assignedPlanAmount || 0) * 15) / 100, 0);

    const totalReferralsCount = referrals.length;
    const activeReferralsCount = referrals.filter(
      (r) => r.status === "active",
    ).length;
    const monthlyReferralCommissionTotal = referrals
      .filter((r) => r.status === "active")
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
        createPlan,
        updatePlan,
        deletePlan,
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
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
