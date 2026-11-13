"use client";

import React from "react";
import {
  TrendingUp,
  Users,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  CheckCircle,
  FileText,
  DollarSign,
  ChevronRight,
  Phone,
  AlertCircle,
} from "lucide-react";
import { useAdmin } from "@/context/admin-context";
import { formatUSDT } from "@/utils/currency";

interface OverviewViewProps {
  onOpenAssignModal: (clientId: string) => void;
}

const isPhoneAdded = (phone?: string) =>
  Boolean(phone && phone.trim().length > 0 && phone.trim().toLowerCase() !== "n/a" && phone.trim() !== "—");

export function OverviewView({ onOpenAssignModal }: OverviewViewProps) {
  const {
    stats,
    clients,
    withdrawals,
    auditLogs,
    setActiveTab,
  } = useAdmin();

  const clientsWithoutPhone = clients.filter((c) => !isPhoneAdded(c.phone));
  const pendingWithdrawals = withdrawals.filter(
    (w) => w.status === "pending_approval",
  );

  const formatINR = (val: number) => {
    return formatUSDT(val);
  };

  return (
    <div className="space-y-6">
      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Total AUM */}
        <div className="p-5 rounded-2xl bg-[#0D131F] border border-[#1E293B] relative overflow-hidden group hover:border-[#D4AF37]/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Contractual AUM
            </span>
            <div className="p-2 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-black text-white tracking-tight">
              {formatINR(stats.totalAum)}
            </h2>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-400 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>100% Locked in 14-Month Tranches</span>
            </div>
          </div>
        </div>

        {/* Active Investors */}
        <div className="p-5 rounded-2xl bg-[#0D131F] border border-[#1E293B] relative overflow-hidden group hover:border-[#D4AF37]/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Active Investors
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-black text-white tracking-tight">
              {stats.activeInvestorsCount}{" "}
              <span className="text-sm font-normal text-slate-400">
                / {clients.length} Total
              </span>
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              {clientsWithoutPhone.length === 0
                ? "All investors have phone added"
                : `${clientsWithoutPhone.length} phone number not added`}
            </p>
          </div>
        </div>

        {/* Monthly Payout Liability */}
        <div className="p-5 rounded-2xl bg-[#0D131F] border border-[#1E293B] relative overflow-hidden group hover:border-[#D4AF37]/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Monthly Payout Obligation
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-black text-amber-400 tracking-tight">
              {formatINR(stats.monthlyLiabilityTotal)}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              15.0% flat monthly disbursement
            </p>
          </div>
        </div>

        {/* Pending Withdrawals */}
        <div className="p-5 rounded-2xl bg-[#0D131F] border border-[#1E293B] relative overflow-hidden group hover:border-[#D4AF37]/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Pending Payout Claims
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-black text-white tracking-tight">
              {stats.pendingWithdrawalCount}{" "}
              <span className="text-sm font-normal text-slate-400">
                ({formatINR(stats.pendingWithdrawalTotal)})
              </span>
            </h2>
            <p className="mt-1 text-xs text-emerald-400 font-medium">
              Zero fee on-time claims ready
            </p>
          </div>
        </div>
      </div>

      {/* Featured 14-Month 15% Plan Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0D131F] via-[#141C2E] to-[#0D131F] border border-[#D4AF37]/40 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold uppercase tracking-wider">
              <span>⭐ Primary Default Yield Vehicle</span>
            </div>
            <h3 className="text-xl font-black text-white tracking-tight">
              INFINIX 14-Month Wealth Accelerator (15.0% Monthly Return)
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every client enrolled in this plan receives a fixed 15.0% monthly
              disbursement: <strong>7.5% systematic capital return</strong> +{" "}
              <strong>7.5% net profit</strong>. Across 14 months, the client
              recovers 100% of their principal plus 105% profit (
              <span className="text-[#D4AF37] font-bold">
                210% gross payout
              </span>
              ).
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab("plans")}
              className="px-4 py-2.5 rounded-xl bg-[#080C14] border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 font-bold text-xs transition-all"
            >
              Simulate Tranche
            </button>
            <button
              onClick={() => setActiveTab("clients")}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-black font-extrabold text-xs hover:brightness-110 active:scale-95 transition-all shadow-md shadow-[#D4AF37]/20"
            >
              Assign to User
            </button>
          </div>
        </div>
      </div>

      {/* 2-Column Section: Pending Verifications vs Pending Withdrawals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Investors Without Phone Number */}
        <div className="p-6 rounded-2xl bg-[#0D131F] border border-[#1E293B]">
          <div className="flex items-center justify-between pb-4 border-b border-[#1E293B]">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Phone Number Not Added ({clientsWithoutPhone.length})
              </h3>
            </div>
            <button
              onClick={() => setActiveTab("clients")}
              className="text-xs text-[#D4AF37] hover:underline font-semibold flex items-center gap-1"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {clientsWithoutPhone.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                All registered investors have added a phone number.
              </p>
            ) : (
              clientsWithoutPhone.map((client) => (
                <div
                  key={client.id}
                  className="p-3.5 rounded-xl bg-[#080C14] border border-[#1E293B] flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {client.firstName} {client.lastName}
                    </h4>
                    <p className="text-xs text-slate-400">{client.email}</p>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-medium">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>Phone number not added</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab("clients")}
                      className="px-3 py-1.5 rounded-lg bg-[#141C2E] border border-[#1E293B] hover:bg-[#1E293B] text-slate-200 hover:text-white font-bold text-xs transition-all"
                    >
                      View Client
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending Withdrawal Claims */}
        <div className="p-6 rounded-2xl bg-[#0D131F] border border-[#1E293B]">
          <div className="flex items-center justify-between pb-4 border-b border-[#1E293B]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Monthly Payout Claims Due ({pendingWithdrawals.length})
              </h3>
            </div>
            <button
              onClick={() => setActiveTab("withdrawals")}
              className="text-xs text-[#D4AF37] hover:underline font-semibold flex items-center gap-1"
            >
              Disbursement Desk <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {pendingWithdrawals.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No pending withdrawal disbursements.
              </p>
            ) : (
              pendingWithdrawals.map((wd) => (
                <div
                  key={wd.id}
                  className="p-3.5 rounded-xl bg-[#080C14] border border-[#1E293B] flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {wd.clientName}
                    </h4>
                    <p className="text-xs text-slate-400">
                      Month {wd.monthIndex} of 14 • {wd.bankAccount}
                    </p>
                    <p className="text-[11px] text-emerald-400 mt-0.5">
                      Fee waived for on-time withdrawal
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black text-white">
                      {formatINR(wd.amount)}
                    </div>
                    <button
                      onClick={() => setActiveTab("withdrawals")}
                      className="mt-1 px-3 py-1 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-black font-bold text-[11px] hover:brightness-110"
                    >
                      Process Payout
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Institutional Audit Log Feed */}
      <div className="p-6 rounded-2xl bg-[#0D131F] border border-[#1E293B]">
        <div className="flex items-center justify-between pb-4 border-b border-[#1E293B]">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Recent Administrative Actions
          </h3>
          <button
            onClick={() => setActiveTab("audit")}
            className="text-xs text-[#D4AF37] hover:underline font-semibold"
          >
            View Complete Log ({auditLogs.length})
          </button>
        </div>

        <div className="mt-4 divide-y divide-[#1E293B]">
          {auditLogs.slice(0, 4).map((log) => (
            <div
              key={log.id}
              className="py-3 flex items-start justify-between gap-4"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">
                    {log.action}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {log.timestamp}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{log.details}</p>
              </div>
              <span className="text-[11px] font-medium text-slate-500 shrink-0">
                {log.adminName}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
