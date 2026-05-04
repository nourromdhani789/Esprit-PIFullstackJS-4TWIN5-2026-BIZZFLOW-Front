import { activityService, Activity, ActivityResponse, ActivityFilterType } from '../activity.service';
import api from '../api';

jest.mock('../api');

const mockedApi = api as jest.Mocked<typeof api>;

describe('ActivityService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getDashboardActivities', () => {
    it('should fetch dashboard activities with default limit', async () => {
      const mockResponse: ActivityResponse = {
        activities: [
          {
            id: 'act-1',
            description: 'Created invoice INV-001',
            entityType: 'Invoice',
            entityId: 'inv-1',
            userEmail: 'user@test.com',
            icon: 'file-invoice',
            link: '/invoices/inv-1',
            createdAt: '2024-01-15T10:00:00Z',
          },
          {
            id: 'act-2',
            description: 'Added new client John Doe',
            entityType: 'Client',
            entityId: 'client-1',
            userEmail: 'user@test.com',
            icon: 'user-plus',
            link: '/clients/client-1',
            createdAt: '2024-01-15T09:00:00Z',
          },
        ],
        total: 2,
        hasMore: false,
      };

      mockedApi.get.mockResolvedValue({ data: mockResponse });

      const result = await activityService.getDashboardActivities();

      expect(result).toEqual(mockResponse);
      expect(mockedApi.get).toHaveBeenCalledWith('/audit-logs/dashboard/activity', {
        params: { limit: 10, page: 1 },
      });
    });

    it('should fetch dashboard activities with custom limit', async () => {
      const mockResponse: ActivityResponse = {
        activities: [],
        total: 0,
        hasMore: false,
      };

      mockedApi.get.mockResolvedValue({ data: mockResponse });

      await activityService.getDashboardActivities(20);

      expect(mockedApi.get).toHaveBeenCalledWith('/audit-logs/dashboard/activity', {
        params: { limit: 20, page: 1 },
      });
    });
  });

  describe('getActivities', () => {
    it('should fetch activities with pagination', async () => {
      const mockResponse: ActivityResponse = {
        activities: [
          {
            id: 'act-1',
            description: 'Created expense',
            entityType: 'Expense',
            entityId: 'exp-1',
            userEmail: 'user@test.com',
            icon: 'receipt',
            link: '/expenses/exp-1',
            createdAt: '2024-01-15T10:00:00Z',
          },
        ],
        total: 1,
        hasMore: true,
      };

      mockedApi.get.mockResolvedValue({ data: mockResponse });

      const result = await activityService.getActivities(2, 15);

      expect(result).toEqual(mockResponse);
      expect(mockedApi.get).toHaveBeenCalledWith('/audit-logs/dashboard/activity', {
        params: { page: 2, limit: 15 },
      });
    });

    it('should fetch activities with entity type filter', async () => {
      const mockResponse: ActivityResponse = {
        activities: [
          {
            id: 'act-1',
            description: 'Created invoice',
            entityType: 'Invoice',
            entityId: 'inv-1',
            userEmail: 'user@test.com',
            icon: 'file-invoice',
            link: '/invoices/inv-1',
            createdAt: '2024-01-15T10:00:00Z',
          },
        ],
        total: 1,
        hasMore: false,
      };

      mockedApi.get.mockResolvedValue({ data: mockResponse });

      const result = await activityService.getActivities(1, 20, { entityType: 'Invoice' });

      expect(result.activities[0].entityType).toBe('Invoice');
      expect(mockedApi.get).toHaveBeenCalledWith('/audit-logs/dashboard/activity', {
        params: { page: 1, limit: 20, entityType: 'Invoice' },
      });
    });

    it('should fetch activities with date range filters', async () => {
      const mockResponse: ActivityResponse = {
        activities: [],
        total: 0,
        hasMore: false,
      };

      mockedApi.get.mockResolvedValue({ data: mockResponse });

      await activityService.getActivities(1, 20, {
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
      });

      expect(mockedApi.get).toHaveBeenCalledWith('/audit-logs/dashboard/activity', {
        params: { page: 1, limit: 20, dateFrom: '2024-01-01', dateTo: '2024-01-31' },
      });
    });

    it('should not include entityType in params when filter is "all"', async () => {
      const mockResponse: ActivityResponse = {
        activities: [],
        total: 0,
        hasMore: false,
      };

      mockedApi.get.mockResolvedValue({ data: mockResponse });

      await activityService.getActivities(1, 20, { entityType: 'all' });

      expect(mockedApi.get).toHaveBeenCalledWith('/audit-logs/dashboard/activity', {
        params: { page: 1, limit: 20 },
      });
    });

    it('should handle all activity filter types', async () => {
      const filterTypes: ActivityFilterType[] = [
        'all', 'Invoice', 'Expense', 'PurchaseOrder', 'Client', 
        'StockTake', 'Product', 'Supplier', 'CreditNote', 'Payment'
      ];

      for (const filterType of filterTypes) {
        mockedApi.get.mockResolvedValue({ 
          data: { activities: [], total: 0, hasMore: false } 
        });

        await activityService.getActivities(1, 20, { entityType: filterType });

        if (filterType !== 'all') {
          expect(mockedApi.get).toHaveBeenCalledWith('/audit-logs/dashboard/activity', {
            params: { page: 1, limit: 20, entityType: filterType },
          });
        }
      }
    });
  });

  describe('formatTimeAgo', () => {
    it('should return "just now" for recent activity', () => {
      const now = new Date().toISOString();
      expect(activityService.formatTimeAgo(now)).toBe('just now');
    });

    it('should return minutes ago', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60000).toISOString();
      expect(activityService.formatTimeAgo(fiveMinutesAgo)).toBe('5m ago');
    });

    it('should return hours ago', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 3600000).toISOString();
      expect(activityService.formatTimeAgo(twoHoursAgo)).toBe('2h ago');
    });

    it('should return "Yesterday" for yesterday', () => {
      const yesterday = new Date(Date.now() - 24 * 3600000).toISOString();
      expect(activityService.formatTimeAgo(yesterday)).toBe('Yesterday');
    });

    it('should return days ago for this week', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 3600000).toISOString();
      expect(activityService.formatTimeAgo(threeDaysAgo)).toBe('3 days ago');
    });

    it('should return formatted date for older dates', () => {
      const oldDate = new Date('2024-01-15').toISOString();
      const result = activityService.formatTimeAgo(oldDate);
      expect(result).toContain('Jan');
    });
  });

  describe('formatDateGroup', () => {
    it('should return "Today" for today', () => {
      const today = new Date().toISOString();
      expect(activityService.formatDateGroup(today)).toBe('Today');
    });

    it('should return "Yesterday" for yesterday', () => {
      const yesterday = new Date(Date.now() - 24 * 3600000).toISOString();
      expect(activityService.formatDateGroup(yesterday)).toBe('Yesterday');
    });

    it('should return weekday name for this week', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 3600000);
      const result = activityService.formatDateGroup(threeDaysAgo.toISOString());
      const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      expect(weekdays).toContain(result);
    });

    it('should return formatted date for older dates', () => {
      const oldDate = new Date('2024-01-15').toISOString();
      const result = activityService.formatDateGroup(oldDate);
      expect(result).toContain('January');
    });
  });

  describe('getEntityColor', () => {
    it('should return correct color for Invoice', () => {
      const color = activityService.getEntityColor('Invoice');
      expect(color).toContain('blue');
    });

    it('should return correct color for Expense', () => {
      const color = activityService.getEntityColor('Expense');
      expect(color).toContain('orange');
    });

    it('should return correct color for PurchaseOrder', () => {
      const color = activityService.getEntityColor('PurchaseOrder');
      expect(color).toContain('purple');
    });

    it('should return correct color for Client', () => {
      const color = activityService.getEntityColor('Client');
      expect(color).toContain('green');
    });

    it('should return correct color for Supplier', () => {
      const color = activityService.getEntityColor('Supplier');
      expect(color).toContain('amber');
    });

    it('should return correct color for Product', () => {
      const color = activityService.getEntityColor('Product');
      expect(color).toContain('gray');
    });

    it('should return correct color for CreditNote', () => {
      const color = activityService.getEntityColor('CreditNote');
      expect(color).toContain('yellow');
    });

    it('should return correct color for StockTake', () => {
      const color = activityService.getEntityColor('StockTake');
      expect(color).toContain('teal');
    });

    it('should return correct color for Payment', () => {
      const color = activityService.getEntityColor('Payment');
      expect(color).toContain('green');
    });

    it('should return default color for unknown entity', () => {
      const color = activityService.getEntityColor('Unknown');
      expect(color).toContain('gray');
    });
  });

  describe('groupActivitiesByDate', () => {
    it('should group activities by date', () => {
      const activities: Activity[] = [
        {
          id: 'act-1',
          description: 'Activity 1',
          entityType: 'Invoice',
          entityId: 'inv-1',
          userEmail: 'user@test.com',
          icon: 'file',
          link: '/invoices/1',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'act-2',
          description: 'Activity 2',
          entityType: 'Client',
          entityId: 'client-1',
          userEmail: 'user@test.com',
          icon: 'user',
          link: '/clients/1',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'act-3',
          description: 'Activity 3',
          entityType: 'Expense',
          entityId: 'exp-1',
          userEmail: 'user@test.com',
          icon: 'receipt',
          link: '/expenses/1',
          createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
        },
      ];

      const result = activityService.groupActivitiesByDate(activities);

      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0].items.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle empty activities array', () => {
      const result = activityService.groupActivitiesByDate([]);
      expect(result).toEqual([]);
    });

    it('should handle activities from different weeks', () => {
      const activities: Activity[] = [
        {
          id: 'act-1',
          description: 'Today activity',
          entityType: 'Invoice',
          entityId: 'inv-1',
          userEmail: 'user@test.com',
          icon: 'file',
          link: '/invoices/1',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'act-2',
          description: 'Old activity',
          entityType: 'Client',
          entityId: 'client-1',
          userEmail: 'user@test.com',
          icon: 'user',
          link: '/clients/1',
          createdAt: new Date('2024-01-01').toISOString(),
        },
      ];

      const result = activityService.groupActivitiesByDate(activities);

      expect(result.length).toBe(2);
    });
  });

  describe('service singleton', () => {
    it('should export singleton instance', () => {
      expect(activityService).toBeDefined();
      expect(typeof activityService.getDashboardActivities).toBe('function');
      expect(typeof activityService.getActivities).toBe('function');
      expect(typeof activityService.formatTimeAgo).toBe('function');
      expect(typeof activityService.formatDateGroup).toBe('function');
      expect(typeof activityService.getEntityColor).toBe('function');
      expect(typeof activityService.groupActivitiesByDate).toBe('function');
    });
  });

  describe('edge cases', () => {
    it('should handle activity with different entity types', async () => {
      const entityTypes = ['Invoice', 'Expense', 'PurchaseOrder', 'Client', 'Product', 'Supplier', 'CreditNote', 'StockTake', 'Payment'];
      
      for (const entityType of entityTypes) {
        const mockActivity: Activity = {
          id: 'act-1',
          description: `Created ${entityType}`,
          entityType,
          entityId: '1',
          userEmail: 'user@test.com',
          icon: 'icon',
          link: `/${entityType.toLowerCase()}/1`,
          createdAt: new Date().toISOString(),
        };

        const color = activityService.getEntityColor(entityType);
        expect(color).toBeDefined();
        expect(color.length).toBeGreaterThan(0);
      }
    });

    it('should handle pagination with hasMore flag', async () => {
      const mockResponse: ActivityResponse = {
        activities: Array(20).fill(null).map((_, i) => ({
          id: `act-${i}`,
          description: `Activity ${i}`,
          entityType: 'Invoice',
          entityId: `inv-${i}`,
          userEmail: 'user@test.com',
          icon: 'file',
          link: `/invoices/${i}`,
          createdAt: new Date().toISOString(),
        })),
        total: 50,
        hasMore: true,
      };

      mockedApi.get.mockResolvedValue({ data: mockResponse });

      const result = await activityService.getActivities(1, 20);

      expect(result.activities).toHaveLength(20);
      expect(result.hasMore).toBe(true);
      expect(result.total).toBe(50);
    });
  });
});
