'use client';

import React, { useState } from 'react';
import { X, CheckCircle, TrendingUp, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAdmin } from '@/context/admin-context';

interface AssignPlanModalProps {
  clientId?: string;
  onClose: () => void;
}

export function AssignPlanModal({ clientId: initialClientId, onClose }: AssignPlanModalProps) {
  const { clients, plans, assignPlanToClient, verifyClientPhone } = useAdmin();

  const [selectedClientId, setSelectedClientId] = useState<string>(
    initialClientId || clients[0]?.id || ''
  );
  const [selectedPlanId, setSelectedPlanId] = useState<string>(plans[0]?.id || '');
  const [allocatedCapital, setAllocatedCapital] = useState<number>(1000000);
  const [toast, setToast] = useState('');

  const targetClient = clients.find((c) => c.id === selectedClientId);
  const targetPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];

  const monthlyPayout = (allocatedCapital * targetPlan.monthlyReturnPct) / 100;
  const monthlyCapReturn = (allocatedCapital * targetPlan.capitalReturnMonthlyPct) / 100;
  const monthlyProfit = (allocatedCapital * targetPlan.profitMonthlyPct) / 100;
  const totalPayout = monthlyPayout * targetPlan.durationMonths;

  const formatINR = (val: number) => {
    return '₹' + Math.round(val).toLocaleString('en-IN');
  };

  const handleVerifyPhoneFirst = () => {
    if (!targetClient) return;
    verifyClientPhone(targetClient.id);
  };

  const handleAssign = () => {
    if (!targetClient) return;
    if (!targetClient.isPhoneVerified) {
      setToast('⚠️ Investor phone must be verified first.');
      return;
    }
    const res = assignPlanToClient(targetClient.id, targetPlan.id, allocatedCapital);
    if (res.success) {
      setToast(res.message);
      setTimeout(() => {
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#0D131F] border border-[#1E293B] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1E293B]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight">
                Assign Contractual Wealth Plan
              </h3>
              <p className="text-xs text-slate-400">
                Allocate private yield tranches directly to verified investors
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-semibold text-xs">
            {toast}
          </div>
        )}

        {/* Client Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
            Select Investor
          </label>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#080C14] border border-[#1E293B] text-white text-xs focus:outline-none focus:border-[#D4AF37]"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName} ({c.email}) —{' '}
                {c.isPhoneVerified ? 'Phone Verified' : 'Pending Phone'}
              </option>
            ))}
          </select>

          {targetClient && !targetClient.isPhoneVerified && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2">
              <div className="text-[11px] text-amber-300">
                ⚠️ Investor phone number ({targetClient.phone}) is not verified.
              </div>
              <button
                onClick={handleVerifyPhoneFirst}
                className="px-2.5 py-1 rounded-lg bg-emerald-500 text-black font-bold text-[11px] shrink-0"
              >
                Verify Phone Now
              </button>
            </div>
          )}
        </div>

        {/* Plan Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
            Select Wealth Plan
          </label>
          <select
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#080C14] border border-[#1E293B] text-white text-xs focus:outline-none focus:border-[#D4AF37]"
          >
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.planName} ({p.monthlyReturnPct}%/mo • {p.durationMonths} Months)
              </option>
            ))}
          </select>
        </div>

        {/* Capital Amount Input */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
            Allocated Investment Capital (INR)
          </label>
          <input
            type="number"
            min={500000}
            step={100000}
            value={allocatedCapital}
            onChange={(e) => setAllocatedCapital(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#080C14] border border-[#1E293B] text-white text-sm font-bold focus:outline-none focus:border-[#D4AF37]"
          />
          <div className="flex gap-2">
            {[1000000, 2500000, 5000000, 10000000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setAllocatedCapital(amt)}
                className="px-2.5 py-1 rounded-lg bg-[#080C14] border border-[#1E293B] text-slate-400 hover:text-white text-[11px]"
              >
                {formatINR(amt)}
              </button>
            ))}
          </div>
        </div>

        {/* Calculated Breakdown Card */}
        <div className="p-4 rounded-2xl bg-[#080C14] border border-[#D4AF37]/30 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span>Monthly Payout (15.0%):</span>
            <span className="font-bold text-[#D4AF37] text-sm">
              {formatINR(monthlyPayout)} / mo
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Monthly Split:</span>
            <span>
              {formatINR(monthlyCapReturn)} Capital + {formatINR(monthlyProfit)} Profit
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Duration:</span>
            <span className="text-white font-semibold">14 Months</span>
          </div>
          <div className="pt-2 border-t border-[#1E293B] flex items-center justify-between">
            <span className="font-bold text-white">Total 14-Mo Gross Payout:</span>
            <span className="font-black text-emerald-400 text-sm">
              {formatINR(totalPayout)} (210%)
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#080C14] border border-[#1E293B] text-slate-400 hover:text-white text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAssign}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-black font-extrabold text-xs hover:brightness-110 active:scale-95 transition-all shadow-md shadow-[#D4AF37]/20"
          >
            Confirm & Allocate Plan
          </button>
        </div>
      </div>
    </div>
  );
}
