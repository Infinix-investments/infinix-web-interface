'use client';

import React, { useState } from 'react';
import { X, CheckCircle, TrendingUp, AlertCircle, ShieldCheck, Calendar, DollarSign, FileCheck } from 'lucide-react';
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
  const [allocatedCapital, setAllocatedCapital] = useState<number>(1000); // Default 1,000 USDT
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isPaymentVerified, setIsPaymentVerified] = useState<boolean>(true);
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [toast, setToast] = useState('');

  const targetClient = clients.find((c) => c.id === selectedClientId);
  const targetPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];

  const dailyRate = targetPlan?.dailyReturnPct ?? 0.5;
  const monthlyRate = targetPlan?.monthlyReturnPct ?? 15.0;
  const durationMonths = targetPlan?.durationMonths ?? 14;

  const dailyGrowth = (allocatedCapital * dailyRate) / 100; // ₹500/day for 1 Lakh
  const monthlyPayout = (allocatedCapital * monthlyRate) / 100; // ₹15,000/mo for 1 Lakh
  const totalPayout = (allocatedCapital * (targetPlan?.grossTotalReturnPct ?? 210)) / 100; // ₹2,10,000 for 1 Lakh

  const formatINR = (val: number) => {
    return Math.round(val).toLocaleString('en-US') + ' USDT';
  };

  const handleVerifyPhoneFirst = () => {
    if (!targetClient) return;
    verifyClientPhone(targetClient.id);
  };

  const handleStartPlan = () => {
    if (!targetClient) return;
    if (!targetClient.isPhoneVerified) {
      setToast('⚠️ Investor phone must be verified first.');
      return;
    }
    if (!isPaymentVerified) {
      setToast('⚠️ Please verify that investment payment has been received in escrow before starting the plan.');
      return;
    }

    const refNote = paymentReference.trim() || 'Bank Transfer Verified';
    const res = assignPlanToClient(targetClient.id, targetPlan.id, allocatedCapital, startDate, refNote);
    if (res.success) {
      setToast(res.message);
      setTimeout(() => {
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#0D131F] border border-[#1E293B] rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1E293B]">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight">
                Verify Payment & Start Client Plan
              </h3>
              <p className="text-xs text-slate-400">
                Confirm received capital and activate 0.5% daily (15% monthly) accruals
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
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-semibold text-xs animate-fade-in">
            {toast}
          </div>
        )}

        {/* Client Selection */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
            Select Investor Client *
          </label>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#080C14] border border-[#1E293B] text-white text-xs focus:outline-none focus:border-[#D4AF37]"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName} ({c.email}) —{' '}
                {c.assignedPlanStatus === 'active'
                  ? `Active Plan (${formatINR(c.assignedPlanAmount || 0)})`
                  : 'Awaiting Plan Start'}
              </option>
            ))}
          </select>

          {targetClient && !targetClient.isPhoneVerified && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2">
              <div className="text-[11px] text-amber-300">
                ⚠️ Investor phone number ({targetClient.phone}) is not verified yet.
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
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
            Select Wealth Plan *
          </label>
          <select
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#080C14] border border-[#1E293B] text-white text-xs focus:outline-none focus:border-[#D4AF37]"
          >
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.planName} (+{p.dailyReturnPct ?? 0.5}%/day • {p.monthlyReturnPct}%/mo • {p.durationMonths}M)
              </option>
            ))}
          </select>
        </div>

        {/* Capital Amount Input & Start Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Invested Capital (USDT) *
            </label>
            <input
              type="number"
              min={1}
              step={1}
              value={allocatedCapital}
              onChange={(e) => setAllocatedCapital(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#080C14] border border-[#1E293B] text-white text-sm font-bold focus:outline-none focus:border-[#D4AF37]"
            />
            <div className="flex gap-1.5 pt-1 flex-wrap">
              {[500, 1000, 2500, 5000, 10000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAllocatedCapital(amt)}
                  className={`px-2 py-0.5 rounded-lg border text-[10px] font-semibold transition-all ${
                    allocatedCapital === amt
                      ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                      : 'bg-[#080C14] border-[#1E293B] text-slate-400 hover:text-white'
                  }`}
                >
                  {formatINR(amt)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Plan Start Date *
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#080C14] border border-[#1E293B] text-white text-xs focus:outline-none focus:border-[#D4AF37]"
            />
            <p className="text-[10px] text-slate-400 pt-1">
              Daily 0.5% increment accrues starting from this date.
            </p>
          </div>
        </div>

        {/* Payment Verification Controls */}
        <div className="p-3.5 rounded-2xl bg-[#080C14] border border-[#1E293B] space-y-3">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={isPaymentVerified}
              onChange={(e) => setIsPaymentVerified(e.target.checked)}
              className="mt-0.5 rounded accent-emerald-500 w-4 h-4"
            />
            <div>
              <span className="text-xs font-bold text-white block">
                Payment Received & Verified in Escrow / Bank Account
              </span>
              <span className="text-[11px] text-slate-400">
                Confirming this starts the user&apos;s active investment plan immediately.
              </span>
            </div>
          </label>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Payment Reference / UTR Number
            </label>
            <input
              type="text"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="e.g. HDFC-NEFT-9912048 / Bank Slip #104"
              className="w-full px-3 py-1.5 rounded-lg bg-[#0D131F] border border-[#1E293B] text-white text-xs focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>

        {/* Calculated Breakdown Card */}
        <div className="p-4 rounded-2xl bg-[#080C14] border border-[#D4AF37]/30 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span>Daily Increment (0.5%):</span>
            <span className="font-bold text-emerald-400 text-sm">
              +{formatINR(dailyGrowth)} / day
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Monthly Return (15.0%):</span>
            <span className="font-bold text-[#D4AF37]">
              {formatINR(monthlyPayout)} / month
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Duration:</span>
            <span className="text-white font-semibold">{durationMonths} Months</span>
          </div>
          <div className="pt-2 border-t border-[#1E293B] flex items-center justify-between">
            <span className="font-bold text-white">Total Gross Payout (210%):</span>
            <span className="font-black text-emerald-400 text-sm">
              {formatINR(totalPayout)}
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
            onClick={handleStartPlan}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white font-extrabold text-xs hover:brightness-110 active:scale-95 transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Verify Payment & Start Plan</span>
          </button>
        </div>
      </div>
    </div>
  );
}
