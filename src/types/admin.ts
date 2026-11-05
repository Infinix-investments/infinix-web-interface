export type KYCStatus = 'verified' | 'pending' | 'rejected';
export type PlanStatus = 'active' | 'pending_assignment' | 'matured' | 'cancelled';
export type WithdrawalStatus = 'pending_approval' | 'disbursed' | 'rejected';

export interface ClientProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isPhoneVerified: boolean;
  kycStatus: KYCStatus;
  assignedPlanId: string | null;
  assignedPlanName?: string;
  assignedPlanAmount?: number;
  assignedPlanStartDate?: string;
  assignedPlanStatus: PlanStatus;
  currentMonthIndex: number;
  currentMonthWithdrawn: boolean;
  lastWithdrawalDate?: string;
  bankAccount: string;
  totalAum: number;
  joinedDate: string;
  notes: string;
}

export interface InvestmentPlanConfig {
  id: string;
  planName: string;
  description: string;
  monthlyReturnPct: number; // e.g. 15.0
  durationMonths: number; // e.g. 14
  capitalReturnMonthlyPct: number; // e.g. 7.5
  profitMonthlyPct: number; // e.g. 7.5
  grossTotalReturnPct: number; // e.g. 210.0
  netProfitPct: number; // e.g. 105.0
  minInvestment: number;
  maxInvestment: number;
  isDefault: boolean;
  status: 'active' | 'closed';
}

export interface WithdrawalRecord {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  monthIndex: number;
  requestDate: string;
  disbursedDate?: string;
  status: WithdrawalStatus;
  bankAccount: string;
  utrReference?: string;
  notes?: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  adminName: string;
  action: string;
  category: 'client_verification' | 'plan_assignment' | 'withdrawal_approval' | 'plan_config';
  details: string;
}

