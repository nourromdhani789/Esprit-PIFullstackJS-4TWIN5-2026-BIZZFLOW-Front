import { supplierService, Supplier, CreateSupplierDto, UpdateSupplierDto, SupplierProfile } from '../supplier.service';
import api from '../api';

jest.mock('../api');

const mockedApi = api as jest.Mocked<typeof api>;

describe('SupplierService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getSuppliers', () => {
    it('should fetch all suppliers successfully', async () => {
      const mockSuppliers: Supplier[] = [
        {
          id: 'supp-1',
          name: 'Supplier One',
          email: 'supplier1@test.com',
          phone: '+1234567890',
          address: '123 Supplier St',
          businessId: 'business-1',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          totalPurchased: 5000,
          totalPaid: 3000,
          outstandingBalance: 2000,
          expenseCount: 5,
          orderCount: 3,
        },
        {
          id: 'supp-2',
          name: 'Supplier Two',
          email: 'supplier2@test.com',
          phone: '+0987654321',
          address: '456 Vendor Ave',
          businessId: 'business-1',
          createdAt: '2024-01-02',
          updatedAt: '2024-01-02',
          totalPurchased: 10000,
          totalPaid: 8000,
          outstandingBalance: 2000,
          expenseCount: 8,
          orderCount: 5,
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockSuppliers });

      const result = await supplierService.getSuppliers();

      expect(result).toEqual(mockSuppliers);
      expect(result).toHaveLength(2);
      expect(mockedApi.get).toHaveBeenCalledWith('/suppliers');
    });

    it('should return empty array if no suppliers', async () => {
      mockedApi.get.mockResolvedValue({ data: [] });

      const result = await supplierService.getSuppliers();

      expect(result).toEqual([]);
    });
  });

  describe('getSupplier', () => {
    it('should fetch single supplier by id', async () => {
      const mockSupplier: Supplier = {
        id: 'supp-1',
        name: 'Test Supplier',
        email: 'test@supplier.com',
        phone: '+1234567890',
        address: '123 Test St',
        businessId: 'business-1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        totalPurchased: 5000,
        totalPaid: 3000,
        outstandingBalance: 2000,
      };

      mockedApi.get.mockResolvedValue({ data: mockSupplier });

      const result = await supplierService.getSupplier('supp-1');

      expect(result).toEqual(mockSupplier);
      expect(mockedApi.get).toHaveBeenCalledWith('/suppliers/supp-1');
    });

    it('should handle supplier without computed fields', async () => {
      const mockSupplier: Supplier = {
        id: 'supp-1',
        name: 'Simple Supplier',
        businessId: 'business-1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      mockedApi.get.mockResolvedValue({ data: mockSupplier });

      const result = await supplierService.getSupplier('supp-1');

      expect(result.totalPurchased).toBeUndefined();
    });
  });

  describe('getSupplierProfile', () => {
    it('should fetch supplier profile with all data', async () => {
      const mockProfile: SupplierProfile = {
        supplier: {
          id: 'supp-1',
          name: 'Test Supplier',
          email: 'test@supplier.com',
          phone: '+1234567890',
          address: '123 Test St',
          createdAt: '2024-01-01',
        },
        stats: {
          totalPurchased: 15000,
          totalPaid: 10000,
          outstandingBalance: 5000,
          orderCount: 10,
          expenseCount: 5,
        },
        purchaseOrders: [
          {
            id: 'po-1',
            orderNumber: 'PO-001',
            date: '2024-01-15',
            totalAmount: 5000,
            status: 'received',
            itemCount: 3,
            supplierName: 'Test Supplier',
          },
        ],
        expenses: [
          {
            id: 'exp-1',
            date: '2024-01-10',
            amount: 1000,
            category: 'Equipment',
            status: 'approved',
            reference: 'EXP-001',
          },
        ],
        payments: [
          {
            id: 'pay-1',
            date: '2024-01-15',
            amount: 5000,
            method: 'bank',
            reference: 'PAY-001',
          },
        ],
      };

      mockedApi.get.mockResolvedValue({ data: mockProfile });

      const result = await supplierService.getSupplierProfile('supp-1');

      expect(result).toEqual(mockProfile);
      expect(result.stats.totalPurchased).toBe(15000);
      expect(result.purchaseOrders).toHaveLength(1);
      expect(result.expenses).toHaveLength(1);
      expect(result.payments).toHaveLength(1);
      expect(mockedApi.get).toHaveBeenCalledWith('/suppliers/supp-1/profile');
    });

    it('should handle profile with empty arrays', async () => {
      const mockProfile: SupplierProfile = {
        supplier: {
          id: 'supp-1',
          name: 'New Supplier',
          email: 'new@supplier.com',
          phone: '',
          address: '',
          createdAt: '2024-01-01',
        },
        stats: {
          totalPurchased: 0,
          totalPaid: 0,
          outstandingBalance: 0,
          orderCount: 0,
          expenseCount: 0,
        },
        purchaseOrders: [],
        expenses: [],
        payments: [],
      };

      mockedApi.get.mockResolvedValue({ data: mockProfile });

      const result = await supplierService.getSupplierProfile('supp-1');

      expect(result.purchaseOrders).toEqual([]);
      expect(result.expenses).toEqual([]);
      expect(result.payments).toEqual([]);
    });
  });

  describe('createSupplier', () => {
    const createData: CreateSupplierDto = {
      name: 'New Supplier',
      email: 'new@supplier.com',
      phone: '+1234567890',
      address: '789 New Street',
    };

    it('should create supplier successfully', async () => {
      const createdSupplier: Supplier = {
        id: 'new-supp-id',
        ...createData,
        businessId: 'business-1',
        createdAt: '2024-01-15',
        updatedAt: '2024-01-15',
      };

      mockedApi.post.mockResolvedValue({ data: createdSupplier });

      const result = await supplierService.createSupplier(createData);

      expect(result).toEqual(createdSupplier);
      expect(mockedApi.post).toHaveBeenCalledWith('/suppliers', createData);
    });

    it('should create supplier with minimal data', async () => {
      const minimalData: CreateSupplierDto = {
        name: 'Minimal Supplier',
      };

      const createdSupplier: Supplier = {
        id: 'minimal-id',
        ...minimalData,
        businessId: 'business-1',
        createdAt: '2024-01-15',
        updatedAt: '2024-01-15',
      };

      mockedApi.post.mockResolvedValue({ data: createdSupplier });

      const result = await supplierService.createSupplier(minimalData);

      expect(result.name).toBe('Minimal Supplier');
    });
  });

  describe('updateSupplier', () => {
    const updateData: UpdateSupplierDto = {
      name: 'Updated Name',
      email: 'updated@supplier.com',
      phone: '+9999999999',
    };

    it('should update supplier successfully', async () => {
      const updatedSupplier: Supplier = {
        id: 'supp-1',
        name: 'Updated Name',
        email: 'updated@supplier.com',
        phone: '+9999999999',
        address: '123 Test St',
        businessId: 'business-1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-15',
      };

      mockedApi.patch.mockResolvedValue({ data: updatedSupplier });

      const result = await supplierService.updateSupplier('supp-1', updateData);

      expect(result).toEqual(updatedSupplier);
      expect(mockedApi.patch).toHaveBeenCalledWith('/suppliers/supp-1', updateData);
    });

    it('should update supplier with partial data', async () => {
      const partialUpdate: UpdateSupplierDto = {
        phone: '+1111111111',
      };

      const updatedSupplier: Supplier = {
        id: 'supp-1',
        name: 'Original Name',
        email: 'original@supplier.com',
        phone: '+1111111111',
        businessId: 'business-1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-15',
      };

      mockedApi.patch.mockResolvedValue({ data: updatedSupplier });

      const result = await supplierService.updateSupplier('supp-1', partialUpdate);

      expect(result.phone).toBe('+1111111111');
    });
  });

  describe('deleteSupplier', () => {
    it('should delete supplier successfully', async () => {
      mockedApi.delete.mockResolvedValue({ data: undefined });

      await supplierService.deleteSupplier('supp-1');

      expect(mockedApi.delete).toHaveBeenCalledWith('/suppliers/supp-1');
    });
  });

  describe('service singleton', () => {
    it('should export singleton instance', () => {
      expect(supplierService).toBeDefined();
      expect(typeof supplierService.getSuppliers).toBe('function');
      expect(typeof supplierService.getSupplier).toBe('function');
      expect(typeof supplierService.getSupplierProfile).toBe('function');
      expect(typeof supplierService.createSupplier).toBe('function');
      expect(typeof supplierService.updateSupplier).toBe('function');
      expect(typeof supplierService.deleteSupplier).toBe('function');
    });
  });

  describe('API integration', () => {
    it('should use correct API endpoints for all operations', async () => {
      mockedApi.get.mockResolvedValue({ data: [] });
      mockedApi.post.mockResolvedValue({ data: {} });
      mockedApi.patch.mockResolvedValue({ data: {} });
      mockedApi.delete.mockResolvedValue({ data: undefined });

      await supplierService.getSuppliers();
      expect(mockedApi.get).toHaveBeenCalledWith('/suppliers');

      await supplierService.getSupplier('supp-1');
      expect(mockedApi.get).toHaveBeenCalledWith('/suppliers/supp-1');

      await supplierService.getSupplierProfile('supp-1');
      expect(mockedApi.get).toHaveBeenCalledWith('/suppliers/supp-1/profile');

      await supplierService.createSupplier({ name: 'Test' });
      expect(mockedApi.post).toHaveBeenCalledWith('/suppliers', { name: 'Test' });

      await supplierService.updateSupplier('supp-1', { name: 'Updated' });
      expect(mockedApi.patch).toHaveBeenCalledWith('/suppliers/supp-1', { name: 'Updated' });

      await supplierService.deleteSupplier('supp-1');
      expect(mockedApi.delete).toHaveBeenCalledWith('/suppliers/supp-1');
    });
  });

  describe('edge cases', () => {
    it('should handle supplier with negative outstanding balance', async () => {
      const mockSupplier: Supplier = {
        id: 'supp-1',
        name: 'Overpaid Supplier',
        businessId: 'business-1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        totalPurchased: 1000,
        totalPaid: 1500,
        outstandingBalance: -500,
      };

      mockedApi.get.mockResolvedValue({ data: mockSupplier });

      const result = await supplierService.getSupplier('supp-1');

      expect(result.outstandingBalance).toBe(-500);
    });

    it('should handle supplier with very large amounts', async () => {
      const mockProfile: SupplierProfile = {
        supplier: {
          id: 'supp-1',
          name: 'Big Supplier',
          email: 'big@supplier.com',
          phone: '',
          address: '',
          createdAt: '2024-01-01',
        },
        stats: {
          totalPurchased: 10000000,
          totalPaid: 8000000,
          outstandingBalance: 2000000,
          orderCount: 1000,
          expenseCount: 500,
        },
        purchaseOrders: [],
        expenses: [],
        payments: [],
      };

      mockedApi.get.mockResolvedValue({ data: mockProfile });

      const result = await supplierService.getSupplierProfile('supp-1');

      expect(result.stats.totalPurchased).toBe(10000000);
    });

    it('should handle supplier profile with expense receipt URL', async () => {
      const mockProfile: SupplierProfile = {
        supplier: {
          id: 'supp-1',
          name: 'Test Supplier',
          email: 'test@supplier.com',
          phone: '',
          address: '',
          createdAt: '2024-01-01',
        },
        stats: {
          totalPurchased: 1000,
          totalPaid: 500,
          outstandingBalance: 500,
          orderCount: 1,
          expenseCount: 1,
        },
        purchaseOrders: [],
        expenses: [
          {
            id: 'exp-1',
            date: '2024-01-15',
            amount: 1000,
            category: 'Equipment',
            status: 'approved',
            reference: 'EXP-001',
            receiptUrl: 'https://example.com/receipt.pdf',
          },
        ],
        payments: [],
      };

      mockedApi.get.mockResolvedValue({ data: mockProfile });

      const result = await supplierService.getSupplierProfile('supp-1');

      expect(result.expenses[0].receiptUrl).toBe('https://example.com/receipt.pdf');
    });
  });
});
