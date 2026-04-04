import api from './api';

export interface Activity {
  id: string;
  description: string;
  entityType: string;
  entityId: string;
  userEmail: string;
  icon: string;
  link: string;
  createdAt: string;
}

export interface ActivityResponse {
  activities: Activity[];
  total: number;
  hasMore: boolean;
}

export type ActivityFilterType = 'all' | 'Invoice' | 'Expense' | 'PurchaseOrder' | 'Client' | 'StockTake' | 'Product' | 'Supplier' | 'CreditNote' | 'Payment';

class ActivityService {
  async getDashboardActivities(limit: number = 10): Promise<ActivityResponse> {
    const response = await api.get('/audit-logs/dashboard/activity', {
      params: { limit, page: 1 },
    });
    return response.data;
  }

  async getActivities(
    page: number = 1,
    limit: number = 20,
    filters?: {
      entityType?: ActivityFilterType;
      dateFrom?: string;
      dateTo?: string;
    }
  ): Promise<ActivityResponse> {
    const params: Record<string, string | number> = { page, limit };
    
    if (filters?.entityType && filters.entityType !== 'all') {
      params.entityType = filters.entityType;
    }
    if (filters?.dateFrom) {
      params.dateFrom = filters.dateFrom;
    }
    if (filters?.dateTo) {
      params.dateTo = filters.dateTo;
    }

    const response = await api.get('/audit-logs/dashboard/activity', { params });
    return response.data;
  }

  formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }

  formatDateGroup(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const activityDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (activityDate.getTime() === today.getTime()) {
      return 'Today';
    }
    if (activityDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    }
    
    const diffDays = Math.round((today.getTime() - activityDate.getTime()) / 86400000);
    if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    }
    
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: activityDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  }

  getEntityColor(entityType: string): string {
    const colors: Record<string, string> = {
      Invoice: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      Expense: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
      PurchaseOrder: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
      CreditNote: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
      Product: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
      Client: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      Supplier: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
      StockTake: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
      Payment: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    };
    return colors[entityType] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
  }

  groupActivitiesByDate(activities: Activity[]): { date: string; items: Activity[] }[] {
    const groups: Record<string, Activity[]> = {};
    
    activities.forEach(activity => {
      const dateGroup = this.formatDateGroup(activity.createdAt);
      if (!groups[dateGroup]) {
        groups[dateGroup] = [];
      }
      groups[dateGroup].push(activity);
    });

    return Object.entries(groups).map(([date, items]) => ({ date, items }));
  }
}

export const activityService = new ActivityService();
