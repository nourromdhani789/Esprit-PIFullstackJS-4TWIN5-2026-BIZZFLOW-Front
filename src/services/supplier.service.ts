import api from './api';

export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  businessId: string;
  createdAt: string;
  updatedAt: string;
  // Computed fields
  totalPurchased?: number;
  totalPaid?: number;
  outstandingBalance?: number;
  expenseCount?: number;
  orderCount?: number;
}

export interface CreateSupplierDto {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface UpdateSupplierDto {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface SupplierProfile {
  supplier: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    createdAt: string;
  };
  stats: {
    totalPurchased: number;
    totalPaid: number;
    outstandingBalance: number;
    orderCount: number;
    expenseCount: number;
  };
  purchaseOrders: Array<{
    id: string;
    orderNumber: string;
    date: string;
    totalAmount: number;
    status: string;
    itemCount: number;
    supplierName: string;
  }>;
  expenses: Array<{
    id: string;
    date: string;
    amount: number;
    category: string;
    status: string;
    reference: string;
    receiptUrl?: string;
  }>;
  payments: Array<{
    id: string;
    date: string;
    amount: number;
    method: string;
    reference: string;
  }>;
}

class SupplierService {
  async getSuppliers(): Promise<Supplier[]> {
    const response = await api.get('/suppliers');
    return response.data;
  }

  async getSupplier(id: string): Promise<Supplier> {
    const response = await api.get(`/suppliers/${id}`);
    return response.data;
  }

  async getSupplierProfile(id: string): Promise<SupplierProfile> {
    const response = await api.get(`/suppliers/${id}/profile`);
    return response.data;
  }

  async createSupplier(data: CreateSupplierDto): Promise<Supplier> {
    const response = await api.post('/suppliers', data);
    return response.data;
  }

  async updateSupplier(id: string, data: UpdateSupplierDto): Promise<Supplier> {
    const response = await api.patch(`/suppliers/${id}`, data);
    return response.data;
  }

  async deleteSupplier(id: string): Promise<void> {
    await api.delete(`/suppliers/${id}`);
  }
}

export const supplierService = new SupplierService();
