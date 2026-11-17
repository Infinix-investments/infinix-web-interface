"use client";

import React, { useState, useMemo } from "react";
import {
  FileSpreadsheet,
  Download,
  Filter,
  Search,
  Calendar,
  Users,
  TrendingUp,
  CreditCard,
  History,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  FileText,
  ShieldCheck,
  Phone,
  ArrowDownToLine,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { useAdmin } from "@/context/admin-context";
import { formatUSDT } from "@/utils/currency";
import { calculateCompletedDays } from "@/utils/date";
import {
  computeClientExtendedMetrics,
  generateMasterExcelWorkbook,
  triggerFileDownload,
  ReportFilterOptions,
} from "@/utils/excel-export";

interface ReportsViewProps {
  onOpenAssignModal?: (clientId: string) => void;
}

export function ReportsView({ onOpenAssignModal }: ReportsViewProps) {
  const { clients, plans, withdrawals, referrals, auditLogs } = useAdmin();

  // Filter States
  const [reportType, setReportType] = useState<
    "master" | "clients" | "contracts" | "withdrawals" | "referrals" | "audit"
  >("master");
  const [searchQuery, setSearchQuery] = useState("");
  const [datePreset, setDatePreset] = useState<
    "all" | "today" | "7days" | "30days" | "thisMonth" | "lastMonth" | "custom"
  >("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [minAumFilter, setMinAumFilter] = useState<number>(0);
  const [quickPreset, setQuickPreset] = useState<string>("all");

  // Export Progress State
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState("");
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4500);
  };

  // Quick Preset Click Handler
  const handleApplyPreset = (preset: string) => {
    setQuickPreset(preset);
    if (preset === "all") {
      setReportType("master");
      setSearchQuery("");
      setStatusFilter("all");
      setTierFilter("all");
      setMinAumFilter(0);
      setDatePreset("all");
    } else if (preset === "pending_wd") {
      setReportType("withdrawals");
      setStatusFilter("pending_approval");
      setSearchQuery("");
      setMinAumFilter(0);
    } else if (preset === "active_investors") {
      setReportType("clients");
      setStatusFilter("active");
      setMinAumFilter(1);
    } else if (preset === "unverified_phone") {
      setReportType("clients");
      setStatusFilter("pending_phone");
      setMinAumFilter(0);
    } else if (preset === "hnw") {
      setReportType("clients");
      setMinAumFilter(1000);
      setStatusFilter("all");
    } else if (preset === "recent_30") {
      setDatePreset("30days");
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setDatePreset("all");
    setCustomStartDate("");
    setCustomEndDate("");
    setStatusFilter("all");
    setTierFilter("all");
    setMinAumFilter(0);
    setQuickPreset("all");
  };

  // Filter Clients
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          c.firstName.toLowerCase().includes(q) ||
          c.lastName.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.phone && c.phone.toLowerCase().includes(q)) ||
          c.id.toLowerCase().includes(q) ||
          (c.clientId && c.clientId.toLowerCase().includes(q)) ||
          (c.referralCode && c.referralCode.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // Tier
      if (tierFilter !== "all") {
        if ((c.tier || "standard").toLowerCase() !== tierFilter.toLowerCase()) {
          return false;
        }
      }

      // Status
      if (statusFilter !== "all") {
        if (statusFilter === "pending_phone") {
          const hasPhone = c.phone && c.phone.trim().length >= 7;
          if (c.isPhoneVerified && hasPhone) return false;
        } else if (statusFilter === "active") {
          const cap = Number(c.assignedPlanAmount || c.totalAum || 0);
          if (c.assignedPlanStatus !== "active" && cap <= 0) return false;
        } else if (statusFilter === "pending_assignment") {
          if (c.assignedPlanStatus === "active") return false;
        }
      }

      // Min AUM
      if (minAumFilter > 0) {
        const cap = Number(c.assignedPlanAmount || c.totalAum || 0);
        if (cap < minAumFilter) return false;
      }

      // Date Range on JoinedDate
      if (datePreset !== "all" && c.joinedDate) {
        const joinDate = new Date(c.joinedDate);
        if (!isNaN(joinDate.getTime())) {
          const now = new Date();
          if (datePreset === "7days") {
            const diffDays = calculateCompletedDays(c.joinedDate);
            if (diffDays > 7) return false;
          } else if (datePreset === "30days") {
            const diffDays = calculateCompletedDays(c.joinedDate);
            if (diffDays > 30) return false;
          } else if (datePreset === "thisMonth") {
            if (
              joinDate.getMonth() !== now.getMonth() ||
              joinDate.getFullYear() !== now.getFullYear()
            ) {
              return false;
            }
          } else if (datePreset === "custom" && customStartDate) {
            const sDate = new Date(customStartDate);
            if (joinDate < sDate) return false;
            if (customEndDate) {
              const eDate = new Date(customEndDate);
              if (joinDate > eDate) return false;
            }
          }
        }
      }

      return true;
    });
  }, [
    clients,
    searchQuery,
    tierFilter,
    statusFilter,
    minAumFilter,
    datePreset,
    customStartDate,
    customEndDate,
  ]);

  // Scoped Contracts
  const scopedContracts = useMemo(() => {
    const list: any[] = [];
    filteredClients.forEach((client) => {
      const metrics = computeClientExtendedMetrics(
        client,
        clients,
        withdrawals,
        referrals
      );
      const contracts =
        metrics.activeContracts.length > 0
          ? metrics.activeContracts
          : metrics.totalCapital > 0
          ? [
              {
                id: `contract-${client.id}`,
                planName: client.assignedPlanName || "14-Month Wealth Accelerator",
                capitalAmount: metrics.totalCapital,
                startDate: client.assignedPlanStartDate || client.joinedDate,
                durationMonths: 14,
                dailyReturnPct: 0.5,
                monthlyReturnPct: 15.0,
                status: client.assignedPlanStatus || "active",
                paymentReference: "Primary Contract Allocation",
              },
            ]
          : [];

      contracts.forEach((c: any) => {
        const cap = Number(c.capitalAmount || 0);
        const days = calculateCompletedDays(c.startDate);
        const dur = c.durationMonths || 14;
        const maxDays = dur * 30;
        const effDays = Math.min(maxDays, days);
        const dailyRate = c.dailyReturnPct ?? 0.5;
        const monthlyRate = c.monthlyReturnPct ?? 15.0;
        const dailyProfit = cap * (dailyRate / 100);
        const accruedProfit = dailyProfit * effDays;

        list.push({
          ...c,
          clientId: client.id,
          clientName: `${client.firstName} ${client.lastName}`,
          clientEmail: client.email,
          capital: cap,
          daysElapsed: days,
          dailyProfit,
          accruedProfit,
          monthlyPayout: cap * (monthlyRate / 100),
        });
      });
    });
    return list;
  }, [filteredClients, clients, withdrawals, referrals]);

  // Scoped Withdrawals
  const scopedWithdrawals = useMemo(() => {
    return withdrawals.filter((w) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          w.clientName.toLowerCase().includes(q) ||
          w.clientId.toLowerCase().includes(q) ||
          (w.bankAccount && w.bankAccount.toLowerCase().includes(q)) ||
          (w.notes && w.notes.toLowerCase().includes(q));
        if (!matches) return false;
      }
      if (statusFilter !== "all" && statusFilter !== "pending_phone") {
        if (w.status !== statusFilter) return false;
      }
      return true;
    });
  }, [withdrawals, searchQuery, statusFilter]);

  // Scoped Referrals
  const scopedReferrals = useMemo(() => {
    return referrals.filter((r) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          (r.referrerName && r.referrerName.toLowerCase().includes(q)) ||
          (r.refereeName && r.refereeName.toLowerCase().includes(q)) ||
          (r.referrerCode && r.referrerCode.toLowerCase().includes(q)) ||
          r.referrerId.toLowerCase().includes(q) ||
          r.refereeId.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [referrals, searchQuery]);

  // Scoped Audit Logs
  const scopedAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          log.details.toLowerCase().includes(q) ||
          log.action.toLowerCase().includes(q) ||
          (log.adminName && log.adminName.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [auditLogs, searchQuery]);

  // KPI Aggregates for Filtered Data
  const aggregates = useMemo(() => {
    let totalAum = 0;
    let totalAccrued = 0;
    let totalDisbursed = 0;
    let totalPending = 0;
    let totalReady = 0;
    let totalReferral = 0;

    filteredClients.forEach((c) => {
      const m = computeClientExtendedMetrics(c, clients, withdrawals, referrals);
      totalAum += m.totalCapital;
      totalAccrued += m.totalAccruedYield;
      totalDisbursed += m.totalSettledDisbursed;
      totalPending += m.totalPendingClaims;
      totalReady += m.availableBalance;
      totalReferral += m.totalReferralBonus;
    });

    return {
      totalClientsCount: filteredClients.length,
      totalContractsCount: scopedContracts.length,
      totalWithdrawalsCount: scopedWithdrawals.length,
      totalAum,
      totalAccrued,
      totalDisbursed,
      totalPending,
      totalReady,
      totalReferral,
    };
  }, [filteredClients, scopedContracts, scopedWithdrawals, clients, withdrawals, referrals]);

  // Trigger ExcelJS Master Export
  const handleExportMaster = async () => {
    try {
      setIsExporting(true);
      setExportMessage("Compiling institutional master dataset & styles...");

      const filterOptions: ReportFilterOptions = {
        searchQuery: searchQuery.trim() || undefined,
        reportType,
        dateRangePreset: datePreset,
        statusFilter: statusFilter !== "all" ? statusFilter : undefined,
        tierFilter: tierFilter !== "all" ? tierFilter : undefined,
        minAum: minAumFilter > 0 ? minAumFilter : undefined,
      };

      const blob = await generateMasterExcelWorkbook(
        clients,
        plans,
        withdrawals,
        referrals,
        auditLogs,
        filterOptions
      );

      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `INFINIX_Institutional_Master_Report_${timestamp}.xlsx`;

      triggerFileDownload(blob, filename);

      showToast(`Master Institutional Report successfully exported (${filename})`);
    } catch (err: any) {
      console.error("Export error:", err);
      showToast(err.message || "Export failed. Please try again.");
    } finally {
      setIsExporting(false);
      setExportMessage("");
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Toast Notification */}
      {toast && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-semibold text-xs flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
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

      {/* Hero Header Section */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-[#0D131F] via-[#080C14] to-[#141C2E] border border-[#1E293B] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] shadow-lg shadow-[#D4AF37]/10">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-[11px] font-bold uppercase tracking-wider">
                Institutional Reporting Engine
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Master Reports & Data Export Desk
            </h1>
            <p className="text-xs md:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Export comprehensive audited financial master data formatted with
              the signature INFINIX Gold executive palette. Supports multi-worksheet
              workbooks, granular date range filters, yield accruals, and regulatory audit trails.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleExportMaster}
              disabled={isExporting}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#F59E0B] to-[#D4AF37] text-black font-extrabold text-sm hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-[#D4AF37]/20 flex items-center gap-2 group disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  <span>{exportMessage || "Generating Styled Excel..."}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-black group-hover:translate-y-0.5 transition-transform" />
                  <span>⚡ Export Master Excel (.xlsx)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preset Quick Filters Pills */}
        <div className="mt-6 pt-5 border-t border-[#1E293B] flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap flex items-center gap-1.5 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Quick Presets:</span>
          </span>

          {[
            { id: "all", label: "🌟 All Master Data" },
            { id: "pending_wd", label: "⏳ Pending Withdrawals" },
            { id: "active_investors", label: "📈 Active Investors with Capital" },
            { id: "unverified_phone", label: "📱 Unverified Phone Accounts" },
            { id: "hnw", label: "💎 High Net Worth (AUM ≥ $1k)" },
            { id: "recent_30", label: "🗓️ Recent Joined (30 Days)" },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleApplyPreset(preset.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                quickPreset === preset.id
                  ? "bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/20"
                  : "bg-[#080C14] hover:bg-[#141C2E] border border-[#1E293B] text-slate-300 hover:text-white"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* 6 Executive KPI Cards based on Active Filter Scope */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-[#0D131F] border border-[#1E293B] space-y-1 shadow-lg">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Scoped Clients</span>
            <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
          </div>
          <div className="text-xl font-black text-white">
            {aggregates.totalClientsCount}
          </div>
          <div className="text-[10px] text-slate-400">
            {aggregates.totalContractsCount} active contracts
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0D131F] border border-[#1E293B] space-y-1 shadow-lg">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Scoped AUM</span>
            <TrendingUp className="w-3.5 h-3.5 text-[#D4AF37]" />
          </div>
          <div className="text-xl font-black text-white">
            {formatUSDT(aggregates.totalAum)}
          </div>
          <div className="text-[10px] text-emerald-400">Total Active Capital</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0D131F] border border-[#1E293B] space-y-1 shadow-lg">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Accrued Yield</span>
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-400">
            +{formatUSDT(aggregates.totalAccrued)}
          </div>
          <div className="text-[10px] text-slate-400">Cumulative Earned</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0D131F] border border-[#1E293B] space-y-1 shadow-lg">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Disbursed Yield</span>
            <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-black text-slate-200">
            {formatUSDT(aggregates.totalDisbursed)}
          </div>
          <div className="text-[10px] text-slate-400">Settled payouts</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0D131F] border border-[#1E293B] space-y-1 shadow-lg">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Ready to Withdraw</span>
            <CreditCard className="w-3.5 h-3.5 text-[#D4AF37]" />
          </div>
          <div className="text-xl font-black text-[#D4AF37]">
            {formatUSDT(aggregates.totalReady)}
          </div>
          <div className="text-[10px] text-emerald-400">Net available</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0D131F] border border-[#1E293B] space-y-1 shadow-lg">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Pending Claims</span>
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-black text-amber-400">
            {formatUSDT(aggregates.totalPending)}
          </div>
          <div className="text-[10px] text-slate-400">Awaiting Settlement</div>
        </div>
      </div>

      {/* Interactive Filter Control Panel */}
      <div className="p-6 rounded-3xl bg-[#0D131F] border border-[#1E293B] space-y-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1E293B]">
          {/* Report Category Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "master", label: "🏛️ Master All Data", icon: FileSpreadsheet },
              { id: "clients", label: "👥 Clients", icon: Users },
              { id: "contracts", label: "📈 Contracts", icon: TrendingUp },
              { id: "withdrawals", label: "💳 Withdrawals", icon: CreditCard },
              { id: "referrals", label: "🤝 Referrals", icon: FileText },
              { id: "audit", label: "🛡️ Audit Trail", icon: History },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setReportType(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  reportType === tab.id
                    ? "bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/20 font-black"
                    : "bg-[#080C14] hover:bg-[#141C2E] border border-[#1E293B] text-slate-300 hover:text-white"
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetFilters}
              className="px-3 py-2 rounded-xl bg-[#080C14] hover:bg-[#141C2E] border border-[#1E293B] text-slate-400 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>

        {/* Inputs & Dropdowns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* 1. Search Query */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Search className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Keyword Search</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Name, email, phone, ID, UTR..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#080C14] border border-[#1E293B] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#D4AF37]/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* 2. Date Range Filter */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Date Range</span>
            </label>
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#080C14] border border-[#1E293B] text-white text-xs focus:outline-none focus:border-[#D4AF37]/50"
            >
              <option value="all">All Historical Time</option>
              <option value="today">Today Only</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="thisMonth">This Current Month</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {/* 3. Status Filter */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Status Filter</span>
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#080C14] border border-[#1E293B] text-white text-xs focus:outline-none focus:border-[#D4AF37]/50"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Plan Allocated</option>
              <option value="pending_phone">Pending Mobile Verification</option>
              <option value="pending_approval">Pending Withdrawal Claim</option>
              <option value="disbursed">Disbursed / Settled Claim</option>
              <option value="rejected">Rejected Claim</option>
            </select>
          </div>

          {/* 4. Investor Tier */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Investor Tier</span>
            </label>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#080C14] border border-[#1E293B] text-white text-xs focus:outline-none focus:border-[#D4AF37]/50"
            >
              <option value="all">All Investor Tiers</option>
              <option value="standard">Standard Investor</option>
              <option value="hnw">High Net Worth (HNW)</option>
              <option value="uhnw">Ultra HNW (UHNW)</option>
              <option value="institutional">Institutional Escrow</option>
            </select>
          </div>

          {/* 5. Minimum AUM Threshold */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Min Capital (USDT)</span>
            </label>
            <select
              value={minAumFilter}
              onChange={(e) => setMinAumFilter(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#080C14] border border-[#1E293B] text-white text-xs focus:outline-none focus:border-[#D4AF37]/50"
            >
              <option value="0">Any Capital Amount ($0+)</option>
              <option value="500">Min 500 USDT</option>
              <option value="1000">Min 1,000 USDT</option>
              <option value="2000">Min 2,000 USDT</option>
              <option value="5000">Min 5,000 USDT</option>
              <option value="10000">Min 10,000 USDT</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range Inputs if "custom" selected */}
        {datePreset === "custom" && (
          <div className="pt-3 border-t border-[#1E293B]/70 flex items-center gap-3 flex-wrap">
            <span className="text-xs text-slate-400 font-semibold">
              Select Custom Window:
            </span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#080C14] border border-[#1E293B] text-white text-xs focus:outline-none focus:border-[#D4AF37]/50"
            />
            <span className="text-slate-500 text-xs font-bold">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#080C14] border border-[#1E293B] text-white text-xs focus:outline-none focus:border-[#D4AF37]/50"
            />
          </div>
        )}
      </div>

      {/* Live Data Preview Table */}
      <div className="rounded-3xl bg-[#0D131F] border border-[#1E293B] shadow-2xl overflow-hidden">
        {/* Table Top Bar */}
        <div className="p-5 border-b border-[#1E293B] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-extrabold text-white">
              Live Filtered Dataset Preview
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#141C2E] border border-[#1E293B] text-slate-300 font-mono text-[11px] font-bold">
              {reportType === "master" || reportType === "clients"
                ? `${filteredClients.length} Clients`
                : reportType === "contracts"
                ? `${scopedContracts.length} Contracts`
                : reportType === "withdrawals"
                ? `${scopedWithdrawals.length} Claims`
                : reportType === "referrals"
                ? `${scopedReferrals.length} Referrals`
                : `${scopedAuditLogs.length} Logs`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportMaster}
              disabled={isExporting}
              className="px-4 py-2 rounded-xl bg-[#141C2E] hover:bg-[#1E293B] border border-[#D4AF37]/40 text-[#D4AF37] font-bold text-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Selected Dataset (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Table Scrollable Container */}
        <div className="overflow-x-auto max-h-[580px]">
          {(reportType === "master" || reportType === "clients") && (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-[#080C14] sticky top-0 z-10 border-b border-[#1E293B]">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Client ID</th>
                  <th className="py-3.5 px-4 font-bold">Investor Name</th>
                  <th className="py-3.5 px-4 font-bold">Mobile Phone</th>
                  <th className="py-3.5 px-4 font-bold text-center">Tier</th>
                  <th className="py-3.5 px-4 font-bold text-center">Plans</th>
                  <th className="py-3.5 px-4 font-bold text-right">Active AUM</th>
                  <th className="py-3.5 px-4 font-bold text-right">Accrued Yield</th>
                  <th className="py-3.5 px-4 font-bold text-right">Settled Payouts</th>
                  <th className="py-3.5 px-4 font-bold text-right">Ready to Withdraw</th>
                  <th className="py-3.5 px-4 font-bold text-center">Custody Wallet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]/50 font-medium">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="py-12 text-center text-slate-500 space-y-2"
                    >
                      <AlertCircle className="w-8 h-8 text-slate-600 mx-auto" />
                      <div>No client records match the current filter criteria.</div>
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => {
                    const metrics = computeClientExtendedMetrics(
                      client,
                      clients,
                      withdrawals,
                      referrals
                    );

                    return (
                      <tr
                        key={client.id}
                        className="hover:bg-[#141C2E]/60 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-[#D4AF37]">
                          #{client.id}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-white">
                            {client.firstName} {client.lastName}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {client.email}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {client.phone ? (
                            <span className="flex items-center gap-1 text-slate-300">
                              <Phone className="w-3 h-3 text-slate-500" />
                              <span>{client.phone}</span>
                            </span>
                          ) : (
                            <span className="text-amber-400 text-[10px]">
                              No Phone
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 text-[10px] font-bold uppercase">
                            {client.tier || "Standard"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold">
                          {metrics.activeContractsCount}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-white">
                          {formatUSDT(metrics.totalCapital)}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-emerald-400">
                          +{formatUSDT(metrics.totalAccruedYield)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-300">
                          {formatUSDT(metrics.totalSettledDisbursed)}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-[#D4AF37]">
                          {formatUSDT(metrics.availableBalance)}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-400">
                          {client.bankAccount
                            ? `${client.bankAccount.slice(0, 10)}...`
                            : "USDT TRC20"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {reportType === "contracts" && (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-[#080C14] sticky top-0 z-10 border-b border-[#1E293B]">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Contract ID</th>
                  <th className="py-3.5 px-4 font-bold">Investor Name</th>
                  <th className="py-3.5 px-4 font-bold">Plan Name</th>
                  <th className="py-3.5 px-4 font-bold text-right">Capital</th>
                  <th className="py-3.5 px-4 font-bold text-center">Start Date</th>
                  <th className="py-3.5 px-4 font-bold text-center">Elapsed</th>
                  <th className="py-3.5 px-4 font-bold text-right">Daily Yield</th>
                  <th className="py-3.5 px-4 font-bold text-right">Accrued Yield</th>
                  <th className="py-3.5 px-4 font-bold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]/50 font-medium">
                {scopedContracts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      No active contracts found matching filter.
                    </td>
                  </tr>
                ) : (
                  scopedContracts.map((c, idx) => (
                    <tr
                      key={c.id || idx}
                      className="hover:bg-[#141C2E]/60 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-[#D4AF37]">
                        #{c.id}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        {c.clientName}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-200">
                        {c.planName}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-white">
                        {formatUSDT(c.capital)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        {c.startDate || "—"}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-300">
                        {c.daysElapsed} days
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-400">
                        +{formatUSDT(c.dailyProfit)}/day
                      </td>
                      <td className="py-3 px-4 text-right font-black text-emerald-400">
                        +{formatUSDT(c.accruedProfit)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase">
                          {c.status || "active"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {reportType === "withdrawals" && (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-[#080C14] sticky top-0 z-10 border-b border-[#1E293B]">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Claim ID</th>
                  <th className="py-3.5 px-4 font-bold">Investor Name</th>
                  <th className="py-3.5 px-4 font-bold text-center">Request Date</th>
                  <th className="py-3.5 px-4 font-bold text-right">Gross Claim</th>
                  <th className="py-3.5 px-4 font-bold text-right">3% Fee</th>
                  <th className="py-3.5 px-4 font-bold text-right">Net Payout</th>
                  <th className="py-3.5 px-4 font-bold text-center">Status</th>
                  <th className="py-3.5 px-4 font-bold">Custody Account</th>
                  <th className="py-3.5 px-4 font-bold">UTR / Payment Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]/50 font-medium">
                {scopedWithdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      No withdrawal claims found matching criteria.
                    </td>
                  </tr>
                ) : (
                  scopedWithdrawals.map((w) => {
                    const gross = Number(w.grossAmount || w.amount || 0);
                    const fee = Number(w.feeAmount || Math.round(gross * 0.03 * 100) / 100);
                    const net = Number(w.netAmount || gross - fee);

                    return (
                      <tr
                        key={w.id}
                        className="hover:bg-[#141C2E]/60 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-[#D4AF37]">
                          #{w.id}
                        </td>
                        <td className="py-3 px-4 font-bold text-white">
                          {w.clientName}
                        </td>
                        <td className="py-3 px-4 text-center font-mono">
                          {w.requestDate}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-white">
                          {formatUSDT(gross)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-400">
                          {formatUSDT(fee)}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-emerald-400">
                          {formatUSDT(net)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                              w.status === "disbursed"
                                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                                : w.status === "pending_approval"
                                ? "bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse"
                                : "bg-red-500/15 border-red-500/30 text-red-400"
                            }`}
                          >
                            {w.status === "disbursed"
                              ? "Disbursed"
                              : w.status === "pending_approval"
                              ? "Pending"
                              : "Rejected"}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                          {w.bankAccount || "Direct TRC20"}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                          {w.notes || "CMS-RTGS-SETTLED"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {reportType === "referrals" && (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-[#080C14] sticky top-0 z-10 border-b border-[#1E293B]">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Referral ID</th>
                  <th className="py-3.5 px-4 font-bold">Referrer</th>
                  <th className="py-3.5 px-4 font-bold text-center">Referral Code</th>
                  <th className="py-3.5 px-4 font-bold">Referee (Investor)</th>
                  <th className="py-3.5 px-4 font-bold text-right">Invested Capital</th>
                  <th className="py-3.5 px-4 font-bold text-center">Rate</th>
                  <th className="py-3.5 px-4 font-bold text-right">Earned Commission</th>
                  <th className="py-3.5 px-4 font-bold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]/50 font-medium">
                {scopedReferrals.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      No referral records found.
                    </td>
                  </tr>
                ) : (
                  scopedReferrals.map((r) => {
                    const referrer = clients.find(
                      (c) => c.id === r.referrerId || c.clientId === r.referrerId
                    );
                    const referee = clients.find(
                      (c) => c.id === r.refereeId || c.clientId === r.refereeId
                    );
                    const cap = Number(r.capitalAmount || referee?.assignedPlanAmount || 0);
                    const comm = Number(r.totalEarnedAmount || r.monthlyCommissionAmount || Math.round(cap * 0.05 * 100) / 100);

                    return (
                      <tr
                        key={r.id}
                        className="hover:bg-[#141C2E]/60 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-[#D4AF37]">
                          #{r.id}
                        </td>
                        <td className="py-3 px-4 font-bold text-white">
                          {referrer
                            ? `${referrer.firstName} ${referrer.lastName}`
                            : r.referrerName || "—"}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-[#D4AF37] font-bold">
                          {r.referrerCode || referrer?.referralCode || "—"}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-200">
                          {referee
                            ? `${referee.firstName} ${referee.lastName}`
                            : r.refereeName || "—"}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-white">
                          {formatUSDT(cap)}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-purple-400">
                          5.00%
                        </td>
                        <td className="py-3 px-4 text-right font-black text-emerald-400">
                          +{formatUSDT(comm)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase">
                            {r.status || "active"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {reportType === "audit" && (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-[#080C14] sticky top-0 z-10 border-b border-[#1E293B]">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Timestamp (UTC)</th>
                  <th className="py-3.5 px-4 font-bold">Administrator</th>
                  <th className="py-3.5 px-4 font-bold">Action Taken</th>
                  <th className="py-3.5 px-4 font-bold text-center">Category</th>
                  <th className="py-3.5 px-4 font-bold">Details & Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]/50 font-medium">
                {scopedAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      No audit logs match criteria.
                    </td>
                  </tr>
                ) : (
                  scopedAuditLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-[#141C2E]/60 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                        {log.adminName || "Administrator"}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-200">
                        {log.action}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-bold uppercase">
                          {log.category || "GENERAL"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 leading-relaxed">
                        {log.details}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
