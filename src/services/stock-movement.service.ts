import api from './api';
import { AxiosError } from 'axios';

export interface StockMovement {
  id: string;
  productId: string;
  product?: {
    id: string;
    name: string;
  };
  type: 'IN' | 'OUT';
  quantity: number;
  reason: 'purchase' | 'sale' | 'adjustment' | 'return' | 'damage';
  notes?: string;
  date: string;
  businessId: string;
  referenceId?: string;
  createdAt: string;
}

export interface CreateStockMovementDto {
  productId: string;
  type: 'IN' | 'OUT';
  quantity: number;
  reason: 'purchase' | 'sale' | 'adjustment' | 'return' | 'damage';
  notes?: string;
  date?: Date;
  referenceId?: string;
}

export const stockMovementService = {
  async create(data: CreateStockMovementDto): Promise<StockMovement> {
    try {
      const response = await api.post('/stock-movements', data);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to create stock movement');
    }
  },

  async getAll(filters?: { type?: 'IN' | 'OUT'; productId?: string; startDate?: Date; endDate?: Date }): Promise<StockMovement[]> {
    try {
      const response = await api.get('/stock-movements', { params: filters });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to get stock movements');
    }
  },

  async getById(id: string): Promise<StockMovement> {
    try {
      const response = await api.get(`/stock-movements/${id}`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to get stock movement');
    }
  },

  async getProductHistory(productId: string): Promise<StockMovement[]> {
    try {
      const response = await api.get(`/stock-movements/product/${productId}/history`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to get product history');
    }
  },

  async getLowStockProducts(): Promise<Array<{ id: string; name: string; quantity: number; minimumStock: number; price: number }>> {
    try {
      const response = await api.get('/stock-movements/products/low-stock');
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to get low stock products');
    }
  },
};
