import api from './api';
import { AxiosError } from 'axios';

export interface PurchaseOrder {
  id: string;
  supplierName: string;
  totalAmount: number;
  status: 'pending' | 'received' | 'cancelled';
  date: string;
  receivedDate?: string;
  notes?: string;
  businessId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseOrderDto {
  supplierId: string;
  totalAmount: number;
  status?: 'pending' | 'received' | 'cancelled';
  date?: Date;
  notes?: string;
}

export interface UpdatePurchaseOrderDto {
  supplierId?: string;
  totalAmount?: number;
  status?: 'pending' | 'received' | 'cancelled';
  notes?: string;
}

export interface ReceivePurchaseOrderDto {
  receivedDate: Date;
  notes?: string;
}

export const purchaseOrderService = {
  async create(data: CreatePurchaseOrderDto): Promise<PurchaseOrder> {
    try {
      const response = await api.post('/purchase-orders', data);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to create purchase order');
    }
  },

  async getAll(status?: string): Promise<PurchaseOrder[]> {
    try {
      const response = await api.get('/purchase-orders', { params: { status } });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to get purchase orders');
    }
  },

  async getById(id: string): Promise<PurchaseOrder> {
    try {
      const response = await api.get(`/purchase-orders/${id}`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to get purchase order');
    }
  },

  async update(id: string, data: UpdatePurchaseOrderDto): Promise<PurchaseOrder> {
    try {
      const response = await api.patch(`/purchase-orders/${id}`, data);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to update purchase order');
    }
  },

  async markAsReceived(id: string, data: ReceivePurchaseOrderDto): Promise<PurchaseOrder> {
    try {
      const response = await api.patch(`/purchase-orders/${id}/receive`, data);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to mark as received');
    }
  },

  async cancel(id: string): Promise<PurchaseOrder> {
    try {
      const response = await api.patch(`/purchase-orders/${id}/cancel`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to cancel purchase order');
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/purchase-orders/${id}`);
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to delete purchase order');
    }
  },
};
