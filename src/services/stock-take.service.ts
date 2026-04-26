import api from './api';

export interface StockTake {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
  countDate?: string;
  totalProducts: number;
  productsCounted: number;
  discrepancies: number;
  businessId: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockTakeItem {
  id: string;
  stockTakeId: string;
  productId: string;
  productName: string;
  systemQuantity: number;
  countedQuantity?: number;
  difference: number;
  notes?: string;
  isAdjusted: boolean;
  businessId: string;
}

export interface CreateStockTakeDto {
  name: string;
  description?: string;
  countDate?: Date;
}

export interface UpdateStockTakeDto {
  name?: string;
  description?: string;
  status?: 'draft' | 'in_progress' | 'completed' | 'cancelled';
  countDate?: Date;
}

export interface AddStockTakeItemDto {
  productId: string;
  countedQuantity: number;
  notes?: string;
}

export interface UpdateStockTakeItemDto {
  countedQuantity?: number;
  notes?: string;
}

const stockTakeService = {
  getAll: async (): Promise<StockTake[]> => {
    const response = await api.get('/stock-takes');
    return response.data;
  },

  getById: async (id: string): Promise<{ stockTake: StockTake; items: StockTakeItem[] }> => {
    const response = await api.get(`/stock-takes/${id}`);
    return response.data;
  },

  create: async (dto: CreateStockTakeDto): Promise<StockTake> => {
    const response = await api.post('/stock-takes', dto);
    return response.data;
  },

  update: async (id: string, dto: UpdateStockTakeDto): Promise<StockTake> => {
    const response = await api.patch(`/stock-takes/${id}`, dto);
    return response.data;
  },

  start: async (id: string): Promise<StockTake> => {
    const response = await api.post(`/stock-takes/${id}/start`);
    return response.data;
  },

  addItem: async (stockTakeId: string, dto: AddStockTakeItemDto): Promise<StockTakeItem> => {
    const response = await api.post(`/stock-takes/${stockTakeId}/items`, dto);
    return response.data;
  },

  updateItem: async (itemId: string, dto: UpdateStockTakeItemDto): Promise<StockTakeItem> => {
    const response = await api.patch(`/stock-takes/items/${itemId}`, dto);
    return response.data;
  },

  complete: async (id: string, action: 'adjust' | 'review' = 'review'): Promise<{ stockTake: StockTake }> => {
    const response = await api.post(`/stock-takes/${id}/complete`, { action });
    return response.data;
  },

  cancel: async (id: string): Promise<StockTake> => {
    const response = await api.post(`/stock-takes/${id}/cancel`);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/stock-takes/${id}`);
  },
};

export { stockTakeService };
