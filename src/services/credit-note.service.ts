import api from './api';
import { AxiosError } from 'axios';

export interface CreditNote {
  id: string;
  clientName: string;
  amount: number;
  reason: string;
  reference?: string;
  date: string;
  status: 'active' | 'used' | 'cancelled';
  businessId: string;
  createdAt: string;
}

export interface CreateCreditNoteDto {
  clientName: string;
  amount: number;
  reason: string;
  reference?: string;
  date?: Date;
}

export interface UpdateCreditNoteDto {
  clientName?: string;
  amount?: number;
  reason?: string;
  reference?: string;
}

export const creditNoteService = {
  async create(data: CreateCreditNoteDto): Promise<CreditNote> {
    try {
      const response = await api.post('/credit-notes', data);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to create credit note');
    }
  },

  async getAll(status?: string): Promise<CreditNote[]> {
    try {
      const response = await api.get('/credit-notes', { params: { status } });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to get credit notes');
    }
  },

  async getById(id: string): Promise<CreditNote> {
    try {
      const response = await api.get(`/credit-notes/${id}`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to get credit note');
    }
  },

  async update(id: string, data: UpdateCreditNoteDto): Promise<CreditNote> {
    try {
      const response = await api.patch(`/credit-notes/${id}`, data);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to update credit note');
    }
  },

  async cancel(id: string): Promise<CreditNote> {
    try {
      const response = await api.patch(`/credit-notes/${id}/cancel`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to cancel credit note');
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/credit-notes/${id}`);
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to delete credit note');
    }
  },
};
