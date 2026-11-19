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
    name: 'Level 0 (No Active Referrals)',
    badgeLabel: 'Level 0 • 0%',
    badgeBg: 'bg-slate-800/80',
    badgeText: 'text-slate-400',
    badgeBorder: 'border-slate-700',
    description: 'Refer 1 investor with an active plan to start earning 10% daily ROI from Level 1.',
  },
  {
    level: 1,
    requiredPlans: 1,
    roiPct: 10,
    name: 'Level 1 (10% ROI)',
    badgeLabel: 'Level 1 • 10% ROI',
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-400',
    badgeBorder: 'border-emerald-500/30',
    description: 'Direct Wealth Partner. Earns 10% of direct referred investors monthly ROI immediately upon 1st referral.',
  },
  {
    level: 2,
    requiredPlans: 1,
    roiPct: 5,
    name: 'Level 2 (5% ROI)',
    badgeLabel: 'Level 2 • 5% ROI',
    badgeBg: 'bg-blue-500/15',
    badgeText: 'text-blue-400',
    badgeBorder: 'border-blue-500/30',
    description: '2nd Generation Partner. Earns 5% of secondary referred investors monthly ROI.',
  },
  {
    level: 3,
    requiredPlans: 1,
    roiPct: 3,
    name: 'Level 3 (3% ROI)',
    badgeLabel: 'Level 3 • 3% ROI',
    badgeBg: 'bg-purple-500/15',
    badgeText: 'text-purple-400',
    badgeBorder: 'border-purple-500/30',
    description: '3rd Generation Partner. Earns 3% of tertiary referred investors monthly ROI.',
  },
  {
    level: 4,
    requiredPlans: 1,
    roiPct: 2,
    name: 'Level 4 (2% ROI)',
    badgeLabel: 'Level 4 • 2% ROI',
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-400',
    badgeBorder: 'border-amber-500/30',
    description: '4th Generation Partner. Earns 2% of quaternary referred investors monthly ROI.',
  },
  {
    level: 5,
    requiredPlans: 1,
    roiPct: 1,
    name: 'Level 5 (1% ROI)',
    badgeLabel: 'Level 5 • 1% ROI',
    badgeBg: 'bg-[#D4AF37]/15',
    badgeText: 'text-[#D4AF37]',
    badgeBorder: 'border-[#D4AF37]/30',
    description: '5th Generation Syndicate Cap. Earns 1% of 5th generation referred investors monthly ROI.',
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
    const planName =
      refereeClient?.assignedPlanName ||
      ref.planName ||
      (hasActive ? 'INFINIX 14-Month Wealth Accelerator' : 'Pending Plan Allocation');
    const planLower = planName.toLowerCase();
    const is20M = planLower.includes('20') || (refereeClient?.assignedPlanId || '').includes('7441');
    const is6M = planLower.includes('6');
    const monthlyRoiPct = is20M || is6M ? 5.0 : 7.5;
    const monthlyRoi = (capital * monthlyRoiPct) / 100;

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
      const planName =
        c.assignedPlanName ||
        (hasActive ? 'INFINIX 14-Month Wealth Accelerator' : 'Pending Plan Allocation');
      const planLower = planName.toLowerCase();
      const is20M = planLower.includes('20') || (c.assignedPlanId || '').includes('7441');
      const is6M = planLower.includes('6');
      const monthlyRoiPct = is20M || is6M ? 5.0 : 7.5;
      const monthlyRoi = (capital * monthlyRoiPct) / 100;

      refereeMap.set(key, {
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        email: c.email,
        phone: c.phone,
        joinedDate: c.joinedDate,
        hasActivePlan: hasActive,
        planName,
        capital,
        monthlyRoi,
        status: hasActive ? 'active' : 'pending',
      });
    }
  }

  const refereeList = Array.from(refereeMap.values());
  const totalReferred = refereeList.length;
  const activePlanReferrals = refereeList.filter((r) => r.hasActivePlan).length;

  // Direct referrals earn Level 1 (10% of monthly ROI) immediately with 1st referral
  const level = activePlanReferrals >= 1 ? 1 : 0;
  const levelRule =
    REFERRAL_LEVEL_RULES.find((r) => r.level === level) || REFERRAL_LEVEL_RULES[0];

  const neededForNext = activePlanReferrals === 0 ? 1 : 0;
  const plansRemainingForNext = activePlanReferrals === 0 ? 1 : 0;

  // Direct referrals earn 10% of active referee monthly ROI
  const monthlyCommissionYield = refereeList.reduce((sum, r) => {
    if (!r.hasActivePlan) return sum;
    return sum + (r.monthlyRoi * 10) / 100;
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

export interface AdminLevelMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  referralCode?: string;
  referredByCode?: string;
  sponsorName?: string;
  planName: string;
  planCapital: number;
  dailyRoiAmount: number;
  yourDailyIncomeCut: number;
  status: 'active' | 'pending';
  joinedDate: string;
  level: number;
}

export interface AdminLevelTierStats {
  level: number;
  levelPercent: number;
  totalMembers: number;
  activeMembers: number;
  totalCapital: number;
  dailyIncome: number;
  totalAccruedIncome: number;
  members: AdminLevelMember[];
}

export interface AdminLevelNetworkResult {
  rootClient: ClientProfile;
  isUnlocked: boolean;
  levels: {
    1: AdminLevelTierStats;
    2: AdminLevelTierStats;
    3: AdminLevelTierStats;
    4: AdminLevelTierStats;
    5: AdminLevelTierStats;
  };
  totalMembers: number;
  totalActiveMembers: number;
  totalCapital: number;
  todayDailyIncome: number;
  totalAccruedIncome: number;
}

export function calculateAdminLevelNetwork(
  rootClient: ClientProfile,
  allClients: ClientProfile[],
  allReferrals: ReferralRecord[]
): AdminLevelNetworkResult {
  const isUnlocked = Boolean(rootClient.isLevelIncomeUnlocked);

  const cleanCode = (c?: string) =>
    (c || '').toString().trim().toUpperCase().replace(/^[#@\s]+/, '').replace(/^INF-?/, '');

  const rootCodeNorm = cleanCode(
    rootClient.referralCode || `INF-${rootClient.firstName.toUpperCase()}${rootClient.id.replace(/\D/g, '') || '01'}`
  );

  const tierRates: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 10,
    2: 5,
    3: 3,
    4: 2,
    5: 1,
  };

  const emptyTier = (lvl: 1 | 2 | 3 | 4 | 5): AdminLevelTierStats => ({
    level: lvl,
    levelPercent: tierRates[lvl],
    totalMembers: 0,
    activeMembers: 0,
    totalCapital: 0,
    dailyIncome: 0,
    totalAccruedIncome: 0,
    members: [],
  });

  const result: AdminLevelNetworkResult = {
    rootClient,
    isUnlocked,
    levels: {
      1: emptyTier(1),
      2: emptyTier(2),
      3: emptyTier(3),
      4: emptyTier(4),
      5: emptyTier(5),
    },
    totalMembers: 0,
    totalActiveMembers: 0,
    totalCapital: 0,
    todayDailyIncome: 0,
    totalAccruedIncome: 0,
  };

  if (!rootCodeNorm) return result;

  // Code alias resolver: maps any ID or Code variant to canonical code
  const codeResolver = new Map<string, string>();
  for (const c of allClients) {
    const canonical = cleanCode(c.referralCode || `INF-${c.firstName.toUpperCase()}101`);
    if (!canonical) continue;
    codeResolver.set(canonical, canonical);
    const cId = cleanCode(c.clientId || c.id);
    if (cId) codeResolver.set(cId, canonical);
    const cEmail = (c.email || '').trim().toUpperCase();
    if (cEmail) codeResolver.set(cEmail, canonical);
  }

  const effectiveRoot = codeResolver.get(rootCodeNorm) || rootCodeNorm;

  // Build parent -> children map
  const parentMap = new Map<string, ClientProfile[]>();
  for (const c of allClients) {
    if (c.id === rootClient.id) continue;
    const parent = cleanCode(c.referredByCode);
    if (!parent) continue;
    const effectiveParent = codeResolver.get(parent) || parent;
    const list = parentMap.get(effectiveParent) || [];
    list.push(c);
    parentMap.set(effectiveParent, list);
  }

  // Also include referrals matching referrerId
  for (const r of allReferrals) {
    const parentCode = cleanCode(r.referrerCode);
    const refereeId = r.refereeId;
    if (!parentCode || !refereeId) continue;
    const effectiveParent = codeResolver.get(parentCode) || parentCode;
    const existing = parentMap.get(effectiveParent) || [];
    if (!existing.some((c) => c.id === refereeId || c.clientId === refereeId)) {
      const match = allClients.find((c) => c.id === refereeId || c.clientId === refereeId);
      if (match) {
        existing.push(match);
        parentMap.set(effectiveParent, existing);
      }
    }
  }

  const visited = new Set<string>();
  visited.add(rootClient.id);
  if (rootClient.clientId) visited.add(rootClient.clientId);

  let currentParents = [effectiveRoot];

  for (let lvl = 1; lvl <= 5; lvl++) {
    const currentLvl = lvl as 1 | 2 | 3 | 4 | 5;
    const rate = tierRates[currentLvl];
    const tierStat = result.levels[currentLvl];
    const nextParents: string[] = [];

    for (const parentCode of currentParents) {
      const children = parentMap.get(parentCode) || [];

      for (const child of children) {
        if (visited.has(child.id)) continue;
        visited.add(child.id);
        if (child.clientId) visited.add(child.clientId);

        const childCode = cleanCode(child.referralCode);
        if (childCode) nextParents.push(childCode);

        const cap = Number(child.assignedPlanAmount || 0);
        const isActive = child.assignedPlanStatus === 'active' && cap > 0;
        const planNameLower = (child.assignedPlanName || '').toLowerCase();
        const is20M = planNameLower.includes('20') || (child.assignedPlanId || '').includes('7441');
        const is6M = planNameLower.includes('6');
        const durationMonths = is20M ? 20 : is6M ? 6 : 14;

        // Business logic:
        // 1. Total profit = Total return - Initial investment
        //    (20M: 200% - 100% = 100% net profit; 14M: 7.5% monthly net profit; 6M: 5% monthly)
        // 2. Monthly ROI = Total profit / Duration in months (5% for 20M/6M; 7.5% for 14M)
        // 3. Daily ROI = Monthly ROI / 30
        // 4. Daily cut = Daily ROI * Level%
        const monthlyRoiPct = is20M || is6M ? 5.0 : 7.5;
        const monthlyRoiAmount = (cap * monthlyRoiPct) / 100;
        const memberDailyRoi = isActive ? monthlyRoiAmount / 30 : 0;
        const yourCut = isActive ? (memberDailyRoi * rate) / 100 : 0;

        // Completed days capped by contractual duration
        const startDate = child.assignedPlanStartDate || child.joinedDate || '2026-11-01';
        const startMs = new Date(startDate).getTime();
        const nowMs = Date.now();
        const daysElapsed = Math.max(0, Math.floor((nowMs - startMs) / (1000 * 60 * 60 * 24)));
        const maxDays = durationMonths * 30;
        const completedDays = Math.min(maxDays, daysElapsed);
        const totalAccrued = yourCut * completedDays;

        const sponsorObj = allClients.find(
          (c) =>
            cleanCode(c.referralCode) === parentCode ||
            cleanCode(c.clientId || c.id) === parentCode
        );
        const sponsorName = sponsorObj
          ? `${sponsorObj.firstName} ${sponsorObj.lastName}`.trim()
          : (child.referredByCode || parentCode);

        const member: AdminLevelMember = {
          id: child.id,
          name: `${child.firstName} ${child.lastName}`.trim(),
          email: child.email,
          phone: child.phone,
          referralCode: child.referralCode,
          referredByCode: child.referredByCode || parentCode,
          sponsorName,
          planName: child.assignedPlanName || (isActive ? 'Active Investment Plan' : 'Pending Plan'),
          planCapital: cap,
          dailyRoiAmount: Math.round(memberDailyRoi * 10000) / 10000,
          yourDailyIncomeCut: Math.round(yourCut * 10000) / 10000,
          status: isActive ? 'active' : 'pending',
          joinedDate: child.joinedDate || startDate,
          level: currentLvl,
        };

        tierStat.members.push(member);
        tierStat.totalMembers++;
        if (isActive) {
          tierStat.activeMembers++;
          tierStat.totalCapital += cap;
          if (isUnlocked) {
            tierStat.dailyIncome += yourCut;
            tierStat.totalAccruedIncome += totalAccrued;
          }
        }
      }
    }

    tierStat.dailyIncome = Math.round(tierStat.dailyIncome * 100) / 100;
    tierStat.totalAccruedIncome = Math.round(tierStat.totalAccruedIncome * 100) / 100;

    result.totalMembers += tierStat.totalMembers;
    result.totalActiveMembers += tierStat.activeMembers;
    result.totalCapital += tierStat.totalCapital;
    result.todayDailyIncome += tierStat.dailyIncome;
    result.totalAccruedIncome += tierStat.totalAccruedIncome;

    currentParents = nextParents;
    if (currentParents.length === 0) break;
  }

  result.todayDailyIncome = Math.round(result.todayDailyIncome * 100) / 100;
  result.totalAccruedIncome = Math.round(result.totalAccruedIncome * 100) / 100;

  return result;
}

