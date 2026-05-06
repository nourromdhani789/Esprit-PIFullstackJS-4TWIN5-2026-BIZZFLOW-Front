import { salesOrderService, CreateSalesOrderDto, UpdateSalesOrderDto, SendSalesOrderEmailDto } from '../sales-order.service';
import api from '../api';

jest.mock('../api');

const mockedApi = api as jest.Mocked<typeof api>;

describe('SalesOrderService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockOrder = {
    id: 'so-1',
    clientId: 'c-1',
    businessId: 'b-1',
    status: 'draft' as const,
    salesOrderNumber: 'SO-2024-001',
    issueDate: '2024-01-15',
    totalAmount: 2000,
    taxAmount: 0,
    subtotal: 2000,
    taxRate: 0,
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
    items: [],
  };

  describe('getSalesOrders', () => {
    it('should fetch all sales orders', async () => {
      mockedApi.get.mockResolvedValue({ data: [mockOrder] });
      const result = await salesOrderService.getSalesOrders();
      expect(result).toEqual([mockOrder]);
      expect(mockedApi.get).toHaveBeenCalledWith('/sales-orders');
    });
  });

  describe('getSalesOrder', () => {
    it('should fetch a single sales order', async () => {
      mockedApi.get.mockResolvedValue({ data: mockOrder });
      const result = await salesOrderService.getSalesOrder('so-1');
      expect(result).toEqual(mockOrder);
      expect(mockedApi.get).toHaveBeenCalledWith('/sales-orders/so-1');
    });
  });

  describe('createSalesOrder', () => {
    it('should create a sales order', async () => {
      const createData: CreateSalesOrderDto = {
        clientId: 'c-1',
        issueDate: '2024-01-15',
        items: [{ productId: 'p-1', quantity: 2, unitPrice: 1000 }],
      };
      mockedApi.post.mockResolvedValue({ data: mockOrder });
      const result = await salesOrderService.createSalesOrder(createData);
      expect(result).toEqual(mockOrder);
      expect(mockedApi.post).toHaveBeenCalledWith('/sales-orders', createData);
    });
  });

  describe('updateSalesOrder', () => {
    it('should update a sales order', async () => {
      const updateData: UpdateSalesOrderDto = { notes: 'Updated' };
      const updated = { ...mockOrder, notes: 'Updated' };
      mockedApi.patch.mockResolvedValue({ data: updated });
      const result = await salesOrderService.updateSalesOrder('so-1', updateData);
      expect(result.notes).toBe('Updated');
      expect(mockedApi.patch).toHaveBeenCalledWith('/sales-orders/so-1', updateData);
    });
  });

  describe('deleteSalesOrder', () => {
    it('should delete a sales order', async () => {
      mockedApi.delete.mockResolvedValue({ data: undefined });
      await salesOrderService.deleteSalesOrder('so-1');
      expect(mockedApi.delete).toHaveBeenCalledWith('/sales-orders/so-1');
    });
  });

  describe('confirmOrder', () => {
    it('should confirm a sales order', async () => {
      const confirmed = { ...mockOrder, status: 'confirmed' as const };
      mockedApi.patch.mockResolvedValue({ data: confirmed });
      const result = await salesOrderService.confirmOrder('so-1');
      expect(result.status).toBe('confirmed');
      expect(mockedApi.patch).toHaveBeenCalledWith('/sales-orders/so-1/confirm');
    });
  });

  describe('deliverOrder', () => {
    it('should deliver a sales order', async () => {
      const delivered = { ...mockOrder, status: 'delivered' as const };
      mockedApi.patch.mockResolvedValue({ data: delivered });
      const result = await salesOrderService.deliverOrder('so-1');
      expect(result.status).toBe('delivered');
      expect(mockedApi.patch).toHaveBeenCalledWith('/sales-orders/so-1/deliver');
    });
  });

  describe('cancelOrder', () => {
    it('should cancel a sales order', async () => {
      const cancelled = { ...mockOrder, status: 'cancelled' as const };
      mockedApi.patch.mockResolvedValue({ data: cancelled });
      const result = await salesOrderService.cancelOrder('so-1');
      expect(result.status).toBe('cancelled');
      expect(mockedApi.patch).toHaveBeenCalledWith('/sales-orders/so-1/cancel');
    });
  });

  describe('duplicateSalesOrder', () => {
    it('should duplicate a sales order', async () => {
      const duplicated = { ...mockOrder, id: 'so-2' };
      mockedApi.post.mockResolvedValue({ data: duplicated });
      const result = await salesOrderService.duplicateSalesOrder('so-1');
      expect(result.id).toBe('so-2');
      expect(mockedApi.post).toHaveBeenCalledWith('/sales-orders/so-1/duplicate');
    });
  });

  describe('downloadPdf', () => {
    it('should download sales order PDF', async () => {
      const blob = new Blob(['pdf'], { type: 'application/pdf' });
      mockedApi.get.mockResolvedValue({ data: blob });
      const result = await salesOrderService.downloadPdf('so-1');
      expect(result).toBeInstanceOf(Blob);
      expect(mockedApi.get).toHaveBeenCalledWith('/sales-orders/so-1/pdf', { responseType: 'blob' });
    });
  });

  describe('sendSalesOrderEmail', () => {
    it('should send sales order email', async () => {
      const emailData: SendSalesOrderEmailDto = { email: 'client@test.com' };
      mockedApi.post.mockResolvedValue({ data: { message: 'Email sent' } });
      const result = await salesOrderService.sendSalesOrderEmail('so-1', emailData);
      expect(result.message).toBe('Email sent');
      expect(mockedApi.post).toHaveBeenCalledWith('/sales-orders/so-1/send-email', emailData);
    });
  });

  describe('convertToInvoice', () => {
    it('should convert sales order to invoice', async () => {
      mockedApi.post.mockResolvedValue({ data: { id: 'inv-1' } });
      const result = await salesOrderService.convertToInvoice('so-1');
      expect(result.id).toBe('inv-1');
      expect(mockedApi.post).toHaveBeenCalledWith('/sales-orders/so-1/convert-to-invoice');
    });
  });
});
