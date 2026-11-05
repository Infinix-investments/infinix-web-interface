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
} from 'lucide-react';
import { useAdmin } from '@/context/admin-context';

export function WithdrawalsView() {
  const { withdrawals, approveWithdrawal, rejectWithdrawal, stats } = useAdmin();
  const [toast, setToast] = useState('');
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4500);
  };

  const handleApprove = (id: string) => {
    const res = approveWithdrawal(id);
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

  const pendingList = withdrawals.filter((w) => w.status === 'pending_approval');
  const settledList = withdrawals.filter((w) => w.status !== 'pending_approval');

  const formatINR = (val: number) => {
    return '₹' + val.toLocaleString('en-IN');
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

      {/* Mandatory Monthly Withdrawal Regulatory Banner */}
      <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-4">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
            Mandatory Monthly Withdrawal & Fee Waiver Protocol
          </h4>
          <p className="text-xs text-amber-200/90 leading-relaxed">
            Under the INFINIX 14-Month Tranche Covenant, investors must claim their 15.0%
            monthly distribution during each active cycle window to avoid non-withdrawal
            custodian holding charges. Approved disbursements waive all custodian fees
            (₹0.00).
          </p>
        </div>
      </div>

      {/* Pending Approvals Table */}
      <div className="rounded-2xl bg-[#0D131F] border border-[#1E293B] overflow-hidden">
        <div className="p-5 border-b border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Pending Payout Disbursements ({pendingList.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Total Due: <strong className="text-white">{formatINR(stats.pendingWithdrawalTotal)}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1E293B] bg-[#080C14]/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-5">Investor</th>
                <th className="py-4 px-5">Month Index</th>
                <th className="py-4 px-5">Net Transfer Amount</th>
                <th className="py-4 px-5">Destination Account</th>
                <th className="py-4 px-5">Custodian Fee</th>
                <th className="py-4 px-5 text-right">Approval Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B] text-xs">
              {pendingList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No pending withdrawal claims at this time. All due payouts have been processed.
                  </td>
                </tr>
              ) : (
                pendingList.map((wd) => (
                  <tr key={wd.id} className="hover:bg-[#141C2E]/50 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-bold text-white text-sm">{wd.clientName}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Claimed on {wd.requestDate}
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <span className="px-2.5 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] font-bold text-[11px]">
                        Month {wd.monthIndex} of 14
                      </span>
                    </td>

                    <td className="py-4 px-5">
                      <div className="font-black text-white text-base">
                        {formatINR(wd.amount)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        7.5% Cap + 7.5% Profit
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                        <Building className="w-3.5 h-3.5 text-slate-500" />
                        <span>{wd.bankAccount}</span>
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <span className="text-emerald-400 font-bold">₹0.00 (Waived)</span>
                    </td>

                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setRejectId(wd.id)}
                          className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 font-semibold text-xs"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleApprove(wd.id)}
                          className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-black font-extrabold text-xs hover:brightness-110 active:scale-95 transition-all shadow-md shadow-[#D4AF37]/20"
                        >
                          ✓ Approve & Disburse
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settled Disbursements History */}
      <div className="rounded-2xl bg-[#0D131F] border border-[#1E293B] overflow-hidden">
        <div className="p-5 border-b border-[#1E293B]">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Settled Disbursements History ({settledList.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1E293B] bg-[#080C14]/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-5">Investor</th>
                <th className="py-3 px-5">Month</th>
                <th className="py-3 px-5">Disbursed Amount</th>
                <th className="py-3 px-5">Bank & UTR Reference</th>
                <th className="py-3 px-5">Disbursed Date</th>
                <th className="py-3 px-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B] text-xs">
              {settledList.map((wd) => (
                <tr key={wd.id} className="hover:bg-[#141C2E]/30">
                  <td className="py-3 px-5 font-bold text-white">{wd.clientName}</td>
                  <td className="py-3 px-5 text-slate-400">Month {wd.monthIndex} of 14</td>
                  <td className="py-3 px-5 font-bold text-emerald-400">{formatINR(wd.amount)}</td>
                  <td className="py-3 px-5 text-slate-300 font-mono text-[11px]">
                    {wd.bankAccount} {wd.utrReference ? `• ${wd.utrReference}` : ''}
                  </td>
                  <td className="py-3 px-5 text-slate-400">{wd.disbursedDate || wd.requestDate}</td>
                  <td className="py-3 px-5 text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[10px]">
                      ✓ Disbursed
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectId && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0D131F] border border-[#1E293B] rounded-2xl p-6 space-y-4">
            <h4 className="text-base font-bold text-white">Reject Withdrawal Claim</h4>
            <p className="text-xs text-slate-400">
              Please enter the regulatory reason for rejecting this payout request:
            </p>
            <input
              type="text"
              placeholder="e.g. Bank IFSC mismatch / Re-KYC required"
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
    </div>
  );
}

