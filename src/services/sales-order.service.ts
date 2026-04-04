import api from './api';

export interface SalesOrderItem {
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

export interface SalesOrder {
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
  status: 'draft' | 'confirmed' | 'delivered' | 'cancelled';
  salesOrderNumber: string;
  issueDate: string;
  expectedDeliveryDate?: string;
  totalAmount: number;
  taxAmount: number;
  subtotal: number;
  taxRate: number;
  notes?: string;
  sourceQuoteId?: string;
  convertedToInvoiceId?: string;
  createdAt: string;
  updatedAt: string;
  items: SalesOrderItem[];
  business?: {
    id: string;
    name: string;
    address?: string;
    phone?: string;
  };
}

export interface CreateSalesOrderItemDto {
  productId: string;
  quantity: number;
  unitPrice: number;
  description?: string;
}

export interface CreateSalesOrderDto {
  clientId: string;
  status?: 'draft' | 'confirmed' | 'delivered' | 'cancelled';
  notes?: string;
  issueDate: string;
  expectedDeliveryDate?: string;
  sourceQuoteId?: string;
  items: CreateSalesOrderItemDto[];
}

export interface UpdateSalesOrderDto {
  clientId?: string;
  status?: 'draft' | 'confirmed' | 'delivered' | 'cancelled';
  notes?: string;
  issueDate?: string;
  expectedDeliveryDate?: string;
}

export interface SendSalesOrderEmailDto {
  email?: string;
  subject?: string;
  message?: string;
}

class SalesOrderService {
  async getSalesOrders(): Promise<SalesOrder[]> {
    const response = await api.get('/sales-orders');
    return response.data;
  }

  async getSalesOrder(id: string): Promise<SalesOrder> {
    const response = await api.get(`/sales-orders/${id}`);
    return response.data;
  }

  async createSalesOrder(data: CreateSalesOrderDto): Promise<SalesOrder> {
    const response = await api.post('/sales-orders', data);
    return response.data;
  }

  async updateSalesOrder(id: string, data: UpdateSalesOrderDto): Promise<SalesOrder> {
    const response = await api.patch(`/sales-orders/${id}`, data);
    return response.data;
  }

  async deleteSalesOrder(id: string): Promise<void> {
    await api.delete(`/sales-orders/${id}`);
  }

  async confirmOrder(id: string): Promise<SalesOrder> {
    const response = await api.patch(`/sales-orders/${id}/confirm`);
    return response.data;
  }

  async deliverOrder(id: string): Promise<SalesOrder> {
    const response = await api.patch(`/sales-orders/${id}/deliver`);
    return response.data;
  }

  async cancelOrder(id: string): Promise<SalesOrder> {
    const response = await api.patch(`/sales-orders/${id}/cancel`);
    return response.data;
  }

  async duplicateSalesOrder(id: string): Promise<SalesOrder> {
    const response = await api.post(`/sales-orders/${id}/duplicate`);
    return response.data;
  }

  async downloadPdf(id: string): Promise<Blob> {
    const response = await api.get(`/sales-orders/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async sendSalesOrderEmail(id: string, data: SendSalesOrderEmailDto): Promise<{ message: string }> {
    const response = await api.post(`/sales-orders/${id}/send-email`, data);
    return response.data;
  }

  async convertToInvoice(id: string): Promise<any> {
    const response = await api.post(`/sales-orders/${id}/convert-to-invoice`);
    return response.data;
  }
}

export const salesOrderService = new SalesOrderService();
