import api from './api';

export interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  receiptUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  supplier?: string;
  description?: string;
  businessId: string;
  createdAt: string;
}

export interface CreateExpenseData {
  amount: number;
  category: string;
  date: string;
  receiptUrl?: string;
  supplier?: string;
  description?: string;
}

export interface UpdateExpenseData {
  amount?: number;
  category?: string;
  date?: string;
  receiptUrl?: string;
  supplier?: string;
  description?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface ScanReceiptResponse {
  receiptUrl: string;
  aiExtracted: {
    amount: number;
    date: string;
    supplier: string;
    confidence: number;
  };
}

export const expenseService = {
  async getExpenses(status?: string): Promise<Expense[]> {
    const params = status ? { status } : {};
    const response = await api.get('/expenses', { params });
    return response.data;
  },

  async getExpense(id: string): Promise<Expense> {
    const response = await api.get(`/expenses/${id}`);
    return response.data;
  },

  async createExpense(data: CreateExpenseData): Promise<Expense> {
    const response = await api.post('/expenses', data);
    return response.data;
  },

  async updateExpense(id: string, data: UpdateExpenseData): Promise<Expense> {
    const response = await api.patch(`/expenses/${id}`, data);
    return response.data;
  },

  async deleteExpense(id: string): Promise<void> {
    await api.delete(`/expenses/${id}`);
  },

  async approveExpense(id: string, status: 'approved' | 'rejected'): Promise<Expense> {
    const response = await api.patch(`/expenses/${id}/approve`, { status });
    return response.data;
  },

  async uploadReceipt(file: File): Promise<ScanReceiptResponse> {
    const formData = new FormData();
    formData.append('receipt', file);
    
    const response = await api.post('/expenses/upload-receipt', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
