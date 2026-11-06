export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: T; error?: string; message?: string }> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(options.headers as Record<string, string>),
      };

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const json = await res.json();
      return json;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network request failed' };
    }
  }

  // Auth
  async login(identifier: string, password: string) {
    return this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
  }

  // Clients
  async getClients(search?: string, kycStatus?: string) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (kycStatus) params.append('kycStatus', kycStatus);
    const q = params.toString() ? `?${params.toString()}` : '';
    return this.request<any[]>(`/clients${q}`);
  }

  async createClient(data: any) {
    return this.request<any>('/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateClient(clientId: string, updates: any) {
    return this.request<any>(`/clients/${clientId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async assignPlan(clientId: string, planId: string, capitalAmount: number, adminName?: string) {
    return this.request<any>(`/clients/${clientId}/assign-plan`, {
      method: 'POST',
      body: JSON.stringify({ planId, capitalAmount, adminName }),
    });
  }

  // Plans
  async getPlans() {
    return this.request<any[]>('/plans');
  }

  async createPlan(data: any) {
    return this.request<any>('/plans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Withdrawals
  async getWithdrawals() {
    return this.request<any[]>('/withdrawals');
  }

  async updateWithdrawalStatus(
    withdrawalId: string,
    status: 'disbursed' | 'rejected',
    utrReference?: string,
    notes?: string,
    adminName?: string
  ) {
    return this.request<any>(`/withdrawals/${withdrawalId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, utrReference, notes, adminName }),
    });
  }

  // Referrals
  async getReferrals() {
    return this.request<any[]>('/referrals');
  }

  async getReferralTiers() {
    return this.request<any[]>('/referrals/tiers');
  }

  // Audit Logs
  async getAuditLogs(search?: string, category?: string) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    const q = params.toString() ? `?${params.toString()}` : '';
    return this.request<any[]>(`/audit-logs${q}`);
  }

  // Health
  async checkHealth() {
    return this.request('/health');
  }
}

export const api = new ApiClient();
