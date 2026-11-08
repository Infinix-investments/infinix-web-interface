'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { useAdmin } from '@/context/admin-context';

export function ReferralsView() {
  const { referrals, disburseReferralCommission, stats, setActiveTab } = useAdmin();
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | '1' | '2' | '3' | '4' | '5'>('all');
  const [toast, setToast] = useState('');

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
    if (val === undefined || val === null || isNaN(val)) return '—';
    return Math.round(val).toLocaleString('en-US') + ' USDT';
  };

  const filteredReferrals = referrals.filter((r) => {
    const matchesSearch =
      r.referrerName.toLowerCase().includes(search.toLowerCase()) ||
      r.referrerCode.toLowerCase().includes(search.toLowerCase()) ||
      r.refereeName.toLowerCase().includes(search.toLowerCase()) ||
      r.refereeEmail.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (levelFilter !== 'all' && r.level.toString() !== levelFilter) return false;
    return true;
  });

  const totalReferralCapital = referrals
    .filter((r) => r.status === 'active')
    .reduce((sum, r) => sum + r.capitalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-semibold text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{toast}</span>
          </div>
          <button onClick={() => setToast('')} className="text-emerald-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

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
              {stats.activeReferralsCount} active on 14-Month Plan
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
              Introduced via Affiliate Codes
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0D131F] border border-[#1E293B]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Monthly Referral Liability
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
              Monthly partner payout obligations
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0D131F] border border-[#1E293B]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Network Levels
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
              onClick={() => setActiveTab('levels')}
              className="mt-1 text-xs text-[#D4AF37] hover:underline font-semibold flex items-center gap-1"
            >
              Configure Tier Rewards →
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
            placeholder="Search by referrer name, code, or referred investor..."
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
            All Tiers ({referrals.length})
          </button>
          <button
            onClick={() => setLevelFilter('1')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              levelFilter === '1'
                ? 'bg-emerald-500 text-black font-bold'
                : 'bg-[#080C14] text-slate-400 border border-[#1E293B]'
            }`}
          >
            Level 1 (10% ROI)
          </button>
          <button
            onClick={() => setLevelFilter('2')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              levelFilter === '2'
                ? 'bg-blue-500 text-white font-bold'
                : 'bg-[#080C14] text-slate-400 border border-[#1E293B]'
            }`}
          >
            Level 2 (5% ROI)
          </button>
          <button
            onClick={() => setLevelFilter('3')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              levelFilter === '3'
                ? 'bg-purple-500 text-white font-bold'
                : 'bg-[#080C14] text-slate-400 border border-[#1E293B]'
            }`}
          >
            Level 3 (3% ROI)
          </button>
          <button
            onClick={() => setLevelFilter('4')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              levelFilter === '4'
                ? 'bg-amber-500 text-black font-bold'
                : 'bg-[#080C14] text-slate-400 border border-[#1E293B]'
            }`}
          >
            Level 4 (2% ROI)
          </button>
          <button
            onClick={() => setLevelFilter('5')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              levelFilter === '5'
                ? 'bg-[#D4AF37] text-black font-bold'
                : 'bg-[#080C14] text-slate-400 border border-[#1E293B]'
            }`}
          >
            Level 5 (1% ROI)
          </button>
        </div>
      </div>

      {/* Referrals Directory Table */}
      <div className="rounded-2xl bg-[#0D131F] border border-[#1E293B] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1E293B] bg-[#080C14]/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-5">Referrer (Partner)</th>
                <th className="py-4 px-5">Referred Investor (Referee)</th>
                <th className="py-4 px-5">Tier Level</th>
                <th className="py-4 px-5">Allocated Plan & Capital</th>
                <th className="py-4 px-5">Commission Rate & Payout</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B] text-xs">
              {filteredReferrals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No referral entries found.
                  </td>
                </tr>
              ) : (
                filteredReferrals.map((ref) => (
                  <tr key={ref.id} className="hover:bg-[#141C2E]/40 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-bold text-white text-sm">{ref.referrerName}</div>
                      <div className="inline-flex items-center gap-1 font-mono text-[10px] text-[#D4AF37] px-2 py-0.5 rounded bg-[#D4AF37]/10 border border-[#D4AF37]/20 mt-1">
                        {ref.referrerCode}
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <div className="font-bold text-white">{ref.refereeName}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{ref.refereeEmail}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{ref.refereePhone}</div>
                    </td>

                    <td className="py-4 px-5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] ${
                          ref.level === 1
                            ? 'bg-blue-500/15 border border-blue-500/30 text-blue-400'
                            : 'bg-purple-500/15 border border-purple-500/30 text-purple-400'
                        }`}
                      >
                        Level {ref.level} ({ref.commissionRatePct}%)
                      </span>
                    </td>

                    <td className="py-4 px-5">
                      {ref.capitalAmount > 0 ? (
                        <div>
                          <div className="font-bold text-white text-sm">
                            {formatINR(ref.capitalAmount)}
                          </div>
                          <div className="text-[10px] text-[#D4AF37]">{ref.planName}</div>
                        </div>
                      ) : (
                        <div>
                          <span className="text-slate-500">0 USDT Capital</span>
                          <div className="text-[10px] text-amber-400">
                            Awaiting Plan Assignment
                          </div>
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-5">
                      {ref.monthlyCommissionAmount > 0 ? (
                        <div>
                          <div className="font-bold text-emerald-400 text-sm">
                            {formatINR(ref.monthlyCommissionAmount)} / mo
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Total Settled: {formatINR(ref.totalEarnedAmount)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>

                    <td className="py-4 px-5">
                      {ref.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold text-[10px]">
                          ✓ Active Earning
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-semibold text-[10px]">
                          ● Pending Plan
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-5 text-right">
                      {ref.status === 'active' ? (
                        <button
                          onClick={() => handleDisburse(ref.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 font-bold text-xs transition-all"
                        >
                          Disburse Yield
                        </button>
                      ) : (
                        <button
                          onClick={() => setActiveTab('clients')}
                          className="px-3 py-1.5 rounded-lg bg-[#080C14] border border-[#1E293B] text-slate-400 hover:text-white text-xs font-semibold"
                        >
                          Assign Plan →
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

