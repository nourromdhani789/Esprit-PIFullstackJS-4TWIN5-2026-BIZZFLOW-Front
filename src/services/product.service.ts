import api from './api';

export interface Product {
  id: string;
  name: string;
  price: number;
  category?: string;
  description?: string;
  quantity: number;
  minimumStock?: number;
  usedFor: 'sales' | 'purchases' | 'both';
  productType: 'storable' | 'consumable' | 'service';
  businessId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  name: string;
  price: number;
  category?: string;
  description?: string;
  initialQuantity?: number;
  minimumStock?: number;
  usedFor?: 'sales' | 'purchases' | 'both';
  productType?: 'storable' | 'consumable' | 'service';
}

export interface UpdateProductDto {
  name?: string;
  price?: number;
  category?: string;
  description?: string;
  minimumStock?: number;
  usedFor?: 'sales' | 'purchases' | 'both';
  productType?: 'storable' | 'consumable' | 'service';
}

class ProductService {
  async getProducts(): Promise<Product[]> {
    const response = await api.get('/products');
    return response.data;
  }

  async getProductsForSales(): Promise<Product[]> {
    const response = await api.get('/products/for-sales');
    return response.data;
  }

  async getProductsForPurchases(): Promise<Product[]> {
    const response = await api.get('/products/for-purchases');
    return response.data;
  }

  async getProduct(id: string): Promise<Product> {
    const response = await api.get(`/products/${id}`);
    return response.data;
  }

  async createProduct(data: CreateProductDto): Promise<Product> {
    const response = await api.post('/products', data);
    return response.data;
  }

  async updateProduct(id: string, data: UpdateProductDto): Promise<Product> {
    const response = await api.patch(`/products/${id}`, data);
    return response.data;
  }

  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
  }
}

export const productService = new ProductService();
