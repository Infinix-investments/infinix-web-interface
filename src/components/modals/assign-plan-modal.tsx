'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, TrendingUp, AlertCircle, ShieldCheck, Calendar, DollarSign, FileCheck } from 'lucide-react';
import { useAdmin } from '@/context/admin-context';
import { api } from '@/services/api';

interface AssignPlanModalProps {
  clientId?: string;
  planId?: string;
  onClose: () => void;
}

export function AssignPlanModal({ clientId: initialClientId, planId: initialPlanId, onClose }: AssignPlanModalProps) {
  const { clients, plans, assignPlanToClient, verifyClientPhone } = useAdmin();

  // Find initial client
  const initialClient = clients.find(
    (c) => c.id === initialClientId || c.clientId === initialClientId
  );

  const [selectedClientId, setSelectedClientId] = useState<string>(() => {
    return initialClientId || clients[0]?.id || '';
  });

  // Preselect the plan cleanly:
  // 1) Explicit planId if opened from Plans tab
  // 2) Client's currently assigned plan if modifying/viewing an active client
  // 3) Default to first plan in plans
  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => {
    if (initialPlanId) {
      const match = plans.find(
        (p) => p.id === initialPlanId || (p as any).planId === initialPlanId
      );
      if (match) return match.id;
    }
    if (initialClient?.assignedPlanId) {
      const match = plans.find(
        (p) =>
          p.id === initialClient.assignedPlanId ||
          (p as any).planId === initialClient.assignedPlanId ||
          (initialClient.assignedPlanName &&
            p.planName.toLowerCase() === initialClient.assignedPlanName.toLowerCase())
      );
      if (match) return match.id;
    }
    return plans[0]?.id || '';
  });

  const [allocatedCapital, setAllocatedCapital] = useState<number>(() => {
    return initialClient?.assignedPlanAmount && initialClient.assignedPlanAmount > 0
      ? initialClient.assignedPlanAmount
      : 1000;
  });

  const [startDate, setStartDate] = useState<string>(() => {
    return initialClient?.assignedPlanStartDate || new Date().toISOString().split('T')[0];
  });

  const [isPaymentVerified, setIsPaymentVerified] = useState<boolean>(true);
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [toast, setToast] = useState('');
  const [phoneInput, setPhoneInput] = useState<string>(() => initialClient?.phone || '');

  // Only fallback if selectedPlanId was empty on mount before plans loaded from server
  useEffect(() => {
    if (!selectedPlanId && plans.length > 0) {
      setSelectedPlanId(plans[0].id);
    }
  }, [plans, selectedPlanId]);

  const targetClient = clients.find(
    (c) => c.id === selectedClientId || c.clientId === selectedClientId
  );

  // Directly find the selected plan. NEVER fallback to client's old plan name!
  const targetPlan =
    plans.find((p) => p.id === selectedPlanId || (p as any).planId === selectedPlanId) ||
    plans[0];

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find(
      (c) => c.id === clientId || c.clientId === clientId
    );
    if (client) {
      if (client.phone) {
        setPhoneInput(client.phone);
      }
      // If client has an assigned plan, pre-select it
      if (client.assignedPlanId) {
        const match = plans.find(
          (p) =>
            p.id === client.assignedPlanId ||
            (p as any).planId === client.assignedPlanId ||
            (client.assignedPlanName &&
              p.planName.toLowerCase() === client.assignedPlanName.toLowerCase())
        );
        if (match) {
          setSelectedPlanId(match.id);
        }
      }
      if (client.assignedPlanAmount && client.assignedPlanAmount > 0) {
        setAllocatedCapital(client.assignedPlanAmount);
      }
      if (client.assignedPlanStartDate) {
        setStartDate(client.assignedPlanStartDate);
      }
    }
  };

  const dailyRate = targetPlan?.dailyReturnPct ?? 0.5;
  const monthlyRate = targetPlan?.monthlyReturnPct ?? 15.0;
  const durationMonths = targetPlan?.durationMonths ?? 14;
  const grossTotalReturnPct = targetPlan?.grossTotalReturnPct ?? (monthlyRate * durationMonths);

  const dailyGrowth = (allocatedCapital * dailyRate) / 100;
  const monthlyPayout = (allocatedCapital * monthlyRate) / 100;
  const totalPayout = (allocatedCapital * grossTotalReturnPct) / 100;

  const formatINR = (val: number) => {
    return Math.round(val).toLocaleString('en-US') + ' USDT';
  };

  const handleSavePhoneAndVerify = async () => {
    if (!targetClient) return;
    const clean = phoneInput.trim();
    if (clean.length < 7) {
      setToast('⚠️ Please enter a valid mobile phone number (min 7 digits).');
      return;
    }
    try {
      await api.updateClient(targetClient.id, { phone: clean, isPhoneVerified: true, kycStatus: 'verified' });
      targetClient.phone = clean;
      targetClient.isPhoneVerified = true;
      setToast(`✓ Phone number ${clean} verified for ${targetClient.firstName}!`);
    } catch {
      setToast('⚠️ Failed to save phone on server.');
    }
  };

  const handleVerifyPhoneFirst = () => {
    if (!targetClient) return;
    if (!targetClient.phone || targetClient.phone.trim().length < 7) {
      setToast('⚠️ Investor has not submitted a mobile phone number yet.');
      return;
    }
    const res = verifyClientPhone(targetClient.id);
    if (!res.success) {
      setToast(res.message);
    } else {
      setToast(res.message);
    }
  };

  const handleStartPlan = () => {
    if (!targetClient) {
      setToast('⚠️ Please select a valid investor client.');
      return;
    }
    if (!targetPlan) {
      setToast('⚠️ Please select a valid wealth plan.');
      return;
    }
    if (!isPaymentVerified) {
      setToast('⚠️ Please verify that investment payment has been received in escrow before starting the plan.');
      return;
    }

    const refNote = paymentReference.trim() || 'Direct USDT Escrow Verified';
    const planToAssignId = targetPlan.id || (targetPlan as any).planId;
    const clientToAssignId = targetClient.id || (targetClient as any).clientId;

    const res = assignPlanToClient(
      clientToAssignId,
      planToAssignId,
      allocatedCapital,
      startDate,
      refNote
    );

    if (res.success) {
      setToast(res.message);
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setToast(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#0D131F] border border-[#1E293B] rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
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
                Confirm received capital and activate {dailyRate}% daily ({monthlyRate}% monthly) accruals for {durationMonths} months
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
            onChange={(e) => handleClientChange(e.target.value)}
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

          {targetClient && (!targetClient.phone || targetClient.phone.trim().length < 7) && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
              <div className="text-[11px] text-amber-300">
                ⚠️ Investor has no mobile phone submitted yet. You can attach & verify one now:
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="+91 98000 00000"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-[#080C14] border border-[#1E293B] text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                />
                <button
                  type="button"
                  onClick={handleSavePhoneAndVerify}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-bold text-xs shrink-0"
                >
                  Save & Verify
                </button>
              </div>
            </div>
          )}

          {targetClient && targetClient.phone && targetClient.phone.trim().length >= 7 && !targetClient.isPhoneVerified && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2">
              <div className="text-[11px] text-amber-300">
                ⚠️ Investor phone number ({targetClient.phone}) is not verified yet.
              </div>
              <button
                type="button"
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
              Daily {dailyRate}% increment accrues starting from this date for {durationMonths} months.
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

        {/* Calculated Breakdown Card (Strictly Dynamic) */}
        <div className="p-4 rounded-2xl bg-[#080C14] border border-[#D4AF37]/30 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span>Daily Increment ({dailyRate}%):</span>
            <span className="font-bold text-emerald-400 text-sm">
              +{formatINR(dailyGrowth)} / day
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Monthly Return ({monthlyRate}%):</span>
            <span className="font-bold text-[#D4AF37]">
              {formatINR(monthlyPayout)} / month
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Duration:</span>
            <span className="text-white font-semibold">{durationMonths} Months</span>
          </div>
          <div className="pt-2 border-t border-[#1E293B] flex items-center justify-between">
            <span className="font-bold text-white">Total Gross Payout ({grossTotalReturnPct}%):</span>
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
