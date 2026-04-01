import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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

const getToken = () => localStorage.getItem('access_token');

const stockTakeService = {
  getAll: async (): Promise<StockTake[]> => {
    const response = await axios.get(`${API_URL}/stock-takes`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return response.data;
  },

  getById: async (id: string): Promise<{ stockTake: StockTake; items: StockTakeItem[] }> => {
    const response = await axios.get(`${API_URL}/stock-takes/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return response.data;
  },

  create: async (dto: CreateStockTakeDto): Promise<StockTake> => {
    const response = await axios.post(`${API_URL}/stock-takes`, dto, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return response.data;
  },

  update: async (id: string, dto: UpdateStockTakeDto): Promise<StockTake> => {
    const response = await axios.patch(`${API_URL}/stock-takes/${id}`, dto, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return response.data;
  },

  start: async (id: string): Promise<StockTake> => {
    const response = await axios.post(`${API_URL}/stock-takes/${id}/start`, {}, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return response.data;
  },

  addItem: async (stockTakeId: string, dto: AddStockTakeItemDto): Promise<StockTakeItem> => {
    const response = await axios.post(`${API_URL}/stock-takes/${stockTakeId}/items`, dto, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return response.data;
  },

  updateItem: async (itemId: string, dto: UpdateStockTakeItemDto): Promise<StockTakeItem> => {
    const response = await axios.patch(`${API_URL}/stock-takes/items/${itemId}`, dto, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return response.data;
  },

  complete: async (id: string, action: 'adjust' | 'review' = 'review'): Promise<{ stockTake: StockTake }> => {
    const response = await axios.post(`${API_URL}/stock-takes/${id}/complete`, { action }, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return response.data;
  },

  cancel: async (id: string): Promise<StockTake> => {
    const response = await axios.post(`${API_URL}/stock-takes/${id}/cancel`, {}, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/stock-takes/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },
};

export { stockTakeService };
