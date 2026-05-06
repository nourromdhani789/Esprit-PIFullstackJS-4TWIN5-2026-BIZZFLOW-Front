import { stockMovementService, CreateStockMovementDto } from '../stock-movement.service';
import api from '../api';

jest.mock('../api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('StockMovementService', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  const mockMovement = {
    id: 'sm-1', productId: 'p-1', type: 'IN' as const, quantity: 50,
    reason: 'purchase' as const, date: '2024-01-15', businessId: 'b-1', createdAt: '2024-01-15T00:00:00Z',
  };

  describe('create', () => {
    it('should create a stock movement', async () => {
      const data: CreateStockMovementDto = { productId: 'p-1', type: 'IN', quantity: 50, reason: 'purchase' };
      mockedApi.post.mockResolvedValue({ data: mockMovement });
      const result = await stockMovementService.create(data);
      expect(result).toEqual(mockMovement);
      expect(mockedApi.post).toHaveBeenCalledWith('/stock-movements', data);
    });
    it('should throw with backend message', async () => {
      const err = { response: { data: { message: 'Insufficient stock' } } } as any;
      mockedApi.post.mockRejectedValue(err);
      await expect(stockMovementService.create({ productId: 'p-1', type: 'OUT', quantity: 999, reason: 'sale' })).rejects.toThrow('Insufficient stock');
    });
    it('should throw default message', async () => {
      mockedApi.post.mockRejectedValue(new Error('fail'));
      await expect(stockMovementService.create({ productId: 'p-1', type: 'IN', quantity: 1, reason: 'purchase' })).rejects.toThrow('Failed to create stock movement');
    });
  });

  describe('getAll', () => {
    it('should fetch all stock movements', async () => {
      mockedApi.get.mockResolvedValue({ data: [mockMovement] });
      const result = await stockMovementService.getAll();
      expect(result).toEqual([mockMovement]);
      expect(mockedApi.get).toHaveBeenCalledWith('/stock-movements', { params: undefined });
    });
    it('should fetch with filters', async () => {
      const filters = { type: 'IN' as const, productId: 'p-1' };
      mockedApi.get.mockResolvedValue({ data: [mockMovement] });
      const result = await stockMovementService.getAll(filters);
      expect(mockedApi.get).toHaveBeenCalledWith('/stock-movements', { params: filters });
    });
    it('should throw on failure', async () => {
      const err = { response: { data: { message: 'Server error' } } } as any;
      mockedApi.get.mockRejectedValue(err);
      await expect(stockMovementService.getAll()).rejects.toThrow('Server error');
    });
  });

  describe('getById', () => {
    it('should fetch by id', async () => {
      mockedApi.get.mockResolvedValue({ data: mockMovement });
      const result = await stockMovementService.getById('sm-1');
      expect(result).toEqual(mockMovement);
      expect(mockedApi.get).toHaveBeenCalledWith('/stock-movements/sm-1');
    });
    it('should throw when not found', async () => {
      const err = { response: { data: { message: 'Not found' } } } as any;
      mockedApi.get.mockRejectedValue(err);
      await expect(stockMovementService.getById('sm-999')).rejects.toThrow('Not found');
    });
  });

  describe('getProductHistory', () => {
    it('should fetch product history', async () => {
      mockedApi.get.mockResolvedValue({ data: [mockMovement] });
      const result = await stockMovementService.getProductHistory('p-1');
      expect(result).toEqual([mockMovement]);
      expect(mockedApi.get).toHaveBeenCalledWith('/stock-movements/product/p-1/history');
    });
    it('should throw on failure', async () => {
      const err = { response: { data: { message: 'Product not found' } } } as any;
      mockedApi.get.mockRejectedValue(err);
      await expect(stockMovementService.getProductHistory('p-999')).rejects.toThrow('Product not found');
    });
  });

  describe('getLowStockProducts', () => {
    it('should fetch low stock products', async () => {
      const lowStock = [{ id: 'p-1', name: 'Product A', quantity: 2, minimumStock: 10, price: 100 }];
      mockedApi.get.mockResolvedValue({ data: lowStock });
      const result = await stockMovementService.getLowStockProducts();
      expect(result).toEqual(lowStock);
      expect(mockedApi.get).toHaveBeenCalledWith('/stock-movements/products/low-stock');
    });
    it('should throw on failure', async () => {
      const err = { response: { data: { message: 'Server error' } } } as any;
      mockedApi.get.mockRejectedValue(err);
      await expect(stockMovementService.getLowStockProducts()).rejects.toThrow('Server error');
    });
  });
});
