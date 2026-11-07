import {
  ClientProfile,
  InvestmentPlanConfig,
  WithdrawalRecord,
  AuditLogItem,
  ReferralRecord,
  ReferralLevelTier,
} from '@/types/admin';

export const INITIAL_PLANS: InvestmentPlanConfig[] = [
  {
    id: 'plan-14m-15pct',
    planName: 'INFINIX 14-Month Wealth Accelerator',
    description:
      'Private contractual high-yield wealth tranche providing 0.5% daily increment (15.0% monthly distribution) over a 14-month contractual period. Total gross payout: 210% of invested capital (e.g. ₹1,00,000 becomes ₹2,10,000).',
    monthlyReturnPct: 15.0,
    dailyReturnPct: 0.5,
    durationMonths: 14,
    capitalReturnMonthlyPct: 7.5,
    profitMonthlyPct: 7.5,
    grossTotalReturnPct: 210.0,
    netProfitPct: 105.0,
    minInvestment: 100000,
    maxInvestment: 50000000,
    isDefault: true,
    status: 'active',
  },
  {
    id: 'plan-custom-flexible',
    planName: 'INFINIX Bespoke Institutional Tranche',
    description:
      'Customized structured vehicle for family offices and institutional allocations exceeding ₹1.0 Cr with customized tenure and distribution frequency.',
    monthlyReturnPct: 12.5,
    dailyReturnPct: 0.41,
    durationMonths: 18,
    capitalReturnMonthlyPct: 5.55,
    profitMonthlyPct: 6.95,
    grossTotalReturnPct: 225.0,
    netProfitPct: 125.0,
    minInvestment: 10000000,
    maxInvestment: 50000000,
    isDefault: false,
    status: 'active',
  },
];

export const INITIAL_CLIENTS: ClientProfile[] = [];

export const INITIAL_WITHDRAWALS: WithdrawalRecord[] = [];

export const INITIAL_REFERRALS: ReferralRecord[] = [];

export const INITIAL_REFERRAL_TIERS: ReferralLevelTier[] = [
  {
    level: 1,
    name: 'Level 1: Direct Wealth Partner',
    commissionPct: 10.0,
    minTeamAum: 0,
    minDirectReferrals: 2,
    description:
      'Direct Introducer Tier. Earns 10% of referred investor’s monthly ROI. Unlocks after 2 referrals start an active plan.',
    totalMembersCount: 0,
    totalVolumeGenerated: 0,
    status: 'active',
  },
  {
    level: 2,
    name: 'Level 2: Syndication Partner',
    commissionPct: 5.0,
    minTeamAum: 0,
    minDirectReferrals: 4,
    description:
      'Secondary Tier. Earns 5% of referred investor’s monthly ROI. Unlocks after 4 referrals start an active plan.',
    totalMembersCount: 0,
    totalVolumeGenerated: 0,
    status: 'active',
  },
  {
    level: 3,
    name: 'Level 3: Executive Partner',
    commissionPct: 3.0,
    minTeamAum: 0,
    minDirectReferrals: 6,
    description:
      'Tertiary Tier. Earns 3% of referred investor’s monthly ROI. Unlocks after 6 referrals start an active plan.',
    totalMembersCount: 0,
    totalVolumeGenerated: 0,
    status: 'active',
  },
  {
    level: 4,
    name: 'Level 4: Managing Partner',
    commissionPct: 2.0,
    minTeamAum: 0,
    minDirectReferrals: 8,
    description:
      'Level 4 Tier. Earns 2% of referred investor’s monthly ROI. Unlocks after 8 referrals start an active plan.',
    totalMembersCount: 0,
    totalVolumeGenerated: 0,
    status: 'active',
  },
  {
    level: 5,
    name: 'Level 5: Sovereign Syndicate',
    commissionPct: 1.0,
    minTeamAum: 0,
    minDirectReferrals: 10,
    description:
      'Level 5 Tier. Earns 1% of referred investor’s monthly ROI. Unlocks after 10 referrals start an active plan.',
    totalMembersCount: 0,
    totalVolumeGenerated: 0,
    status: 'active',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [];
