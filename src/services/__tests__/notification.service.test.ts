import { notificationService, NotificationFilters } from '../notification.service';
import api from '../api';

jest.mock('../api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('NotificationService', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  const mockNotification = {
    id: 'n-1', businessId: 'b-1', title: 'Test', message: 'Test message',
    type: 'info' as const, category: 'invoice' as const, isRead: false,
    createdAt: '2024-01-15T00:00:00Z',
  };

  describe('getNotifications', () => {
    it('should fetch all notifications without filters', async () => {
      mockedApi.get.mockResolvedValue({ data: [mockNotification] });
      const result = await notificationService.getNotifications();
      expect(result).toEqual([mockNotification]);
      expect(mockedApi.get).toHaveBeenCalledWith('/notifications');
    });

    it('should fetch notifications with isRead filter', async () => {
      mockedApi.get.mockResolvedValue({ data: [mockNotification] });
      const filters: NotificationFilters = { isRead: false };
      await notificationService.getNotifications(filters);
      expect(mockedApi.get).toHaveBeenCalledWith('/notifications?isRead=false');
    });

    it('should fetch notifications with category filter', async () => {
      mockedApi.get.mockResolvedValue({ data: [mockNotification] });
      const filters: NotificationFilters = { category: 'invoice' };
      await notificationService.getNotifications(filters);
      expect(mockedApi.get).toHaveBeenCalledWith('/notifications?category=invoice');
    });

    it('should fetch notifications with limit', async () => {
      mockedApi.get.mockResolvedValue({ data: [mockNotification] });
      await notificationService.getNotifications(undefined, 5);
      expect(mockedApi.get).toHaveBeenCalledWith('/notifications?limit=5');
    });

    it('should fetch notifications with all filters and limit', async () => {
      mockedApi.get.mockResolvedValue({ data: [mockNotification] });
      const filters: NotificationFilters = { isRead: true, category: 'expense' };
      await notificationService.getNotifications(filters, 10);
      expect(mockedApi.get).toHaveBeenCalledWith('/notifications?isRead=true&category=expense&limit=10');
    });
  });

  describe('getUnreadCount', () => {
    it('should fetch unread count', async () => {
      mockedApi.get.mockResolvedValue({ data: { count: 5 } });
      const result = await notificationService.getUnreadCount();
      expect(result).toBe(5);
      expect(mockedApi.get).toHaveBeenCalledWith('/notifications/unread-count');
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const read = { ...mockNotification, isRead: true };
      mockedApi.patch.mockResolvedValue({ data: read });
      const result = await notificationService.markAsRead('n-1');
      expect(result.isRead).toBe(true);
      expect(mockedApi.patch).toHaveBeenCalledWith('/notifications/n-1/read');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      mockedApi.patch.mockResolvedValue({ data: { message: 'All marked as read' } });
      const result = await notificationService.markAllAsRead();
      expect(result.message).toBe('All marked as read');
      expect(mockedApi.patch).toHaveBeenCalledWith('/notifications/mark-all-read');
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      mockedApi.delete.mockResolvedValue({ data: { message: 'Deleted' } });
      const result = await notificationService.deleteNotification('n-1');
      expect(result.message).toBe('Deleted');
      expect(mockedApi.delete).toHaveBeenCalledWith('/notifications/n-1');
    });
  });
});
