import ExcelJS from 'exceljs';
import { ClientProfile, InvestmentPlanConfig, WithdrawalRecord, ReferralRecord, AuditLogItem } from '@/types/admin';
import { calculateCompletedDays } from './date';
import { computeClientReferralStats } from './referral';

export interface ReportFilterOptions {
  searchQuery?: string;
  reportType?: 'master' | 'clients' | 'contracts' | 'withdrawals' | 'referrals' | 'audit';
  dateRangePreset?: 'all' | 'today' | '7days' | '30days' | 'thisMonth' | 'lastMonth' | 'custom';
  startDate?: string;
  endDate?: string;
  statusFilter?: string;
  tierFilter?: string;
  minAum?: number;
}

// Styling Constants for ExcelJS
const GOLD_COLOR = 'FFD4AF37';
const GOLD_LIGHT_COLOR = 'FFF59E0B';
const NAVY_DARK = 'FF080C14';
const NAVY_ROW = 'FF0D131F';
const NAVY_ACCENT = 'FF141C2E';
const WHITE_COLOR = 'FFFFFFFF';
const SLATE_MUTED = 'FF94A3B8';
const EMERALD_COLOR = 'FF10B981';
const AMBER_COLOR = 'FFF59E0B';
const RED_COLOR = 'FFEF4444';
const ZEBRA_LIGHT = 'FFF8FAFC';
const BORDER_COLOR = 'FFE2E8F0';

/**
 * Applies executive INFINIX banner header to a worksheet
 */
function applyBanner(
  worksheet: ExcelJS.Worksheet,
  title: string,
  subtitle: string,
  colSpan: number
) {
  // Row 1: Brand Title
  worksheet.mergeCells(1, 1, 1, colSpan);
  const row1 = worksheet.getRow(1);
  row1.height = 36;
  const cell1 = row1.getCell(1);
  cell1.value = `🏛️ INFINIX PRIVATE WEALTH MANAGEMENT — ${title.toUpperCase()}`;
  cell1.font = { name: 'Calibri', size: 14, bold: true, color: { argb: GOLD_COLOR } };
  cell1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_DARK } };
  cell1.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

  // Row 2: Subtitle & Metadata
  worksheet.mergeCells(2, 1, 2, colSpan);
  const row2 = worksheet.getRow(2);
  row2.height = 24;
  const cell2 = row2.getCell(1);
  cell2.value = `${subtitle} | Generated: ${new Date().toLocaleString('en-US', { timeZoneName: 'short' })} | Security: Institutional Confidential`;
  cell2.font = { name: 'Calibri', size: 10, italic: true, color: { argb: SLATE_MUTED } };
  cell2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_ROW } };
  cell2.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

  // Row 3: Blank separator
  const row3 = worksheet.getRow(3);
  row3.height = 12;
}

/**
 * Styles a table header row with gold on dark navy
 */
function styleHeaderRow(row: ExcelJS.Row, colCount: number) {
  row.height = 28;
  for (let c = 1; c <= colCount; c++) {
    const cell = row.getCell(c);
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: WHITE_COLOR } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_ACCENT } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
    cell.border = {
      top: { style: 'medium', color: { argb: GOLD_COLOR } },
      bottom: { style: 'medium', color: { argb: GOLD_COLOR } },
      left: { style: 'thin', color: { argb: 'FF334155' } },
      right: { style: 'thin', color: { argb: 'FF334155' } },
    };
  }
}

/**
 * Auto-fits worksheet column widths based on contents
 */
function autoFitColumns(worksheet: ExcelJS.Worksheet, minWidth = 14, maxWidth = 45) {
  worksheet.columns.forEach((col) => {
    let maxLen = minWidth;
    if (col && col.eachCell) {
      col.eachCell({ includeEmpty: false }, (cell, rowNumber) => {
        if (rowNumber <= 2) return; // Skip merged title banner
        const val = cell.value ? cell.value.toString() : '';
        if (val.length > maxLen) {
          maxLen = val.length;
        }
      });
    }
    col.width = Math.min(maxWidth, Math.max(minWidth, maxLen + 3));
  });
}

/**
 * Helper to compute comprehensive client metrics
 */
export function computeClientExtendedMetrics(
  client: ClientProfile,
  clients: ClientProfile[],
  withdrawals: WithdrawalRecord[],
  referrals: ReferralRecord[]
) {
  const activeContracts = (client.activePlans && Array.isArray(client.activePlans) && client.activePlans.length > 0)
    ? client.activePlans.filter((p: any) => (p.status || 'active') === 'active')
    : [];

  let totalCapital = 0;
  let totalDailyProfit = 0;
  let totalAccruedYield = 0;
  let totalMonthlyPayout = 0;

  if (activeContracts.length > 0) {
    for (const p of activeContracts) {
      const cap = Number(p.capitalAmount || 0);
      const days = calculateCompletedDays(p.startDate);
      const duration = p.durationMonths || 14;
      const maxDays = duration * 30;
      const effDays = Math.min(maxDays, days);
      const dailyRate = (p.dailyReturnPct ?? 0.5) / 100;
      const monthlyRate = (p.monthlyReturnPct ?? 15.0) / 100;

      const dailyProfit = cap * dailyRate;
      const accrued = dailyProfit * effDays;
      const monthly = cap * monthlyRate;

      totalCapital += cap;
      totalDailyProfit += dailyProfit;
      totalAccruedYield += accrued;
      totalMonthlyPayout += monthly;
    }
  } else {
    totalCapital = Number(client.assignedPlanAmount || client.totalAum || 0);
    const days = calculateCompletedDays(client.assignedPlanStartDate);
    const effDays = Math.min(420, days);
    totalDailyProfit = totalCapital * 0.005;
    totalAccruedYield = totalDailyProfit * effDays;
    totalMonthlyPayout = totalCapital * 0.15;
  }

  totalAccruedYield = Math.round(totalAccruedYield * 100) / 100;

  // Referral stats
  const refStats = computeClientReferralStats(client, clients, referrals);
  const totalReferralBonus = refStats.totalEarnedCommissions || (refStats.monthlyCommissionYield * 5);

  // Withdrawals for this client
  const clientWds = withdrawals.filter(
    (w) =>
      w.clientId === client.id ||
      (client.clientId && w.clientId === client.clientId) ||
      w.clientName.toLowerCase() === `${client.firstName} ${client.lastName}`.toLowerCase()
  );

  const settledWds = clientWds.filter((w) => w.status === 'disbursed');
  const pendingWds = clientWds.filter((w) => w.status === 'pending_approval');

  const totalSettledDisbursed = settledWds.reduce((sum, w) => sum + (w.grossAmount || w.amount || 0), 0);
  const totalPendingClaims = pendingWds.reduce((sum, w) => sum + (w.grossAmount || w.amount || 0), 0);

  const availableBalance = Math.max(0, Math.round((totalAccruedYield + totalReferralBonus - totalSettledDisbursed) * 100) / 100);

  return {
    activeContractsCount: activeContracts.length || (totalCapital > 0 ? 1 : 0),
    totalCapital,
    totalDailyProfit,
    totalAccruedYield,
    totalMonthlyPayout,
    totalReferralBonus,
    totalSettledDisbursed,
    totalPendingClaims,
    availableBalance,
    referralCount: refStats.totalReferred,
    referralLevel: refStats.levelName,
    activeContracts,
  };
}

/**
 * MASTER EXPORT: Generates styled multi-tab institutional Excel workbook
 */
export async function generateMasterExcelWorkbook(
  clients: ClientProfile[],
  plans: InvestmentPlanConfig[],
  withdrawals: WithdrawalRecord[],
  referrals: ReferralRecord[],
  auditLogs: AuditLogItem[],
  filters?: ReportFilterOptions
): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'INFINIX Wealth Desk (Institutional)';
  workbook.lastModifiedBy = 'INFINIX Administrator';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Filter clients if filters applied
  let filteredClients = [...clients];
  if (filters?.searchQuery) {
    const q = filters.searchQuery.toLowerCase();
    filteredClients = filteredClients.filter(
      (c) =>
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        (c.referralCode && c.referralCode.toLowerCase().includes(q))
    );
  }
  if (filters?.tierFilter && filters.tierFilter !== 'all') {
    filteredClients = filteredClients.filter((c) => (c.tier || 'standard').toLowerCase() === filters.tierFilter!.toLowerCase());
  }
  if (filters?.statusFilter && filters.statusFilter !== 'all') {
    filteredClients = filteredClients.filter((c) => (c.assignedPlanStatus || 'pending_assignment') === filters.statusFilter);
  }
  if (filters?.minAum && filters.minAum > 0) {
    filteredClients = filteredClients.filter((c) => (Number(c.assignedPlanAmount) || Number(c.totalAum) || 0) >= filters.minAum!);
  }

  // =========================================================================
  // WORKSHEET 1: MASTER CONSOLIDATED OVERVIEW
  // =========================================================================
  const wsMaster = workbook.addWorksheet('Master Overview', {
    views: [{ showGridLines: true }],
    properties: { tabColor: { argb: GOLD_COLOR } },
  });

  applyBanner(wsMaster, 'Master Institutional Client & Portfolio Overview', 'Full Investor AUM, Yield Accruals, Payouts & Escrow Balances', 16);

  // Column Headers
  const masterHeaders = [
    'Client ID',
    'Investor Name',
    'Email Address',
    'Mobile Phone',
    'Phone Status',
    'Investor Tier',
    'Active Plans',
    'Active Capital (USDT)',
    'Accrued Yield (USDT)',
    'Daily Yield (USDT)',
    'Monthly Yield (USDT)',
    'Referral Bonus (USDT)',
    'Settled Disbursed (USDT)',
    'Ready to Withdraw (USDT)',
    'Pending Claims (USDT)',
    'Custody TRC20 / Bank',
  ];

  const headerRowMaster = wsMaster.addRow(masterHeaders);
  styleHeaderRow(headerRowMaster, masterHeaders.length);

  let grandTotalAum = 0;
  let grandTotalAccrued = 0;
  let grandTotalDaily = 0;
  let grandTotalMonthly = 0;
  let grandTotalRefBonus = 0;
  let grandTotalDisbursed = 0;
  let grandTotalReady = 0;
  let grandTotalPending = 0;

  filteredClients.forEach((client, idx) => {
    const metrics = computeClientExtendedMetrics(client, clients, withdrawals, referrals);

    grandTotalAum += metrics.totalCapital;
    grandTotalAccrued += metrics.totalAccruedYield;
    grandTotalDaily += metrics.totalDailyProfit;
    grandTotalMonthly += metrics.totalMonthlyPayout;
    grandTotalRefBonus += metrics.totalReferralBonus;
    grandTotalDisbursed += metrics.totalSettledDisbursed;
    grandTotalReady += metrics.availableBalance;
    grandTotalPending += metrics.totalPendingClaims;

    const row = wsMaster.addRow([
      client.id,
      `${client.firstName} ${client.lastName}`,
      client.email,
      client.phone || '—',
      client.isPhoneVerified ? 'Verified' : 'Pending',
      (client.tier || 'Standard').toUpperCase(),
      metrics.activeContractsCount,
      metrics.totalCapital,
      metrics.totalAccruedYield,
      metrics.totalDailyProfit,
      metrics.totalMonthlyPayout,
      metrics.totalReferralBonus,
      metrics.totalSettledDisbursed,
      metrics.availableBalance,
      metrics.totalPendingClaims,
      client.bankAccount || 'Direct Escrow (TRC20)',
    ]);

    row.height = 20;

    // Formatting numbers
    [8, 9, 10, 11, 12, 13, 14, 15].forEach((colIdx) => {
      row.getCell(colIdx).numFmt = '#,##0.00';
      row.getCell(colIdx).alignment = { horizontal: 'right', vertical: 'middle' };
    });

    // Center IDs, Phone Status, Tier, Plans count
    [1, 5, 6, 7].forEach((colIdx) => {
      row.getCell(colIdx).alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Zebra striping
    if (idx % 2 === 1) {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ZEBRA_LIGHT } };
      });
    }

    // Border
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: BORDER_COLOR } },
        bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
        left: { style: 'thin', color: { argb: BORDER_COLOR } },
        right: { style: 'thin', color: { argb: BORDER_COLOR } },
      };
    });
  });

  // Master Summary Total Row
  const totalRowMaster = wsMaster.addRow([
    'TOTALS',
    `${filteredClients.length} Active Records`,
    '',
    '',
    '',
    '',
    '',
    grandTotalAum,
    grandTotalAccrued,
    grandTotalDaily,
    grandTotalMonthly,
    grandTotalRefBonus,
    grandTotalDisbursed,
    grandTotalReady,
    grandTotalPending,
    '',
  ]);

  totalRowMaster.height = 24;
  totalRowMaster.font = { name: 'Calibri', size: 10, bold: true, color: { argb: GOLD_COLOR } };
  totalRowMaster.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_DARK } };
    cell.border = {
      top: { style: 'thin', color: { argb: GOLD_COLOR } },
      bottom: { style: 'double', color: { argb: GOLD_COLOR } },
    };
  });
  [8, 9, 10, 11, 12, 13, 14, 15].forEach((colIdx) => {
    totalRowMaster.getCell(colIdx).numFmt = '#,##0.00';
    totalRowMaster.getCell(colIdx).alignment = { horizontal: 'right', vertical: 'middle' };
  });

  autoFitColumns(wsMaster, 14, 40);

  // =========================================================================
  // WORKSHEET 2: ACTIVE CONTRACTS & PARALLEL INVESTMENTS
  // =========================================================================
  const wsContracts = workbook.addWorksheet('Investment Contracts', {
    views: [{ showGridLines: true }],
    properties: { tabColor: { argb: 'FF10B981' } },
  });

  applyBanner(wsContracts, 'Active Investment Contracts & Accruals', 'Live breakdown of every concurrent contract, cycle day, and yield rate', 14);

  const contractHeaders = [
    'Contract ID',
    'Client ID',
    'Investor Name',
    'Plan Name',
    'Capital (USDT)',
    'Start Date',
    'Elapsed Days',
    'Duration (Mo)',
    'Daily Yield %',
    'Monthly Yield %',
    'Daily Earnings (USDT)',
    'Accrued Yield (USDT)',
    'Contract Status',
    'Escrow Reference',
  ];

  const headerRowContracts = wsContracts.addRow(contractHeaders);
  styleHeaderRow(headerRowContracts, contractHeaders.length);

  let contractRowIdx = 0;
  let totalContractCapital = 0;
  let totalContractDaily = 0;
  let totalContractAccrued = 0;

  filteredClients.forEach((client) => {
    const metrics = computeClientExtendedMetrics(client, clients, withdrawals, referrals);
    const plansToRender = metrics.activeContracts.length > 0
      ? metrics.activeContracts
      : (metrics.totalCapital > 0
        ? [{
            id: `plan-primary-${client.id}`,
            planName: client.assignedPlanName || '14-Month Wealth Accelerator',
            capitalAmount: metrics.totalCapital,
            startDate: client.assignedPlanStartDate || client.joinedDate,
            durationMonths: 14,
            dailyReturnPct: 0.5,
            monthlyReturnPct: 15.0,
            status: client.assignedPlanStatus || 'active',
            paymentReference: 'Primary Contract Allocation',
          }]
        : []);

    plansToRender.forEach((contract: any) => {
      const cap = Number(contract.capitalAmount || 0);
      const days = calculateCompletedDays(contract.startDate);
      const dur = contract.durationMonths || 14;
      const maxDays = dur * 30;
      const effDays = Math.min(maxDays, days);
      const dailyRate = contract.dailyReturnPct ?? 0.5;
      const monthlyRate = contract.monthlyReturnPct ?? 15.0;
      const dailyEarn = cap * (dailyRate / 100);
      const accrued = dailyEarn * effDays;

      totalContractCapital += cap;
      totalContractDaily += dailyEarn;
      totalContractAccrued += accrued;

      const row = wsContracts.addRow([
        contract.id || contract.planInstanceId,
        client.id,
        `${client.firstName} ${client.lastName}`,
        contract.planName,
        cap,
        contract.startDate || '—',
        days,
        dur,
        dailyRate,
        monthlyRate,
        dailyEarn,
        accrued,
        (contract.status || 'active').toUpperCase(),
        contract.paymentReference || 'Direct USDT Escrow',
      ]);

      row.height = 20;

      // Number formatting
      [5, 11, 12].forEach((cIdx) => {
        row.getCell(cIdx).numFmt = '#,##0.00';
        row.getCell(cIdx).alignment = { horizontal: 'right', vertical: 'middle' };
      });
      [9, 10].forEach((cIdx) => {
        row.getCell(cIdx).numFmt = '0.00"%"';
        row.getCell(cIdx).alignment = { horizontal: 'right', vertical: 'middle' };
      });
      [1, 2, 6, 7, 8, 13].forEach((cIdx) => {
        row.getCell(cIdx).alignment = { horizontal: 'center', vertical: 'middle' };
      });

      if (contractRowIdx % 2 === 1) {
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ZEBRA_LIGHT } };
        });
      }

      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: BORDER_COLOR } },
          bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
          left: { style: 'thin', color: { argb: BORDER_COLOR } },
          right: { style: 'thin', color: { argb: BORDER_COLOR } },
        };
      });

      contractRowIdx++;
    });
  });

  // Contracts Total Row
  const totalRowContracts = wsContracts.addRow([
    'TOTALS',
    '',
    '',
    `${contractRowIdx} Total Contracts`,
    totalContractCapital,
    '',
    '',
    '',
    '',
    '',
    totalContractDaily,
    totalContractAccrued,
    '',
    '',
  ]);

  totalRowContracts.height = 24;
  totalRowContracts.font = { name: 'Calibri', size: 10, bold: true, color: { argb: GOLD_COLOR } };
  totalRowContracts.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_DARK } };
    cell.border = {
      top: { style: 'thin', color: { argb: GOLD_COLOR } },
      bottom: { style: 'double', color: { argb: GOLD_COLOR } },
    };
  });
  [5, 11, 12].forEach((cIdx) => {
    totalRowContracts.getCell(cIdx).numFmt = '#,##0.00';
    totalRowContracts.getCell(cIdx).alignment = { horizontal: 'right', vertical: 'middle' };
  });

  autoFitColumns(wsContracts, 14, 40);

  // =========================================================================
  // WORKSHEET 3: WITHDRAWALS & PAYOUT CLAIMS
  // =========================================================================
  const wsWithdrawals = workbook.addWorksheet('Withdrawals & Payouts', {
    views: [{ showGridLines: true }],
    properties: { tabColor: { argb: 'FFF59E0B' } },
  });

  applyBanner(wsWithdrawals, 'Withdrawal Claims & Settlement Registry', 'Audited record of all yield claims, fee deductions, and UTR transfers', 12);

  const wdHeaders = [
    'Claim ID',
    'Client ID',
    'Investor Name',
    'Request Date',
    'Disbursed Date',
    'Gross Claim (USDT)',
    '3% Fee (USDT)',
    'Net Payout (USDT)',
    'Status',
    'Payout Wallet / Bank',
    'Payment Reference / UTR',
    'Administrator Notes',
  ];

  const headerRowWd = wsWithdrawals.addRow(wdHeaders);
  styleHeaderRow(headerRowWd, wdHeaders.length);

  let filteredWds = [...withdrawals];
  if (filters?.searchQuery) {
    const q = filters.searchQuery.toLowerCase();
    filteredWds = filteredWds.filter(
      (w) =>
        w.clientName.toLowerCase().includes(q) ||
        w.clientId.toLowerCase().includes(q) ||
        (w.bankAccount && w.bankAccount.toLowerCase().includes(q)) ||
        (w.notes && w.notes.toLowerCase().includes(q))
    );
  }

  let totalGrossWd = 0;
  let totalFeeWd = 0;
  let totalNetWd = 0;

  filteredWds.forEach((w, idx) => {
    const gross = Number(w.grossAmount || w.amount || 0);
    const fee = Number(w.feeAmount || Math.round(gross * 0.03 * 100) / 100);
    const net = Number(w.netAmount || gross - fee);

    totalGrossWd += gross;
    totalFeeWd += fee;
    totalNetWd += net;

    const row = wsWithdrawals.addRow([
      w.id,
      w.clientId,
      w.clientName,
      w.requestDate || '—',
      w.disbursedDate || (w.status === 'disbursed' ? w.requestDate : 'Pending Approval'),
      gross,
      fee,
      net,
      w.status === 'disbursed' ? 'DISBURSED' : w.status === 'pending_approval' ? 'PENDING APPROVAL' : 'REJECTED',
      w.bankAccount || 'Direct TRC20 Wallet',
      w.notes?.includes('UTR') ? w.notes : (w.status === 'disbursed' ? 'CMS-RTGS-SETTLED' : 'Awaiting Approval'),
      w.notes || 'Yield Claim',
    ]);

    row.height = 20;

    [6, 7, 8].forEach((cIdx) => {
      row.getCell(cIdx).numFmt = '#,##0.00';
      row.getCell(cIdx).alignment = { horizontal: 'right', vertical: 'middle' };
    });
    [1, 2, 4, 5, 9].forEach((cIdx) => {
      row.getCell(cIdx).alignment = { horizontal: 'center', vertical: 'middle' };
    });

    if (idx % 2 === 1) {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ZEBRA_LIGHT } };
      });
    }

    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: BORDER_COLOR } },
        bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
        left: { style: 'thin', color: { argb: BORDER_COLOR } },
        right: { style: 'thin', color: { argb: BORDER_COLOR } },
      };
    });
  });

  // Withdrawals Total Row
  const totalRowWd = wsWithdrawals.addRow([
    'TOTALS',
    '',
    `${filteredWds.length} Claims`,
    '',
    '',
    totalGrossWd,
    totalFeeWd,
    totalNetWd,
    '',
    '',
    '',
    '',
  ]);

  totalRowWd.height = 24;
  totalRowWd.font = { name: 'Calibri', size: 10, bold: true, color: { argb: GOLD_COLOR } };
  totalRowWd.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_DARK } };
    cell.border = {
      top: { style: 'thin', color: { argb: GOLD_COLOR } },
      bottom: { style: 'double', color: { argb: GOLD_COLOR } },
    };
  });
  [6, 7, 8].forEach((cIdx) => {
    totalRowWd.getCell(cIdx).numFmt = '#,##0.00';
    totalRowWd.getCell(cIdx).alignment = { horizontal: 'right', vertical: 'middle' };
  });

  autoFitColumns(wsWithdrawals, 14, 40);

  // =========================================================================
  // WORKSHEET 4: REFERRAL SYNDICATE NETWORK
  // =========================================================================
  const wsReferrals = workbook.addWorksheet('Referral Syndicate Network', {
    views: [{ showGridLines: true }],
    properties: { tabColor: { argb: 'FF8B5CF6' } },
  });

  applyBanner(wsReferrals, 'Referral Syndicate Network & 5% Commissions', 'Institutional syndicate hierarchy, referee capital, and monthly overrides', 10);

  const refHeaders = [
    'Referral ID',
    'Referrer ID',
    'Referrer Name',
    'Referral Code',
    'Referee ID',
    'Referee Name',
    'Invested Capital (USDT)',
    'Commission Rate',
    'Earned Commission (USDT)',
    'Syndicate Status',
  ];

  const headerRowRef = wsReferrals.addRow(refHeaders);
  styleHeaderRow(headerRowRef, refHeaders.length);

  let totalRefCap = 0;
  let totalRefComm = 0;

  referrals.forEach((r, idx) => {
    const referrer = clients.find((c) => c.id === r.referrerId || c.clientId === r.referrerId);
    const referee = clients.find((c) => c.id === r.refereeId || c.clientId === r.refereeId);
    const cap = Number(r.capitalAmount || referee?.assignedPlanAmount || 0);
    const comm = Number(r.totalEarnedAmount || r.monthlyCommissionAmount || Math.round(cap * 0.05 * 100) / 100);

    totalRefCap += cap;
    totalRefComm += comm;

    const row = wsReferrals.addRow([
      r.id,
      r.referrerId,
      referrer ? `${referrer.firstName} ${referrer.lastName}` : (r.referrerName || '—'),
      r.referrerCode || referrer?.referralCode || '—',
      r.refereeId,
      referee ? `${referee.firstName} ${referee.lastName}` : (r.refereeName || '—'),
      cap,
      '5.00%',
      comm,
      (r.status || 'active').toUpperCase(),
    ]);

    row.height = 20;

    [7, 9].forEach((cIdx) => {
      row.getCell(cIdx).numFmt = '#,##0.00';
      row.getCell(cIdx).alignment = { horizontal: 'right', vertical: 'middle' };
    });
    [1, 2, 4, 5, 8, 10].forEach((cIdx) => {
      row.getCell(cIdx).alignment = { horizontal: 'center', vertical: 'middle' };
    });

    if (idx % 2 === 1) {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ZEBRA_LIGHT } };
      });
    }

    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: BORDER_COLOR } },
        bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
        left: { style: 'thin', color: { argb: BORDER_COLOR } },
        right: { style: 'thin', color: { argb: BORDER_COLOR } },
      };
    });
  });

  // Referrals Total Row
  const totalRowRef = wsReferrals.addRow([
    'TOTALS',
    '',
    '',
    `${referrals.length} Referrals`,
    '',
    '',
    totalRefCap,
    '',
    totalRefComm,
    '',
  ]);

  totalRowRef.height = 24;
  totalRowRef.font = { name: 'Calibri', size: 10, bold: true, color: { argb: GOLD_COLOR } };
  totalRowRef.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_DARK } };
    cell.border = {
      top: { style: 'thin', color: { argb: GOLD_COLOR } },
      bottom: { style: 'double', color: { argb: GOLD_COLOR } },
    };
  });
  [7, 9].forEach((cIdx) => {
    totalRowRef.getCell(cIdx).numFmt = '#,##0.00';
    totalRowRef.getCell(cIdx).alignment = { horizontal: 'right', vertical: 'middle' };
  });

  autoFitColumns(wsReferrals, 14, 40);

  // =========================================================================
  // WORKSHEET 5: INSTITUTIONAL AUDIT TRAIL
  // =========================================================================
  const wsAudit = workbook.addWorksheet('Audit Trail', {
    views: [{ showGridLines: true }],
    properties: { tabColor: { argb: 'FF3B82F6' } },
  });

  applyBanner(wsAudit, 'System Audit Logs & Regulatory Trail', 'Tamper-evident logs of administrative plan assignments, KYC verifications, and approvals', 6);

  const auditHeaders = [
    'Log ID',
    'Timestamp (UTC)',
    'Administrator',
    'Action Taken',
    'Category',
    'Details & Contract Reference',
  ];

  const headerRowAudit = wsAudit.addRow(auditHeaders);
  styleHeaderRow(headerRowAudit, auditHeaders.length);

  auditLogs.forEach((log, idx) => {
    const row = wsAudit.addRow([
      log.id || `audit-${idx}`,
      log.timestamp,
      log.adminName || 'System Administrator',
      log.action,
      (log.category || 'general').toUpperCase(),
      log.details,
    ]);

    row.height = 20;
    [1, 2, 3, 5].forEach((cIdx) => {
      row.getCell(cIdx).alignment = { horizontal: 'center', vertical: 'middle' };
    });

    if (idx % 2 === 1) {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ZEBRA_LIGHT } };
      });
    }

    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: BORDER_COLOR } },
        bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
        left: { style: 'thin', color: { argb: BORDER_COLOR } },
        right: { style: 'thin', color: { argb: BORDER_COLOR } },
      };
    });
  });

  autoFitColumns(wsAudit, 15, 60);

  // Write and return buffer as Blob
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * Initiates direct browser download of the generated blob
 */
export function triggerFileDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}
