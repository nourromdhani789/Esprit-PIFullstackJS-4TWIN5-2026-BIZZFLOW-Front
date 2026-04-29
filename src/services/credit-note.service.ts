import api from './api';

export interface CreditNote {
  id: string;
  clientId?: string;
  clientName: string;
  amount: number;
  reason: 'returned_goods' | 'pricing_error' | 'product_expired_or_damaged' | 'service_not_delivered' | 'partial_refund' | 'other';
  reasonDetails?: string;
  reference?: string;
  invoiceId?: string;
  invoice?: {
    id: string;
    invoiceNumber: string;
    client?: { name: string };
  };
  date: string;
  status: 'draft' | 'approved' | 'applied' | 'refunded' | 'cancelled';
  businessId: string;
  createdAt: string;
}

export interface CreateCreditNoteDto {
  clientId?: string;
  clientName: string;
  amount: number;
  reason: 'returned_goods' | 'pricing_error' | 'product_expired_or_damaged' | 'service_not_delivered' | 'partial_refund' | 'other';
  reasonDetails?: string;
  reference?: string;
  invoiceId?: string;
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
      const axiosError = error as any;
      throw new Error(axiosError.response?.data?.message || 'Failed to create credit note');
    }
  },

  async getAll(status?: string): Promise<CreditNote[]> {
    try {
      const response = await api.get('/credit-notes', { params: { status } });
      return response.data;
    } catch (error) {
      const axiosError = error as any;
      throw new Error(axiosError.response?.data?.message || 'Failed to get credit notes');
    }
  },

  async getById(id: string): Promise<CreditNote> {
    try {
      const response = await api.get(`/credit-notes/${id}`);
      return response.data;
    } catch (error) {
      const axiosError = error as any;
      throw new Error(axiosError.response?.data?.message || 'Failed to get credit note');
    }
  },

  async update(id: string, data: UpdateCreditNoteDto): Promise<CreditNote> {
    try {
      const response = await api.patch(`/credit-notes/${id}`, data);
      return response.data;
    } catch (error) {
      const axiosError = error as any;
      throw new Error(axiosError.response?.data?.message || 'Failed to update credit note');
    }
  },

  async approve(id: string): Promise<CreditNote> {
    try {
      const response = await api.patch(`/credit-notes/${id}/approve`);
      return response.data;
    } catch (error) {
      const axiosError = error as any;
      throw new Error(axiosError.response?.data?.message || 'Failed to approve credit note');
    }
  },

  async apply(id: string): Promise<CreditNote> {
    try {
      const response = await api.post(`/credit-notes/${id}/apply`);
      return response.data;
    } catch (error) {
      const axiosError = error as any;
      throw new Error(axiosError.response?.data?.message || 'Failed to apply credit note');
    }
  },

  async refund(id: string): Promise<CreditNote> {
    try {
      const response = await api.post(`/credit-notes/${id}/refund`);
      return response.data;
    } catch (error) {
      const axiosError = error as any;
      throw new Error(axiosError.response?.data?.message || 'Failed to refund credit note');
    }
  },

  async cancel(id: string): Promise<CreditNote> {
    try {
      const response = await api.patch(`/credit-notes/${id}/cancel`);
      return response.data;
    } catch (error) {
      const axiosError = error as any;
      throw new Error(axiosError.response?.data?.message || 'Failed to cancel credit note');
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/credit-notes/${id}`);
    } catch (error) {
      const axiosError = error as any;
      throw new Error(axiosError.response?.data?.message || 'Failed to delete credit note');
    }
  },
};
