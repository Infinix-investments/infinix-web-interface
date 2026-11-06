import {
  ClientProfile,
  ReferralRecord,
  ClientReferralSummary,
  ReferredUserItem,
} from '@/types/admin';

export interface LevelConfig {
  level: number;
  requiredPlans: number;
  roiPct: number;
  name: string;
  badgeLabel: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  description: string;
}

export const REFERRAL_LEVEL_RULES: LevelConfig[] = [
  {
    level: 0,
    requiredPlans: 0,
    roiPct: 0,
    name: 'Level 0 (Pending 2 Plans)',
    badgeLabel: 'Level 0 • 0%',
    badgeBg: 'bg-slate-800/80',
    badgeText: 'text-slate-400',
    badgeBorder: 'border-slate-700',
    description: 'Requires 2 active plan referrals to unlock Level 1 (10% ROI yield).',
  },
  {
    level: 1,
    requiredPlans: 2,
    roiPct: 10,
    name: 'Level 1 (10% ROI)',
    badgeLabel: 'Level 1 • 10% ROI',
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-400',
    badgeBorder: 'border-emerald-500/30',
    description: 'Direct Wealth Partner. Earns 10% of referred investors monthly ROI. Unlocked with 2 active plan referrals.',
  },
  {
    level: 2,
    requiredPlans: 4,
    roiPct: 5,
    name: 'Level 2 (5% ROI)',
    badgeLabel: 'Level 2 • 5% ROI',
    badgeBg: 'bg-blue-500/15',
    badgeText: 'text-blue-400',
    badgeBorder: 'border-blue-500/30',
    description: 'Syndication Partner. Earns 5% of referred investors monthly ROI. Unlocked with 4 active plan referrals.',
  },
  {
    level: 3,
    requiredPlans: 6,
    roiPct: 3,
    name: 'Level 3 (3% ROI)',
    badgeLabel: 'Level 3 • 3% ROI',
    badgeBg: 'bg-purple-500/15',
    badgeText: 'text-purple-400',
    badgeBorder: 'border-purple-500/30',
    description: 'Executive Partner. Earns 3% of referred investors monthly ROI. Unlocked with 6 active plan referrals.',
  },
  {
    level: 4,
    requiredPlans: 8,
    roiPct: 2,
    name: 'Level 4 (2% ROI)',
    badgeLabel: 'Level 4 • 2% ROI',
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-400',
    badgeBorder: 'border-amber-500/30',
    description: 'Managing Partner. Earns 2% of referred investors monthly ROI. Unlocked with 8 active plan referrals.',
  },
  {
    level: 5,
    requiredPlans: 10,
    roiPct: 1,
    name: 'Level 5 (1% ROI)',
    badgeLabel: 'Level 5 • 1% ROI',
    badgeBg: 'bg-[#D4AF37]/15',
    badgeText: 'text-[#D4AF37]',
    badgeBorder: 'border-[#D4AF37]/30',
    description: 'Sovereign Syndicate. Earns 1% of referred investors monthly ROI. Unlocked with 10 active plan referrals.',
  },
];

export function computeClientReferralStats(
  client: ClientProfile,
  allClients: ClientProfile[],
  allReferrals: ReferralRecord[]
): ClientReferralSummary {
  const code =
    client.referralCode ||
    `INF-${client.firstName.toUpperCase()}${client.id.replace(/\D/g, '') || '01'}`;

  // 1. Find all referrals matching referrerId or referrerCode
  const matchedReferrals = allReferrals.filter(
    (r) =>
      r.referrerId === client.id ||
      (client.referralCode && r.referrerCode === client.referralCode)
  );

  // 2. Find clients signed up with client's referral code
  const referredFromClients = allClients.filter(
    (c) =>
      c.id !== client.id &&
      client.referralCode &&
      c.referredByCode === client.referralCode
  );

  const refereeMap = new Map<string, ReferredUserItem>();

  for (const ref of matchedReferrals) {
    const refereeClient = allClients.find(
      (c) => c.id === ref.refereeId || (ref.refereeEmail && c.email === ref.refereeEmail)
    );
    const hasActive =
      ref.status === 'active' ||
      refereeClient?.assignedPlanStatus === 'active' ||
      ref.capitalAmount > 0;
    const capital = refereeClient?.assignedPlanAmount ?? (ref.capitalAmount || 0);
    const monthlyRoi = (capital * 15) / 100;
    const planName =
      refereeClient?.assignedPlanName ||
      ref.planName ||
      (hasActive ? 'INFINIX 14-Month Wealth Accelerator' : 'Pending Plan Allocation');

    const key = ref.refereeId || ref.refereeEmail || ref.id;
    refereeMap.set(key, {
      id: ref.refereeId || key,
      name:
        ref.refereeName ||
        `${refereeClient?.firstName || ''} ${refereeClient?.lastName || ''}`.trim() ||
        'Investor',
      email: ref.refereeEmail || refereeClient?.email || '',
      phone: ref.refereePhone || refereeClient?.phone || '',
      joinedDate: ref.dateJoined || refereeClient?.joinedDate || '2026-11-01',
      hasActivePlan: hasActive,
      planName,
      capital,
      monthlyRoi,
      status: hasActive ? 'active' : 'pending',
    });
  }

  for (const c of referredFromClients) {
    const key = c.id;
    if (!refereeMap.has(key) && !refereeMap.has(c.email)) {
      const hasActive = c.assignedPlanStatus === 'active';
      const capital = c.assignedPlanAmount || 0;
      const monthlyRoi = (capital * 15) / 100;
      refereeMap.set(key, {
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        email: c.email,
        phone: c.phone,
        joinedDate: c.joinedDate,
        hasActivePlan: hasActive,
        planName:
          c.assignedPlanName ||
          (hasActive ? 'INFINIX 14-Month Wealth Accelerator' : 'Pending Plan Allocation'),
        capital,
        monthlyRoi,
        status: hasActive ? 'active' : 'pending',
      });
    }
  }

  const refereeList = Array.from(refereeMap.values());
  const totalReferred = refereeList.length;
  const activePlanReferrals = refereeList.filter((r) => r.hasActivePlan).length;

  // Level determination: unlocks every 2 active referrals with an active plan
  const level = Math.min(5, Math.floor(activePlanReferrals / 2));
  const levelRule =
    REFERRAL_LEVEL_RULES.find((r) => r.level === level) || REFERRAL_LEVEL_RULES[0];

  const neededForNext = level < 5 ? (level + 1) * 2 : 10;
  const plansRemainingForNext =
    level < 5 ? Math.max(0, neededForNext - activePlanReferrals) : 0;

  // Commission strictly the level-specific % of referee monthly ROI (15% payout)
  const monthlyCommissionYield = refereeList.reduce((sum, r) => {
    if (!r.hasActivePlan || levelRule.roiPct === 0) return sum;
    return sum + (r.monthlyRoi * levelRule.roiPct) / 100;
  }, 0);

  return {
    referralCode: code,
    totalReferred,
    activePlanReferrals,
    level,
    levelName: levelRule.name,
    roiPct: levelRule.roiPct,
    neededForNext,
    plansRemainingForNext,
    monthlyCommissionYield,
    refereeList,
  };
}

