'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  CreditCard,
  History,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Share2,
  Gift,
  Layers,
  Award,
} from 'lucide-react';
import { useAdmin, AdminTab } from '@/context/admin-context';

export function Sidebar() {
  const { activeTab, setActiveTab, stats } = useAdmin();

  // Collapsible state for Refer & Earn folder
  const [isReferEarnOpen, setIsReferEarnOpen] = useState(
    activeTab === 'referrals' || activeTab === 'levels'
  );

  // Auto-expand if user navigates to referrals or levels
  useEffect(() => {
    if (activeTab === 'referrals' || activeTab === 'levels') {
      const timer = setTimeout(() => setIsReferEarnOpen(true), 0);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  const isReferEarnActive = activeTab === 'referrals' || activeTab === 'levels';

  const navItems: {
    id: AdminTab;
    label: string;
    sublabel: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: 'overview',
      label: 'Executive Overview',
      sublabel: 'AUM & Portfolio Health',
      icon: LayoutDashboard,
    },
    {
      id: 'clients',
      label: 'Client Management',
      sublabel: 'Profiles, Portfolios & Directory',
      icon: Users,
      badge: stats.pendingPhoneCount > 0 ? stats.pendingPhoneCount : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/40',
    },
    {
      id: 'plans',
      label: 'Plan Configuration',
      sublabel: '14-Mo 15% Yield Tranche',
      icon: TrendingUp,
    },
    {
      id: 'withdrawals',
      label: 'Withdrawal Management',
      sublabel: 'Claims & Payout Approvals',
      icon: CreditCard,
      badge:
        stats.pendingWithdrawalCount > 0
          ? stats.pendingWithdrawalCount
          : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/40',
    },
    {
      id: 'audit',
      label: 'Audit Trail',
      sublabel: 'Institutional Logs',
      icon: History,
    },
  ];

  return (
    <aside className="w-72 bg-[#080C14] border-r border-[#1E293B] flex flex-col justify-between shrink-0 select-none">
      {/* Top Branding Section */}
      <div>
        <div className="p-6 pb-5 border-b border-[#1E293B]">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-[#D4AF37]/40 shadow-lg shadow-[#D4AF37]/10 bg-[#0D131F]">
              <Image
                src="/icon.png"
                alt="INFINIX"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-wider text-lg text-white">
                  INFINIX
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 uppercase">
                  Desk
                </span>
              </div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">
                Private Wealth Portal
              </p>
            </div>
          </div>

          <div className="mt-4 px-3 py-2 rounded-lg bg-[#0D131F] border border-[#1E293B] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-semibold text-slate-300">
                14-Month 15% Tranche Active
              </span>
            </div>
            <span className="text-[10px] font-bold text-[#D4AF37]">210% Yield</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-250px)]">
          <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Administrative Modules
          </p>

          {/* Regular Top Nav Items */}
          {navItems.slice(0, 3).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all duration-200 text-left ${
                  isActive
                    ? 'bg-gradient-to-r from-[#D4AF37]/15 to-[#D4AF37]/5 border border-[#D4AF37]/40 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-[#0D131F] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-1.5 rounded-lg ${
                      isActive
                        ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                        : 'text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold leading-tight">
                      {item.label}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {item.sublabel}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge !== undefined && (
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-4 h-4 text-[#D4AF37]" />}
                </div>
              </button>
            );
          })}

          {/* =========================================================================
              DROPDOWN FOLDER: REFER & EARN (OPENS AND COLLAPSES)
             ========================================================================= */}
          <div className="pt-1">
            <button
              onClick={() => setIsReferEarnOpen((prev) => !prev)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all duration-200 text-left ${
                isReferEarnActive
                  ? 'bg-[#0D131F] border border-[#D4AF37]/30 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-[#0D131F] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-1.5 rounded-lg ${
                    isReferEarnActive
                      ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                      : 'text-slate-400'
                  }`}
                >
                  <Gift className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold leading-tight">
                    <span>Refer & Earn</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Affiliate & Network Tiers
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-slate-400">
                {isReferEarnOpen ? (
                  <ChevronDown className="w-4 h-4 text-[#D4AF37]" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </div>
            </button>

            {/* Nested Sub-Sections Container */}
            {isReferEarnOpen && (
              <div className="mt-1 ml-4 pl-3 border-l-2 border-[#1E293B] space-y-1 py-1">
                {/* 1. Referrals Section */}
                <button
                  onClick={() => setActiveTab('referrals')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'referrals'
                      ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40'
                      : 'text-slate-400 hover:text-white hover:bg-[#0D131F]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        activeTab === 'referrals'
                          ? 'bg-[#D4AF37]'
                          : 'bg-slate-600'
                      }`}
                    />
                    <span>Referrals</span>
                  </div>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-[#080C14] text-slate-300 border border-[#1E293B]">
                    {stats.totalReferralsCount}
                  </span>
                </button>

                {/* 2. Level Section */}
                <button
                  onClick={() => setActiveTab('levels')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'levels'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      : 'text-slate-400 hover:text-white hover:bg-[#0D131F]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        activeTab === 'levels' ? 'bg-purple-400' : 'bg-slate-600'
                      }`}
                    />
                    <span>Level Section</span>
                  </div>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    3 Levels
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Remaining Nav Items */}
          {navItems.slice(3).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all duration-200 text-left ${
                  isActive
                    ? 'bg-gradient-to-r from-[#D4AF37]/15 to-[#D4AF37]/5 border border-[#D4AF37]/40 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-[#0D131F] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-1.5 rounded-lg ${
                      isActive
                        ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                        : 'text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold leading-tight">
                      {item.label}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {item.sublabel}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge !== undefined && (
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-4 h-4 text-[#D4AF37]" />}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Administrator Card */}
      <div className="p-4 border-t border-[#1E293B]">
        <div className="p-3 rounded-xl bg-[#0D131F] border border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] font-bold text-xs">
              AD
            </div>
            <div>
              <p className="text-xs font-bold text-white">Chief Wealth Admin</p>
              <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Master Authority
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between px-2 text-[10px] text-slate-500">
          <span>INFINIX OS v2.4</span>
          <span className="flex items-center gap-1 text-[#D4AF37] hover:underline cursor-pointer">
            Vercel Ready <ExternalLink className="w-2.5 h-2.5" />
          </span>
        </div>
      </div>
    </aside>
  );
}
