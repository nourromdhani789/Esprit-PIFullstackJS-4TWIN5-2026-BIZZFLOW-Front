import api from './api';

export interface KPIData {
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  profitMargin: number;
}

export interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface RecentInvoice {
  id: string;
  invoiceNumber?: string;
  clientName?: string;
  clientId: string;
  status: 'paid' | 'unpaid' | 'overdue';
  totalAmount: number;
  createdAt: string;
}

export interface RecentExpense {
  id: string;
  amount: number;
  category: string;
  date: string;
  supplier?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface TopClient {
  clientId: string;
  clientName: string;
  totalInvoiced: number;
  totalPaid: number;
  outstandingBalance: number;
  invoiceCount: number;
}

export interface DashboardData {
  kpis: KPIData;
  monthlyTrend: MonthlyData[];
  recentInvoices: RecentInvoice[];
  recentExpenses: RecentExpense[];
  topClients: TopClient[];
}

export interface ReportSummary {
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  totalInvoices: number;
  totalExpensesCount: number;
}

export interface FullReportData {
  summary: ReportSummary;
  invoices: RecentInvoice[];
  expenses: RecentExpense[];
}

class ReportingService {
  async getDashboard(): Promise<DashboardData> {
    const response = await api.get('/reporting/dashboard');
    return response.data;
  }

  async getKPIs(startDate?: string, endDate?: string): Promise<KPIData> {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await api.get('/reporting/kpis', { params });
    return response.data;
  }

  async getMonthlyTrend(months?: number): Promise<MonthlyData[]> {
    const params: Record<string, string> = {};
    if (months) params.months = months.toString();
    
    const response = await api.get('/reporting/monthly-trend', { params });
    return response.data;
  }

  async getFullReport(startDate?: string, endDate?: string): Promise<FullReportData> {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await api.get('/reporting/report', { params });
    return response.data;
  }

  async exportCSV(startDate?: string, endDate?: string): Promise<Blob> {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await api.get('/reporting/export/csv', {
      params,
      responseType: 'blob',
    });
    return response.data;
  }

  async exportPDF(startDate?: string, endDate?: string): Promise<Blob> {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await api.get('/reporting/export/pdf', {
      params,
      responseType: 'blob',
    });
    return response.data;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }
}

export const reportingService = new ReportingService();
