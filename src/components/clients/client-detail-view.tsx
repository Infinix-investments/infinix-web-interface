"use client";

import { useAdmin } from "@/context/admin-context";
import { ClientProfile } from "@/types/admin";
import { formatUSDT } from "@/utils/currency";
import {
  computeClientReferralStats,
  REFERRAL_LEVEL_RULES,
} from "@/utils/referral";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Award,
  Building,
  Calendar,
  Check,
  CheckCircle,
  Clock,
  Copy,
  CreditCard,
  Edit2,
  FileText,
  Mail,
  Phone,
  PlusCircle,
  Save,
  Share2,
  ShieldCheck,
  Trash2,
  TrendingUp,
  User,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

interface ClientDetailViewProps {
  clientId: string;
  onBack: () => void;
  onOpenAssignModal?: (clientId: string) => void;
}

const isPhoneAdded = (phone?: string) =>
  Boolean(
    phone &&
    phone.trim().length > 0 &&
    phone.trim().toLowerCase() !== "n/a" &&
    phone.trim() !== "—",
  );

function calculateCompletedDays(startDateStr?: string | Date): number {
  if (!startDateStr) return 0;
  let startYear: number, startMonth: number, startDay: number;
  if (typeof startDateStr === 'string') {
    const cleanStr = startDateStr.split('T')[0];
    const parts = cleanStr.split(/[-/]/);
    if (parts.length >= 3) {
      startYear = parseInt(parts[0], 10);
      startMonth = parseInt(parts[1], 10) - 1;
      startDay = parseInt(parts[2], 10);
    } else {
      const d = new Date(startDateStr);
      if (isNaN(d.getTime())) return 0;
      startYear = d.getFullYear();
      startMonth = d.getMonth();
      startDay = d.getDate();
    }
  } else {
    const d = new Date(startDateStr);
    if (isNaN(d.getTime())) return 0;
    startYear = d.getFullYear();
    startMonth = d.getMonth();
    startDay = d.getDate();
  }

  const now = new Date();
  const startMidnight = new Date(startYear, startMonth, startDay, 0, 0, 0, 0);
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const diffMs = todayMidnight.getTime() - startMidnight.getTime();
  if (diffMs <= 0) return 0;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function ClientDetailView({
  clientId,
  onBack,
  onOpenAssignModal,
}: ClientDetailViewProps) {
  const {
    clients,
    plans,
    referrals,
    withdrawals,
    auditLogs,
    verifyClientPhone,
    updateClientProfile,
    revokeClientPlan,
    revokeClientPlanInstance,
    approveWithdrawal,
    rejectWithdrawal,
  } = useAdmin();

  const client = clients.find(
    (c) => c.id === clientId || c.clientId === clientId,
  );

  const [activeTab, setActiveTab] = useState<
    "plans" | "referrals" | "withdrawals" | "profile" | "audit"
  >("plans");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [toast, setToast] = useState("");
  const [customUtr, setCustomUtr] = useState("");
  const [approvingWdId, setApprovingWdId] = useState<string | null>(null);

  // Edit Profile / Notes State
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Edit Phone / Bank State
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editPhone, setEditPhone] = useState("");
  const [editBank, setEditBank] = useState("");
  const [editTier, setEditTier] = useState("");
  const [isSavingInfo, setIsSavingInfo] = useState(false);

  // Reject modal state
  const [rejectingWdId, setRejectingWdId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4500);
  };

  // Compute live referral stats for this client
  const referralStats = useMemo(() => {
    if (!client) {
      return {
        referralCode: "INF-0000",
        totalReferred: 0,
        activePlanReferrals: 0,
        level: 0,
        levelName: "Level 0",
        roiPct: 0,
        neededForNext: 2,
        plansRemainingForNext: 2,
        monthlyCommissionYield: 0,
        refereeList: [],
        totalEarnedCommissions: 0,
      };
    }
    return computeClientReferralStats(client, clients, referrals);
  }, [client, clients, referrals]);

  // Direct referee client profiles
  const referredClients = useMemo(() => {
    if (!client) return [];
    return clients.filter(
      (c) =>
        c.id !== client.id &&
        ((client.referralCode && c.referredByCode === client.referralCode) ||
          referrals.some((r) => r.referrerId === client.id && r.refereeId === c.id)),
    );
  }, [clients, client, referrals]);

  // Get all withdrawals for this client
  const clientWithdrawals = useMemo(() => {
    if (!client) return [];
    return withdrawals.filter(
      (w) =>
        w.clientId === client.id ||
        (client.clientId && w.clientId === client.clientId) ||
        w.clientName.toLowerCase() ===
          `${client.firstName} ${client.lastName}`.toLowerCase(),
    );
  }, [client, withdrawals]);

  const pendingWithdrawals = clientWithdrawals.filter(
    (w) => w.status === "pending_approval",
  );
  const settledWithdrawals = clientWithdrawals.filter(
    (w) => w.status === "disbursed",
  );

  const totalDisbursedAmount = settledWithdrawals.reduce(
    (sum, w) => sum + (w.grossAmount || w.amount || 0),
    0,
  );
  const pendingClaimsTotal = pendingWithdrawals.reduce(
    (sum, w) => sum + (w.grossAmount || w.amount || 0),
    0,
  );

  const currentLevelRule =
    REFERRAL_LEVEL_RULES.find((r) => r.level === referralStats.level) ||
    REFERRAL_LEVEL_RULES[0];

  const formatINR = (val?: number) => {
    return formatUSDT(val);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralStats.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    const link = `https://infinix.vip/register?ref=${referralStats.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleApprovePayout = useCallback(
    (wdId: string) => {
      const utr =
        customUtr.trim() || `CMS-RTGS-${Date.now().toString().slice(-8)}`;
      const res = approveWithdrawal(wdId, utr);
      setApprovingWdId(null);
      setCustomUtr("");
      if (res.success) {
        showToast(res.message);
      }
    },
    [customUtr, approveWithdrawal],
  );

  const handleRejectPayout = (wdId: string) => {
    const res = rejectWithdrawal(
      wdId,
      rejectReason || "Administrative verification required",
    );
    setRejectingWdId(null);
    setRejectReason("");
    if (res.success) {
      showToast(res.message);
    }
  };

  const handleRevokePlan = () => {
    if (!client) return;
    if (
      confirm(
        `Are you sure you want to revoke all active investment plans for ${client.firstName} ${client.lastName}?`,
      )
    ) {
      const res = revokeClientPlan(client.id);
      if (res.success) {
        showToast(res.message);
      }
    }
  };

  const handleRevokeSingleContract = (contractId: string, planName: string, capital: number) => {
    if (!client) return;
    if (
      confirm(
        `Are you sure you want to revoke contract "${planName}" (${formatINR(capital)})? All other active plans for ${client.firstName} ${client.lastName} will continue unaffected.`,
      )
    ) {
      const res = revokeClientPlanInstance(client.id, contractId);
      if (res.success) {
        showToast(res.message);
      }
    }
  };

  const handleVerifyPhone = () => {
    if (!client) return;
    const res = verifyClientPhone(client.id);
    if (res.success) {
      showToast(res.message);
    } else {
      showToast(res.message || "Phone verification failed.");
    }
  };

  const handleSaveNotes = async () => {
    if (!client) return;
    setIsSavingNotes(true);
    const res = await updateClientProfile(client.id, { notes: editedNotes });
    setIsSavingNotes(false);
    if (res.success) {
      setIsEditingNotes(false);
      showToast("Client notes saved successfully.");
    } else {
      showToast(res.message);
    }
  };

  const handleSaveInfo = async () => {
    if (!client) return;
    setIsSavingInfo(true);
    const updates: Partial<ClientProfile> = {};
    if (editPhone.trim()) updates.phone = editPhone.trim();
    if (editBank.trim()) updates.bankAccount = editBank.trim();
    if (editTier) updates.tier = editTier as any;

    const res = await updateClientProfile(client.id, updates);
    setIsSavingInfo(false);
    if (res.success) {
      setIsEditingInfo(false);
      showToast("Investor credentials updated successfully.");
    } else {
      showToast(res.message);
    }
  };

  // Display active contracts & timeline metrics
  const displayPlans = useMemo(() => {
    if (!client) return [];
    if (client.activePlans && client.activePlans.length > 0) {
      const activeContracts = client.activePlans
        .filter((p: any) => (p.status || "active") === "active")
        .map((p: any, idx: number) => {
          const duration = p.durationMonths || 14;
          const maxDays = duration * 30;
          const days = calculateCompletedDays(p.startDate);
          const effDays = Math.min(maxDays, days);
          const dailyRate = p.dailyReturnPct ?? 0.5;
          const monthlyRate = p.monthlyReturnPct ?? 15.0;
          const cap = Number(p.capitalAmount || 0);
          const dailyProfit = cap * (dailyRate / 100) || 0;
          const accruedProfit = effDays * dailyProfit || 0;
          const monthlyPayout = (cap * monthlyRate) / 100 || 0;

          return {
            id: p.planInstanceId || `contract-${idx}`,
            planName: p.planName || "14-Month Wealth Accelerator",
            planId: p.planId || "plan-14m-15pct",
            capitalAmount: cap,
            startDate: p.startDate,
            durationMonths: duration,
            dailyReturnPct: dailyRate,
            monthlyReturnPct: monthlyRate,
            grossTotalReturnPct: p.grossTotalReturnPct || monthlyRate * duration,
            dailyProfit,
            accruedProfit,
            monthlyPayout,
            daysElapsed: days,
            effectiveDays: effDays,
            progressPct: Math.min(100, Math.round((effDays / maxDays) * 100)),
            status: p.status || "active",
            paymentReference: p.paymentReference || "Direct USDT Escrow",
            assignedAt: p.assignedAt,
          };
        });

      if (activeContracts.length > 0) {
        return activeContracts;
      }
    }

    const fallbackCap = Number(client.assignedPlanAmount || client.totalAum || 0);
    if (fallbackCap > 0) {
      const assignedPlan = plans.find(
        (p) =>
          p.id === client.assignedPlanId ||
          (p as any).planId === client.assignedPlanId,
      );
      const cap = fallbackCap;
      const duration = assignedPlan?.durationMonths || 14;
      const maxDays = duration * 30;
      const days = calculateCompletedDays(client.assignedPlanStartDate);
      const effDays = Math.min(maxDays, days);
      const dailyRate = assignedPlan?.dailyReturnPct || 0.5;
      const monthlyRate = assignedPlan?.monthlyReturnPct || 15.0;
      const dailyProfit = cap * (dailyRate / 100) || 0;
      const accruedProfit = effDays * dailyProfit || 0;
      const monthlyPayout = (cap * monthlyRate) / 100 || 0;

      return [
        {
          id: "primary-contract",
          planName:
            client.assignedPlanName ||
            assignedPlan?.planName ||
            "14-Month Wealth Accelerator",
          planId: client.assignedPlanId || "plan-14m-15pct",
          capitalAmount: cap,
          startDate: client.assignedPlanStartDate,
          durationMonths: duration,
          dailyReturnPct: dailyRate,
          monthlyReturnPct: monthlyRate,
          grossTotalReturnPct:
            assignedPlan?.grossTotalReturnPct || monthlyRate * duration,
          dailyProfit,
          accruedProfit,
          monthlyPayout,
          daysElapsed: days,
          effectiveDays: effDays,
          progressPct: Math.min(100, Math.round((effDays / maxDays) * 100)),
          status: "active",
          paymentReference: client.paymentReference || "Escrow Verified",
          assignedAt: client.assignedPlanStartDate,
        },
      ];
    }

    return [];
  }, [client, plans]);

  const totalCapital = displayPlans.length > 0
    ? displayPlans.reduce((sum, p) => sum + (Number(p.capitalAmount) || 0), 0)
    : (Number(client?.assignedPlanAmount) || Number(client?.totalAum) || 0);

  const totalAccruedProfit = displayPlans.reduce(
    (sum, p) => sum + (Number(p.accruedProfit) || 0),
    0,
  );
  const totalMonthlyPayout = displayPlans.reduce(
    (sum, p) => sum + (Number(p.monthlyPayout) || 0),
    0,
  );

  // Referral total earned
  const totalReferralBonus =
    referralStats.totalEarnedCommissions ||
    referralStats.monthlyCommissionYield * 5;

  // Available to withdraw: Accrued Profit + Referral Bonus - Settled Disbursed
  const availableToWithdraw = Math.max(
    0,
    Math.round(
      (totalAccruedProfit + totalReferralBonus - totalDisbursedAmount) * 100,
    ) / 100,
  );

  // Client audit log history
  const clientAuditLogs = useMemo(() => {
    if (!client) return [];
    return auditLogs.filter(
      (log) =>
        log.details.toLowerCase().includes(client.id.toLowerCase()) ||
        (client.clientId &&
          log.details.toLowerCase().includes(client.clientId.toLowerCase())) ||
        log.details.toLowerCase().includes(client.email.toLowerCase()) ||
        log.details
          .toLowerCase()
          .includes(`${client.firstName} ${client.lastName}`.toLowerCase()),
    );
  }, [client, auditLogs]);

  if (!client) {
    return (
      <div className="p-8 rounded-2xl bg-[#0D131F] border border-[#1E293B] text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">
          Client Profile Not Found
        </h2>
        <p className="text-sm text-slate-400">
          The requested client record (#{clientId}) could not be located in the
          directory.
        </p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#141C2E] hover:bg-[#1E293B] border border-[#1E293B] text-white text-xs font-bold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Client Management</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Toast */}
      {toast && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-semibold text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{toast}</span>
          </div>
          <button
            onClick={() => setToast("")}
            className="text-emerald-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Breadcrumb & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0D131F] border border-[#1E293B]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#080C14] hover:bg-[#141C2E] border border-[#1E293B] text-slate-300 hover:text-white text-xs font-bold transition-all group"
          >
            <ArrowLeft className="w-4 h-4 text-[#D4AF37] group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Client Management</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span>/</span>
            <span className="text-white font-bold">
              {client.firstName} {client.lastName}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#141C2E] text-slate-300 font-mono text-[11px] border border-[#1E293B]">
              #{client.id}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {client.assignedPlanStatus === "active" ? (
            <button
              onClick={handleRevokePlan}
              className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-semibold text-xs transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Revoke Plan</span>
            </button>
          ) : null}

          <button
            onClick={() => onOpenAssignModal && onOpenAssignModal(client.id)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-black font-extrabold text-xs hover:brightness-110 active:scale-95 transition-all shadow-md shadow-[#D4AF37]/20 flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>
              {client.assignedPlanStatus === "active"
                ? "Allocate Additional Plan"
                : "⚡ Start Investment Plan"}
            </span>
          </button>
        </div>
      </div>

      {/* Hero Client Profile Header Card */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-b from-[#0D131F] to-[#080C14] border border-[#1E293B] shadow-2xl relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Avatar & Core Credentials */}
          <div className="flex items-start gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1E293B] to-[#0D131F] border-2 border-[#D4AF37] flex items-center justify-center text-white font-extrabold text-xl shadow-xl shadow-[#D4AF37]/10">
                {(client.firstName?.[0] || 'I').toUpperCase()}
                {(client.lastName?.[0] || '').toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#080C14] flex items-center justify-center text-black text-[10px] font-bold">
                ✓
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-black text-white tracking-tight">
                  {client.firstName} {client.lastName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-md bg-[#141C2E] border border-[#1E293B] text-slate-300 font-mono text-xs font-bold">
                  #{client.id}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] font-bold text-[11px] uppercase tracking-wider">
                  {client.tier || "Standard Investor"}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-300 flex-wrap pt-1">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <a
                    href={`mailto:${client.email}`}
                    className="hover:text-[#D4AF37] transition-colors"
                  >
                    {client.email}
                  </a>
                </div>

                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  {isPhoneAdded(client.phone) ? (
                    <span className="font-mono text-white">{client.phone}</span>
                  ) : (
                    <span className="text-amber-400 font-medium">
                      No Phone Added
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Joined {client.joinedDate || "Recently"}</span>
                </div>
              </div>

              {/* Status Badges Row */}
              <div className="flex items-center gap-2 pt-2 flex-wrap">
                {isPhoneAdded(client.phone) ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold text-[11px]">
                    <CheckCircle className="w-3 h-3" />
                    <span>Phone Added</span>
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      const newP = prompt(
                        "Enter phone number to verify for this investor:",
                      );
                      if (newP) {
                        updateClientProfile(client.id, {
                          phone: newP.trim(),
                          isPhoneVerified: true,
                        }).then((r) => showToast(r.message));
                      }
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-semibold text-[11px] hover:bg-amber-500/25 transition-all"
                  >
                    <AlertCircle className="w-3 h-3" />
                    <span>Add & Verify Phone</span>
                  </button>
                )}

                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 font-semibold text-[11px]">
                  <ShieldCheck className="w-3 h-3" />
                  <span>
                    KYC{" "}
                    {client.kycStatus === "verified" ? "Verified" : "Pending"}
                  </span>
                </span>

                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${currentLevelRule.badgeBg} ${currentLevelRule.badgeText} ${currentLevelRule.badgeBorder}`}
                >
                  <Award className="w-3 h-3" />
                  <span>{currentLevelRule.badgeLabel}</span>
                </span>

                {pendingWithdrawals.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold text-[11px] animate-pulse">
                    <Clock className="w-3 h-3" />
                    <span>
                      {pendingWithdrawals.length} Withdrawal Claim Awaiting
                      Settlement
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Info Block (Wallet / Bank) */}
          <div className="p-4 rounded-2xl bg-[#080C14]/90 border border-[#1E293B] flex flex-col gap-2 min-w-[240px]">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Settlement Account</span>
              <Building className="w-3.5 h-3.5 text-[#D4AF37]" />
            </div>
            <div className="text-xs font-mono text-white break-all">
              {client.bankAccount || "USDT TRC20 Wallet on File"}
            </div>
            <div className="text-[10px] text-emerald-400 font-medium">
              Custody Fee Waived • Fastify Direct Settlement
            </div>
          </div>
        </div>
      </div>

      {/* 6 Executive Financial Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Active Capital */}
        <div className="p-4 rounded-2xl bg-[#0D131F] border border-[#1E293B] space-y-1 shadow-lg">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Active AUM
          </div>
          <div className="text-lg font-black text-white">
            {formatINR(totalCapital)}
          </div>
          <div className="text-[10px] text-slate-400">
            {displayPlans.length} Active Contract
            {displayPlans.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Card 2: Accrued Yield */}
        <div className="p-4 rounded-2xl bg-[#0D131F] border border-[#1E293B] space-y-1 shadow-lg">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Accrued Yield
          </div>
          <div className="text-lg font-black text-emerald-400">
            +{formatINR(totalAccruedProfit)}
          </div>
          <div className="text-[10px] text-slate-400">0.5% Daily increment</div>
        </div>

        {/* Card 3: Monthly Payout */}
        <div className="p-4 rounded-2xl bg-[#0D131F] border border-[#1E293B] space-y-1 shadow-lg">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Monthly Payout
          </div>
          <div className="text-lg font-black text-[#D4AF37]">
            {formatINR(totalMonthlyPayout)}/mo
          </div>
          <div className="text-[10px] text-slate-400">
            15.0% contractual yield
          </div>
        </div>

        {/* Card 4: Settled Disbursed */}
        <div className="p-4 rounded-2xl bg-[#0D131F] border border-[#1E293B] space-y-1 shadow-lg">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Settled
          </div>
          <div className="text-lg font-black text-slate-300">
            {formatINR(totalDisbursedAmount)}
          </div>
          <div className="text-[10px] text-slate-400">
            {settledWithdrawals.length} settled payouts
          </div>
        </div>

        {/* Card 5: Net Available Balance */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0D131F] to-[#141C2E] border border-[#D4AF37]/30 space-y-1 shadow-lg">
          <div className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider">
            Ready to Withdraw
          </div>
          <div className="text-lg font-black text-white">
            {formatINR(availableToWithdraw)}
          </div>
          <div className="text-[10px] text-emerald-400 font-semibold">
            Net available yield
          </div>
        </div>

        {/* Card 6: Referral Bonus */}
        <div className="p-4 rounded-2xl bg-[#0D131F] border border-[#1E293B] space-y-1 shadow-lg">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Referral Bonus
          </div>
          <div className="text-lg font-black text-purple-400">
            +{formatINR(totalReferralBonus)}
          </div>
          <div className="text-[10px] text-slate-400">
            {referralStats.totalReferred} Direct Referees
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-[#1E293B] pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab("plans")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
            activeTab === "plans"
              ? "bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/20 font-extrabold"
              : "bg-[#0D131F] text-slate-400 hover:text-white border border-[#1E293B]"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Active Plans & Contracts ({displayPlans.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("referrals")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
            activeTab === "referrals"
              ? "bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/20 font-extrabold"
              : "bg-[#0D131F] text-slate-400 hover:text-white border border-[#1E293B]"
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>Referral Downline ({referralStats.totalReferred})</span>
        </button>

        <button
          onClick={() => setActiveTab("withdrawals")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
            activeTab === "withdrawals"
              ? "bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/20 font-extrabold"
              : "bg-[#0D131F] text-slate-400 hover:text-white border border-[#1E293B]"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Withdrawals & Payouts ({clientWithdrawals.length})</span>
          {pendingWithdrawals.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
            activeTab === "profile"
              ? "bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/20 font-extrabold"
              : "bg-[#0D131F] text-slate-400 hover:text-white border border-[#1E293B]"
          }`}
        >
          <User className="w-4 h-4" />
          <span>Credentials & Settings</span>
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
            activeTab === "audit"
              ? "bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/20 font-extrabold"
              : "bg-[#0D131F] text-slate-400 hover:text-white border border-[#1E293B]"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Compliance Audit ({clientAuditLogs.length})</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: ACTIVE PLANS & CONTRACTS
          ========================================================================= */}
      {activeTab === "plans" && (
        <div className="space-y-6">
          {displayPlans.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#0D131F] border border-[#1E293B] text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  No Active Investment Plan Assigned
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  This investor is currently registered and awaiting plan
                  assignment following capital verification.
                </p>
              </div>
              <button
                onClick={() =>
                  onOpenAssignModal && onOpenAssignModal(client.id)
                }
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-black font-extrabold text-xs hover:brightness-110 shadow-lg shadow-[#D4AF37]/20"
              >
                <PlusCircle className="w-4 h-4" />
                <span>⚡ Allocate 14-Month Wealth Accelerator</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {displayPlans.map((contract) => (
                <div
                  key={contract.id}
                  className="p-6 rounded-2xl bg-[#0D131F] border border-[#1E293B] space-y-6 hover:border-[#D4AF37]/40 transition-colors shadow-xl"
                >
                  {/* Contract Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E293B]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[10px] uppercase">
                          Contract Active
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          ID: {contract.id}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white mt-1">
                        {contract.planName}
                      </h3>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Inception:{" "}
                        <strong className="text-slate-200">
                          {contract.startDate || "Recent"}
                        </strong>{" "}
                        • Ref: {contract.paymentReference}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap justify-end">
                      <div className="text-right">
                        <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">
                          Invested Capital
                        </div>
                        <div className="text-2xl font-black text-white">
                          {formatINR(contract.capitalAmount)}
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          handleRevokeSingleContract(
                            contract.id,
                            contract.planName,
                            contract.capitalAmount,
                          )
                        }
                        className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm"
                        title="Revoke only this plan contract without affecting other plans"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Revoke Plan</span>
                      </button>
                    </div>
                  </div>

                  {/* Contract Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-3.5 rounded-xl bg-[#080C14] border border-[#1E293B]">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">
                        Monthly Distribution
                      </div>
                      <div className="text-base font-black text-emerald-400">
                        {formatINR(contract.monthlyPayout)} / mo
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {contract.monthlyReturnPct}% stated monthly
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#080C14] border border-[#1E293B]">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">
                        Daily Increment
                      </div>
                      <div className="text-base font-black text-[#D4AF37]">
                        +{formatINR(contract.dailyProfit)} / day
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {contract.dailyReturnPct}% daily capital growth
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#080C14] border border-[#1E293B]">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">
                        Accrued Till Date
                      </div>
                      <div className="text-base font-black text-white">
                        +{formatINR(contract.accruedProfit)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Day {contract.effectiveDays} completed
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#080C14] border border-[#1E293B]">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">
                        Gross Total Return
                      </div>
                      <div className="text-base font-black text-purple-400">
                        {contract.grossTotalReturnPct}%
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {contract.durationMonths} Contractual Periods
                      </div>
                    </div>
                  </div>

                  {/* Contract Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-400 font-semibold">
                      <span>
                        Timeline: Day {contract.effectiveDays} of{" "}
                        {contract.durationMonths * 30} days
                      </span>
                      <span className="text-[#D4AF37] font-bold">
                        {contract.progressPct}% Completed
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#080C14] border border-[#1E293B] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#D4AF37] to-[#10B981] rounded-full transition-all duration-500"
                        style={{ width: `${contract.progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: REFERRAL DOWNLINE & AFFILIATE PERFORMANCE
          ========================================================================= */}
      {activeTab === "referrals" && (
        <div className="space-y-6">
          {/* Referral Code & Tools Hero */}
          <div className="p-6 rounded-2xl bg-[#0D131F] border border-[#1E293B] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Direct Referral Code & Tier Level
              </div>
              <div className="flex items-center gap-3">
                <span className="px-4 py-2 rounded-xl bg-[#080C14] border-2 border-[#D4AF37] text-[#D4AF37] font-mono text-xl font-black tracking-wider">
                  {referralStats.referralCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="px-3.5 py-2.5 rounded-xl bg-[#141C2E] hover:bg-[#1E293B] border border-[#1E293B] text-white text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  {copiedCode ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span>{copiedCode ? "Copied" : "Copy Code"}</span>
                </button>
                <button
                  onClick={handleCopyLink}
                  className="px-3.5 py-2.5 rounded-xl bg-[#141C2E] hover:bg-[#1E293B] border border-[#1E293B] text-white text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  {copiedLink ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                  <span>
                    {copiedLink ? "Copied Link" : "Copy Registration Link"}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div>
                <div className="text-xs text-slate-400 uppercase font-bold">
                  Commission Split
                </div>
                <div className="text-xl font-black text-emerald-400">
                  5.0% Direct Cash
                </div>
                <div className="text-[10px] text-slate-400">
                  On every referred investment
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-400 uppercase font-bold">
                  Monthly Yield Share
                </div>
                <div className="text-xl font-black text-[#D4AF37]">
                  +{formatINR(referralStats.monthlyCommissionYield)} / mo
                </div>
                <div className="text-[10px] text-slate-400">
                  10% of downline monthly yield
                </div>
              </div>
            </div>
          </div>

          {/* Referred Clients Directory Table */}
          <div className="rounded-2xl bg-[#0D131F] border border-[#1E293B] overflow-hidden shadow-xl">
            <div className="p-4 border-b border-[#1E293B] flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-sm">
                  Direct Downline Partners
                </h4>
                <p className="text-xs text-slate-400">
                  All investors who enrolled using referral code{" "}
                  {referralStats.referralCode}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-[#141C2E] text-slate-300 font-bold text-xs border border-[#1E293B]">
                {referredClients.length} Members
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#1E293B] bg-[#080C14] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Referee Investor</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Assigned Plan</th>
                    <th className="py-3 px-4">Invested Capital</th>
                    <th className="py-3 px-4">5% Direct Cash Bonus</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]">
                  {referredClients.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 text-center text-slate-500"
                      >
                        No downline investors registered under code{" "}
                        {referralStats.referralCode} yet.
                      </td>
                    </tr>
                  ) : (
                    referredClients.map((ref: ClientProfile) => {
                      const isActive =
                        ref.assignedPlanStatus === "active" &&
                        Number(ref.assignedPlanAmount || 0) > 0;
                      const cap = Number(ref.assignedPlanAmount || 0);
                      const directBonus = Math.round(cap * 0.05 * 100) / 100;

                      return (
                        <tr
                          key={ref.id}
                          className="hover:bg-[#141C2E]/40 transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white">
                              {ref.firstName} {ref.lastName}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              #{ref.id}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-300">
                            <div>{ref.email}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {ref.phone || "No phone"}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            {isActive ? (
                              <span className="text-white font-semibold">
                                {ref.assignedPlanName ||
                                  "14-Month Wealth Accelerator"}
                              </span>
                            ) : (
                              <span className="text-amber-400 font-semibold">
                                Pending Plan
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-white">
                            {formatINR(cap)}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-emerald-400">
                            +{formatINR(directBonus)}
                          </td>
                          <td className="py-3.5 px-4">
                            {isActive ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold text-[10px] border border-emerald-500/30">
                                Active Investor
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-semibold text-[10px] border border-amber-500/30">
                                Awaiting Plan
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: DISBURSEMENTS & WITHDRAWAL HISTORY
          ========================================================================= */}
      {activeTab === "withdrawals" && (
        <div className="space-y-6">
          {/* Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#0D131F] border border-[#1E293B]">
              <div className="text-[10px] text-slate-400 uppercase font-bold">
                Total Claim Requests
              </div>
              <div className="text-lg font-black text-white">
                {clientWithdrawals.length} Claims
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0D131F] border border-[#1E293B]">
              <div className="text-[10px] text-slate-400 uppercase font-bold">
                Settled & Disbursed
              </div>
              <div className="text-lg font-black text-emerald-400">
                {formatINR(totalDisbursedAmount)}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0D131F] border border-[#1E293B]">
              <div className="text-[10px] text-slate-400 uppercase font-bold">
                Pending Settlement
              </div>
              <div className="text-lg font-black text-amber-400">
                {formatINR(pendingClaimsTotal)}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0D131F] border border-[#1E293B]">
              <div className="text-[10px] text-slate-400 uppercase font-bold">
                Fee Policy
              </div>
              <div className="text-lg font-black text-slate-200">
                Flat 3% Standard
              </div>
            </div>
          </div>

          {/* Pending Actions Box if any */}
          {pendingWithdrawals.length > 0 && (
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 animate-pulse" />
                <span>
                  Action Required: {pendingWithdrawals.length} Claim Pending
                  Authorization
                </span>
              </div>
              <p className="text-xs text-slate-300">
                The investor has submitted a withdrawal request. Authorizing
                this claim will disburse funds via TRC20 transfer and record the
                settlement.
              </p>
            </div>
          )}

          {/* Withdrawals Table */}
          <div className="rounded-2xl bg-[#0D131F] border border-[#1E293B] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#1E293B] bg-[#080C14] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Claim ID & Date</th>
                    <th className="py-3 px-4">Gross Claim</th>
                    <th className="py-3 px-4">3% Fee</th>
                    <th className="py-3 px-4">Net Payout</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Settlement Reference</th>
                    <th className="py-3 px-4 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]">
                  {clientWithdrawals.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-12 text-center text-slate-500"
                      >
                        No withdrawal requests recorded for this client.
                      </td>
                    </tr>
                  ) : (
                    clientWithdrawals.map((w) => {
                      const isPending = w.status === "pending_approval";
                      const isDisbursed = w.status === "disbursed";

                      return (
                        <tr
                          key={w.id}
                          className="hover:bg-[#141C2E]/40 transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white font-mono">
                              {w.id}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {w.requestDate}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-white">
                            {formatINR(w.grossAmount || w.amount)}
                          </td>
                          <td className="py-3.5 px-4 text-amber-400 font-semibold">
                            -
                            {formatINR(
                              w.feeAmount ||
                                Math.round(
                                  (w.grossAmount || w.amount) * 0.03 * 100,
                                ) / 100,
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-black text-emerald-400">
                            {formatINR(w.netAmount || w.amount)}
                          </td>
                          <td className="py-3.5 px-4">
                            {isDisbursed ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold text-[10px] border border-emerald-500/30">
                                ✓ Settled
                              </span>
                            ) : isPending ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-bold text-[10px] border border-amber-500/30 animate-pulse">
                                ⏳ Pending Approval
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 font-bold text-[10px] border border-red-500/30">
                                ✕ Rejected
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                            {w.utrReference ? (
                              <span className="text-[#D4AF37] font-bold">
                                {w.utrReference}
                              </span>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {isPending ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleApprovePayout(w.id)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500 text-black font-extrabold text-[10px] hover:brightness-110 shadow-sm"
                                >
                                  ✓ Disburse
                                </button>
                                <button
                                  onClick={() => handleRejectPayout(w.id)}
                                  className="px-2 py-1 rounded-lg bg-red-500/15 text-red-400 border border-red-500/30 font-bold text-[10px] hover:bg-red-500/25"
                                >
                                  ✕ Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-500">
                                Completed
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: CREDENTIALS & SETTLEMENT WALLET
          ========================================================================= */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Identity & Account Specs */}
          <div className="p-6 rounded-2xl bg-[#0D131F] border border-[#1E293B] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-[#D4AF37]" />
                <span>Investor Identity & Credentials</span>
              </h4>
              <button
                onClick={() => {
                  setIsEditingInfo(!isEditingInfo);
                  setEditPhone(client.phone || "");
                  setEditBank(client.bankAccount || "");
                  setEditTier(client.tier || "standard");
                }}
                className="text-xs text-[#D4AF37] hover:underline font-semibold flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" />
                <span>{isEditingInfo ? "Cancel" : "Edit Credentials"}</span>
              </button>
            </div>

            {isEditingInfo ? (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase">
                    Mobile Phone
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+91 98000 00000"
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-[#080C14] border border-[#1E293B] text-white text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase">
                    Settlement Wallet / Bank
                  </label>
                  <input
                    type="text"
                    value={editBank}
                    onChange={(e) => setEditBank(e.target.value)}
                    placeholder="TRC20 Wallet Address"
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-[#080C14] border border-[#1E293B] text-white text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase">
                    Investor Tier
                  </label>
                  <select
                    value={editTier}
                    onChange={(e) => setEditTier(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-[#080C14] border border-[#1E293B] text-white text-xs"
                  >
                    <option value="standard">Standard Tier</option>
                    <option value="premium">Premium Wealth</option>
                    <option value="high_net_worth">High Net Worth (HNW)</option>
                    <option value="ultra_hnw">Ultra HNW Sovereign</option>
                  </select>
                </div>

                <button
                  onClick={handleSaveInfo}
                  disabled={isSavingInfo}
                  className="w-full py-2.5 rounded-xl bg-[#D4AF37] text-black font-extrabold text-xs hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {isSavingInfo ? "Saving Changes..." : "Save Credentials"}
                  </span>
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-[#1E293B]/50">
                  <span className="text-slate-400">Full Name</span>
                  <span className="font-bold text-white">
                    {client.firstName} {client.lastName}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#1E293B]/50">
                  <span className="text-slate-400">Client Identifier</span>
                  <span className="font-mono text-white">#{client.id}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#1E293B]/50">
                  <span className="text-slate-400">Registered Email</span>
                  <span className="text-slate-200">{client.email}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#1E293B]/50">
                  <span className="text-slate-400">Mobile Phone</span>
                  <span className="font-mono text-white">
                    {client.phone || "—"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#1E293B]/50">
                  <span className="text-slate-400">Settlement Destination</span>
                  <span className="font-mono text-[#D4AF37]">
                    {client.bankAccount || "USDT TRC20 Wallet"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#1E293B]/50">
                  <span className="text-slate-400">Assigned Advisor</span>
                  <span className="text-slate-200">
                    Chief Wealth Admin (Altaf)
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Account Onboarded</span>
                  <span className="text-slate-300">
                    {client.joinedDate || "Standard Inception"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Internal Notes */}
          <div className="p-6 rounded-2xl bg-[#0D131F] border border-[#1E293B] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#D4AF37]" />
                <span>Internal Wealth Admin Notes</span>
              </h4>
              <button
                onClick={() => {
                  setIsEditingNotes(!isEditingNotes);
                  setEditedNotes(client.notes || "");
                }}
                className="text-xs text-[#D4AF37] hover:underline font-semibold flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" />
                <span>{isEditingNotes ? "Cancel" : "Edit Notes"}</span>
              </button>
            </div>

            {isEditingNotes ? (
              <div className="space-y-3">
                <textarea
                  value={editedNotes}
                  onChange={(e) => setEditedNotes(e.target.value)}
                  rows={6}
                  placeholder="Enter administrative notes, compliance memos, payment references..."
                  className="w-full p-3 rounded-xl bg-[#080C14] border border-[#1E293B] text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                />
                <button
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                  className="px-4 py-2 rounded-xl bg-[#D4AF37] text-black font-extrabold text-xs hover:brightness-110 transition-all flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingNotes ? "Saving..." : "Save Notes"}</span>
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#080C14] border border-[#1E293B] text-xs text-slate-300 whitespace-pre-line min-h-[140px]">
                {client.notes ||
                  "No internal administrative memos logged for this investor."}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: AUDIT & COMPLIANCE TRAIL
          ========================================================================= */}
      {activeTab === "audit" && (
        <div className="rounded-2xl bg-[#0D131F] border border-[#1E293B] overflow-hidden shadow-xl">
          <div className="p-4 border-b border-[#1E293B]">
            <h4 className="font-bold text-white text-sm">
              Compliance & Administrative Event Log
            </h4>
            <p className="text-xs text-slate-400">
              Immutable log of plan allocations, phone verifications, and status
              changes for this investor
            </p>
          </div>

          <div className="divide-y divide-[#1E293B] text-xs">
            {clientAuditLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No individual audit trail entries recorded yet.
              </div>
            ) : (
              clientAuditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 hover:bg-[#141C2E]/40 transition-colors flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>{log.action}</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#141C2E] border border-[#1E293B] text-slate-400 text-[10px] uppercase">
                        {log.category}
                      </span>
                    </div>
                    <div className="text-slate-300">{log.details}</div>
                  </div>
                  <div className="text-right text-[11px] text-slate-500 font-mono shrink-0">
                    <div>{log.timestamp}</div>
                    <div className="text-slate-400 font-bold">
                      {log.adminName}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
