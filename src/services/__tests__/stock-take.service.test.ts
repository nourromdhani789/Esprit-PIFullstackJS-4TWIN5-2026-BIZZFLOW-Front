import { stockTakeService, CreateStockTakeDto, UpdateStockTakeDto, AddStockTakeItemDto, UpdateStockTakeItemDto } from '../stock-take.service';
import api from '../api';

jest.mock('../api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('StockTakeService', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  const mockStockTake = {
    id: 'st-1', name: 'Count 1', description: 'Test', status: 'draft' as const,
    totalProducts: 10, productsCounted: 0, discrepancies: 0,
    businessId: 'b-1', createdAt: '2024-01-15T00:00:00Z', updatedAt: '2024-01-15T00:00:00Z',
  };

  const mockItem = {
    id: 'item-1', stockTakeId: 'st-1', productId: 'p-1', productName: 'Product A',
    systemQuantity: 100, countedQuantity: 95, difference: -5, isAdjusted: false, businessId: 'b-1',
  };

  describe('getAll', () => {
    it('should fetch all stock takes', async () => {
      mockedApi.get.mockResolvedValue({ data: [mockStockTake] });
      const result = await stockTakeService.getAll();
      expect(result).toEqual([mockStockTake]);
      expect(mockedApi.get).toHaveBeenCalledWith('/stock-takes');
    });
  });

  describe('getById', () => {
    it('should fetch stock take with items', async () => {
      mockedApi.get.mockResolvedValue({ data: { stockTake: mockStockTake, items: [mockItem] } });
      const result = await stockTakeService.getById('st-1');
      expect(result.stockTake).toEqual(mockStockTake);
      expect(result.items).toEqual([mockItem]);
      expect(mockedApi.get).toHaveBeenCalledWith('/stock-takes/st-1');
    });
  });

  describe('create', () => {
    it('should create a stock take', async () => {
      const data: CreateStockTakeDto = { name: 'Count 1' };
      mockedApi.post.mockResolvedValue({ data: mockStockTake });
      const result = await stockTakeService.create(data);
      expect(result).toEqual(mockStockTake);
      expect(mockedApi.post).toHaveBeenCalledWith('/stock-takes', data);
    });
  });

  describe('update', () => {
    it('should update a stock take', async () => {
      const data: UpdateStockTakeDto = { name: 'Updated' };
      mockedApi.patch.mockResolvedValue({ data: { ...mockStockTake, name: 'Updated' } });
      const result = await stockTakeService.update('st-1', data);
      expect(result.name).toBe('Updated');
      expect(mockedApi.patch).toHaveBeenCalledWith('/stock-takes/st-1', data);
    });
  });

  describe('start', () => {
    it('should start a stock take', async () => {
      mockedApi.post.mockResolvedValue({ data: { ...mockStockTake, status: 'in_progress' } });
      const result = await stockTakeService.start('st-1');
      expect(result.status).toBe('in_progress');
      expect(mockedApi.post).toHaveBeenCalledWith('/stock-takes/st-1/start');
    });
  });

  describe('addItem', () => {
    it('should add an item to stock take', async () => {
      const data: AddStockTakeItemDto = { productId: 'p-1', countedQuantity: 95 };
      mockedApi.post.mockResolvedValue({ data: mockItem });
      const result = await stockTakeService.addItem('st-1', data);
      expect(result).toEqual(mockItem);
      expect(mockedApi.post).toHaveBeenCalledWith('/stock-takes/st-1/items', data);
    });
  });

  describe('updateItem', () => {
    it('should update a stock take item', async () => {
      const data: UpdateStockTakeItemDto = { countedQuantity: 90 };
      mockedApi.patch.mockResolvedValue({ data: { ...mockItem, countedQuantity: 90 } });
      const result = await stockTakeService.updateItem('item-1', data);
      expect(result.countedQuantity).toBe(90);
      expect(mockedApi.patch).toHaveBeenCalledWith('/stock-takes/items/item-1', data);
    });
  });

  describe('complete', () => {
    it('should complete a stock take with adjust action', async () => {
      mockedApi.post.mockResolvedValue({ data: { stockTake: { ...mockStockTake, status: 'completed' } } });
      const result = await stockTakeService.complete('st-1', 'adjust');
      expect(result.stockTake.status).toBe('completed');
      expect(mockedApi.post).toHaveBeenCalledWith('/stock-takes/st-1/complete', { action: 'adjust' });
    });
    it('should complete with review action by default', async () => {
      mockedApi.post.mockResolvedValue({ data: { stockTake: { ...mockStockTake, status: 'completed' } } });
      await stockTakeService.complete('st-1');
      expect(mockedApi.post).toHaveBeenCalledWith('/stock-takes/st-1/complete', { action: 'review' });
    });
  });

  describe('cancel', () => {
    it('should cancel a stock take', async () => {
      mockedApi.post.mockResolvedValue({ data: { ...mockStockTake, status: 'cancelled' } });
      const result = await stockTakeService.cancel('st-1');
      expect(result.status).toBe('cancelled');
      expect(mockedApi.post).toHaveBeenCalledWith('/stock-takes/st-1/cancel');
    });
  });

  describe('delete', () => {
    it('should delete a stock take', async () => {
      mockedApi.delete.mockResolvedValue({ data: undefined });
      await stockTakeService.delete('st-1');
      expect(mockedApi.delete).toHaveBeenCalledWith('/stock-takes/st-1');
    });
  });
});
