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

      {/* 5 Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        {referralTiers.map((tier) => (
          <div
            key={tier.level}
            className={`p-5 rounded-3xl bg-[#0D131F] border transition-all relative overflow-hidden flex flex-col justify-between ${
              tier.level === 1
                ? 'border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                : tier.level === 2
                ? 'border-blue-500/40 shadow-lg shadow-blue-500/5'
                : tier.level === 3
                ? 'border-purple-500/40 shadow-lg shadow-purple-500/5'
                : tier.level === 4
                ? 'border-amber-500/40 shadow-lg shadow-amber-500/5'
                : 'border-[#D4AF37]/50 shadow-lg shadow-[#D4AF37]/10'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    tier.level === 1
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : tier.level === 2
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : tier.level === 3
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : tier.level === 4
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30'
                  }`}
                >
                  Level {tier.level}
                </span>
                <span className="text-[10px] font-semibold text-emerald-400">
                  ● Active
                </span>
              </div>

              <h3 className="text-base font-black text-white mt-3">{tier.name}</h3>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                {tier.description}
              </p>

              <div className="mt-4 p-3.5 rounded-2xl bg-[#080C14] border border-[#1E293B] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Commission (% of ROI):</span>
                  <span className="text-lg font-black text-[#D4AF37]">
                    {tier.commissionPct}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-[#1E293B] pt-2">
                  <span>Required Active Plans:</span>
                  <span className="font-semibold text-white">
                    {tier.minDirectReferrals || tier.level * 2} Plans
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Unlock Rule:</span>
                  <span className="font-semibold text-emerald-400">
                    2 Plans / Level
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3.5 border-t border-[#1E293B] flex items-center justify-between">
              <div className="text-[11px] text-slate-400">
                Partners: <strong className="text-white">{tier.totalMembersCount}</strong>
              </div>
              <button
                onClick={() => {
                  setEditingTier(tier);
                  setEditRate(tier.commissionPct);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#080C14] border border-[#1E293B] text-slate-300 hover:text-white font-semibold text-[11px]"
              >
                <Edit2 className="w-3 h-3 text-[#D4AF37]" />
                <span>Adjust</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Network Tier Payout Distribution Flow */}
      <div className="p-6 rounded-2xl bg-[#0D131F] border border-[#1E293B]">
        <div className="pb-4 border-b border-[#1E293B]">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Illustrative 5-Tier Syndicate Yield Flow (Example: ₹10,00,000 14M Plan Allocation • ₹1.5L/mo ROI)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Every level's payout is calculated strictly as a percentage of the referred investor's contractual monthly ROI (15% yield).
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 text-center">
          <div className="p-3.5 rounded-2xl bg-[#080C14] border border-emerald-500/30">
            <div className="text-[10px] font-bold text-slate-400 uppercase">
              Investor ROI (15%)
            </div>
            <div className="text-lg font-black text-emerald-400 mt-1">
              ₹1,50,000 / mo
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Direct to investor's bank
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#080C14] border border-emerald-500/30">
            <div className="text-[10px] font-bold text-slate-400 uppercase">
              Level 1 (10% ROI)
            </div>
            <div className="text-lg font-black text-emerald-400 mt-1">
              ₹15,000 / mo
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Requires 2 active plans
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#080C14] border border-blue-500/30">
            <div className="text-[10px] font-bold text-slate-400 uppercase">
              Level 2 (5% ROI)
            </div>
            <div className="text-lg font-black text-blue-400 mt-1">
              ₹7,500 / mo
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Requires 4 active plans
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#080C14] border border-purple-500/30">
            <div className="text-[10px] font-bold text-slate-400 uppercase">
              Level 3 (3% ROI)
            </div>
            <div className="text-lg font-black text-purple-400 mt-1">
              ₹4,500 / mo
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Requires 6 active plans
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#080C14] border border-amber-500/30">
            <div className="text-[10px] font-bold text-slate-400 uppercase">
              Level 4 (2% ROI)
            </div>
            <div className="text-lg font-black text-amber-400 mt-1">
              ₹3,000 / mo
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Requires 8 active plans
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#080C14] border border-[#D4AF37]/40">
            <div className="text-[10px] font-bold text-slate-400 uppercase">
              Level 5 (1% ROI)
            </div>
            <div className="text-lg font-black text-[#D4AF37] mt-1">
              ₹1,500 / mo
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Requires 10 active plans
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

