'use client';

import React, { useState, useMemo } from 'react';
import {
  Share2,
  Users,
  Search,
  CheckCircle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  DollarSign,
  Layers,
  Copy,
  Gift,
  Plus,
  Lock,
  Unlock,
  ShieldCheck,
  AlertCircle,
  X,
  UserCheck,
} from 'lucide-react';
import { useAdmin } from '@/context/admin-context';
import { ClientProfile } from '@/types/admin';
import { formatUSDT } from '@/utils/currency';
import { calculateAdminLevelNetwork } from '@/utils/referral';

export function ReferralsView() {
  const {
    referrals,
    clients,
    disburseReferralCommission,
    toggleClientLevelIncome,
    addMissedReferral,
    stats,
    setActiveTab,
  } = useAdmin();

  const [activeSubTab, setActiveSubTab] = useState<'direct' | 'levels'>('direct');
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | '1' | '2' | '3' | '4' | '5'>('all');
  const [toast, setToast] = useState('');

  // Selected client for Level Income Explorer
  const [selectedClientId, setSelectedClientId] = useState<string>(
    clients.length > 0 ? (clients[0].id || clients[0].clientId || '') : ''
  );
  const [clientSearch, setClientSearch] = useState('');
  const [isTogglingLevelIncome, setIsTogglingLevelIncome] = useState(false);

  // Missed Referral Modal state
  const [isMissedModalOpen, setIsMissedModalOpen] = useState(false);
  const [missedSponsorId, setMissedSponsorId] = useState('');
  const [missedRefereeId, setMissedRefereeId] = useState('');
  const [isSubmittingMissed, setIsSubmittingMissed] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4500);
  };

  const handleDisburse = (id: string) => {
    const res = disburseReferralCommission(id);
    if (res.success) {
      showToast(res.message);
    }
  };

  const formatINR = (val?: number) => {
    return formatUSDT(val);
  };

  const filteredReferrals = referrals.filter((r) => {
    const matchesSearch =
      r.referrerName.toLowerCase().includes(search.toLowerCase()) ||
      r.referrerCode.toLowerCase().includes(search.toLowerCase()) ||
      r.refereeName.toLowerCase().includes(search.toLowerCase()) ||
      (r.refereeEmail && r.refereeEmail.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (levelFilter !== 'all' && r.level.toString() !== levelFilter) return false;
    return true;
  });

  const totalReferralCapital = referrals
    .filter((r) => r.status === 'active')
    .reduce((sum, r) => sum + r.capitalAmount, 0);

  // Active client for Level Income tab
  const activeLevelClient = useMemo(() => {
    return (
      clients.find((c) => c.id === selectedClientId || c.clientId === selectedClientId) ||
      clients[0] ||
      null
    );
  }, [clients, selectedClientId]);

  // Compute 5-Tier Network for activeLevelClient
  const levelNetwork = useMemo(() => {
    if (!activeLevelClient) return null;
    return calculateAdminLevelNetwork(activeLevelClient, clients, referrals);
  }, [activeLevelClient, clients, referrals]);

  // Handle Toggle Level Income for selected client
  const handleToggleLevelIncome = async () => {
    if (!activeLevelClient) return;
    setIsTogglingLevelIncome(true);
    try {
      const res = await toggleClientLevelIncome(activeLevelClient.id);
      if (res.success) {
        showToast(res.message);
      } else {
        showToast(res.message || 'Failed to update level income status.');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update level income status.');
    } finally {
      setIsTogglingLevelIncome(false);
    }
  };

  // Handle Submit Missed Referral
  const handleSubmitMissedReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!missedSponsorId || !missedRefereeId) {
      showToast('Please select both a sponsor and referee.');
      return;
    }
    if (missedSponsorId === missedRefereeId) {
      showToast('A client cannot be their own sponsor.');
      return;
    }

    setIsSubmittingMissed(true);
    try {
      const res = await addMissedReferral(missedSponsorId, missedRefereeId);
      if (res.success) {
        showToast(res.message);
        setIsMissedModalOpen(false);
        setMissedSponsorId('');
        setMissedRefereeId('');
      } else {
        showToast(res.message || 'Failed to add missed referral.');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to add missed referral.');
    } finally {
      setIsSubmittingMissed(false);
    }
  };

  // Preview selected missed referee details
  const previewReferee = useMemo(() => {
    if (!missedRefereeId) return null;
    return clients.find((c) => c.id === missedRefereeId || c.clientId === missedRefereeId);
  }, [clients, missedRefereeId]);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-semibold text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{toast}</span>
          </div>
          <button onClick={() => setToast('')} className="text-emerald-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Header and Top Action Bar */}
      <div className="p-6 rounded-2xl bg-[#0D131F] border border-[#1E293B] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight">Refer & Earn Desk</h1>
            <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-extrabold uppercase tracking-wider">
              Affiliate & Syndicate Network
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Monitor direct 5% commission payouts, track 5-tier pyramid downlines, and authorize institutional level income privileges.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMissedModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#b5952f] text-black font-extrabold text-xs transition-all flex items-center gap-2 shadow-lg shadow-[#D4AF37]/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Missed Referral</span>
          </button>
        </div>
      </div>

      {/* Sub-Tab Navigation: Direct Referrals vs Level Income Network */}
      <div className="flex items-center gap-3 border-b border-[#1E293B] pb-3">
        <button
          onClick={() => setActiveSubTab('direct')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeSubTab === 'direct'
              ? 'bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/20 font-extrabold'
              : 'bg-[#0D131F] text-slate-400 hover:text-white border border-[#1E293B]'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>Direct Referrals Directory ({referrals.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('levels')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeSubTab === 'levels'
              ? 'bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/20 font-extrabold'
              : 'bg-[#0D131F] text-slate-400 hover:text-white border border-[#1E293B]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>5-Tier Level Income Network</span>
          <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-black">
            5 TIERS
          </span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: DIRECT REFERRALS DIRECTORY
         ========================================================================= */}
      {activeSubTab === 'direct' && (
        <div className="space-y-6">
          {/* 4 Referral KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            <div className="p-5 rounded-2xl bg-[#0D131F] border border-[#1E293B]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Total Referrals
                </span>
                <div className="p-2 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
                  <Share2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <h2 className="text-2xl font-black text-white tracking-tight">
                  {stats.totalReferralsCount}
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  {stats.activeReferralsCount} active on investment plan
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#0D131F] border border-[#1E293B]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Referred Capital Volume
                </span>
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <h2 className="text-2xl font-black text-white tracking-tight">
                  {formatINR(totalReferralCapital)}
                </h2>
                <p className="mt-1 text-xs text-emerald-400 font-medium">
                  Introduced via Sponsor Codes
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#0D131F] border border-[#1E293B]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Monthly Direct Liability
                </span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <h2 className="text-2xl font-black text-amber-400 tracking-tight">
                  {formatINR(stats.monthlyReferralCommissionTotal)}
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Direct sponsor payout obligations
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#0D131F] border border-[#1E293B]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Syndicate Depth
                </span>
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <h2 className="text-2xl font-black text-white tracking-tight">
                  5 Tiers Active
                </h2>
                <button
                  onClick={() => setActiveSubTab('levels')}
                  className="mt-1 text-xs text-[#D4AF37] hover:underline font-semibold flex items-center gap-1"
                >
                  Explore Level Chains →
                </button>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="p-5 rounded-2xl bg-[#0D131F] border border-[#1E293B] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by sponsor name, code, or referred investor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#080C14] border border-[#1E293B] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#D4AF37]/60"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setLevelFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  levelFilter === 'all'
                    ? 'bg-[#D4AF37] text-black font-bold'
                    : 'bg-[#080C14] text-slate-400 border border-[#1E293B]'
                }`}
              >
                All Referrals ({referrals.length})
              </button>
              <button
                onClick={() => setLevelFilter('1')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  levelFilter === '1'
                    ? 'bg-emerald-500 text-black font-bold'
                    : 'bg-[#080C14] text-slate-400 border border-[#1E293B]'
                }`}
              >
                Direct (5% Cash)
              </button>
            </div>
          </div>

          {/* Referrals Directory Table */}
          <div className="rounded-2xl bg-[#0D131F] border border-[#1E293B] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1E293B] bg-[#080C14]/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-5">Sponsor (Referrer)</th>
                    <th className="py-4 px-5">Referred Investor (Referee)</th>
                    <th className="py-4 px-5">Tier Level</th>
                    <th className="py-4 px-5">Allocated Plan & Capital</th>
                    <th className="py-4 px-5">Direct Commission (5%)</th>
                    <th className="py-4 px-5">Status</th>
                    <th className="py-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B] text-xs">
                  {filteredReferrals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        No affiliate referral records found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredReferrals.map((r) => (
                      <tr key={r.id} className="hover:bg-[#141C2E]/40 transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="font-bold text-white">{r.referrerName}</div>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                            <span className="px-1.5 py-0.5 rounded bg-[#080C14] border border-[#1E293B] text-[#D4AF37] font-bold">
                              {r.referrerCode}
                            </span>
                            <span>#{r.referrerId}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-5 text-slate-300">
                          <div className="font-bold text-white">{r.refereeName}</div>
                          <div className="text-[10px] text-slate-400">
                            {r.refereeEmail} {r.refereePhone ? `• ${r.refereePhone}` : ''}
                          </div>
                        </td>

                        <td className="py-3.5 px-5">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            Level {r.level} (Direct)
                          </span>
                        </td>

                        <td className="py-3.5 px-5">
                          <div className="font-bold text-white">
                            {formatINR(r.capitalAmount)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {r.planName || 'Active Investment Plan'}
                          </div>
                        </td>

                        <td className="py-3.5 px-5">
                          <div className="font-bold text-emerald-400">
                            +{formatINR(r.monthlyCommissionAmount || r.totalEarnedAmount)}
                          </div>
                          <div className="text-[10px] text-slate-400">5.0% Direct Bonus</div>
                        </td>

                        <td className="py-3.5 px-5">
                          {r.status === 'active' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              Pending Plan
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-5 text-right">
                          <button
                            onClick={() => handleDisburse(r.id)}
                            className="px-3 py-1.5 rounded-lg bg-[#141C2E] hover:bg-[#1E293B] border border-[#1E293B] text-slate-300 hover:text-white font-bold text-[11px] transition-all"
                          >
                            Disburse Bonus
                          </button>
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

      {/* =========================================================================
          TAB 2: 5-TIER LEVEL INCOME NETWORK EXPLORER & UNLOCK CONTROL
         ========================================================================= */}
      {activeSubTab === 'levels' && (
        <div className="space-y-6">
          {/* Investor Selector & Level Income Privilege Header */}
          <div className="p-6 rounded-2xl bg-[#0D131F] border border-[#1E293B] shadow-xl space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1E293B]">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Investor Account Selector
                </span>
                <h3 className="text-base font-black text-white mt-0.5">
                  Select Investor to Inspect 5-Tier Syndicate Network & Control Level Income
                </h3>
              </div>

              {/* Client Selector Dropdown */}
              <div className="w-full md:w-72">
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#080C14] border border-[#1E293B] text-white text-xs font-bold focus:outline-none focus:border-[#D4AF37]"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName} ({c.referralCode || c.id}) {c.isLevelIncomeUnlocked ? '⚡ [UNLOCKED]' : '🔒 [LOCKED]'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected Investor Profile Card & Level Income Toggle Button */}
            {activeLevelClient ? (
              <div className="p-5 rounded-xl bg-[#080C14] border border-[#1E293B] flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] font-black text-lg">
                    {activeLevelClient.firstName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h4 className="font-black text-white text-base">
                        {activeLevelClient.firstName} {activeLevelClient.lastName}
                      </h4>
                      <span className="px-2 py-0.5 rounded-md bg-[#141C2E] border border-[#1E293B] font-mono text-xs text-[#D4AF37] font-bold">
                        {activeLevelClient.referralCode || activeLevelClient.id}
                      </span>
                      {activeLevelClient.isLevelIncomeUnlocked ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-black flex items-center gap-1">
                          <Unlock className="w-3 h-3" />
                          <span>LEVEL INCOME UNLOCKED</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-400 text-xs font-black flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>LEVEL INCOME LOCKED</span>
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                      <span>ID: #{activeLevelClient.id}</span>
                      <span>{activeLevelClient.email}</span>
                      <span>{activeLevelClient.phone || 'No phone'}</span>
                    </div>
                  </div>
                </div>

                {/* The Master Toggle Button */}
                <div className="flex items-center gap-3">
                  <button
                    disabled={isTogglingLevelIncome}
                    onClick={handleToggleLevelIncome}
                    className={`px-5 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 ${
                      activeLevelClient.isLevelIncomeUnlocked
                        ? 'bg-[#1E293B] hover:bg-rose-950/60 border border-rose-500/40 text-rose-300'
                        : 'bg-[#D4AF37] hover:bg-[#b5952f] text-black shadow-[#D4AF37]/20'
                    }`}
                  >
                    {activeLevelClient.isLevelIncomeUnlocked ? (
                      <>
                        <Lock className="w-4 h-4 text-rose-400" />
                        <span>{isTogglingLevelIncome ? 'Locking...' : 'Lock Level Income'}</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-4 h-4" />
                        <span>{isTogglingLevelIncome ? 'Unlocking...' : 'Unlock Level Income for Account'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : null}

            {/* 4 Revenue & Syndicate Metrics for Selected Investor */}
            {levelNetwork && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-[#080C14] border border-[#1E293B]">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Today's Level Income
                  </div>
                  <div className="text-xl font-black text-emerald-400 mt-1">
                    +{formatINR(levelNetwork.todayDailyIncome)} / day
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {levelNetwork.isUnlocked ? 'Active daily credit' : 'Inactive (Account Locked)'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#080C14] border border-[#1E293B]">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Accumulated Level Yield
                  </div>
                  <div className="text-xl font-black text-[#D4AF37] mt-1">
                    {formatINR(levelNetwork.totalAccruedIncome)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Cumulative syndicate earnings
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#080C14] border border-[#1E293B]">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Total Network Members
                  </div>
                  <div className="text-xl font-black text-white mt-1">
                    {levelNetwork.totalMembers} Partners
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {levelNetwork.totalActiveMembers} active across 5 tiers
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#080C14] border border-[#1E293B]">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Downline Capital Volume
                  </div>
                  <div className="text-xl font-black text-blue-400 mt-1">
                    {formatINR(levelNetwork.totalCapital)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Total invested capital in 5 tiers
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Vertical 5-Tier Level Network Tree */}
          {levelNetwork && (
            <div className="space-y-4">
              <div className="px-1">
                <h3 className="font-extrabold text-white text-base">
                  5-Tier Generational Chain for {activeLevelClient?.firstName} {activeLevelClient?.lastName}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Level 1 reveals direct partner details (name, plan, capital, daily cut). Generations 2 to 5 protect investor privacy and display aggregate volume and yield.
                </p>
              </div>

              {([1, 2, 3, 4, 5] as const).map((lvl) => {
                const stat = levelNetwork.levels[lvl];
                const tierColor =
                  lvl === 1
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : lvl === 2
                    ? 'border-amber-500/40 bg-amber-500/5'
                    : lvl === 3
                    ? 'border-sky-500/40 bg-sky-500/5'
                    : lvl === 4
                    ? 'border-purple-500/40 bg-purple-500/5'
                    : 'border-pink-500/40 bg-pink-500/5';

                const badgeColor =
                  lvl === 1
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : lvl === 2
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : lvl === 3
                    ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                    : lvl === 4
                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/40'
                    : 'bg-pink-500/20 text-pink-400 border-pink-500/40';

                return (
                  <div
                    key={lvl}
                    className={`p-6 rounded-2xl bg-[#0D131F] border ${tierColor} shadow-xl space-y-4 transition-all`}
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E293B]">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-[#080C14] border border-[#1E293B] font-mono text-sm font-black text-white flex items-center justify-center">
                          L{lvl}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-white text-sm">
                              {lvl === 1
                                ? 'Level 1: Direct Referrals'
                                : lvl === 2
                                ? 'Level 2: 2nd Generation Downline'
                                : lvl === 3
                                ? 'Level 3: 3rd Generation Downline'
                                : lvl === 4
                                ? 'Level 4: 4th Generation Downline'
                                : 'Level 5: 5th Generation Downline (Syndicate Cap)'}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${badgeColor}`}>
                              {stat.levelPercent}% OF DAILY ROI
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {lvl === 1
                              ? 'Partners who enrolled directly with this sponsor'
                              : `Referrals introduced by Generation ${lvl - 1} partners`}
                          </div>
                        </div>
                      </div>

                      {/* Tier Stats Pill */}
                      <div className="flex items-center gap-4 text-xs">
                        <div>
                          <span className="text-slate-400">Members: </span>
                          <span className="font-bold text-white">{stat.totalMembers} ({stat.activeMembers} Active)</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Capital: </span>
                          <span className="font-bold text-white">{formatINR(stat.totalCapital)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Daily Cut: </span>
                          <span className="font-bold text-emerald-400">+{formatINR(stat.dailyIncome)}/d</span>
                        </div>
                      </div>
                    </div>

                    {/* Level 1: Details visible */}
                    {lvl === 1 ? (
                      <div>
                        {stat.members.length === 0 ? (
                          <div className="py-6 text-center text-slate-500 text-xs">
                            No direct partners enrolled under this investor yet. Use "Add Missed Referral" above to link partners.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {stat.members.map((member) => (
                              <div
                                key={member.id}
                                className="p-3.5 rounded-xl bg-[#080C14] border border-[#1E293B] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center justify-center">
                                    {member.name.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-white text-xs">{member.name}</span>
                                      <span className="text-[10px] text-slate-400 font-mono">#{member.id}</span>
                                      {member.status === 'active' ? (
                                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold">
                                          Active Plan
                                        </span>
                                      ) : (
                                        <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[9px] font-bold">
                                          Pending Plan
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-slate-400 mt-0.5">
                                      {member.planName} • {formatINR(member.planCapital)}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-6 text-right">
                                  <div>
                                    <div className="text-[10px] text-slate-400 uppercase">Member Daily ROI</div>
                                    <div className="font-bold text-white text-xs">
                                      +{formatINR(member.dailyRoiAmount)}/day
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-[10px] text-slate-400 uppercase">Sponsor's 10% Cut</div>
                                    <div className="font-bold text-emerald-400 text-xs">
                                      +{formatINR(member.yourDailyIncomeCut)}/day
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Levels 2 to 5: Anonymous generation */
                      <div className="p-4 rounded-xl bg-[#080C14] border border-[#1E293B] flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <ShieldCheck className="w-5 h-5 text-slate-400" />
                          <div>
                            <div className="text-xs font-bold text-white">
                              Anonymous Generation ({stat.totalMembers} Investors)
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              Investor identities beyond Level 1 are protected. Sponsor earns {stat.levelPercent}% of this generation's active ROI.
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-bold">
                          <span className="text-slate-300">
                            Volume: <span className="text-white">{formatINR(stat.totalCapital)}</span>
                          </span>
                          <span className="text-emerald-400">
                            Yield: +{formatINR(stat.dailyIncome)}/day
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD MISSED REFERRAL TO USER
         ========================================================================= */}
      {isMissedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-[#0D131F] border border-[#1E293B] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-4">
              <div>
                <h3 className="font-black text-white text-base">Add Missed Referral</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Link an existing investor to their intended sponsor and immediately sync both Direct Referral & Level Income.
                </p>
              </div>
              <button
                onClick={() => setIsMissedModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitMissedReferral} className="space-y-4">
              {/* Sponsor Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  1. Sponsor / Upline Referrer
                </label>
                <select
                  required
                  value={missedSponsorId}
                  onChange={(e) => setMissedSponsorId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#080C14] border border-[#1E293B] text-white text-xs font-bold focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="">-- Select Sponsor Investor --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName} ({c.referralCode || c.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Missed Referee Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  2. Missed Investor (Referee)
                </label>
                <select
                  required
                  value={missedRefereeId}
                  onChange={(e) => setMissedRefereeId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#080C14] border border-[#1E293B] text-white text-xs font-bold focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="">-- Select Missed Investor to Link --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName} ({c.email}) {c.assignedPlanAmount ? `• ${c.assignedPlanAmount} USDT` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preview Box */}
              {previewReferee && (
                <div className="p-4 rounded-xl bg-[#080C14] border border-[#D4AF37]/30 space-y-2">
                  <div className="text-xs font-bold text-slate-300">
                    Calculated Commission Preview
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Investor Plan:</span>
                    <span className="font-bold text-white">
                      {previewReferee.assignedPlanName || 'Pending Plan'} ({previewReferee.assignedPlanAmount || 0} USDT)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Direct 5% Cash Bonus:</span>
                    <span className="font-extrabold text-emerald-400">
                      +{formatINR(Math.round(Number(previewReferee.assignedPlanAmount || 0) * 0.05 * 100) / 100)} USDT
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Level 1 Daily ROI:</span>
                    <span className="font-extrabold text-[#D4AF37]">
                      10% of their daily ROI (credited to sponsor upon level income unlock)
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setIsMissedModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#141C2E] text-slate-400 hover:text-white text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMissed || !missedSponsorId || !missedRefereeId}
                  className="px-5 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#b5952f] disabled:opacity-50 text-black text-xs font-black transition-all flex items-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{isSubmittingMissed ? 'Syncing...' : 'Confirm & Sync Referral'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
