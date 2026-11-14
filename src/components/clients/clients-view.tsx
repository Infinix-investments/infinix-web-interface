'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  AlertCircle,
  PlusCircle,
  Trash2,
  Phone,
  Mail,
  Building,
  Award,
  Share2,
  Eye,
  TrendingUp,
  Percent,
  ArrowUpDown,
  RotateCcw,
  User,
  Users,
  DollarSign,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useAdmin } from '@/context/admin-context';
import { ClientProfile } from '@/types/admin';
import { ClientDetailView } from './client-detail-view';
import { formatUSDT } from '@/utils/currency';
import {
  computeClientReferralStats,
  REFERRAL_LEVEL_RULES,
} from '@/utils/referral';

interface ClientsViewProps {
  onOpenAssignModal: (clientId?: string, planId?: string) => void;
  onOpenNewClientModal: () => void;
}

const isPhoneAdded = (phone?: string) =>
  Boolean(phone && phone.trim().length > 0 && phone.trim().toLowerCase() !== 'n/a' && phone.trim() !== '—');

export function ClientsView({
  onOpenAssignModal,
  onOpenNewClientModal,
}: ClientsViewProps) {
  const {
    clients,
    plans,
    referrals,
    selectedClientId,
    setSelectedClientId,
    revokeClientPlan,
  } = useAdmin();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<
    'all' | 'active_plan' | 'pending_plan' | 'pending_verification' | 'phone_verified' | 'referral_partners'
  >('all');
  const [sortBy, setSortBy] = useState<
    'recent' | 'aum_desc' | 'aum_asc' | 'name_asc' | 'name_desc' | 'yield_desc' | 'referrals_desc'
  >('recent');
  const [tierFilter, setTierFilter] = useState<'all' | 'standard' | 'premium' | 'high_net_worth' | 'ultra_hnw'>('all');
  const [actionToast, setActionToast] = useState('');

  const showToast = (msg: string) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(''), 4500);
  };

  const handleRevoke = (clientId: string) => {
    if (confirm('Are you sure you want to revoke the active plan from this investor?')) {
      const res = revokeClientPlan(clientId);
      if (res.success) {
        showToast(res.message);
      }
    }
  };

  const formatINR = (val?: number) => {
    return formatUSDT(val);
  };

  // Calculate live summary stats across all clients
  const stats = useMemo(() => {
    let totalAum = 0;
    let activePlansCount = 0;
    let pendingPlansCount = 0;
    let noPhoneCount = 0;
    let phoneVerifiedCount = 0;
    let referralPartnersCount = 0;
    let totalMonthlyLiability = 0;

    clients.forEach((c) => {
      const clientActivePlans = Array.isArray(c.activePlans) && c.activePlans.length > 0
        ? c.activePlans.filter((p) => p.status === 'active')
        : [];

      const cap = clientActivePlans.length > 0
        ? clientActivePlans.reduce((sum, p) => sum + (Number(p.capitalAmount) || 0), 0)
        : (c.assignedPlanAmount || 0);

      if (c.assignedPlanStatus === 'active' && cap > 0) {
        totalAum += cap;
        activePlansCount += 1;
        totalMonthlyLiability += (cap * 15) / 100;
      } else {
        pendingPlansCount += 1;
      }

      if (!isPhoneAdded(c.phone)) {
        noPhoneCount += 1;
      } else {
        phoneVerifiedCount += 1;
      }

      const refStats = computeClientReferralStats(c, clients, referrals);
      if (refStats.totalReferred > 0) {
        referralPartnersCount += 1;
      }
    });

    return {
      totalClients: clients.length,
      totalAum,
      activePlansCount,
      pendingPlansCount,
      noPhoneCount,
      phoneVerifiedCount,
      referralPartnersCount,
      totalMonthlyLiability,
    };
  }, [clients, referrals]);

  // Filter and Sort Clients
  const processedClients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = clients.filter((c) => {
      const refStats = computeClientReferralStats(c, clients, referrals);
      const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
      const clientActivePlans = Array.isArray(c.activePlans) && c.activePlans.length > 0
        ? c.activePlans.filter((p) => p.status === 'active')
        : [];
      const planNames = clientActivePlans.map((p) => (p.planName || '').toLowerCase()).join(' ') +
        ' ' + (c.assignedPlanName || '').toLowerCase();

      // Search match
      const matchesSearch =
        !q ||
        fullName.includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.id && c.id.toLowerCase().includes(q)) ||
        (c.clientId && c.clientId.toLowerCase().includes(q)) ||
        (c.referralCode && c.referralCode.toLowerCase().includes(q)) ||
        (c.referredByCode && c.referredByCode.toLowerCase().includes(q)) ||
        (c.bankAccount && c.bankAccount.toLowerCase().includes(q)) ||
        planNames.includes(q);

      if (!matchesSearch) return false;

      // Tier filter
      if (tierFilter !== 'all' && (c.tier || 'standard') !== tierFilter) {
        return false;
      }

      // Filter tabs
      if (filterTab === 'active_plan') return c.assignedPlanStatus === 'active' && (c.assignedPlanAmount || 0) > 0;
      if (filterTab === 'pending_plan') return c.assignedPlanStatus !== 'active' || !c.assignedPlanId;
      if (filterTab === 'pending_verification') return !isPhoneAdded(c.phone);
      if (filterTab === 'phone_verified') return isPhoneAdded(c.phone);
      if (filterTab === 'referral_partners') return refStats.totalReferred > 0;

      return true;
    });

    // Sorting
    return filtered.sort((a, b) => {
      const aPlans = Array.isArray(a.activePlans) && a.activePlans.length > 0
        ? a.activePlans.filter((p) => p.status === 'active')
        : [];
      const bPlans = Array.isArray(b.activePlans) && b.activePlans.length > 0
        ? b.activePlans.filter((p) => p.status === 'active')
        : [];

      const aAum = aPlans.length > 0
        ? aPlans.reduce((sum, p) => sum + (Number(p.capitalAmount) || 0), 0)
        : (a.assignedPlanAmount || 0);

      const bAum = bPlans.length > 0
        ? bPlans.reduce((sum, p) => sum + (Number(p.capitalAmount) || 0), 0)
        : (b.assignedPlanAmount || 0);

      if (sortBy === 'aum_desc') return bAum - aAum;
      if (sortBy === 'aum_asc') return aAum - bAum;

      if (sortBy === 'name_asc') {
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      }
      if (sortBy === 'name_desc') {
        return `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`);
      }

      if (sortBy === 'yield_desc') {
        const aYield = (aAum * 15) / 100;
        const bYield = (bAum * 15) / 100;
        return bYield - aYield;
      }

      if (sortBy === 'referrals_desc') {
        const aRefs = computeClientReferralStats(a, clients, referrals).totalReferred;
        const bRefs = computeClientReferralStats(b, clients, referrals).totalReferred;
        return bRefs - aRefs;
      }

      // Default: recent by joinedDate / ID
      const aDate = new Date(a.joinedDate || '2026-01-01').getTime();
      const bDate = new Date(b.joinedDate || '2026-01-01').getTime();
      if (bDate !== aDate) return bDate - aDate;
      return b.id.localeCompare(a.id);
    });
  }, [clients, referrals, searchQuery, filterTab, sortBy, tierFilter]);

  const hasActiveFilters = searchQuery || filterTab !== 'all' || sortBy !== 'recent' || tierFilter !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setFilterTab('all');
    setSortBy('recent');
    setTierFilter('all');
  };

  // If a client is selected, render their individual page view
  if (selectedClientId) {
    return (
      <ClientDetailView
        clientId={selectedClientId}
        onBack={() => setSelectedClientId(null)}
        onOpenAssignModal={onOpenAssignModal}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {actionToast && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-semibold text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{actionToast}</span>
          </div>
          <button
            onClick={() => setActionToast('')}
            className="text-emerald-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Executive KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-[#0D131F] border border-[#1E293B] shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Clients</span>
            <Users className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div className="text-xl font-black text-white mt-1.5">{stats.totalClients}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Enrolled Profiles</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0D131F] border border-[#1E293B] shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Active AUM</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-400 mt-1.5">{formatINR(stats.totalAum)}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{stats.activePlansCount} Active Investors</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0D131F] border border-[#1E293B] shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Monthly Payout Liability</span>
            <DollarSign className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div className="text-xl font-black text-white mt-1.5">{formatINR(stats.totalMonthlyLiability)}/mo</div>
          <div className="text-[10px] text-slate-400 mt-0.5">15% Contractual Yield</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0D131F] border border-[#1E293B] shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Referral Partners</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-black text-purple-400 mt-1.5">{stats.referralPartnersCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Active Downline Partners</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0D131F] border border-[#1E293B] shadow-lg col-span-2 md:col-span-4 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Pending Action</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-black text-amber-400 mt-1.5">{stats.pendingPlansCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Awaiting Plan Assignment</div>
        </div>
      </div>

      {/* Top Search, Sort & Advanced Filter Console */}
      <div className="p-5 rounded-2xl bg-[#0D131F] border border-[#1E293B] space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by investor name, email, phone, client ID, referral code, or bank account..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#080C14] border border-[#1E293B] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#D4AF37]/60"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sorting Dropdown */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#080C14] border border-[#1E293B] text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="text-slate-400 text-[11px] font-bold">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-white font-semibold text-xs focus:outline-none cursor-pointer"
              >
                <option value="recent" className="bg-[#0D131F] text-white">Most Recent (Joined Date)</option>
                <option value="aum_desc" className="bg-[#0D131F] text-white">Highest Capital / AUM</option>
                <option value="aum_asc" className="bg-[#0D131F] text-white">Lowest Capital / AUM</option>
                <option value="name_asc" className="bg-[#0D131F] text-white">Investor Name (A → Z)</option>
                <option value="name_desc" className="bg-[#0D131F] text-white">Investor Name (Z → A)</option>
                <option value="yield_desc" className="bg-[#0D131F] text-white">Highest Monthly Yield</option>
                <option value="referrals_desc" className="bg-[#0D131F] text-white">Most Referrals</option>
              </select>
            </div>

            {/* Investor Tier Filter */}
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#080C14] border border-[#1E293B] text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value as any)}
                className="bg-transparent text-white font-semibold text-xs focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-[#0D131F] text-white">All Tiers</option>
                <option value="standard" className="bg-[#0D131F] text-white">Standard</option>
                <option value="premium" className="bg-[#0D131F] text-white">Premium</option>
                <option value="high_net_worth" className="bg-[#0D131F] text-white">High Net Worth (HNW)</option>
                <option value="ultra_hnw" className="bg-[#0D131F] text-white">Ultra HNW</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="px-3 py-2 rounded-xl bg-[#141C2E] hover:bg-[#1E293B] text-slate-300 hover:text-white border border-[#1E293B] text-xs font-semibold transition-all flex items-center gap-1"
                title="Reset all filters"
              >
                <RotateCcw className="w-3 h-3 text-[#D4AF37]" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterTab === 'all'
                ? 'bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/20 font-black'
                : 'bg-[#080C14] text-slate-400 hover:text-white border border-[#1E293B]'
            }`}
          >
            All Clients ({clients.length})
          </button>

          <button
            onClick={() => setFilterTab('active_plan')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterTab === 'active_plan'
                ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20 font-black'
                : 'bg-[#080C14] text-slate-400 hover:text-white border border-[#1E293B]'
            }`}
          >
            Active Wealth Plan ({stats.activePlansCount})
          </button>

          <button
            onClick={() => setFilterTab('pending_plan')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterTab === 'pending_plan'
                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20 font-black'
                : 'bg-[#080C14] text-slate-400 hover:text-white border border-[#1E293B]'
            }`}
          >
            Awaiting Plan Start ({stats.pendingPlansCount})
          </button>

          <button
            onClick={() => setFilterTab('pending_verification')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterTab === 'pending_verification'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 font-black'
                : 'bg-[#080C14] text-slate-400 hover:text-white border border-[#1E293B]'
            }`}
          >
            No Phone Added ({stats.noPhoneCount})
          </button>

          <button
            onClick={() => setFilterTab('phone_verified')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterTab === 'phone_verified'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20 font-black'
                : 'bg-[#080C14] text-slate-400 hover:text-white border border-[#1E293B]'
            }`}
          >
            Phone Added ({stats.phoneVerifiedCount})
          </button>

          <button
            onClick={() => setFilterTab('referral_partners')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterTab === 'referral_partners'
                ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20 font-black'
                : 'bg-[#080C14] text-slate-400 hover:text-white border border-[#1E293B]'
            }`}
          >
            Referral Partners ({stats.referralPartnersCount})
          </button>
        </div>
      </div>

      {/* Main Clients Table */}
      <div className="rounded-2xl bg-[#0D131F] border border-[#1E293B] overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#D4AF37]" />
            <h3 className="font-bold text-white text-sm">
              Client Management Roster ({processedClients.length} of {clients.length})
            </h3>
          </div>
          {hasActiveFilters && (
            <span className="text-xs text-slate-400">
              Filtered results
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1E293B] bg-[#080C14]/90 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-5">Client / Investor</th>
                <th className="py-4 px-5">Phone Status</th>
                <th className="py-4 px-5">Assigned Plan & AUM</th>
                <th className="py-4 px-5">Referral Code & Level</th>
                <th className="py-4 px-5">Settlement Account</th>
                {/* DEDICATED VIEW CLIENT COLUMN AS REQUESTED */}
                <th className="py-4 px-5 text-center">View Client</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B] text-xs">
              {processedClients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#141C2E] border border-[#1E293B] text-slate-500 flex items-center justify-center mx-auto">
                      <Search className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-bold text-white">No Clients Found</div>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      No registered clients match the current search query or active filter criteria.
                    </p>
                    <button
                      onClick={resetFilters}
                      className="px-4 py-2 rounded-xl bg-[#141C2E] hover:bg-[#1E293B] text-white text-xs font-bold border border-[#1E293B] transition-all"
                    >
                      Clear All Filters
                    </button>
                  </td>
                </tr>
              ) : (
                processedClients.map((client) => {
                  const assignedPlan = plans.find(
                    (p) =>
                      p.id === client.assignedPlanId ||
                      (p as any).planId === client.assignedPlanId ||
                      (client.assignedPlanName &&
                        p.planName.toLowerCase() === client.assignedPlanName.toLowerCase())
                  );
                  const planDuration = assignedPlan?.durationMonths ?? 14;
                  const planMonthlyPct = assignedPlan?.monthlyReturnPct ?? 15.0;

                  const clientActivePlans = Array.isArray(client.activePlans) && client.activePlans.length > 0
                    ? client.activePlans.filter((p) => p.status === 'active')
                    : [];

                  const totalPlanCapital = clientActivePlans.length > 0
                    ? clientActivePlans.reduce((sum, p) => sum + (Number(p.capitalAmount) || 0), 0)
                    : (client.assignedPlanAmount || 0);

                  const monthlyPayout = clientActivePlans.length > 0
                    ? clientActivePlans.reduce((sum, p) => sum + ((Number(p.capitalAmount) || 0) * (p.monthlyReturnPct ?? 15.0)) / 100, 0)
                    : totalPlanCapital
                    ? (totalPlanCapital * planMonthlyPct) / 100
                    : 0;

                  // Live referral calculations
                  const refStats = computeClientReferralStats(client, clients, referrals);
                  const levelRule =
                    REFERRAL_LEVEL_RULES.find((r) => r.level === refStats.level) ||
                    REFERRAL_LEVEL_RULES[0];

                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-[#141C2E]/60 transition-colors group"
                    >
                      {/* Name & Contact */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1E293B] to-[#080C14] border border-[#1E293B] flex items-center justify-center text-white font-black text-xs shrink-0 group-hover:border-[#D4AF37]/50 transition-all shadow-sm">
                            {client.firstName[0]}
                            {client.lastName[0]}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm flex items-center gap-1.5 flex-wrap">
                              <span
                                onClick={() => setSelectedClientId(client.id)}
                                className="hover:text-[#D4AF37] cursor-pointer transition-colors"
                              >
                                {client.firstName} {client.lastName}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono font-normal">
                                #{client.id}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                              <span>{client.email}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
                              <span>Joined {client.joinedDate || 'Recently'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Phone Status */}
                      <td className="py-4 px-5">
                        {isPhoneAdded(client.phone) ? (
                          <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[11px]">
                              <CheckCircle className="w-3 h-3" />
                              <span>Phone Added</span>
                            </div>
                            <div className="text-xs font-mono text-slate-200 flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{client.phone}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-medium text-[11px]">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>No phone added</span>
                          </div>
                        )}
                      </td>

                      {/* Assigned Plan & AUM */}
                      <td className="py-4 px-5">
                        {client.assignedPlanStatus === 'active' && totalPlanCapital > 0 ? (
                          <div>
                            <div className="font-extrabold text-white text-xs flex items-center gap-1.5 flex-wrap">
                              <span>{formatINR(totalPlanCapital)}</span>
                              {clientActivePlans.length > 1 ? (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[10px]">
                                  {clientActivePlans.length} Contracts
                                </span>
                              ) : (
                                <span className="text-[10px] text-[#D4AF37] font-semibold">
                                  ({planDuration}-Month)
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-emerald-400 font-bold mt-0.5">
                              +{formatINR(monthlyPayout)} / mo (15.0%)
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Month {client.currentMonthIndex || 1} of {planDuration} •{' '}
                              {client.currentMonthWithdrawn ? (
                                <span className="text-emerald-400 font-semibold">✓ Settled</span>
                              ) : (
                                <span className="text-amber-400 font-semibold">● Ready</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-[11px] font-semibold border border-amber-500/20">
                              Awaiting Plan Start
                            </span>
                            <div className="mt-1.5">
                              <button
                                onClick={() => onOpenAssignModal(client.id)}
                                className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-black font-extrabold text-[10px] hover:brightness-110 transition-all flex items-center gap-1 shadow-sm"
                              >
                                <span>⚡ Start Plan</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Referral Code & Level */}
                      <td className="py-4 px-5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] font-mono text-[11px] font-bold">
                              {refStats.referralCode}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${levelRule.badgeBg} ${levelRule.badgeText} ${levelRule.badgeBorder}`}
                            >
                              <Award className="w-3 h-3" />
                              <span>{levelRule.badgeLabel}</span>
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-300">
                            <strong className="text-white">{refStats.totalReferred}</strong> Referred{' '}
                            <span className="text-slate-500">
                              ({refStats.activePlanReferrals} Active)
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Settlement Account */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5 text-slate-300 font-medium font-mono text-[11px] max-w-[180px] truncate">
                          <Building className="w-3 h-3 text-slate-500 shrink-0" />
                          <span title={client.bankAccount || 'USDT TRC20 Wallet'}>
                            {client.bankAccount || 'USDT TRC20 Wallet'}
                          </span>
                        </div>
                        <div className="text-[10px] text-emerald-400 mt-0.5">
                          0% Fee Custody Escrow
                        </div>
                      </td>

                      {/* DEDICATED VIEW CLIENT COLUMN AS REQUESTED */}
                      <td className="py-4 px-5 text-center">
                        <button
                          onClick={() => setSelectedClientId(client.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37]/20 to-[#F59E0B]/20 hover:from-[#D4AF37] hover:to-[#F59E0B] border border-[#D4AF37]/40 hover:border-transparent text-[#D4AF37] hover:text-black font-extrabold text-xs transition-all shadow-md group"
                          title={`Open individual page for ${client.firstName} ${client.lastName}`}
                        >
                          <Eye className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                          <span>View Client</span>
                        </button>
                      </td>

                      {/* Contextual Quick Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {client.assignedPlanStatus === 'active' ? (
                            <>
                              <button
                                onClick={() => onOpenAssignModal(client.id)}
                                title="Allocate additional concurrent investment plan"
                                className="px-2.5 py-1.5 rounded-lg bg-[#080C14] hover:bg-[#141C2E] border border-[#1E293B] text-slate-300 hover:text-white font-semibold text-xs transition-all"
                              >
                                + Plan
                              </button>
                              <button
                                onClick={() => handleRevoke(client.id)}
                                title="Revoke Plan"
                                className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => onOpenAssignModal(client.id)}
                              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-black font-extrabold text-xs hover:brightness-110 active:scale-95 transition-all shadow-md shadow-[#D4AF37]/20"
                            >
                              ⚡ Assign Plan
                            </button>
                          )}
                        </div>
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
  );
}
