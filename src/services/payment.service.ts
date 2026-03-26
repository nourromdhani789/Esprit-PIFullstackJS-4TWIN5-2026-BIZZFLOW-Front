import api from './api';
import { AxiosError } from 'axios';

export interface Payment {
  id: string;
  type: 'IN' | 'OUT';
  amount: number;
  method: 'cash' | 'bank' | 'card' | 'check' | 'transfer';
  reference?: string;
  referenceId?: string;
  referenceType?: string;
  description?: string;
  date: string;
  businessId: string;
  createdAt: string;
}

export interface Cash {
  id: string;
  currentBalance: number;
  businessId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentDto {
  type: 'IN' | 'OUT';
  amount: number;
  method: 'cash' | 'bank' | 'card' | 'check' | 'transfer';
  reference?: string;
  referenceId?: string;
  referenceType?: string;
  description?: string;
  date?: Date;
}

export interface UpdatePaymentDto {
  type?: 'IN' | 'OUT';
  amount?: number;
  method?: 'cash' | 'bank' | 'card' | 'check' | 'transfer';
  reference?: string;
  description?: string;
}

export interface PaymentFilterDto {
  type?: 'IN' | 'OUT';
  method?: 'cash' | 'bank' | 'card' | 'check' | 'transfer';
  startDate?: Date;
  endDate?: Date;
}

export const paymentService = {
  async create(data: CreatePaymentDto): Promise<Payment> {
    try {
      const response = await api.post('/payments', data);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to create payment');
    }
  },

  async getAll(filters?: PaymentFilterDto): Promise<Payment[]> {
    try {
      const response = await api.get('/payments', { params: filters });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to get payments');
    }
  },

  async getById(id: string): Promise<Payment> {
    try {
      const response = await api.get(`/payments/${id}`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to get payment');
    }
  },

  async update(id: string, data: UpdatePaymentDto): Promise<Payment> {
    try {
      const response = await api.patch(`/payments/${id}`, data);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to update payment');
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/payments/${id}`);
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to delete payment');
    }
  },

  async getCashBalance(): Promise<number> {
    try {
      const response = await api.get('/cash/balance');
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to get cash balance');
    }
  },

  async getCashDetails(): Promise<Cash> {
    try {
      const response = await api.get('/cash');
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to get cash details');
    }
  },
};
