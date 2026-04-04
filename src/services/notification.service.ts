import api from './api';

export type NotificationType = 'warning' | 'info' | 'success' | 'error';
export type NotificationCategory = 'invoice' | 'expense' | 'stock' | 'purchase_order' | 'credit_note' | 'payment';

export interface Notification {
  id: string;
  businessId: string;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  isRead: boolean;
  link?: string;
  entityId?: string;
  entityType?: string;
  createdAt: string;
}

export interface NotificationFilters {
  isRead?: boolean;
  category?: NotificationCategory;
}

class NotificationService {
  async getNotifications(filters?: NotificationFilters, limit?: number): Promise<Notification[]> {
    const params = new URLSearchParams();
    
    if (filters?.isRead !== undefined) {
      params.append('isRead', String(filters.isRead));
    }
    
    if (filters?.category) {
      params.append('category', filters.category);
    }
    
    if (limit) {
      params.append('limit', String(limit));
    }
    
    const queryString = params.toString();
    const url = queryString ? `/notifications?${queryString}` : '/notifications';
    
    const response = await api.get(url);
    return response.data;
  }

  async getUnreadCount(): Promise<number> {
    const response = await api.get('/notifications/unread-count');
    return response.data.count;
  }

  async markAsRead(id: string): Promise<Notification> {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  }

  async markAllAsRead(): Promise<{ message: string }> {
    const response = await api.patch('/notifications/mark-all-read');
    return response.data;
  }

  async deleteNotification(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  }
}

export const notificationService = new NotificationService();
