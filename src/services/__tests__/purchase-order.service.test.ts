import { purchaseOrderService, CreatePurchaseOrderDto, UpdatePurchaseOrderDto, ReceivePurchaseOrderDto } from '../purchase-order.service';
import api from '../api';

jest.mock('../api');

const mockedApi = api as jest.Mocked<typeof api>;

describe('PurchaseOrderService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockOrder = {
    id: 'po-1',
    supplierName: 'Test Supplier',
    totalAmount: 1000,
    status: 'pending' as const,
    date: '2024-01-15',
    businessId: 'b-1',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  };

  describe('create', () => {
    it('should create a purchase order', async () => {
      const createData: CreatePurchaseOrderDto = { supplierId: 's-1', totalAmount: 1000 };
      mockedApi.post.mockResolvedValue({ data: mockOrder });
      const result = await purchaseOrderService.create(createData);
      expect(result).toEqual(mockOrder);
      expect(mockedApi.post).toHaveBeenCalledWith('/purchase-orders', createData);
    });

    it('should throw error with backend message on failure', async () => {
      const axiosError = { response: { data: { message: 'Supplier not found' } } } as any;
      mockedApi.post.mockRejectedValue(axiosError);
      await expect(purchaseOrderService.create({ supplierId: 's-1', totalAmount: 1000 })).rejects.toThrow('Supplier not found');
    });

    it('should throw default error when no message', async () => {
      mockedApi.post.mockRejectedValue(new Error('Network Error'));
      await expect(purchaseOrderService.create({ supplierId: 's-1', totalAmount: 1000 })).rejects.toThrow('Failed to create purchase order');
    });
  });

  describe('getAll', () => {
    it('should fetch all purchase orders', async () => {
      mockedApi.get.mockResolvedValue({ data: [mockOrder] });
      const result = await purchaseOrderService.getAll();
      expect(result).toEqual([mockOrder]);
      expect(mockedApi.get).toHaveBeenCalledWith('/purchase-orders', { params: { status: undefined } });
    });

    it('should fetch purchase orders with status filter', async () => {
      mockedApi.get.mockResolvedValue({ data: [mockOrder] });
      const result = await purchaseOrderService.getAll('pending');
      expect(mockedApi.get).toHaveBeenCalledWith('/purchase-orders', { params: { status: 'pending' } });
    });

    it('should throw error on failure', async () => {
      const axiosError = { response: { data: { message: 'Server error' } } } as any;
      mockedApi.get.mockRejectedValue(axiosError);
      await expect(purchaseOrderService.getAll()).rejects.toThrow('Server error');
    });
  });

  describe('getById', () => {
    it('should fetch a purchase order by id', async () => {
      mockedApi.get.mockResolvedValue({ data: mockOrder });
      const result = await purchaseOrderService.getById('po-1');
      expect(result).toEqual(mockOrder);
      expect(mockedApi.get).toHaveBeenCalledWith('/purchase-orders/po-1');
    });

    it('should throw error when not found', async () => {
      const axiosError = { response: { data: { message: 'Not found' } } } as any;
      mockedApi.get.mockRejectedValue(axiosError);
      await expect(purchaseOrderService.getById('po-999')).rejects.toThrow('Not found');
    });
  });

  describe('update', () => {
    it('should update a purchase order', async () => {
      const updateData: UpdatePurchaseOrderDto = { notes: 'Updated' };
      const updated = { ...mockOrder, notes: 'Updated' };
      mockedApi.patch.mockResolvedValue({ data: updated });
      const result = await purchaseOrderService.update('po-1', updateData);
      expect(result.notes).toBe('Updated');
      expect(mockedApi.patch).toHaveBeenCalledWith('/purchase-orders/po-1', updateData);
    });

    it('should throw error on update failure', async () => {
      const axiosError = { response: { data: { message: 'Update failed' } } } as any;
      mockedApi.patch.mockRejectedValue(axiosError);
      await expect(purchaseOrderService.update('po-1', {})).rejects.toThrow('Update failed');
    });
  });

  describe('markAsReceived', () => {
    it('should mark purchase order as received', async () => {
      const receiveData: ReceivePurchaseOrderDto = { receivedDate: new Date() };
      const received = { ...mockOrder, status: 'received' as const };
      mockedApi.patch.mockResolvedValue({ data: received });
      const result = await purchaseOrderService.markAsReceived('po-1', receiveData);
      expect(result.status).toBe('received');
      expect(mockedApi.patch).toHaveBeenCalledWith('/purchase-orders/po-1/receive', receiveData);
    });

    it('should throw error on receive failure', async () => {
      const axiosError = { response: { data: { message: 'Already received' } } } as any;
      mockedApi.patch.mockRejectedValue(axiosError);
      await expect(purchaseOrderService.markAsReceived('po-1', { receivedDate: new Date() })).rejects.toThrow('Already received');
    });
  });

  describe('cancel', () => {
    it('should cancel a purchase order', async () => {
      const cancelled = { ...mockOrder, status: 'cancelled' as const };
      mockedApi.patch.mockResolvedValue({ data: cancelled });
      const result = await purchaseOrderService.cancel('po-1');
      expect(result.status).toBe('cancelled');
      expect(mockedApi.patch).toHaveBeenCalledWith('/purchase-orders/po-1/cancel');
    });

    it('should throw error on cancel failure', async () => {
      const axiosError = { response: { data: { message: 'Cannot cancel' } } } as any;
      mockedApi.patch.mockRejectedValue(axiosError);
      await expect(purchaseOrderService.cancel('po-1')).rejects.toThrow('Cannot cancel');
    });
  });

  describe('delete', () => {
    it('should delete a purchase order', async () => {
      mockedApi.delete.mockResolvedValue({ data: undefined });
      await purchaseOrderService.delete('po-1');
      expect(mockedApi.delete).toHaveBeenCalledWith('/purchase-orders/po-1');
    });

    it('should throw error on delete failure', async () => {
      const axiosError = { response: { data: { message: 'Cannot delete' } } } as any;
      mockedApi.delete.mockRejectedValue(axiosError);
      await expect(purchaseOrderService.delete('po-1')).rejects.toThrow('Cannot delete');
    });
  });
});
