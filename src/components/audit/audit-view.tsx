'use client';

import React, { useState } from 'react';
import { History, ShieldCheck, Search, Filter } from 'lucide-react';
import { useAdmin } from '@/context/admin-context';
import { AuditLogItem } from '@/types/admin';

export function AuditView() {
  const { auditLogs } = useAdmin();
  const [filterCat, setFilterCat] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  const filteredLogs = auditLogs.filter((log) => {
    if (filterCat !== 'all' && log.category !== filterCat) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.adminName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Filter */}
      <div className="p-5 rounded-2xl bg-[#0D131F] border border-[#1E293B] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-[#D4AF37]" />
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Immutable System Activity & Compliance Audit
            </h3>
            <p className="text-xs text-slate-400">
              Complete chronological tracking of all wealth allocations, verifications, and payouts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterCat('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              filterCat === 'all'
                ? 'bg-[#D4AF37] text-black font-bold'
                : 'bg-[#080C14] text-slate-400 border border-[#1E293B]'
            }`}
          >
            All Logs ({auditLogs.length})
          </button>
          <button
            onClick={() => setFilterCat('client_verification')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              filterCat === 'client_verification'
                ? 'bg-blue-500 text-white font-bold'
                : 'bg-[#080C14] text-slate-400 border border-[#1E293B]'
            }`}
          >
            Verifications
          </button>
          <button
            onClick={() => setFilterCat('plan_assignment')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              filterCat === 'plan_assignment'
                ? 'bg-[#D4AF37] text-black font-bold'
                : 'bg-[#080C14] text-slate-400 border border-[#1E293B]'
            }`}
          >
            Plan Allocations
          </button>
          <button
            onClick={() => setFilterCat('withdrawal_approval')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              filterCat === 'withdrawal_approval'
                ? 'bg-emerald-500 text-black font-bold'
                : 'bg-[#080C14] text-slate-400 border border-[#1E293B]'
            }`}
          >
            Disbursements
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl bg-[#0D131F] border border-[#1E293B] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1E293B] bg-[#080C14]/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-5">Timestamp</th>
                <th className="py-4 px-5">Administrative Action</th>
                <th className="py-4 px-5">Audit Details</th>
                <th className="py-4 px-5 text-right">Authorized By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B] text-xs">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#141C2E]/40">
                  <td className="py-3 px-5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3 px-5 font-bold text-white whitespace-nowrap">
                    <span
                      className={`inline-block w-2 h-2 rounded-full mr-2 ${
                        log.category === 'client_verification'
                          ? 'bg-blue-400'
                          : log.category === 'plan_assignment'
                          ? 'bg-[#D4AF37]'
                          : 'bg-emerald-400'
                      }`}
                    />
                    {log.action}
                  </td>
                  <td className="py-3 px-5 text-slate-300 max-w-xl">{log.details}</td>
                  <td className="py-3 px-5 text-right text-slate-400 whitespace-nowrap">
                    {log.adminName}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

