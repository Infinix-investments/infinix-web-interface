'use client';

import React from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  Lock,
  PlusCircle,
  Bell,
  RefreshCw,
  Clock,
  CreditCard,
} from 'lucide-react';
import { useAdmin } from '@/context/admin-context';

interface HeaderProps {
  onOpenNewClientModal: () => void;
}

export function Header({ onOpenNewClientModal }: HeaderProps) {
  const { activeTab, stats } = useAdmin();

  const titles: Record<string, { title: string; subtitle: string }> = {
    overview: {
      title: 'Executive Portfolio Desk',
      subtitle: 'Real-time AUM, liabilities, and client status overview',
    },
    clients: {
      title: 'Client Management Desk',
      subtitle: 'Search, filter, view individual client pages, inspect portfolios, and manage allocations',
    },
    plans: {
      title: 'Plan Configuration & Tranche Engine',
      subtitle: 'Active 14-Month 15% Return Accelerator and yield simulation',
    },
    withdrawals: {
      title: 'Withdrawal Management Desk',
      subtitle: 'Authorize 15.0% monthly client payout claims and issue Bank UTR references',
    },
    referrals: {
      title: 'Referral Network & Affiliate Directory',
      subtitle: 'Track investor introducers, multi-level overrides, and commission claims',
    },
    levels: {
      title: 'Level Section & Network Tier Governance',
      subtitle: 'Configure commission splits, team AUM thresholds, and syndicator ranks',
    },
    audit: {
      title: 'Institutional Audit Trail',
      subtitle: 'Immutable record of plan allocations, verifications, and transfers',
    },
  };

  const current = titles[activeTab] || titles.overview;

  return (
    <header className="h-20 bg-[#080C14] border-b border-[#1E293B] px-8 flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-xl font-extrabold text-white tracking-tight">
          {current.title}
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">{current.subtitle}</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Security / Escrow Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0D131F] border border-[#1E293B]">
          <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span className="text-[11px] font-medium text-slate-300">
            Escrow Vault:{' '}
            <span className="text-emerald-400 font-bold">256-Bit Live</span>
          </span>
        </div>

        {/* Pending Withdrawal Claims Pill */}
        {stats.pendingWithdrawalCount > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-400 text-xs font-semibold animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            <span>{stats.pendingWithdrawalCount} Pending Withdrawal Claim{stats.pendingWithdrawalCount !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Pending Alerts Pill */}
        {stats.pendingPhoneCount > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{stats.pendingPhoneCount} Needs Phone Verification</span>
          </div>
        )}

        {/* Onboard Client CTA */}
        <button
          onClick={onOpenNewClientModal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-black font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-md shadow-[#D4AF37]/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Onboard Investor</span>
        </button>
      </div>
    </header>
  );
}

