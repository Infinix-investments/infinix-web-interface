'use client';

import React, { useState } from 'react';
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  AlertCircle,
  PlusCircle,
  Trash2,
  Phone,
  Mail,
  Building,
  Award,
  Share2,
  Eye,
  TrendingUp,
  Percent,
} from 'lucide-react';
import { useAdmin } from '@/context/admin-context';
import { ClientProfile } from '@/types/admin';
import { ClientDetailModal } from './client-detail-modal';
import {
  computeClientReferralStats,
  REFERRAL_LEVEL_RULES,
} from '@/utils/referral';

interface ClientsViewProps {
  onOpenAssignModal: (clientId?: string, planId?: string) => void;
  onOpenNewClientModal: () => void;
}

export function ClientsView({
  onOpenAssignModal,
  onOpenNewClientModal,
}: ClientsViewProps) {
  const { clients, referrals, verifyClientPhone, revokeClientPlan } = useAdmin();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<
    'all' | 'pending_verification' | 'pending_plan' | 'active_plan' | 'referral_partners'
  >('all');
  const [actionToast, setActionToast] = useState('');
  const [selectedClientForDetail, setSelectedClientForDetail] =
    useState<ClientProfile | null>(null);

  const showToast = (msg: string) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(''), 4500);
  };

  const handleVerify = (clientId: string) => {
    const res = verifyClientPhone(clientId);
    if (res.success) {
      showToast(res.message);
    }
  };

  const handleRevoke = (clientId: string) => {
    if (confirm('Are you sure you want to revoke the active plan from this investor?')) {
      const res = revokeClientPlan(clientId);
      if (res.success) {
        showToast(res.message);
      }
    }
  };

  const filteredClients = clients.filter((c) => {
    const refStats = computeClientReferralStats(c, clients, referrals);
    const matchesSearch =
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (c.referralCode && c.referralCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      refStats.referralCode.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === 'pending_verification') return !c.isPhoneVerified;
    if (filterTab === 'pending_plan') return c.isPhoneVerified && !c.assignedPlanId;
    if (filterTab === 'active_plan') return c.assignedPlanStatus === 'active';
    if (filterTab === 'referral_partners') return refStats.level > 0 || refStats.totalReferred > 0;

    return true;
  });

  const formatINR = (val?: number) => {
    if (!val) return '—';
    return Math.round(val).toLocaleString('en-US') + ' USDT';
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {actionToast && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-semibold text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{actionToast}</span>
          </div>
          <button
            onClick={() => setActionToast('')}
            className="text-emerald-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Search & Filter Bar */}
      <div className="p-5 rounded-2xl bg-[#0D131F] border border-[#1E293B] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by investor name, email, phone, or referral code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#080C14] border border-[#1E293B] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#D4AF37]/60"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterTab === 'all'
                ? 'bg-[#D4AF37] text-black font-bold'
                : 'bg-[#080C14] text-slate-400 hover:text-white border border-[#1E293B]'
            }`}
          >
            All Registered ({clients.length})
          </button>
          <button
            onClick={() => setFilterTab('pending_verification')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterTab === 'pending_verification'
                ? 'bg-amber-500 text-black font-bold'
                : 'bg-[#080C14] text-slate-400 hover:text-white border border-[#1E293B]'
            }`}
          >
            Pending Phone ({clients.filter((c) => !c.isPhoneVerified).length})
          </button>
          <button
            onClick={() => setFilterTab('pending_plan')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterTab === 'pending_plan'
                ? 'bg-blue-500 text-white font-bold'
                : 'bg-[#080C14] text-slate-400 hover:text-white border border-[#1E293B]'
            }`}
          >
            Verified (No Plan) ({clients.filter((c) => c.isPhoneVerified && !c.assignedPlanId).length})
          </button>
          <button
            onClick={() => setFilterTab('active_plan')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterTab === 'active_plan'
                ? 'bg-emerald-500 text-black font-bold'
                : 'bg-[#080C14] text-slate-400 hover:text-white border border-[#1E293B]'
            }`}
          >
            Active 14M Plan ({clients.filter((c) => c.assignedPlanStatus === 'active').length})
          </button>
          <button
            onClick={() => setFilterTab('referral_partners')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterTab === 'referral_partners'
                ? 'bg-purple-500 text-white font-bold'
                : 'bg-[#080C14] text-slate-400 hover:text-white border border-[#1E293B]'
            }`}
          >
            Referral Partners ({
              clients.filter((c) => {
                const s = computeClientReferralStats(c, clients, referrals);
                return s.totalReferred > 0;
              }).length
            })
          </button>
        </div>
      </div>

      {/* Investors Directory Table */}
      <div className="rounded-2xl bg-[#0D131F] border border-[#1E293B] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1E293B] bg-[#080C14]/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-5">Client / Investor</th>
                <th className="py-4 px-5">Phone Verification</th>
                <th className="py-4 px-5">Assigned Plan & 15% Payout</th>
                <th className="py-4 px-5">Referral Code & Level</th>
                <th className="py-4 px-5">Settlement Bank</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B] text-xs">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No registered clients found matching the current search criteria.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const monthlyPayout = client.assignedPlanAmount
                    ? (client.assignedPlanAmount * 15) / 100
                    : 0;

                  // Live referral calculations
                  const refStats = computeClientReferralStats(client, clients, referrals);
                  const levelRule =
                    REFERRAL_LEVEL_RULES.find((r) => r.level === refStats.level) ||
                    REFERRAL_LEVEL_RULES[0];

                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-[#141C2E]/50 transition-colors group"
                    >
                      {/* Name & Contact */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#080C14] border border-[#1E293B] flex items-center justify-center text-slate-300 font-bold text-xs shrink-0 group-hover:border-[#D4AF37]/50 transition-all">
                            {client.firstName[0]}
                            {client.lastName[0]}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm flex items-center gap-1.5">
                              <span>{client.firstName} {client.lastName}</span>
                              <span className="text-[10px] text-slate-500 font-mono font-normal">
                                #{client.id}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                              <span>{client.email}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                              <span>{client.phone}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Phone Verification */}
                      <td className="py-4 px-5">
                        {client.isPhoneVerified ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold text-[11px]">
                            <CheckCircle className="w-3 h-3" />
                            <span>Phone Verified</span>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-semibold text-[11px]">
                              <Clock className="w-3 h-3" />
                              <span>Pending OTP</span>
                            </div>
                            <div>
                              <button
                                onClick={() => handleVerify(client.id)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 font-bold text-[10px] transition-all"
                              >
                                ✓ Verify Phone
                              </button>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Assigned Plan & Payout */}
                      <td className="py-4 px-5">
                        {client.assignedPlanStatus === 'active' ? (
                          <div>
                            <div className="font-bold text-white text-xs flex items-center gap-1.5">
                              <span>{formatINR(client.assignedPlanAmount)}</span>
                              <span className="text-[10px] text-[#D4AF37] font-semibold">
                                (14-Month)
                              </span>
                            </div>
                            <div className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                              {formatINR(monthlyPayout)} / mo (15%)
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Month {client.currentMonthIndex} of 14 •{' '}
                              {client.currentMonthWithdrawn ? (
                                <span className="text-emerald-400 font-medium">✓ Withdrawn</span>
                              ) : (
                                <span className="text-amber-400 font-medium">● Claim Due</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-[11px] font-semibold border border-amber-500/20">
                              Awaiting Plan Start
                            </span>
                            <div className="mt-1">
                              <button
                                onClick={() => onOpenAssignModal(client.id)}
                                className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-black font-extrabold text-[10px] hover:brightness-110 transition-all flex items-center gap-1 shadow-sm"
                              >
                                <span>⚡ Start Plan</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Referral Code & Level (NEW USER REQUEST) */}
                      <td className="py-4 px-5">
                        <div className="space-y-1.5">
                          {/* Code Pill */}
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] font-mono text-[11px] font-bold">
                              {refStats.referralCode}
                            </span>
                          </div>

                          {/* Level Badge */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${levelRule.badgeBg} ${levelRule.badgeText} ${levelRule.badgeBorder}`}
                            >
                              <Award className="w-3 h-3" />
                              <span>{levelRule.badgeLabel}</span>
                            </span>
                          </div>

                          {/* Referrals Count & Active Plans */}
                          <div className="text-[11px] text-slate-300">
                            <strong className="text-white">{refStats.totalReferred}</strong> Referred{' '}
                            <span className="text-slate-500">
                              ({refStats.activePlanReferrals} Active)
                            </span>
                          </div>

                          {/* Commission yield if earning */}
                          {refStats.monthlyCommissionYield > 0 && (
                            <div className="text-[10px] text-[#D4AF37] font-bold">
                              +{formatINR(refStats.monthlyCommissionYield)} / mo yield
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Settlement Bank */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5 text-slate-300 font-medium font-mono text-[11px]">
                          <Building className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{client.bankAccount}</span>
                        </div>
                        <div className="text-[10px] text-emerald-400 mt-0.5">
                          Fee Waived (0.00 USDT)
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          {/* VIEW DETAILS BUTTON (User explicit request) */}
                          <button
                            onClick={() => setSelectedClientForDetail(client)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141C2E] hover:bg-[#1E293B] border border-[#1E293B] text-slate-200 hover:text-white font-bold text-xs transition-all shadow-sm"
                            title="Inspect full client credentials, 14M schedule, referral network, and payouts"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#D4AF37]" />
                            <span>View Details</span>
                          </button>

                          {/* Contextual Quick Actions */}
                          {!client.isPhoneVerified ? (
                            <button
                              onClick={() => handleVerify(client.id)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-extrabold text-xs hover:brightness-110 transition-all shadow"
                            >
                              Verify
                            </button>
                          ) : client.assignedPlanStatus === 'active' ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => onOpenAssignModal(client.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-[#080C14] border border-[#1E293B] text-slate-300 hover:text-white font-semibold text-xs transition-all"
                              >
                                Modify
                              </button>
                              <button
                                onClick={() => handleRevoke(client.id)}
                                title="Revoke Plan"
                                className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => onOpenAssignModal(client.id)}
                              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-black font-extrabold text-xs hover:brightness-110 active:scale-95 transition-all shadow-md shadow-[#D4AF37]/20"
                            >
                              ⚡ Assign Plan
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reusable Full Client Detail Modal */}
      <ClientDetailModal
        client={selectedClientForDetail}
        isOpen={!!selectedClientForDetail}
        onClose={() => setSelectedClientForDetail(null)}
        onOpenAssignModal={onOpenAssignModal}
      />
    </div>
  );
}
