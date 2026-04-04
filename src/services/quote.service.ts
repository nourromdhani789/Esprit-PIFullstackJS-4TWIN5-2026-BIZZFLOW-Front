import api from './api';

export interface QuoteItem {
  id?: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  description?: string;
  total?: number;
  product?: {
    id: string;
    name: string;
    price: number;
  };
}

export interface Quote {
  id: string;
  clientId: string;
  client?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  businessId: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  quoteNumber: string;
  issueDate: string;
  expiryDate: string;
  totalAmount: number;
  taxAmount: number;
  subtotal: number;
  taxRate: number;
  notes?: string;
  convertedToSalesOrderId?: string;
  convertedToInvoiceId?: string;
  createdAt: string;
  updatedAt: string;
  items: QuoteItem[];
  business?: {
    id: string;
    name: string;
    address?: string;
    phone?: string;
  };
}

export interface CreateQuoteItemDto {
  productId: string;
  quantity: number;
  unitPrice: number;
  description?: string;
}

export interface CreateQuoteDto {
  clientId: string;
  status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  notes?: string;
  issueDate: string;
  expiryDate: string;
  items: CreateQuoteItemDto[];
}

export interface UpdateQuoteDto {
  clientId?: string;
  status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  notes?: string;
  issueDate?: string;
  expiryDate?: string;
}

export interface SendQuoteEmailDto {
  email?: string;
  subject?: string;
  message?: string;
}

class QuoteService {
  async getQuotes(): Promise<Quote[]> {
    const response = await api.get('/quotes');
    return response.data;
  }

  async getQuote(id: string): Promise<Quote> {
    const response = await api.get(`/quotes/${id}`);
    return response.data;
  }

  async createQuote(data: CreateQuoteDto): Promise<Quote> {
    const response = await api.post('/quotes', data);
    return response.data;
  }

  async updateQuote(id: string, data: UpdateQuoteDto): Promise<Quote> {
    const response = await api.patch(`/quotes/${id}`, data);
    return response.data;
  }

  async deleteQuote(id: string): Promise<void> {
    await api.delete(`/quotes/${id}`);
  }

  async markAsSent(id: string): Promise<Quote> {
    const response = await api.patch(`/quotes/${id}/send`);
    return response.data;
  }

  async markAsAccepted(id: string): Promise<Quote> {
    const response = await api.patch(`/quotes/${id}/accept`);
    return response.data;
  }

  async markAsRejected(id: string): Promise<Quote> {
    const response = await api.patch(`/quotes/${id}/reject`);
    return response.data;
  }

  async duplicateQuote(id: string): Promise<Quote> {
    const response = await api.post(`/quotes/${id}/duplicate`);
    return response.data;
  }

  async downloadPdf(id: string): Promise<Blob> {
    const response = await api.get(`/quotes/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async sendQuoteEmail(id: string, data: SendQuoteEmailDto): Promise<{ message: string }> {
    const response = await api.post(`/quotes/${id}/send-email`, data);
    return response.data;
  }

  async convertToSalesOrder(id: string): Promise<any> {
    const response = await api.post(`/quotes/${id}/convert-to-sales-order`);
    return response.data;
  }

  async convertToInvoice(id: string): Promise<any> {
    const response = await api.post(`/quotes/${id}/convert-to-invoice`);
    return response.data;
  }
}

export const quoteService = new QuoteService();
