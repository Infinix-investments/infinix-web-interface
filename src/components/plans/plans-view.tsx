'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  Percent,
  Calendar,
  ShieldCheck,
  Calculator,
  ArrowRight,
  CheckCircle2,
  Lock,
  Layers,
} from 'lucide-react';
import { useAdmin } from '@/context/admin-context';

interface PlansViewProps {
  onOpenAssignModal: (clientId?: string) => void;
}

export function PlansView({ onOpenAssignModal }: PlansViewProps) {
  const { plans, clients } = useAdmin();
  const primaryPlan = plans[0]; // 14-Month 15% plan

  // Simulator State
  const [simAmount, setSimAmount] = useState<number>(1000000); // 10 Lakhs

  const monthlyPayout = (simAmount * 15) / 100;
  const monthlyCapitalReturn = (simAmount * 7.5) / 100;
  const monthlyProfit = (simAmount * 7.5) / 100;
  const total14MonthPayout = monthlyPayout * 14; // 210%
  const totalNetProfit = monthlyProfit * 14; // 105%

  const formatINR = (val: number) => {
    return '₹' + Math.round(val).toLocaleString('en-IN');
  };

  const activeEnrolledClients = clients.filter(
    (c) => c.assignedPlanId === primaryPlan.id
  );

  return (
    <div className="space-y-6">
      {/* Primary Plan Showcase Card */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-[#0D131F] via-[#141C2E] to-[#080C14] border border-[#D4AF37]/50 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold uppercase tracking-wider">
              <span>⭐ ACTIVE DEFAULT PLAN</span>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">
              {primaryPlan.planName}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              {primaryPlan.description}
            </p>

            <div className="pt-2 flex items-center gap-6 flex-wrap text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Zero Custodian Fee for on-time withdrawal</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#D4AF37]" />
                <span>SEBI Escrow Backed</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>Direct Bank Settlement</span>
              </div>
            </div>
          </div>

          {/* Key Metrics Pill Grid */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="p-4 rounded-2xl bg-[#080C14]/90 border border-[#1E293B] text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Monthly Return
              </span>
              <div className="text-2xl font-black text-[#D4AF37]">15.0%</div>
              <span className="text-[10px] text-slate-400">7.5% Cap + 7.5% Profit</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#080C14]/90 border border-[#1E293B] text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Duration
              </span>
              <div className="text-2xl font-black text-white">14 Months</div>
              <span className="text-[10px] text-slate-400">Fixed Contractual Term</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#080C14]/90 border border-[#1E293B] text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Total Payout
              </span>
              <div className="text-2xl font-black text-emerald-400">210%</div>
              <span className="text-[10px] text-slate-400">Gross Return</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#080C14]/90 border border-[#1E293B] text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Active Enrolled
              </span>
              <div className="text-2xl font-black text-white">
                {activeEnrolledClients.length}
              </div>
              <span className="text-[10px] text-slate-400">Verified Investors</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Yield Simulator */}
      <div className="p-6 rounded-2xl bg-[#0D131F] border border-[#1E293B]">
        <div className="flex items-center gap-2 pb-4 border-b border-[#1E293B]">
          <Calculator className="w-5 h-5 text-[#D4AF37]" />
          <div>
            <h3 className="text-base font-bold text-white">
              14-Month Yield & Payout Simulator
            </h3>
            <p className="text-xs text-slate-400">
              Calculate exact monthly disbursements and total returns for any allocation
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Controls */}
          <div className="lg:col-span-5 space-y-4">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Simulated Investment Capital (INR)
            </label>
            <div className="text-3xl font-black text-white">
              {formatINR(simAmount)}
            </div>

            <input
              type="range"
              min={500000}
              max={20000000}
              step={250000}
              value={simAmount}
              onChange={(e) => setSimAmount(Number(e.target.value))}
              className="w-full accent-[#D4AF37] cursor-pointer"
            />

            <div className="flex items-center gap-2 pt-2 flex-wrap">
              {[500000, 1000000, 2500000, 5000000, 10000000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setSimAmount(amt)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    simAmount === amt
                      ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                      : 'bg-[#080C14] text-slate-400 border-[#1E293B] hover:text-white'
                  }`}
                >
                  {formatINR(amt)}
                </button>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 pt-2">
              ⚠️ Minimum allocation: ₹5,00,000. Maximum allocation: ₹5,00,00,000.
            </p>
          </div>

          {/* Calculated Output Breakdown */}
          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Monthly Payout */}
            <div className="p-4 rounded-2xl bg-[#080C14] border border-[#1E293B]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Monthly Payout (15%)
              </span>
              <div className="text-xl font-black text-[#D4AF37] mt-1">
                {formatINR(monthlyPayout)}
                <span className="text-xs text-slate-400 font-normal"> / mo</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-2 space-y-0.5">
                <div>• {formatINR(monthlyCapitalReturn)} Capital (7.5%)</div>
                <div>• {formatINR(monthlyProfit)} Profit (7.5%)</div>
              </div>
            </div>

            {/* Total 14-Mo Payout */}
            <div className="p-4 rounded-2xl bg-[#080C14] border border-emerald-500/30">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Total 14-Mo Gross Payout
              </span>
              <div className="text-xl font-black text-emerald-400 mt-1">
                {formatINR(total14MonthPayout)}
              </div>
              <div className="text-[10px] text-emerald-400/90 mt-2">
                210% of initial principal systematically recovered
              </div>
            </div>

            {/* Total Net Profit */}
            <div className="p-4 rounded-2xl bg-[#080C14] border border-[#1E293B]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Net Profit
              </span>
              <div className="text-xl font-black text-white mt-1">
                {formatINR(totalNetProfit)}
              </div>
              <div className="text-[10px] text-slate-400 mt-2">
                105% pure contractual upside over 14 months
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* All Available Plans Table */}
      <div className="p-6 rounded-2xl bg-[#0D131F] border border-[#1E293B]">
        <div className="flex items-center justify-between pb-4 border-b border-[#1E293B]">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Structured Wealth Tranches ({plans.length})
            </h3>
            <p className="text-xs text-slate-400">
              Contractual vehicles authorized for assignment by the desk
            </p>
          </div>
        </div>

        <div className="mt-4 divide-y divide-[#1E293B]">
          {plans.map((p) => (
            <div
              key={p.id}
              className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">{p.planName}</h4>
                  {p.isDefault && (
                    <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-bold">
                      Default Tranche
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">{p.description}</p>
                <div className="text-[11px] text-slate-400 flex items-center gap-4">
                  <span>Min: {formatINR(p.minInvestment)}</span>
                  <span>•</span>
                  <span>Max: {formatINR(p.maxInvestment)}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <div className="text-base font-black text-[#D4AF37]">
                    {p.monthlyReturnPct}% / mo
                  </div>
                  <div className="text-xs text-slate-400">{p.durationMonths} Months</div>
                </div>

                <button
                  onClick={() => onOpenAssignModal()}
                  className="px-4 py-2 rounded-xl bg-[#080C14] border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 font-bold text-xs transition-all"
                >
                  Assign to Investor
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
