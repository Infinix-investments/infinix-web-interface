'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ArrowDownLeft,
  Building,
  ShieldCheck,
  FileText,
  Search,
  Check,
  Copy,
  Eye,
  Filter,
  TrendingDown,
  Sparkles,
} from 'lucide-react';
import { useAdmin } from '@/context/admin-context';
import { ClientProfile, WithdrawalRecord } from '@/types/admin';
import { ClientDetailModal } from '../clients/client-detail-modal';
import { formatUSDT } from '@/utils/currency';

export function WithdrawalsView() {
  const {
    withdrawals,
    clients,
    approveWithdrawal,
    rejectWithdrawal,
    setSelectedClientId,
    setActiveTab,
    stats,
  } = useAdmin();

  const [toast, setToast] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'pending' | 'settled' | 'all' | 'rejected'>('pending');

  // Approval Modal State with Bank UTR
  const [approvingRecord, setApprovingRecord] = useState<WithdrawalRecord | null>(null);
  const [approvalUtr, setApprovalUtr] = useState('');

  // Reject Modal State
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Selected Client for detail inspection
  const [selectedClientForDetail, setSelectedClientForDetail] = useState<ClientProfile | null>(null);

  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4500);
  };

  const handleOpenApproveModal = (wd: WithdrawalRecord) => {
    setApprovingRecord(wd);
    setApprovalUtr(`CMS-RTGS-${Date.now().toString().slice(-8)}`);
  };

  const handleConfirmApproval = () => {
    if (!approvingRecord) return;
    const res = approveWithdrawal(approvingRecord.id, approvalUtr || undefined);
    setApprovingRecord(null);
    setApprovalUtr('');
    if (res.success) {
      showToast(res.message);
    }
  };

  const handleRejectConfirm = () => {
    if (!rejectId) return;
    const res = rejectWithdrawal(rejectId, rejectReason || 'Incomplete KYC documentation');
    setRejectId(null);
    setRejectReason('');
    if (res.success) {
      showToast(res.message);
    }
  };

  const handleCopyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  const handleViewClientProfile = (clientId: string, clientName: string) => {
    const client =
      clients.find((c) => c.id === clientId) ||
      clients.find((c) => `${c.firstName} ${c.lastName}`.toLowerCase() === clientName.toLowerCase());
    if (client) {
      setSelectedClientId(client.id);
      setActiveTab('clients');
    } else {
      showToast('Client profile not found in directory.');
    }
  };

  const pendingList = withdrawals.filter((w) => w.status === 'pending_approval');
  const settledList = withdrawals.filter((w) => w.status === 'disbursed');
  const rejectedList = withdrawals.filter((w) => w.status === 'rejected');

  const filteredWithdrawals = withdrawals.filter((w) => {
    const matchesSearch =
      w.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.bankAccount.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.utrReference && w.utrReference.toLowerCase().includes(searchQuery.toLowerCase())) ||
      w.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === 'pending') return w.status === 'pending_approval';
    if (filterTab === 'settled') return w.status === 'disbursed';
    if (filterTab === 'rejected') return w.status === 'rejected';

    return true;
  });

  const totalDisbursedAmount = settledList.reduce((sum, w) => sum + w.amount, 0);

  const formatINR = (val?: number) => {
    return formatUSDT(val);
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

      {/* ⚠️ HIGH PRIORITY PENDING CLAIMS BANNER (User Request 2) */}
      {pendingList.length > 0 ? (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-[#0D131F] border border-amber-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg shadow-amber-500/5">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shrink-0 mt-0.5">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] uppercase tracking-wider border border-amber-500/40">
                  Action Required
                </span>
                <span className="text-xs font-semibold text-slate-300">
                  14-Month Payout Window Active
                </span>
              </div>
              <h3 className="text-base font-black text-white mt-1">
                {pendingList.length} Client Withdrawal Claim{pendingList.length > 1 ? 's' : ''} Pending Desk Approval
              </h3>
              <p className="text-xs text-amber-200/90 mt-0.5 max-w-2xl leading-relaxed">
                Total Payout Due:{' '}
                <strong className="text-white font-mono text-sm">
                  {formatINR(stats.pendingWithdrawalTotal)}
                </strong>
                . Verify destination account numbers and authorize bank RTGS/NEFT disbursements below.
              </p>
            </div>
          </div>

          <button
            onClick={() => setFilterTab('pending')}
            className="px-4 py-2.5 rounded-xl bg-amber-500 text-black font-extrabold text-xs hover:brightness-110 active:scale-95 transition-all shadow-md shrink-0 flex items-center gap-2"
          >
            <span>Review Pending Claims ({pendingList.length})</span>
          </button>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-[#0D131F] border border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="text-xs text-slate-300 font-medium">
              All due client withdrawal claims have been approved and settled. No pending payouts at this time.
            </span>
          </div>
          <span className="text-xs font-bold text-emerald-400">Desk Up To Date</span>
        </div>
      )}

      {/* 4 Top Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Pending Card */}
        <div className="p-5 rounded-2xl bg-[#0D131F] border border-[#1E293B]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Pending Authorization
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-black text-amber-400">
              {formatINR(stats.pendingWithdrawalTotal)}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {pendingList.length} request{pendingList.length !== 1 ? 's' : ''} awaiting UTR clearance
            </p>
          </div>
        </div>

        {/* Settled Disbursements */}
        <div className="p-5 rounded-2xl bg-[#0D131F] border border-[#1E293B]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Settled Disbursements
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-black text-emerald-400">
              {formatINR(totalDisbursedAmount)}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {settledList.length} transfer{settledList.length !== 1 ? 's' : ''} executed to client banks
            </p>
          </div>
        </div>

        {/* Monthly Contractual Liability */}
        <div className="p-5 rounded-2xl bg-[#0D131F] border border-[#1E293B]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Monthly 15% Distribution
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-black text-white">
              {formatINR(stats.monthlyLiabilityTotal)}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              15.0% contractual return across active capital
            </p>
          </div>
        </div>

        {/* Fee Policy */}
        <div className="p-5 rounded-2xl bg-[#0D131F] border border-[#1E293B]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Disbursement Fee Engine
            </span>
            <div className="p-2 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-black text-[#D4AF37]">
              3% Flat Fee
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Flat 3% withdrawal fee • 10-day cycle gap • Zero late fees
            </p>
          </div>
        </div>
      </div>

      {/* Top Filter and Search Bar */}
      <div className="p-5 rounded-2xl bg-[#0D131F] border border-[#1E293B] flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by client name, bank account, or UTR reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#080C14] border border-[#1E293B] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#D4AF37]/60"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterTab('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filterTab === 'pending'
                ? 'bg-amber-500 text-black font-bold'
                : 'bg-[#080C14] text-slate-400 hover:text-white border border-[#1E293B]'
            }`}
          >
            <span>Pending Authorization</span>
            {pendingList.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                filterTab === 'pending' ? 'bg-black text-amber-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {pendingList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setFilterTab('settled')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filterTab === 'settled'
                ? 'bg-emerald-500 text-black font-bold'
                : 'bg-[#080C14] text-slate-400 hover:text-white border border-[#1E293B]'
            }`}
          >
            <span>Settled Disbursements</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#080C14] text-slate-300">
              {settledList.length}
            </span>
          </button>

          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterTab === 'all'
                ? 'bg-[#D4AF37] text-black font-bold'
                : 'bg-[#080C14] text-slate-400 hover:text-white border border-[#1E293B]'
            }`}
          >
            All Requests ({withdrawals.length})
          </button>

          {rejectedList.length > 0 && (
            <button
              onClick={() => setFilterTab('rejected')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterTab === 'rejected'
                  ? 'bg-red-500 text-white font-bold'
                  : 'bg-[#080C14] text-slate-400 hover:text-white border border-[#1E293B]'
              }`}
            >
              Rejected ({rejectedList.length})
            </button>
          )}
        </div>
      </div>

      {/* Main Withdrawals Table */}
      <div className="rounded-2xl bg-[#0D131F] border border-[#1E293B] overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#D4AF37]" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              {filterTab === 'pending'
                ? `Pending Claims Requiring Authorization (${filteredWithdrawals.length})`
                : filterTab === 'settled'
                ? `Settled Bank Transfers History (${filteredWithdrawals.length})`
                : `Withdrawal Claims Ledger (${filteredWithdrawals.length})`}
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Total Displayed: <strong className="text-white">{formatINR(filteredWithdrawals.reduce((s, w) => s + w.amount, 0))}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1E293B] bg-[#080C14]/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-5">Client / Investor</th>
                <th className="py-4 px-5">Tranche Month</th>
                <th className="py-4 px-5">15% Payout Breakdown</th>
                <th className="py-4 px-5">Destination Bank Account</th>
                <th className="py-4 px-5">Status & UTR</th>
                <th className="py-4 px-5 text-right">Desk Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B] text-xs">
              {filteredWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No withdrawal records found matching the current search / filter.
                  </td>
                </tr>
              ) : (
                filteredWithdrawals.map((wd) => {
                  const capitalReturn = wd.amount / 2;
                  const profitReturn = wd.amount / 2;

                  return (
                    <tr
                      key={wd.id}
                      className="hover:bg-[#141C2E]/50 transition-colors"
                    >
                      {/* Client info */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-white text-sm flex items-center gap-1.5">
                          <span>{wd.clientName}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Claimed on: <strong className="text-slate-300">{wd.requestDate}</strong>
                        </div>
                        <div className="mt-1">
                          <button
                            onClick={() => handleViewClientProfile(wd.clientId, wd.clientName)}
                            className="inline-flex items-center gap-1 text-[10px] text-[#D4AF37] hover:underline font-semibold"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Inspect Client Profile</span>
                          </button>
                        </div>
                      </td>

                      {/* Month & Tranche index */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2.5 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] font-bold text-[11px]">
                            Month {wd.monthIndex} of 14
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold text-[10px]">
                            Part {wd.partIndex || 1} of 2
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          10-Day Cycle Window (3% Flat Fee)
                        </div>
                      </td>

                      {/* Tranche payout amount breakdown */}
                      <td className="py-4 px-5">
                        <div className="font-black text-white text-base">
                          {formatINR(wd.netAmount || wd.amount)}
                          <span className="text-[11px] font-normal text-slate-400 ml-1.5">(Net Payout)</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                          Gross: {formatINR(wd.grossAmount || wd.amount)} • Fee (3%):{' '}
                          <span className="text-amber-400 font-semibold">
                            -{formatINR(wd.feeAmount || ((wd.grossAmount || wd.amount) * 0.03))}
                          </span>
                        </div>
                        <div className="text-[10px] text-emerald-400 font-medium mt-0.5">
                          Principal ({formatINR((wd.grossAmount || wd.amount) / 2)}) + Profit ({formatINR((wd.grossAmount || wd.amount) / 2)})
                        </div>
                      </td>

                      {/* Bank account */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5 text-slate-200 font-mono text-[11px] font-medium">
                          <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{wd.bankAccount}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          RTGS / NEFT Clearance
                        </div>
                      </td>

                      {/* Status & UTR */}
                      <td className="py-4 px-5">
                        {wd.status === 'disbursed' ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[10px]">
                              <CheckCircle className="w-3 h-3" />
                              Disbursed
                            </span>
                            {wd.utrReference && (
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="font-mono text-[11px] text-slate-300">
                                  {wd.utrReference}
                                </span>
                                <button
                                  onClick={() => handleCopyUtr(wd.utrReference!)}
                                  title="Copy UTR Reference"
                                  className="text-slate-500 hover:text-white"
                                >
                                  {copiedUtr === wd.utrReference ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            )}
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              Settled on {wd.disbursedDate || wd.requestDate}
                            </div>
                          </div>
                        ) : wd.status === 'pending_approval' ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-[10px] animate-pulse">
                              <Clock className="w-3 h-3" />
                              Pending Approval
                            </span>
                            <div className="text-[10px] text-amber-200/80 mt-1">
                              Awaiting Treasury UTR
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 font-bold text-[10px]">
                              <XCircle className="w-3 h-3" />
                              Rejected
                            </span>
                            {wd.notes && (
                              <div className="text-[10px] text-red-300 mt-1 max-w-xs">
                                {wd.notes}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        {wd.status === 'pending_approval' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setRejectId(wd.id)}
                              className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 font-semibold text-xs transition-all"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleOpenApproveModal(wd)}
                              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-black font-extrabold text-xs hover:brightness-110 active:scale-95 transition-all shadow-md shadow-[#D4AF37]/20"
                            >
                              ✓ Approve & Disburse
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px] font-medium">
                            Archived in ledger
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* APPROVAL & UTR ASSIGNMENT MODAL */}
      {approvingRecord && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-[#0D131F] border border-[#1E293B] rounded-3xl p-6 md:p-8 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[10px] uppercase tracking-wider">
                  Treasury Authorization
                </span>
                <h3 className="text-lg font-black text-white mt-1.5">
                  Authorize Payout Disbursement
                </h3>
              </div>
              <button
                onClick={() => setApprovingRecord(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#080C14] border border-[#1E293B] space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
                <span className="text-slate-400">Beneficiary Investor:</span>
                <span className="font-bold text-white text-sm">{approvingRecord.clientName}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
                <span className="text-slate-400">Tranche Tenure:</span>
                <span className="font-bold text-[#D4AF37]">
                  Month {approvingRecord.monthIndex} of 14 • Part {approvingRecord.partIndex || 1} of 2
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
                <span className="text-slate-400">Destination Bank Account:</span>
                <span className="font-mono font-bold text-slate-200">{approvingRecord.bankAccount}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
                <span className="text-slate-400">Gross Tranche Amount:</span>
                <span className="font-mono font-bold text-white">
                  {formatINR(approvingRecord.grossAmount || approvingRecord.amount)}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
                <span className="text-slate-400">Processing Fee (3%):</span>
                <span className="font-bold text-slate-300">
                  -
                  {formatINR(
                    approvingRecord.feeAmount ||
                      ((approvingRecord.grossAmount || approvingRecord.amount) * 0.03)
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-300 font-bold">Net Bank Disbursement:</span>
                <span className="font-black text-emerald-400 text-lg font-mono">
                  {formatINR(approvingRecord.netAmount || approvingRecord.amount)}
                </span>
              </div>
            </div>

            {/* Bank UTR Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                Bank UTR / Transaction Reference Number:
              </label>
              <input
                type="text"
                value={approvalUtr}
                onChange={(e) => setApprovalUtr(e.target.value)}
                placeholder="e.g. CMS-RTGS-998823104 or HDFC0000123"
                className="w-full px-4 py-2.5 rounded-xl bg-[#080C14] border border-[#1E293B] text-white text-xs font-mono placeholder:text-slate-500 focus:outline-none focus:border-[#D4AF37]"
              />
              <p className="text-[10px] text-slate-500">
                This transaction reference will be permanently attached to the client’s mobile ledger.
              </p>
            </div>

            {/* Modal Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setApprovingRecord(null)}
                className="px-4 py-2 rounded-xl bg-[#080C14] border border-[#1E293B] text-slate-400 hover:text-white text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApproval}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-black font-extrabold text-xs hover:brightness-110 shadow-lg shadow-[#D4AF37]/20 transition-all"
              >
                Confirm & Disburse Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT WITHDRAWAL MODAL */}
      {rejectId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0D131F] border border-[#1E293B] rounded-2xl p-6 space-y-4 shadow-2xl">
            <h4 className="text-base font-bold text-white">Reject Withdrawal Claim</h4>
            <p className="text-xs text-slate-400">
              Please enter the regulatory reason for rejecting this payout request:
            </p>
            <input
              type="text"
              placeholder="e.g. Bank IFSC mismatch / Re-KYC authentication required"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#080C14] border border-[#1E293B] text-white text-xs focus:outline-none focus:border-red-400"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectId(null)}
                className="px-3 py-1.5 rounded-lg bg-[#080C14] text-slate-400 text-xs hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                className="px-4 py-1.5 rounded-lg bg-red-500 text-white font-bold text-xs hover:bg-red-600"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Full Detail Inspection Modal */}
      <ClientDetailModal
        client={selectedClientForDetail}
        isOpen={!!selectedClientForDetail}
        onClose={() => setSelectedClientForDetail(null)}
      />
    </div>
  );
}
