import api from './api';

export interface InvoiceItem {
  id?: string;
  productId: string;
  quantity: number;
  price: number;
  description?: string;
  total?: number;
  product?: {
    id: string;
    name: string;
    price: number;
  };
}

export interface Invoice {
  id: string;
  clientId: string;
  clientName?: string;
  clientEmail?: string;
  businessId: string;
  status: 'paid' | 'unpaid' | 'overdue';
  totalAmount: number;
  taxAmount: number;
  subtotal: number;
  notes?: string;
  dueDate?: string;
  invoiceNumber: string;
  createdAt: string;
  updatedAt: string;
  items: InvoiceItem[];
  business?: {
    id: string;
    name: string;
    address?: string;
    phone?: string;
  };
}

export interface CreateInvoiceItemDto {
  productId: string;
  quantity: number;
  price: number;
  description?: string;
}

export interface CreateInvoiceDto {
  clientId: string;
  clientName?: string;
  clientEmail?: string;
  status?: 'paid' | 'unpaid' | 'overdue';
  notes?: string;
  dueDate?: string;
  items: CreateInvoiceItemDto[];
}

export interface UpdateInvoiceDto {
  clientId?: string;
  clientName?: string;
  clientEmail?: string;
  status?: 'paid' | 'unpaid' | 'overdue';
  notes?: string;
  dueDate?: string;
}

export interface SendInvoiceEmailDto {
  email: string;
  subject?: string;
  message?: string;
}

export interface ScanInvoiceResponse {
  scanUrl: string;
  aiExtracted: {
    totalAmount: number;
    date: string;
    clientName: string;
    confidence: number;
  };
}

class InvoiceService {
  async getInvoices(): Promise<Invoice[]> {
    const response = await api.get('/invoices');
    return response.data;
  }

  async getInvoice(id: string): Promise<Invoice> {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  }

  async createInvoice(data: CreateInvoiceDto): Promise<Invoice> {
    const response = await api.post('/invoices', data);
    return response.data;
  }

  async updateInvoice(id: string, data: UpdateInvoiceDto): Promise<Invoice> {
    const response = await api.patch(`/invoices/${id}`, data);
    return response.data;
  }

  async updateInvoiceStatus(id: string, status: 'paid' | 'unpaid' | 'overdue'): Promise<Invoice> {
    const response = await api.patch(`/invoices/${id}/status`, { status });
    return response.data;
  }

  async deleteInvoice(id: string): Promise<void> {
    await api.delete(`/invoices/${id}`);
  }

  async downloadPdf(id: string): Promise<Blob> {
    const response = await api.get(`/invoices/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async sendInvoiceEmail(id: string, data: SendInvoiceEmailDto): Promise<{ message: string }> {
    const response = await api.post(`/invoices/${id}/send-email`, data);
    return response.data;
  }

  async uploadScan(file: File): Promise<ScanInvoiceResponse> {
    const formData = new FormData();
    formData.append('document', file);
    
    const response = await api.post('/invoices/upload-scan', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  calculateTotals(items: { quantity: number; price: number }[]): { subtotal: number; taxAmount: number; totalAmount: number } {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const taxAmount = subtotal * 0.0; // Add tax calculation if needed
    const totalAmount = subtotal + taxAmount;
    return { subtotal, taxAmount, totalAmount };
  }
}

export const invoiceService = new InvoiceService();
