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
} from 'lucide-react';
import { useAdmin } from '@/context/admin-context';
import { ClientProfile } from '@/types/admin';

interface ClientsViewProps {
  onOpenAssignModal: (clientId: string) => void;
  onOpenNewClientModal: () => void;
}

export function ClientsView({
  onOpenAssignModal,
  onOpenNewClientModal,
}: ClientsViewProps) {
  const { clients, verifyClientPhone, revokeClientPlan } = useAdmin();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<
    'all' | 'pending_verification' | 'pending_plan' | 'active_plan'
  >('all');
  const [actionToast, setActionToast] = useState('');

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
    const matchesSearch =
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);

    if (!matchesSearch) return false;

    if (filterTab === 'pending_verification') return !c.isPhoneVerified;
    if (filterTab === 'pending_plan') return c.isPhoneVerified && !c.assignedPlanId;
    if (filterTab === 'active_plan') return c.assignedPlanStatus === 'active';

    return true;
  });

  const formatINR = (val?: number) => {
    if (!val) return '—';
    return '₹' + val.toLocaleString('en-IN');
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
      <div className="p-5 rounded-2xl bg-[#0D131F] border border-[#1E293B] flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by investor name, email, or mobile number..."
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
            All Investors ({clients.length})
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
        </div>
      </div>

      {/* Investors Directory Table */}
      <div className="rounded-2xl bg-[#0D131F] border border-[#1E293B] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1E293B] bg-[#080C14]/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-5">Investor Profile</th>
                <th className="py-4 px-5">Phone Verification</th>
                <th className="py-4 px-5">Assigned Plan</th>
                <th className="py-4 px-5">Capital & 15% Payout</th>
                <th className="py-4 px-5">Settlement Bank</th>
                <th className="py-4 px-5 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B] text-xs">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No investors found matching the current search criteria.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const monthlyPayout = client.assignedPlanAmount
                    ? (client.assignedPlanAmount * 15) / 100
                    : 0;

                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-[#141C2E]/50 transition-colors"
                    >
                      {/* Name & Contact */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-white text-sm">
                          {client.firstName} {client.lastName}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span>{client.email}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{client.phone}</span>
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
                              <span>Pending Verification</span>
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

                      {/* Assigned Plan */}
                      <td className="py-4 px-5">
                        {client.assignedPlanStatus === 'active' ? (
                          <div>
                            <div className="font-bold text-[#D4AF37] flex items-center gap-1">
                              <span>{client.assignedPlanName}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              14-Month Term • Month {client.currentMonthIndex} of 14
                            </div>
                            <div className="text-[10px] text-emerald-400 font-medium">
                              {client.currentMonthWithdrawn
                                ? '✓ Current month withdrawn'
                                : '● Payout available for claim'}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 text-[11px] font-semibold border border-slate-700">
                              No Plan Assigned
                            </span>
                            <p className="text-[10px] text-slate-500 mt-1">
                              Investor will not see plan until desk allocates
                            </p>
                          </div>
                        )}
                      </td>

                      {/* Capital & Payout */}
                      <td className="py-4 px-5">
                        {client.assignedPlanAmount ? (
                          <div>
                            <div className="font-bold text-white text-sm">
                              {formatINR(client.assignedPlanAmount)}
                            </div>
                            <div className="text-[11px] text-emerald-400 font-semibold">
                              {formatINR(monthlyPayout)} / mo (15%)
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>

                      {/* Settlement Bank */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                          <Building className="w-3 h-3 text-slate-500" />
                          <span>{client.bankAccount}</span>
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!client.isPhoneVerified ? (
                            <button
                              onClick={() => handleVerify(client.id)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-extrabold text-xs hover:brightness-110 transition-all shadow"
                            >
                              Verify Phone
                            </button>
                          ) : client.assignedPlanStatus === 'active' ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => onOpenAssignModal(client.id)}
                                className="px-3 py-1.5 rounded-lg bg-[#080C14] border border-[#1E293B] text-slate-300 hover:text-white font-semibold text-xs transition-all"
                              >
                                Modify Plan
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
                              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-black font-extrabold text-xs hover:brightness-110 active:scale-95 transition-all shadow-md shadow-[#D4AF37]/20"
                            >
                              ⚡ Assign 14M Plan
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
    </div>
  );
}
