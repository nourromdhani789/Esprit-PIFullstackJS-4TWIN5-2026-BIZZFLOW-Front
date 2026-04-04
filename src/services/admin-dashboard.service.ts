import api from './api';

export interface DashboardMetrics {
  totalUsers: number;
  totalBusinesses: number;
  activeUsers: number;
  inactiveUsers: number;
  newUsersThisWeek: number;
  totalInvoices: number;
  totalRevenue: number;
}

export interface UserGrowthData {
  date: string;
  count: number;
}

export interface RevenueData {
  date: string;
  amount: number;
}

export interface RecentUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roleId: string;
  isActive: boolean;
  createdAt: string;
}

export interface RecentBusiness {
  id: string;
  name: string;
  legalName: string | null;
  tenantId: string;
  ownerEmail: string;
  ownerName: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface PlatformUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roleId: string;
  isActive: boolean;
  isEmailVerified: boolean;
  tenantId?: string;
  createdAt: string;
}

export interface PlatformBusiness {
  id: string;
  name: string;
  legalName?: string;
  phone?: string;
  tenantId: string;
  totalUsers: number;
  totalInvoices: number;
  totalRevenue: number;
  createdAt: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  businessName?: string;
  tenantId?: string;
  action: string;
  details?: string;
  ipAddress?: string;
  timestamp: string;
}

export const adminDashboardService = {
  // Get main dashboard metrics
  getDashboardMetrics: async (): Promise<DashboardMetrics> => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  // Get recent users
  getRecentUsers: async (limit: number = 10): Promise<RecentUser[]> => {
    const response = await api.get('/admin/recent-users', { params: { limit } });
    return response.data;
  },

  // Get recent businesses
  getRecentBusinesses: async (limit: number = 10): Promise<RecentBusiness[]> => {
    const response = await api.get('/admin/recent-businesses', { params: { limit } });
    return response.data;
  },

  // Get user growth data (daily)
  getUserGrowth: async (days: number = 7): Promise<UserGrowthData[]> => {
    const response = await api.get('/admin/user-growth', { params: { days } });
    return response.data;
  },

  // Get user growth data (monthly)
  getUserGrowthMonthly: async (months: number = 6): Promise<UserGrowthData[]> => {
    const response = await api.get('/admin/user-growth-monthly', { params: { months } });
    return response.data;
  },

  // Get revenue data (daily)
  getRevenue: async (days: number = 7): Promise<RevenueData[]> => {
    const response = await api.get('/admin/revenue', { params: { days } });
    return response.data;
  },

  // Get revenue data (monthly)
  getRevenueMonthly: async (months: number = 6): Promise<RevenueData[]> => {
    const response = await api.get('/admin/revenue-monthly', { params: { months } });
    return response.data;
  },

  // ============================================
  // PLATFORM-WIDE DATA ACCESS
  // ============================================

  // Get all platform users with pagination
  getAllPlatformUsers: async (
    page: number = 1,
    limit: number = 50,
    search?: string,
    role?: string,
    isActive?: boolean
  ): Promise<{ users: PlatformUser[]; total: number; page: number; limit: number }> => {
    const response = await api.get('/admin/users', {
      params: { page, limit, search, role, isActive },
    });
    return response.data;
  },

  // Get all platform businesses with pagination
  getAllPlatformBusinesses: async (
    page: number = 1,
    limit: number = 50,
    search?: string,
    isActive?: boolean
  ): Promise<{ businesses: PlatformBusiness[]; total: number; page: number; limit: number }> => {
    const response = await api.get('/admin/businesses', {
      params: { page, limit, search, isActive },
    });
    return response.data;
  },

  // Get platform activity logs with pagination
  getPlatformActivityLogs: async (
    page: number = 1,
    limit: number = 50,
    action?: string,
    userId?: string,
    tenantId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<{ logs: ActivityLog[]; total: number; page: number; limit: number }> => {
    const response = await api.get('/admin/activity-logs', {
      params: { page, limit, action, userId, tenantId, startDate, endDate },
    });
    return response.data;
  },
};
