'use client';

import React, { useState } from 'react';
import {
  Layers,
  Award,
  TrendingUp,
  Percent,
  Users,
  ShieldCheck,
  CheckCircle,
  Edit2,
  DollarSign,
  ChevronRight,
} from 'lucide-react';
import { useAdmin } from '@/context/admin-context';
import { ReferralLevelTier } from '@/types/admin';

export function LevelsView() {
  const { referralTiers, updateReferralTier, clients, referrals } = useAdmin();
  const [editingTier, setEditingTier] = useState<ReferralLevelTier | null>(null);
  const [editRate, setEditRate] = useState<number>(2.0);
  const [toast, setToast] = useState('');

  const formatINR = (val: number) => {
    return '₹' + Math.round(val).toLocaleString('en-IN');
  };

  const handleSaveTier = () => {
    if (!editingTier) return;
    const res = updateReferralTier(editingTier.level, { commissionPct: editRate });
    setEditingTier(null);
    if (res.success) {
      setToast(res.message);
      setTimeout(() => setToast(''), 4500);
    }
  };

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

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-[#0D131F] border border-[#1E293B]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white tracking-tight">
              Multi-Tier Network Structure & Commission Governance
            </h2>
            <p className="text-xs text-slate-400">
              Configure tiered commission splits across direct introducers and institutional syndicators
            </p>
          </div>
        </div>
      </div>

      {/* 3 Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {referralTiers.map((tier) => (
          <div
            key={tier.level}
            className={`p-6 rounded-3xl bg-[#0D131F] border transition-all relative overflow-hidden flex flex-col justify-between ${
              tier.level === 1
                ? 'border-blue-500/40 shadow-lg shadow-blue-500/5'
                : tier.level === 2
                ? 'border-purple-500/40 shadow-lg shadow-purple-500/5'
                : 'border-[#D4AF37]/40 shadow-lg shadow-[#D4AF37]/5'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    tier.level === 1
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : tier.level === 2
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30'
                  }`}
                >
                  Level {tier.level} Tier
                </span>
                <span className="text-[11px] font-semibold text-emerald-400">
                  ● Active Status
                </span>
              </div>

              <h3 className="text-xl font-black text-white mt-4">{tier.name}</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {tier.description}
              </p>

              <div className="mt-6 p-4 rounded-2xl bg-[#080C14] border border-[#1E293B] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Monthly Commission Rate:</span>
                  <span className="text-xl font-black text-[#D4AF37]">
                    {tier.commissionPct}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-[#1E293B] pt-2">
                  <span>Min Direct Introductions:</span>
                  <span className="font-semibold text-white">
                    {tier.minDirectReferrals} Verified
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Min Team Volume:</span>
                  <span className="font-semibold text-white">
                    {formatINR(tier.minTeamAum)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#1E293B] flex items-center justify-between">
              <div className="text-xs text-slate-400">
                Active Partners: <strong className="text-white">{tier.totalMembersCount}</strong>
              </div>
              <button
                onClick={() => {
                  setEditingTier(tier);
                  setEditRate(tier.commissionPct);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#080C14] border border-[#1E293B] text-slate-300 hover:text-white font-semibold text-xs"
              >
                <Edit2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Adjust Rate</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Network Tier Payout Distribution Flow */}
      <div className="p-6 rounded-2xl bg-[#0D131F] border border-[#1E293B]">
        <div className="pb-4 border-b border-[#1E293B]">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Illustrative Network Yield Flow (Example: ₹10,00,000 14M Plan Allocation)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            How monthly returns and affiliate tier bonuses are funded systematically
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-2xl bg-[#080C14] border border-emerald-500/30">
            <div className="text-[10px] font-bold text-slate-400 uppercase">
              Investor Payout (15%)
            </div>
            <div className="text-xl font-black text-emerald-400 mt-1">
              ₹1,50,000 / mo
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Direct to investor's verified bank
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#080C14] border border-blue-500/30">
            <div className="text-[10px] font-bold text-slate-400 uppercase">
              Level 1 Direct (2.0%)
            </div>
            <div className="text-xl font-black text-blue-400 mt-1">
              ₹20,000 / mo
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Direct introducer partner bonus
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#080C14] border border-purple-500/30">
            <div className="text-[10px] font-bold text-slate-400 uppercase">
              Level 2 Override (1.0%)
            </div>
            <div className="text-xl font-black text-purple-400 mt-1">
              ₹10,000 / mo
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Secondary syndicator override
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#080C14] border border-[#D4AF37]/30">
            <div className="text-[10px] font-bold text-slate-400 uppercase">
              Level 3 Pool (0.5%)
            </div>
            <div className="text-xl font-black text-[#D4AF37] mt-1">
              ₹5,000 / mo
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Institutional desk bonus
            </div>
          </div>
        </div>
      </div>

      {/* Adjust Rate Modal */}
      {editingTier && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0D131F] border border-[#1E293B] rounded-3xl p-6 space-y-4">
            <h4 className="text-base font-bold text-white">
              Adjust Level {editingTier.level} ({editingTier.name}) Rate
            </h4>
            <div className="space-y-2">
              <label className="block text-xs text-slate-300 font-bold uppercase">
                Monthly Commission Percentage (%):
              </label>
              <input
                type="number"
                step={0.1}
                min={0}
                max={10}
                value={editRate}
                onChange={(e) => setEditRate(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[#080C14] border border-[#1E293B] text-white text-lg font-black focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingTier(null)}
                className="px-3 py-1.5 rounded-lg bg-[#080C14] text-slate-400 text-xs hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTier}
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-black font-extrabold text-xs"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
