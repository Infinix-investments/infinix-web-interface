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
  Plus,
  Edit3,
  Trash2,
  Sparkles,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useAdmin } from '@/context/admin-context';
import { InvestmentPlanConfig } from '@/types/admin';

interface PlansViewProps {
  onOpenAssignModal: (clientId?: string) => void;
}

export function PlansView({ onOpenAssignModal }: PlansViewProps) {
  const { plans, clients, createPlan, updatePlan, deletePlan } = useAdmin();
  const primaryPlan = plans.find((p) => p.isDefault) || plans[0];

  // Simulator State (Default 1 Lakh = ₹100,000)
  const [simAmount, setSimAmount] = useState<number>(100000);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<InvestmentPlanConfig | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState({
    planName: '',
    description: '',
    monthlyReturnPct: 15.0,
    dailyReturnPct: 0.5,
    durationMonths: 14,
    grossTotalReturnPct: 210.0,
    minInvestment: 100000,
    maxInvestment: 50000000,
    isDefault: false,
    status: 'active' as 'active' | 'closed',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleOpenCreateModal = () => {
    setEditingPlan(null);
    setFormData({
      planName: '',
      description: '',
      monthlyReturnPct: 15.0,
      dailyReturnPct: 0.5,
      durationMonths: 14,
      grossTotalReturnPct: 210.0,
      minInvestment: 100000,
      maxInvestment: 50000000,
      isDefault: plans.length === 0,
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: InvestmentPlanConfig) => {
    setEditingPlan(p);
    setFormData({
      planName: p.planName,
      description: p.description,
      monthlyReturnPct: p.monthlyReturnPct,
      dailyReturnPct: p.dailyReturnPct ?? 0.5,
      durationMonths: p.durationMonths,
      grossTotalReturnPct: p.grossTotalReturnPct,
      minInvestment: p.minInvestment,
      maxInvestment: p.maxInvestment,
      isDefault: p.isDefault,
      status: p.status,
    });
    setIsModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.planName.trim()) {
      showToast('⚠️ Please enter a plan name.');
      return;
    }

    if (editingPlan) {
      const res = await updatePlan(editingPlan.id, formData);
      if (res.success) {
        showToast(res.message);
        setIsModalOpen(false);
      }
    } else {
      const res = await createPlan(formData);
      if (res.success) {
        showToast(res.message);
        setIsModalOpen(false);
      }
    }
  };

  const handleDeletePlan = async (id: string) => {
    const res = await deletePlan(id);
    showToast(res.message);
    setDeleteConfirmId(null);
  };

  // Simulator Calculations
  const dailyRate = primaryPlan?.dailyReturnPct ?? 0.5;
  const monthlyRate = primaryPlan?.monthlyReturnPct ?? 15.0;
  const duration = primaryPlan?.durationMonths ?? 14;

  const dailyGrowthProfit = (simAmount * dailyRate) / 100; // ₹500/day for 1 Lakh
  const monthlyPayout = (simAmount * monthlyRate) / 100; // ₹15,000/month for 1 Lakh
  const totalMaturityPayout = (simAmount * (primaryPlan?.grossTotalReturnPct ?? 210)) / 100; // ₹2,10,000 for 1 Lakh
  const totalNetProfit = totalMaturityPayout - simAmount; // ₹1,10,000 pure return

  const formatINR = (val: number) => {
    return '₹' + Math.round(val).toLocaleString('en-IN');
  };

  const activeEnrolledClients = clients.filter(
    (c) => c.assignedPlanId === primaryPlan?.id && c.assignedPlanStatus === 'active'
  );

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-black font-extrabold text-xs shadow-2xl animate-fade-in flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#D4AF37]" />
            <span>Investment Plans Management</span>
          </h2>
          <p className="text-xs text-slate-400">
            Configure private wealth tranches, daily accruals, and investor assignment terms
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-black font-extrabold text-xs hover:brightness-110 active:scale-95 transition-all shadow-md shadow-[#D4AF37]/20"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Wealth Plan</span>
        </button>
      </div>

      {/* Primary Plan Showcase Card */}
      {primaryPlan && (
        <div className="p-8 rounded-3xl bg-gradient-to-br from-[#0D131F] via-[#141C2E] to-[#080C14] border border-[#D4AF37]/50 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-[11px] font-bold uppercase tracking-wider">
                  ⭐ DEFAULT ACTIVE PLAN
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[11px] font-bold">
                  +{dailyRate}% Daily Accrual
                </span>
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
                  <span>Daily 0.5% Increment (₹500 / day on 1 Lakh)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#D4AF37]" />
                  <span>14 Months Contractual Term (210% Total Payout)</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span>Escrow Backed Direct Settlement</span>
                </div>
              </div>
            </div>

            {/* Key Metrics Pill Grid */}
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <div className="p-4 rounded-2xl bg-[#080C14]/90 border border-[#1E293B] text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Daily Increment
                </span>
                <div className="text-2xl font-black text-emerald-400">+{dailyRate}%</div>
                <span className="text-[10px] text-slate-400">Capital Increment / Day</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#080C14]/90 border border-[#1E293B] text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Monthly Return
                </span>
                <div className="text-2xl font-black text-[#D4AF37]">{monthlyRate}%</div>
                <span className="text-[10px] text-slate-400">15.0% Distributed / mo</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#080C14]/90 border border-[#1E293B] text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Duration & Total
                </span>
                <div className="text-2xl font-black text-white">{duration}M • 210%</div>
                <span className="text-[10px] text-slate-400">Gross Contractual Payout</span>
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
      )}

      {/* Interactive Yield Simulator */}
      <div className="p-6 rounded-2xl bg-[#0D131F] border border-[#1E293B]">
        <div className="flex items-center gap-2 pb-4 border-b border-[#1E293B]">
          <Calculator className="w-5 h-5 text-[#D4AF37]" />
          <div>
            <h3 className="text-base font-bold text-white">
              14-Month Yield & Daily Incremental Calculator
            </h3>
            <p className="text-xs text-slate-400">
              Contractual model: 0.5% daily capital accrual (15% monthly) totaling 210% returns over 14 months
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Controls */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Simulated Investment Capital (INR)
              </label>
              <span className="text-xs text-[#D4AF37] font-semibold">Min: ₹1,00,000</span>
            </div>
            <div className="text-3xl font-black text-white">
              {formatINR(simAmount)}
            </div>

            <input
              type="range"
              min={100000}
              max={10000000}
              step={50000}
              value={simAmount}
              onChange={(e) => setSimAmount(Number(e.target.value))}
              className="w-full accent-[#D4AF37] cursor-pointer"
            />

            <div className="flex items-center gap-2 pt-2 flex-wrap">
              {[100000, 250000, 500000, 1000000, 2500000, 5000000].map((amt) => (
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

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300">
              💡 <strong>Example:</strong> At ₹1,00,000 invested, client receives <strong>+₹500/day</strong> (0.5% daily), accumulating to <strong>₹15,000/month</strong>, and receives <strong>₹2,10,000</strong> gross back over 14 months (₹1.10L pure profit).
            </div>
          </div>

          {/* Calculated Output Breakdown */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Daily Growth */}
            <div className="p-4 rounded-2xl bg-[#080C14] border border-emerald-500/30">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Daily Increment (0.5%)
              </span>
              <div className="text-xl font-black text-emerald-400 mt-1">
                +{formatINR(dailyGrowthProfit)}
                <span className="text-xs text-slate-400 font-normal"> / day</span>
              </div>
              <div className="text-[10px] text-emerald-400/90 mt-2">
                Accrues every 24 hours on active capital
              </div>
            </div>

            {/* Monthly Payout */}
            <div className="p-4 rounded-2xl bg-[#080C14] border border-[#1E293B]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Monthly Return (15%)
              </span>
              <div className="text-xl font-black text-[#D4AF37] mt-1">
                {formatINR(monthlyPayout)}
                <span className="text-xs text-slate-400 font-normal"> / mo</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-2">
                Available for monthly withdrawal
              </div>
            </div>

            {/* Total 14-Mo Gross Payout */}
            <div className="p-4 rounded-2xl bg-[#080C14] border border-[#D4AF37]/30">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                14-Mo Total Return (210%)
              </span>
              <div className="text-xl font-black text-white mt-1">
                {formatINR(totalMaturityPayout)}
              </div>
              <div className="text-[10px] text-slate-400 mt-2">
                Principal returned + {formatINR(totalNetProfit)} net profit
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* All Available Plans Management Table */}
      <div className="p-6 rounded-2xl bg-[#0D131F] border border-[#1E293B]">
        <div className="flex items-center justify-between pb-4 border-b border-[#1E293B]">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Managed Wealth Plans ({plans.length})
            </h3>
            <p className="text-xs text-slate-400">
              Add, edit, or delete investment plans offered to your clients
            </p>
          </div>
        </div>

        <div className="mt-4 divide-y divide-[#1E293B]">
          {plans.map((p) => {
            const isDeleting = deleteConfirmId === p.id;
            const enrolledCount = clients.filter(
              (c) => c.assignedPlanId === p.id && c.assignedPlanStatus === 'active'
            ).length;

            return (
              <div
                key={p.id}
                className="py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-white/[0.01] px-2 rounded-xl transition-all"
              >
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-white">{p.planName}</h4>
                    {p.isDefault && (
                      <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-bold">
                        Default Plan
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-700/50 text-slate-400 border border-slate-600'
                      }`}
                    >
                      {p.status === 'active' ? 'Active' : 'Closed'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-semibold border border-blue-500/30">
                      {enrolledCount} enrolled
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">{p.description}</p>

                  <div className="text-[11px] text-slate-400 flex items-center gap-4 flex-wrap">
                    <span>
                      Daily:{' '}
                      <strong className="text-emerald-400">
                        +{p.dailyReturnPct ?? 0.5}% / day
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Monthly:{' '}
                      <strong className="text-[#D4AF37]">{p.monthlyReturnPct}% / mo</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Duration: <strong className="text-white">{p.durationMonths} Months</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Total Return:{' '}
                      <strong className="text-emerald-400">{p.grossTotalReturnPct}%</strong>
                    </span>
                    <span>•</span>
                    <span>Min: {formatINR(p.minInvestment)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {isDeleting ? (
                    <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 p-2 rounded-xl">
                      <span className="text-xs text-rose-300 font-semibold">Delete plan?</span>
                      <button
                        onClick={() => handleDeletePlan(p.id)}
                        className="px-2.5 py-1 rounded-lg bg-rose-500 text-white font-bold text-xs hover:bg-rose-600"
                      >
                        Yes, Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-2.5 py-1 rounded-lg bg-[#080C14] text-slate-400 text-xs hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleOpenEditModal(p)}
                        className="px-3 py-2 rounded-xl bg-[#080C14] border border-[#1E293B] text-slate-300 hover:text-white hover:border-[#D4AF37]/50 font-bold text-xs transition-all flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => setDeleteConfirmId(p.id)}
                        disabled={p.isDefault}
                        title={p.isDefault ? 'Cannot delete the default active plan' : 'Remove plan'}
                        className={`p-2 rounded-xl border text-xs transition-all ${
                          p.isDefault
                            ? 'bg-[#080C14]/50 border-[#1E293B] text-slate-600 cursor-not-allowed'
                            : 'bg-[#080C14] border-[#1E293B] text-slate-400 hover:text-rose-400 hover:border-rose-500/40'
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onOpenAssignModal()}
                        className="px-4 py-2 rounded-xl bg-[#080C14] border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 font-bold text-xs transition-all flex items-center gap-1.5"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>Assign Plan</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CREATE / EDIT PLAN MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#0D131F] border border-[#1E293B] rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E293B]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
                  {editingPlan ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">
                    {editingPlan ? 'Edit Wealth Plan' : 'Create New Wealth Plan'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configure interest increments, tenure, and capital thresholds
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">
              {/* Plan Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Plan Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.planName}
                  onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
                  placeholder="e.g. INFINIX 14-Month Wealth Accelerator"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#080C14] border border-[#1E293B] text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Contractual yield structure details..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#080C14] border border-[#1E293B] text-white text-xs focus:outline-none focus:border-[#D4AF37] resize-none"
                />
              </div>

              {/* Grid: Daily %, Monthly %, Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Daily Increment (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formData.dailyReturnPct}
                    onChange={(e) => {
                      const daily = Number(e.target.value);
                      const monthly = Math.round(daily * 30 * 10) / 10;
                      const gross = Math.round(monthly * formData.durationMonths);
                      setFormData({
                        ...formData,
                        dailyReturnPct: daily,
                        monthlyReturnPct: monthly,
                        grossTotalReturnPct: gross,
                      });
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#080C14] border border-[#1E293B] text-emerald-400 font-bold text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                  <span className="text-[10px] text-slate-400">e.g. 0.5% / day</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Monthly Return (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    required
                    value={formData.monthlyReturnPct}
                    onChange={(e) => {
                      const monthly = Number(e.target.value);
                      const daily = Math.round((monthly / 30) * 100) / 100;
                      const gross = Math.round(monthly * formData.durationMonths);
                      setFormData({
                        ...formData,
                        monthlyReturnPct: monthly,
                        dailyReturnPct: daily,
                        grossTotalReturnPct: gross,
                      });
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#080C14] border border-[#1E293B] text-[#D4AF37] font-bold text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                  <span className="text-[10px] text-slate-400">e.g. 15.0% / month</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Duration (Months)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    required
                    value={formData.durationMonths}
                    onChange={(e) => {
                      const dur = Number(e.target.value);
                      const gross = Math.round(formData.monthlyReturnPct * dur);
                      setFormData({
                        ...formData,
                        durationMonths: dur,
                        grossTotalReturnPct: gross,
                      });
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#080C14] border border-[#1E293B] text-white font-bold text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                  <span className="text-[10px] text-slate-400">e.g. 14 Months</span>
                </div>
              </div>

              {/* Min & Max Investment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Min Investment (INR)
                  </label>
                  <input
                    type="number"
                    step="10000"
                    min="10000"
                    value={formData.minInvestment}
                    onChange={(e) => setFormData({ ...formData, minInvestment: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#080C14] border border-[#1E293B] text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Total Gross Return (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.grossTotalReturnPct}
                    onChange={(e) => setFormData({ ...formData, grossTotalReturnPct: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#080C14] border border-[#1E293B] text-emerald-400 font-bold text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                  <span className="text-[10px] text-slate-400">e.g. 210% gross payout</span>
                </div>
              </div>

              {/* Toggles */}
              <div className="pt-2 flex items-center justify-between border-t border-[#1E293B]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="rounded accent-[#D4AF37]"
                  />
                  <span className="text-xs font-bold text-slate-300">Set as Primary Default Plan</span>
                </label>

                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="px-2.5 py-1 rounded-lg bg-[#080C14] border border-[#1E293B] text-xs text-white"
                >
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#080C14] border border-[#1E293B] text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-black font-extrabold text-xs hover:brightness-110 active:scale-95 transition-all shadow-md shadow-[#D4AF37]/20"
                >
                  {editingPlan ? 'Save Changes' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
