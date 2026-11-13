'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  CheckCircle,
  TrendingUp,
  AlertCircle,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
  Phone,
  FileCheck,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useAdmin } from '@/context/admin-context';
import { api } from '@/services/api';
import { formatUSDT } from '@/utils/currency';

interface AssignPlanModalProps {
  clientId?: string;
  planId?: string;
  onClose: () => void;
}

export function AssignPlanModal({ clientId: initialClientId, planId: initialPlanId, onClose }: AssignPlanModalProps) {
  const { clients, plans, assignPlanToClient } = useAdmin();

  // Selected client
  const [selectedClientId, setSelectedClientId] = useState<string>(() => {
    return initialClientId || clients[0]?.id || '';
  });

  const targetClient = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId || c.clientId === selectedClientId);
  }, [clients, selectedClientId]);

  // Extract all existing active contracts for target client
  const activeContracts = useMemo(() => {
    if (!targetClient) return [];
    if (Array.isArray(targetClient.activePlans) && targetClient.activePlans.length > 0) {
      return targetClient.activePlans.filter((p) => p.status === 'active');
    }
    if (
      targetClient.assignedPlanStatus === 'active' &&
      targetClient.assignedPlanAmount &&
      targetClient.assignedPlanAmount > 0
    ) {
      const matchPlan = plans.find(
        (p) =>
          p.id === targetClient.assignedPlanId ||
          (p as any).planId === targetClient.assignedPlanId ||
          (targetClient.assignedPlanName &&
            p.planName.toLowerCase() === targetClient.assignedPlanName.toLowerCase())
      );
      return [
        {
          planInstanceId: 'contract-primary',
          planId: targetClient.assignedPlanId || 'plan-default',
          planName: targetClient.assignedPlanName || matchPlan?.planName || 'Private Wealth Accelerator',
          capitalAmount: targetClient.assignedPlanAmount,
          startDate: targetClient.assignedPlanStartDate || targetClient.joinedDate || new Date().toISOString().split('T')[0],
          durationMonths: matchPlan?.durationMonths || 14,
          dailyReturnPct: matchPlan?.dailyReturnPct ?? 0.5,
          monthlyReturnPct: matchPlan?.monthlyReturnPct ?? 15.0,
          grossTotalReturnPct: matchPlan?.grossTotalReturnPct ?? 210,
          status: 'active' as const,
        },
      ];
    }
    return [];
  }, [targetClient, plans]);

  const isAdditional = activeContracts.length > 0;
  const newContractIndex = activeContracts.length + 1;

  // Selected plan for the NEW contract
  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => {
    if (initialPlanId) {
      const match = plans.find((p) => p.id === initialPlanId || (p as any).planId === initialPlanId);
      if (match) return match.id;
    }
    return plans[0]?.id || '';
  });

  useEffect(() => {
    if (!selectedPlanId && plans.length > 0) {
      setSelectedPlanId(plans[0].id);
    }
  }, [plans, selectedPlanId]);

  const targetPlan = useMemo(() => {
    return plans.find((p) => p.id === selectedPlanId || (p as any).planId === selectedPlanId) || plans[0];
  }, [plans, selectedPlanId]);

  const [allocatedCapital, setAllocatedCapital] = useState<number>(1000);
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [isPaymentVerified, setIsPaymentVerified] = useState<boolean>(true);
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [toast, setToast] = useState('');
  const [phoneInput, setPhoneInput] = useState<string>(() => targetClient?.phone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (targetClient?.phone) {
      setPhoneInput(targetClient.phone);
    }
  }, [targetClient]);

  const dailyRate = targetPlan?.dailyReturnPct ?? 0.5;
  const monthlyRate = targetPlan?.monthlyReturnPct ?? 15.0;
  const durationMonths = targetPlan?.durationMonths ?? 14;
  const grossTotalReturnPct = targetPlan?.grossTotalReturnPct ?? monthlyRate * durationMonths;

  // Calculations for THIS NEW plan
  const newDailyGrowth = (allocatedCapital * dailyRate) / 100;
  const newMonthlyPayout = (allocatedCapital * monthlyRate) / 100;
  const newTotalPayout = (allocatedCapital * grossTotalReturnPct) / 100;

  // Calculations for EXISTING portfolio
  const existingCapital = activeContracts.reduce((sum, p) => sum + (Number(p.capitalAmount) || 0), 0);
  const existingDaily = activeContracts.reduce((sum, p) => {
    const rate = p.dailyReturnPct ?? 0.5;
    return sum + ((Number(p.capitalAmount) || 0) * rate) / 100;
  }, 0);

  // Days elapsed from selected start date
  const daysElapsedForNewPlan = useMemo(() => {
    if (!startDate) return 0;
    const s = new Date(startDate);
    if (isNaN(s.getTime())) return 0;
    const diff = Math.floor((Date.now() - s.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, [startDate]);

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find((c) => c.id === clientId || c.clientId === clientId);
    if (client?.phone) {
      setPhoneInput(client.phone);
    }
  };

  const handleQuickDatePreset = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    setStartDate(d.toISOString().split('T')[0]);
  };

  const handleSavePhone = async () => {
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
      setToast(`✓ Phone number ${clean} saved for ${targetClient.firstName}!`);
    } catch {
      setToast('⚠️ Failed to save phone on server.');
    }
  };

  const handleVerifyPhoneFirst = async () => {
    if (!targetClient) return;
    try {
      await api.updateClient(targetClient.id, { isPhoneVerified: true, kycStatus: 'verified' });
      targetClient.isPhoneVerified = true;
      targetClient.kycStatus = 'verified';
      setToast(`✓ Phone verified for ${targetClient.firstName}!`);
    } catch {
      setToast('⚠️ Failed to verify phone on server.');
    }
  };

  const handleStartPlan = async () => {
    if (!targetClient) {
      setToast('⚠️ Please select a valid investor client.');
      return;
    }
    if (!targetPlan) {
      setToast('⚠️ Please select a valid wealth plan.');
      return;
    }
    if (!allocatedCapital || allocatedCapital <= 0) {
      setToast('⚠️ Please enter a positive capital amount.');
      return;
    }
    if (!isPaymentVerified) {
      setToast('⚠️ Please verify that investment payment has been received in escrow before activating.');
      return;
    }

    setIsSubmitting(true);
    const refNote = paymentReference.trim() || 'Direct USDT Escrow Verified';
    const planToAssignId = targetPlan.id || (targetPlan as any).planId;
    const clientToAssignId = targetClient.id || (targetClient as any).clientId;

    try {
      const res = assignPlanToClient(
        clientToAssignId,
        planToAssignId,
        allocatedCapital,
        startDate,
        refNote
      );

      if (res.success) {
        setToast(`✓ Success: ${res.message}`);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setToast(res.message);
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setToast(`⚠️ Error: ${err?.message || 'Failed to allocate plan'}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#0D131F] border border-[#1E293B] rounded-3xl p-5 sm:p-7 space-y-5 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1E293B]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 to-[#141C2E] text-[#D4AF37] border border-[#D4AF37]/40 shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white tracking-tight">
                  {isAdditional ? 'Allocate Additional Independent Contract' : 'Verify Escrow & Start Plan'}
                </h3>
                {isAdditional && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[10px]">
                    Contract #{newContractIndex}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAdditional
                  ? `Allocate a concurrent plan running in parallel with dedicated capital, start date, and payout timeline.`
                  : `Confirm received capital and start first investment contract with daily distribution.`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#080C14] border border-[#1E293B] text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Alert */}
        {toast && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-semibold text-xs flex items-center gap-2 animate-fade-in shadow-md">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{toast}</span>
          </div>
        )}

        {/* SECTION 1: INVESTOR SELECTION */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
            Target Investor Client *
          </label>
          <select
            value={selectedClientId}
            onChange={(e) => handleClientChange(e.target.value)}
            className="w-full px-3.5 py-3 rounded-xl bg-[#080C14] border border-[#1E293B] text-white text-xs font-semibold focus:outline-none focus:border-[#D4AF37] transition-all"
          >
            {clients.map((c) => {
              const plansCount = Array.isArray(c.activePlans)
                ? c.activePlans.filter((p) => p.status === 'active').length
                : c.assignedPlanStatus === 'active'
                ? 1
                : 0;
              return (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} ({c.email}) —{' '}
                  {plansCount > 0
                    ? `${plansCount} Active Contract${plansCount > 1 ? 's' : ''} (${formatUSDT(c.assignedPlanAmount || 0)})`
                    : 'Awaiting Initial Plan'}
                </option>
              );
            })}
          </select>

          {/* Missing or Unverified Phone Helpers */}
          {targetClient && (!targetClient.phone || targetClient.phone.trim().length < 7) && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
              <div className="text-[11px] text-amber-300 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Investor has no mobile phone attached yet. Attach one now:</span>
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
                  onClick={handleSavePhone}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-bold text-xs shrink-0"
                >
                  Save Phone
                </button>
              </div>
            </div>
          )}

          {targetClient && targetClient.phone && targetClient.phone.trim().length >= 7 && !targetClient.isPhoneVerified && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2">
              <div className="text-[11px] text-amber-300 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Investor phone ({targetClient.phone}) is pending verification.</span>
              </div>
              <button
                type="button"
                onClick={handleVerifyPhoneFirst}
                className="px-2.5 py-1 rounded-lg bg-emerald-500 text-black font-bold text-[11px] shrink-0"
              >
                Verify Phone
              </button>
            </div>
          )}
        </div>

        {/* SECTION 2: EXISTING ACTIVE CONTRACTS LIST (IF ANY) */}
        {activeContracts.length > 0 && (
          <div className="rounded-2xl bg-[#080C14] border border-[#1E293B] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Currently Active Contracts ({activeContracts.length})
                </h4>
              </div>
              <span className="text-[11px] text-[#D4AF37] font-bold">
                Total AUM: {formatUSDT(existingCapital)}
              </span>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {activeContracts.map((c, idx) => {
                const s = new Date(c.startDate);
                const days = isNaN(s.getTime())
                  ? 0
                  : Math.max(0, Math.floor((Date.now() - s.getTime()) / (1000 * 60 * 60 * 24)));
                const duration = c.durationMonths || 14;
                const maxDays = duration * 30;
                const dailyEarn = ((c.capitalAmount || 0) * (c.dailyReturnPct ?? 0.5)) / 100;

                return (
                  <div
                    key={c.planInstanceId || idx}
                    className="p-3 rounded-xl bg-[#0D131F] border border-[#1E293B] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono text-[10px] font-bold">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-white truncate">{c.planName}</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold">
                          RUNNING
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2">
                        <span>Started: <strong className="text-slate-300">{c.startDate}</strong></span>
                        <span>•</span>
                        <span>Day {days} of {maxDays}</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-semibold">+{formatUSDT(dailyEarn)}/day</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-black text-white text-xs block">
                        {formatUSDT(c.capitalAmount)}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {duration} Months
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>
                <strong>Parallel Isolation Guaranteed:</strong> The existing contract(s) above will continue running completely untouched. Contract #{newContractIndex} will be added alongside them with its own independent timeline.
              </span>
            </div>
          </div>
        )}

        {/* SECTION 3: NEW CONTRACT CONFIGURATION */}
        <div className="rounded-2xl bg-gradient-to-br from-[#080C14] to-[#0D131F] border border-[#D4AF37]/30 p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                {isAdditional ? `Configure Independent Contract #${newContractIndex}` : 'Configure Investment Contract'}
              </h4>
            </div>
            <span className="text-[10px] text-slate-400">Independent Timeline & Capital</span>
          </div>

          {/* Plan Selector (Interactive Cards) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Select Wealth Plan *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {plans.map((p) => {
                const isSelected = p.id === selectedPlanId || (p as any).planId === selectedPlanId;
                const dRate = p.dailyReturnPct ?? 0.5;
                const mRate = p.monthlyReturnPct ?? 15.0;
                const dur = p.durationMonths ?? 14;
                const totalGross = p.grossTotalReturnPct ?? mRate * dur;

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPlanId(p.id)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-[#D4AF37]/15 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/10'
                        : 'bg-[#080C14] border-[#1E293B] hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs truncate">{p.planName}</span>
                      <span
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-[#D4AF37] bg-[#D4AF37]' : 'border-slate-600'
                        }`}
                      >
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px]">
                      <span className="text-emerald-400 font-bold">+{dRate}%/day</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-[#D4AF37] font-semibold">{mRate}%/mo</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-300">{dur} Months ({totalGross}% Gross)</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Capital Input & Quick Chips */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Invested Capital for this Contract (USDT) *
              </label>
              <span className="text-[10px] text-slate-400">Min: 100 USDT</span>
            </div>
            <div className="relative">
              <input
                type="number"
                min={1}
                step={1}
                value={allocatedCapital || ''}
                onChange={(e) => setAllocatedCapital(Math.max(0, Number(e.target.value)))}
                className="w-full px-4 py-3 rounded-xl bg-[#080C14] border border-[#1E293B] text-white text-base font-black focus:outline-none focus:border-[#D4AF37] transition-all"
                placeholder="1000"
              />
              <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400">USDT</span>
            </div>

            {/* Quick Amount Chips */}
            <div className="flex gap-1.5 flex-wrap pt-0.5">
              {[500, 1000, 2500, 5000, 10000, 25000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAllocatedCapital(amt)}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all ${
                    allocatedCapital === amt
                      ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                      : 'bg-[#080C14] border-[#1E293B] text-slate-300 hover:text-white'
                  }`}
                >
                  +{formatUSDT(amt)}
                </button>
              ))}
            </div>
          </div>

          {/* Contract Start Date & Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Contract Start Date *
              </label>
              <span className="text-[10px] text-emerald-400 font-semibold">
                {daysElapsedForNewPlan > 0
                  ? `Backdated by ${daysElapsedForNewPlan} day${daysElapsedForNewPlan > 1 ? 's' : ''}`
                  : 'Starts Today'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#080C14] border border-[#1E293B] text-white text-xs font-semibold focus:outline-none focus:border-[#D4AF37]"
              />
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleQuickDatePreset(0)}
                  className={`px-2 py-2 rounded-lg border text-[10px] font-bold transition-all ${
                    daysElapsedForNewPlan === 0
                      ? 'bg-slate-700 text-white border-slate-500'
                      : 'bg-[#080C14] border-[#1E293B] text-slate-400 hover:text-white'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDatePreset(5)}
                  className={`px-2 py-2 rounded-lg border text-[10px] font-bold transition-all ${
                    daysElapsedForNewPlan === 5
                      ? 'bg-slate-700 text-white border-slate-500'
                      : 'bg-[#080C14] border-[#1E293B] text-slate-400 hover:text-white'
                  }`}
                >
                  -5 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDatePreset(12)}
                  className={`px-2 py-2 rounded-lg border text-[10px] font-bold transition-all ${
                    daysElapsedForNewPlan === 12
                      ? 'bg-slate-700 text-white border-slate-500'
                      : 'bg-[#080C14] border-[#1E293B] text-slate-400 hover:text-white'
                  }`}
                >
                  -12 Days
                </button>
              </div>
            </div>
            <p className="text-[10px] text-slate-400">
              Daily {dailyRate}% accruals for this contract run from this exact date for {durationMonths} months.
            </p>
          </div>

          {/* Payment Escrow Verification */}
          <div className="p-3.5 rounded-2xl bg-[#080C14] border border-[#1E293B] space-y-3">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isPaymentVerified}
                onChange={(e) => setIsPaymentVerified(e.target.checked)}
                className="mt-0.5 rounded accent-emerald-500 w-4 h-4 cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-white block">
                  Payment Received & Verified in Escrow / Bank Account
                </span>
                <span className="text-[11px] text-slate-400">
                  Activates this contract immediately with full yield accrual schedule.
                </span>
              </div>
            </label>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Escrow UTR / Reference / Hash
              </label>
              <input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="e.g. USDT-TRC20-Hash / Bank Slip #402"
                className="w-full px-3 py-2 rounded-lg bg-[#0D131F] border border-[#1E293B] text-white text-xs focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: DUAL FINANCIAL BREAKDOWN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Card A: This Contract */}
          <div className="p-3.5 rounded-2xl bg-[#080C14] border border-[#1E293B] space-y-2">
            <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase text-[10px]">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>This Contract Yield (+{dailyRate}%/day)</span>
            </div>
            <div className="space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span>Daily Increment:</span>
                <strong className="text-emerald-400">+{formatUSDT(newDailyGrowth)} / day</strong>
              </div>
              <div className="flex justify-between">
                <span>Monthly Return:</span>
                <strong className="text-[#D4AF37]">+{formatUSDT(newMonthlyPayout)} / mo</strong>
              </div>
              <div className="flex justify-between border-t border-[#1E293B] pt-1">
                <span>Total Gross Return:</span>
                <strong className="text-white">{formatUSDT(newTotalPayout)} ({durationMonths}M)</strong>
              </div>
            </div>
          </div>

          {/* Card B: Combined Portfolio Impact */}
          <div className="p-3.5 rounded-2xl bg-[#080C14] border border-[#D4AF37]/30 space-y-2">
            <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase text-[10px]">
              <TrendingUp className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Investor Total Portfolio Impact</span>
            </div>
            <div className="space-y-1 text-slate-300">
              <div className="flex justify-between items-center">
                <span>Total Active Capital:</span>
                <span className="flex items-center gap-1 font-bold">
                  {existingCapital > 0 && <span className="text-slate-500 line-through">{formatUSDT(existingCapital)}</span>}
                  <ArrowRight className="w-3 h-3 text-emerald-400" />
                  <strong className="text-emerald-400">{formatUSDT(existingCapital + allocatedCapital)}</strong>
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Combined Daily Payout:</span>
                <span className="flex items-center gap-1 font-bold">
                  {existingDaily > 0 && <span className="text-slate-500 line-through">{formatUSDT(existingDaily)}</span>}
                  <ArrowRight className="w-3 h-3 text-emerald-400" />
                  <strong className="text-emerald-400">+{formatUSDT(existingDaily + newDailyGrowth)}/day</strong>
                </span>
              </div>
              <div className="flex justify-between border-t border-[#1E293B] pt-1">
                <span>Running Contracts:</span>
                <strong className="text-[#D4AF37]">
                  {activeContracts.length} → {newContractIndex} Concurrent
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 5: MODAL ACTIONS */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#1E293B]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl bg-[#080C14] border border-[#1E293B] text-slate-400 hover:text-white text-xs font-semibold transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStartPlan}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white font-black text-xs hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2 disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            <span>
              {isSubmitting
                ? 'Allocating...'
                : isAdditional
                ? `Verify & Allocate Independent Contract #${newContractIndex}`
                : 'Verify Payment & Start Plan'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
