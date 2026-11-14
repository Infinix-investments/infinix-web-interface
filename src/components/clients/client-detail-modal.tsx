'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Building,
  CheckCircle,
  Clock,
  ShieldCheck,
  TrendingUp,
  Share2,
  Calendar,
  AlertCircle,
  AlertTriangle,
  Copy,
  Check,
  Award,
  Layers,
  ArrowRight,
  CreditCard,
  FileText,
  Percent,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useAdmin } from '@/context/admin-context';
import { ClientProfile } from '@/types/admin';
import { formatUSDT } from '@/utils/currency';
import {
  computeClientReferralStats,
  REFERRAL_LEVEL_RULES,
} from '@/utils/referral';

interface ClientDetailModalProps {
  client: ClientProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenAssignModal?: (clientId: string) => void;
}

const isPhoneAdded = (phone?: string) =>
  Boolean(phone && phone.trim().length > 0 && phone.trim().toLowerCase() !== 'n/a' && phone.trim() !== '—');

export function ClientDetailModal({
  client,
  isOpen,
  onClose,
  onOpenAssignModal,
}: ClientDetailModalProps) {
  const {
    clients,
    plans,
    referrals,
    withdrawals,
    verifyClientPhone,
    approveWithdrawal,
    rejectWithdrawal,
  } = useAdmin();

  const [activeTab, setActiveTab] = useState<'overview' | 'plan' | 'referrals' | 'withdrawals'>('overview');
  const [copiedCode, setCopiedCode] = useState(false);
  const [toast, setToast] = useState('');
  const [customUtr, setCustomUtr] = useState('');
  const [approvingWdId, setApprovingWdId] = useState<string | null>(null);
  const [currentTime] = useState(() => Date.now());

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  // Compute live referral stats for this client
  const referralStats = useMemo(() => {
    if (!client) {
      return {
        referralCode: 'INF-0000',
        totalReferred: 0,
        activePlanReferrals: 0,
        level: 0,
        levelName: 'Level 0',
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

  // Get all withdrawals for this client
  const clientWithdrawals = useMemo(() => {
    if (!client) return [];
    return withdrawals.filter(
      (w) => w.clientId === client.id || w.clientName.toLowerCase() === `${client.firstName} ${client.lastName}`.toLowerCase()
    );
  }, [client, withdrawals]);

  const pendingWithdrawal = clientWithdrawals.find(
    (w) => w.status === 'pending_approval'
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

  const handleApprovePayout = (wdId: string) => {
    const res = approveWithdrawal(wdId, customUtr || undefined);
    setApprovingWdId(null);
    setCustomUtr('');
    if (res.success) {
      showToast(res.message);
    }
  };

  const displayPlans = useMemo(() => {
    if (!client) return [];
    if (client.activePlans && client.activePlans.length > 0) {
      return client.activePlans.map((p: any, idx: number) => {
        const start = p.startDate ? new Date(p.startDate) : new Date();
        const duration = p.durationMonths || 14;
        const maxDays = duration * 30;
        const days = Math.max(0, Math.floor((currentTime - start.getTime()) / (1000 * 60 * 60 * 24)));
        const effDays = Math.min(maxDays, days);
        const dailyRate = p.dailyReturnPct ?? 0.5;
        const monthlyRate = p.monthlyReturnPct ?? 15.0;
        const grossRate = p.grossTotalReturnPct ?? (monthlyRate * duration);
        const daily = (p.capitalAmount * dailyRate) / 100;
        const accrued = daily * effDays;
        const monthly = (p.capitalAmount * monthlyRate) / 100;
        const grossReturn = (p.capitalAmount * grossRate) / 100;
        return {
          ...p,
          index: idx + 1,
          durationMonths: duration,
          daysElapsed: days,
          effectiveDays: effDays,
          maxDays,
          dailyProfit: daily,
          accruedProfit: accrued,
          monthlyPayout: monthly,
          grossReturn,
        };
      });
    }

    if (client.assignedPlanStatus === 'active' && client.assignedPlanAmount && client.assignedPlanAmount > 0) {
      const assignedPlan = plans.find(
        (p) =>
          p.id === client.assignedPlanId ||
          (p as any).planId === client.assignedPlanId ||
          (client.assignedPlanName &&
            p.planName.toLowerCase() === client.assignedPlanName.toLowerCase())
      );
      const planDuration = assignedPlan?.durationMonths ?? 14;
      const planDailyRate = assignedPlan?.dailyReturnPct ?? 0.5;
      const planMonthlyPct = assignedPlan?.monthlyReturnPct ?? 15.0;
      const planGrossTotalReturnPct =
        assignedPlan?.grossTotalReturnPct ?? planMonthlyPct * planDuration;

      const start = client.assignedPlanStartDate ? new Date(client.assignedPlanStartDate) : new Date();
      const maxDays = planDuration * 30;
      const days = Math.max(0, Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24)));
      const effDays = Math.min(maxDays, days);
      const daily = (client.assignedPlanAmount * planDailyRate) / 100;
      const accrued = daily * effDays;
      const monthly = (client.assignedPlanAmount * planMonthlyPct) / 100;
      const grossReturn = (client.assignedPlanAmount * planGrossTotalReturnPct) / 100;

      return [
        {
          planInstanceId: 'primary-plan',
          planId: client.assignedPlanId || 'plan-default',
          planName: client.assignedPlanName || assignedPlan?.planName || 'Private Wealth Accelerator',
          capitalAmount: client.assignedPlanAmount,
          startDate: client.assignedPlanStartDate || new Date().toISOString().split('T')[0],
          durationMonths: planDuration,
          dailyReturnPct: planDailyRate,
          monthlyReturnPct: planMonthlyPct,
          grossTotalReturnPct: planGrossTotalReturnPct,
          status: 'active' as const,
          index: 1,
          daysElapsed: days,
          effectiveDays: effDays,
          maxDays,
          dailyProfit: daily,
          accruedProfit: accrued,
          monthlyPayout: monthly,
          grossReturn,
        },
      ];
    }

    return [];
  }, [client, plans, currentTime]);

  const totalCapitalAllocated = displayPlans.reduce((sum: number, p: any) => sum + (Number(p.capitalAmount) || 0), 0);
  const totalDailyProfit = displayPlans.reduce((sum: number, p: any) => sum + (Number(p.dailyProfit) || 0), 0);
  const totalAccruedReturns = displayPlans.reduce((sum: number, p: any) => sum + (Number(p.accruedProfit) || 0), 0);
  const totalMonthlyPayout = displayPlans.reduce((sum: number, p: any) => sum + (Number(p.monthlyPayout) || 0), 0);
  const totalMaturityGross = displayPlans.reduce((sum: number, p: any) => sum + (Number(p.grossReturn) || 0), 0);

  const primaryPlan = displayPlans[0];
  const planDuration = primaryPlan?.durationMonths ?? 14;
  const planMonthlyPct = primaryPlan?.monthlyReturnPct ?? 15.0;

  if (!isOpen || !client) return null;

  const monthlyPayout = totalMonthlyPayout;
  const dailyProfit = totalDailyProfit;
  const planStart = client.assignedPlanStartDate ? new Date(client.assignedPlanStartDate) : new Date();
  const daysElapsed = Math.max(1, Math.min(planDuration * 30, Math.floor((currentTime - planStart.getTime()) / (1000 * 60 * 60 * 24)) + 1));
  const totalAccruedSoFar = totalAccruedReturns;
  const monthlyCapitalReturn = monthlyPayout / 2;
  const monthlyProfitReturn = monthlyPayout / 2;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-[#0D131F] border border-[#1E293B] rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Toast inside modal */}
        {toast && (
          <div className="p-3 bg-emerald-500/20 border-b border-emerald-500/40 text-emerald-400 font-semibold text-xs flex items-center justify-between px-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>{toast}</span>
            </div>
            <button onClick={() => setToast('')} className="text-emerald-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Modal Header */}
        <div className="p-6 border-b border-[#1E293B] bg-[#080C14]/90 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 to-[#141C2E] border-2 border-[#D4AF37]/60 flex items-center justify-center text-[#D4AF37] font-black text-xl shrink-0 shadow-lg shadow-[#D4AF37]/10">
              {client.firstName[0]}
              {client.lastName[0]}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg md:text-xl font-black text-white tracking-tight">
                  {client.firstName} {client.lastName}
                </h2>

                {/* Referral Code Badge */}
                <button
                  onClick={handleCopyCode}
                  title="Click to copy unique referral code"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-mono font-bold transition-all"
                >
                  <Share2 className="w-3 h-3" />
                  <span>{referralStats.referralCode}</span>
                  {copiedCode ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 opacity-60" />
                  )}
                </button>

                {/* Referral Level Pill */}
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${currentLevelRule.badgeBg} ${currentLevelRule.badgeText} ${currentLevelRule.badgeBorder}`}
                >
                  <Award className="w-3 h-3" />
                  <span>{currentLevelRule.badgeLabel}</span>
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1.5 flex-wrap">
                <span>Client ID: <strong className="text-slate-300">#{client.id}</strong></span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-500" />
                  {client.email}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-500" />
                  {client.phone}
                </span>
              </div>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#141C2E] border border-[#1E293B] text-slate-400 hover:text-white transition-all shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top 4 KPI Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#1E293B] border-b border-[#1E293B]">
          <div className="p-4 bg-[#0D131F]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Invested Capital
            </span>
            <div className="text-base md:text-lg font-black text-white mt-1">
              {formatINR(client.assignedPlanAmount)}
            </div>
            <div className="text-[11px] text-[#D4AF37] font-semibold mt-0.5">
              {client.assignedPlanStatus === 'active' ? `Active ${planDuration}M Tranche` : 'Awaiting Plan'}
            </div>
          </div>

          <div className="p-4 bg-[#0D131F]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {planMonthlyPct}% Monthly Payout
            </span>
            <div className="text-base md:text-lg font-black text-emerald-400 mt-1">
              {monthlyPayout > 0 ? formatINR(monthlyPayout) : '—'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {(planMonthlyPct / 2).toFixed(1)}% Cap + {(planMonthlyPct / 2).toFixed(1)}% Profit
            </div>
          </div>

          <div className="p-4 bg-[#0D131F]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Referral Level & Count
            </span>
            <div className="text-base md:text-lg font-black text-white mt-1 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#D4AF37]" />
              <span>Level {referralStats.level}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {referralStats.totalReferred} Invited • {referralStats.activePlanReferrals} Active
            </div>
          </div>

          <div className="p-4 bg-[#0D131F]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Monthly Referral Yield
            </span>
            <div className="text-base md:text-lg font-black text-[#D4AF37] mt-1">
              {referralStats.monthlyCommissionYield > 0
                ? formatINR(referralStats.monthlyCommissionYield) + '/mo'
                : '0.00 USDT/mo'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {referralStats.roiPct > 0 ? `${referralStats.roiPct}% of referee ROI` : 'Unlock at Level 1'}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-4 border-b border-[#1E293B] bg-[#080C14]">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'overview'
                ? 'border-[#D4AF37] text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Investor Profile
          </button>
          <button
            onClick={() => setActiveTab('plan')}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'plan'
                ? 'border-[#D4AF37] text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Investment Schedule</span>
            {client.assignedPlanStatus === 'active' && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('referrals')}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'referrals'
                ? 'border-[#D4AF37] text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Referral Network</span>
            <span className="px-1.5 py-0.5 rounded-full bg-[#1E293B] text-[10px] text-slate-300">
              {referralStats.totalReferred}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'withdrawals'
                ? 'border-[#D4AF37] text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Withdrawals</span>
            {pendingWithdrawal && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/40">
                1 Pending
              </span>
            )}
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: OVERVIEW & CREDENTIALS */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Phone Status Notice Banner if phone not added */}
              {!isPhoneAdded(client.phone) && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-300">
                        Phone Number Not Added
                      </h4>
                      <p className="text-[11px] text-amber-200/80">
                        This investor has registered their account but has not added a mobile phone number yet.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Identity & Contact Details Grid */}
              <div className="rounded-2xl bg-[#080C14] border border-[#1E293B] p-5 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Personal Credentials & Contact Information</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#0D131F] border border-[#1E293B]">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Full Legal Name
                    </span>
                    <span className="font-bold text-white text-sm mt-0.5 block">
                      {client.firstName} {client.lastName}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0D131F] border border-[#1E293B]">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Email Address
                    </span>
                    <span className="font-semibold text-slate-200 mt-0.5 block">
                      {client.email}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0D131F] border border-[#1E293B]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Registered Mobile Number
                      </span>
                      {isPhoneAdded(client.phone) ? (
                        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Added
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Not Added
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-white text-sm mt-0.5 block">
                      {isPhoneAdded(client.phone) ? (
                        client.phone
                      ) : (
                        <span className="text-slate-500 font-normal italic text-xs">
                          Phone number not added
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0D131F] border border-[#1E293B]">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      KYC Compliance Status
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-emerald-400 uppercase text-xs">
                        {client.kycStatus === 'verified' ? 'Verified & Approved' : client.kycStatus}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0D131F] border border-[#1E293B]">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Registration Date
                    </span>
                    <span className="font-semibold text-slate-300 mt-0.5 block flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {client.joinedDate}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0D131F] border border-[#1E293B]">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Referred By
                    </span>
                    <span className="font-semibold text-slate-300 mt-0.5 block">
                      {client.referredByCode ? (
                        <span className="text-[#D4AF37] font-mono font-bold">
                          {client.referredByCode}
                        </span>
                      ) : (
                        <span className="text-slate-500">Direct Inflow (No Referrer)</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Settlement Bank Details */}
              <div className="rounded-2xl bg-[#080C14] border border-[#1E293B] p-5 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Settlement Bank Account & Fee Waiver</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#0D131F] border border-[#1E293B]">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Designated Payout Account
                    </span>
                    <span className="font-bold text-white text-sm mt-0.5 block font-mono">
                      {client.bankAccount}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      RTGS / NEFT Direct Settlement Enabled
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0D131F] border border-[#1E293B]">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Non-Withdrawal Custodian Fee Waiver
                    </span>
                    <span className="font-bold text-emerald-400 text-sm mt-0.5 block">
                      0.00 USDT (100% Contractual Waiver)
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Exempt from holding charges when claimed monthly
                    </span>
                  </div>
                </div>
              </div>

              {/* Administrative Notes */}
              <div className="rounded-2xl bg-[#080C14] border border-[#1E293B] p-5 space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Administrative Audit Notes</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed bg-[#0D131F] p-3 rounded-xl border border-[#1E293B]">
                  {client.notes || 'No administrative notes attached to this investor profile.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: INVESTMENT SCHEDULE & ALL ACTIVE PLANS */}
          {activeTab === 'plan' && (
            <div className="space-y-6">
              {displayPlans.length > 0 ? (
                <>
                  {/* Top Action & Overview */}
                  <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-[#1E293B]">
                    <div>
                      <h3 className="text-base font-black text-white">
                        Active Investment Contracts ({displayPlans.length})
                      </h3>
                      <p className="text-xs text-slate-400">
                        {displayPlans.length > 1
                          ? `${displayPlans.length} plans running concurrently in parallel with independent terms & timelines.`
                          : 'Independent high-yield private contract actively accruing returns.'}
                      </p>
                    </div>

                    {onOpenAssignModal && (
                      <button
                        onClick={() => onOpenAssignModal(client.id)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white font-extrabold text-xs hover:brightness-110 shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>+ Allocate Additional Plan</span>
                      </button>
                    )}
                  </div>

                  {/* ALL INDIVIDUAL ACTIVE PLANS (NO OVERWRITING, FULL INDIVIDUAL VISIBILITY) */}
                  <div className="space-y-4">
                    {displayPlans.map((p: any, idx: number) => (
                      <div
                        key={p.planInstanceId || idx}
                        className="rounded-2xl bg-gradient-to-br from-[#0D131F] to-[#141C2E] border border-[#D4AF37]/30 p-5 space-y-4 hover:border-[#D4AF37]/60 transition-all shadow-lg"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[10px] uppercase">
                                Plan #{p.index || idx + 1} Active
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] font-bold text-[10px]">
                                {p.durationMonths} Months Term
                              </span>
                            </div>
                            <h4 className="text-base font-black text-white">{p.planName}</h4>
                            <p className="text-xs text-slate-400">
                              Started: <strong className="text-white">{p.startDate}</strong> • Day {p.daysElapsed} of {p.maxDays} ({Math.min(100, Math.round((p.daysElapsed / (p.maxDays || 1)) * 100))}%)
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                              Invested Capital
                            </span>
                            <span className="text-lg font-black text-white">
                              {formatINR(p.capitalAmount)}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar for this plan */}
                        <div className="space-y-1">
                          <div className="w-full h-2 rounded-full bg-[#080C14] border border-[#1E293B] overflow-hidden p-0.5">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-emerald-400 transition-all duration-500"
                              style={{
                                width: `${Math.min(100, Math.max(3, Math.round((p.daysElapsed / (p.maxDays || 1)) * 100)))}%`,
                              }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-500">
                            <span>Start: {p.startDate}</span>
                            <span className="text-slate-400 font-semibold">
                              {Math.max(0, p.maxDays - p.daysElapsed)} days remaining
                            </span>
                          </div>
                        </div>

                        {/* Individual Plan Metrics Breakdown */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-[#1E293B] text-xs">
                          <div className="p-2.5 rounded-xl bg-[#080C14] border border-[#1E293B]">
                            <span className="text-[9px] uppercase font-bold text-slate-400 block">Daily Increment</span>
                            <span className="font-extrabold text-emerald-400 text-sm">+{formatINR(p.dailyProfit)}</span>
                            <span className="text-[9px] text-slate-500 block">+{p.dailyReturnPct}% / day</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-[#080C14] border border-[#1E293B]">
                            <span className="text-[9px] uppercase font-bold text-slate-400 block">Accrued Returns</span>
                            <span className="font-extrabold text-[#D4AF37] text-sm">+{formatINR(p.accruedProfit)}</span>
                            <span className="text-[9px] text-slate-500 block">{p.daysElapsed} days accrued</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-[#080C14] border border-[#1E293B]">
                            <span className="text-[9px] uppercase font-bold text-slate-400 block">Monthly Payout</span>
                            <span className="font-extrabold text-white text-sm">{formatINR(p.monthlyPayout)}</span>
                            <span className="text-[9px] text-slate-500 block">+{p.monthlyReturnPct}% / mo</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-[#080C14] border border-[#1E293B]">
                            <span className="text-[9px] uppercase font-bold text-slate-400 block">Maturity Gross</span>
                            <span className="font-extrabold text-emerald-400 text-sm">{formatINR(p.grossReturn)}</span>
                            <span className="text-[9px] text-slate-500 block">{p.grossTotalReturnPct}% total</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* PORTFOLIO TOTALS AGGREGATION */}
                  <div className="rounded-2xl bg-[#080C14] border border-[#D4AF37]/40 p-5 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
                      <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
                        Combined Portfolio Summary ({displayPlans.length} Plans)
                      </span>
                      <span className="text-xs text-slate-400">
                        Total Capital: <strong className="text-white">{formatINR(totalCapitalAllocated)}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-[#0D131F] border border-[#1E293B]">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Daily Increment</span>
                        <div className="text-lg font-black text-emerald-400 mt-1">+{formatINR(totalDailyProfit)} / day</div>
                      </div>
                      <div className="p-3 rounded-xl bg-[#0D131F] border border-[#1E293B]">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Accrued to Date</span>
                        <div className="text-lg font-black text-[#D4AF37] mt-1">+{formatINR(totalAccruedReturns)}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-[#0D131F] border border-[#1E293B]">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Monthly Distributions</span>
                        <div className="text-lg font-black text-white mt-1">{formatINR(totalMonthlyPayout)} / mo</div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* No Plan Assigned State */
                <div className="rounded-2xl bg-[#080C14] border border-[#1E293B] p-10 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Payment Verification & Plan Activation
                    </h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                      Once client payment is received in Infinix escrow, start their plan here. The plan will become active immediately and begin accruing daily returns in the investor&apos;s app.
                    </p>
                  </div>
                  {onOpenAssignModal && (
                    <button
                      onClick={() => onOpenAssignModal(client.id)}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white font-extrabold text-xs hover:brightness-110 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 mx-auto"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>✓ Verify Payment & Start Plan</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REFERRAL SYNDICATE & 5 LEVELS */}
          {activeTab === 'referrals' && (
            <div className="space-y-6">
              {/* Current Referral Level Banner */}
              <div className="rounded-2xl bg-gradient-to-br from-[#0D131F] to-[#141C2E] border border-[#D4AF37]/40 p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] font-bold text-[10px] uppercase tracking-wider">
                        5-Tier Referral Syndicate
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${currentLevelRule.badgeBg} ${currentLevelRule.badgeText} ${currentLevelRule.badgeBorder}`}
                      >
                        {currentLevelRule.badgeLabel}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-white mt-2">
                      {currentLevelRule.name}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                      {currentLevelRule.description}
                    </p>
                  </div>

                  {/* Live Commission Yield */}
                  <div className="p-4 rounded-xl bg-[#080C14] border border-[#1E293B] text-right shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Active Monthly Commission
                    </span>
                    <div className="text-xl font-black text-[#D4AF37] mt-0.5">
                      {formatINR(referralStats.monthlyCommissionYield)} / mo
                    </div>
                    <span className="text-[10px] text-emerald-400 mt-0.5 block font-semibold">
                      {referralStats.roiPct}% of referee monthly ROI
                    </span>
                  </div>
                </div>

                {/* Progress To Next Level */}
                {referralStats.level < 5 ? (
                  <div className="pt-2 border-t border-[#1E293B]">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-300 font-medium">
                        Progress to Level {referralStats.level + 1}:{' '}
                        <strong className="text-white">
                          {referralStats.activePlanReferrals} of {referralStats.neededForNext}
                        </strong>{' '}
                        active plan referrals
                      </span>
                      <span className="text-xs font-bold text-[#D4AF37]">
                        {referralStats.plansRemainingForNext === 0
                          ? 'Unlocked!'
                          : `${referralStats.plansRemainingForNext} more active plan${referralStats.plansRemainingForNext > 1 ? 's' : ''} needed`}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#080C14] border border-[#1E293B] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F59E0B]"
                        style={{
                          width: `${Math.min(100, Math.round((referralStats.activePlanReferrals / referralStats.neededForNext) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-center text-xs font-bold text-[#D4AF37]">
                    🏆 Sovereign Syndicate Rank Reached — Maximum Level 5 Unlocked
                  </div>
                )}
              </div>

              {/* 5-Level Reference Guide */}
              <div className="rounded-2xl bg-[#080C14] border border-[#1E293B] p-5 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>5-Tier Syndicate Structure Reference</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    2 active plans per level unlock
                  </span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs">
                  {REFERRAL_LEVEL_RULES.slice(1).map((lvl) => {
                    const isCurrent = referralStats.level === lvl.level;
                    const isUnlocked = referralStats.level >= lvl.level;

                    return (
                      <div
                        key={lvl.level}
                        className={`p-3 rounded-xl border transition-all ${
                          isCurrent
                            ? 'bg-[#D4AF37]/10 border-[#D4AF37] shadow-md shadow-[#D4AF37]/10'
                            : isUnlocked
                            ? 'bg-[#0D131F] border-emerald-500/30'
                            : 'bg-[#0D131F]/50 border-[#1E293B] opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs">Level {lvl.level}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              isCurrent
                                ? 'bg-[#D4AF37] text-black'
                                : isUnlocked
                                ? 'text-emerald-400'
                                : 'text-slate-500'
                            }`}
                          >
                            {lvl.roiPct}% ROI
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {lvl.requiredPlans} Active Plans
                        </div>
                        <div className="text-[9px] mt-1 font-semibold">
                          {isCurrent ? (
                            <span className="text-[#D4AF37]">● Current Rank</span>
                          ) : isUnlocked ? (
                            <span className="text-emerald-400">✓ Unlocked</span>
                          ) : (
                            <span className="text-slate-500">🔒 Locked</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Referred Investors Directory Table */}
              <div className="rounded-2xl bg-[#080C14] border border-[#1E293B] overflow-hidden">
                <div className="p-4 border-b border-[#1E293B] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-[#D4AF37]" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Referred Investors Network ({referralStats.refereeList.length})
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Active Plans: <strong className="text-white">{referralStats.activePlanReferrals}</strong>
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#1E293B] bg-[#0D131F] text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4">Referee Investor</th>
                        <th className="py-3 px-4">Registered Date</th>
                        <th className="py-3 px-4">Investment Plan</th>
                        <th className="py-3 px-4">Invested Capital</th>
                        <th className="py-3 px-4">Referee Monthly ROI</th>
                        <th className="py-3 px-4 text-right">
                          Monthly Yield ({referralStats.roiPct}%)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E293B]">
                      {referralStats.refereeList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-slate-500">
                            This investor has not referred anyone yet. Share referral code{' '}
                            <strong className="text-[#D4AF37] font-mono">
                              {referralStats.referralCode}
                            </strong>{' '}
                            to unlock Level 1 (10% ROI) once 2 referees start an active plan.
                          </td>
                        </tr>
                      ) : (
                        referralStats.refereeList.map((ref) => {
                          const userYield =
                            ref.hasActivePlan && referralStats.roiPct > 0
                              ? (ref.monthlyRoi * referralStats.roiPct) / 100
                              : 0;

                          return (
                            <tr
                              key={ref.id}
                              className="hover:bg-[#141C2E]/40 transition-colors"
                            >
                              <td className="py-3 px-4">
                                <div className="font-bold text-white">{ref.name}</div>
                                <div className="text-[10px] text-slate-400">{ref.email}</div>
                              </td>

                              <td className="py-3 px-4 text-slate-400">
                                {ref.joinedDate}
                              </td>

                              <td className="py-3 px-4">
                                {ref.hasActivePlan ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold text-[10px] border border-emerald-500/30">
                                    <CheckCircle className="w-3 h-3" />
                                    Active 14M Plan
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold text-[10px]">
                                    <Clock className="w-3 h-3" />
                                    Pending Plan
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-4 font-bold text-white">
                                {ref.capital > 0 ? formatINR(ref.capital) : '—'}
                              </td>

                              <td className="py-3 px-4 text-slate-300">
                                {ref.hasActivePlan ? formatINR(ref.monthlyRoi) : '—'}
                              </td>

                              <td className="py-3 px-4 text-right font-black text-[#D4AF37]">
                                {userYield > 0 ? formatINR(userYield) + '/mo' : '0.00 USDT'}
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

          {/* TAB 4: WITHDRAWALS & LEDGER */}
          {activeTab === 'withdrawals' && (
            <div className="space-y-6">
              {/* Pending Disbursement Banner if any */}
              {pendingWithdrawal && (
                <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold text-amber-300">
                          Active Withdrawal Claim Awaiting Approval
                        </h4>
                        <p className="text-[11px] text-amber-200/80 mt-0.5">
                          Claimed Month {pendingWithdrawal.monthIndex} of {planDuration} distribution ({formatINR(pendingWithdrawal.amount)}) for {client.bankAccount}. Custodian fee waived.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setApprovingWdId(pendingWithdrawal.id)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-black font-extrabold text-xs hover:brightness-110 shadow-lg shadow-[#D4AF37]/20 shrink-0"
                    >
                      ✓ Approve Payout
                    </button>
                  </div>

                  {/* Custom UTR Input dialog inside banner */}
                  {approvingWdId === pendingWithdrawal.id && (
                    <div className="p-4 rounded-xl bg-[#080C14] border border-[#1E293B] space-y-3 pt-3">
                      <div className="text-xs font-bold text-white">
                        Bank Transfer Reference Confirmation:
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Optional: Enter Bank UTR (e.g. CMS-RTGS-998823104)"
                          value={customUtr}
                          onChange={(e) => setCustomUtr(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl bg-[#0D131F] border border-[#1E293B] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#D4AF37]"
                        />
                        <button
                          onClick={() => handleApprovePayout(pendingWithdrawal.id)}
                          className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-extrabold text-xs hover:brightness-110 shrink-0"
                        >
                          Confirm & Disburse
                        </button>
                        <button
                          onClick={() => setApprovingWdId(null)}
                          className="px-3 py-2 rounded-xl bg-[#141C2E] text-slate-400 text-xs hover:text-white shrink-0"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Disbursements History Table */}
              <div className="rounded-2xl bg-[#080C14] border border-[#1E293B] overflow-hidden">
                <div className="p-4 border-b border-[#1E293B] flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Disbursements & Claims History ({clientWithdrawals.length})</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Mandatory Monthly Claim • Zero Custodian Fee
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#1E293B] bg-[#0D131F] text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4">Claim ID</th>
                        <th className="py-3 px-4">Tranche Month</th>
                        <th className="py-3 px-4">Amount Claimed</th>
                        <th className="py-3 px-4">Destination Account</th>
                        <th className="py-3 px-4">Status & UTR</th>
                        <th className="py-3 px-4 text-right">Claim Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E293B]">
                      {clientWithdrawals.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-slate-500">
                            No withdrawal claims recorded for this investor yet.
                          </td>
                        </tr>
                      ) : (
                        clientWithdrawals.map((wd) => (
                          <tr
                            key={wd.id}
                            className="hover:bg-[#141C2E]/40 transition-colors"
                          >
                            <td className="py-3 px-4 font-mono text-slate-400">
                              #{wd.id}
                            </td>
                            <td className="py-3 px-4 font-bold text-white">
                              Month {wd.monthIndex} of 14
                            </td>
                            <td className="py-3 px-4 font-black text-white">
                              {formatINR(wd.amount)}
                            </td>
                            <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">
                              {wd.bankAccount}
                            </td>
                            <td className="py-3 px-4">
                              {wd.status === 'disbursed' ? (
                                <div>
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[10px]">
                                    ✓ Disbursed
                                  </span>
                                  {wd.utrReference && (
                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                      UTR: {wd.utrReference}
                                    </div>
                                  )}
                                </div>
                              ) : wd.status === 'pending_approval' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-[10px]">
                                  ● Pending Desk Approval
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 font-bold text-[10px]">
                                  ✕ Rejected
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right text-slate-400">
                              {wd.disbursedDate || wd.requestDate}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Quick Actions */}
        <div className="p-4 px-6 border-t border-[#1E293B] bg-[#080C14] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {client.assignedPlanStatus !== 'active' && onOpenAssignModal && (
              <button
                onClick={() => onOpenAssignModal(client.id)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white font-extrabold text-xs hover:brightness-110 shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Verify Payment & Start Plan</span>
              </button>
            )}

            {client.assignedPlanStatus === 'active' && onOpenAssignModal && (
              <button
                onClick={() => onOpenAssignModal(client.id)}
                className="px-3 py-2 rounded-xl bg-[#0D131F] border border-[#1E293B] text-slate-300 hover:text-white font-semibold text-xs transition-all"
              >
                + Allocate Additional Plan
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#141C2E] border border-[#1E293B] text-slate-300 hover:text-white font-bold text-xs transition-all"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}

