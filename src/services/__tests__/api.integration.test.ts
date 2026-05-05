/**
 * API Integration Tests
 * Tests the integration between frontend services and backend API
 */

import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { authService } from '../auth.service';
import { clientService } from '../client.service';
import { invoiceService } from '../invoice.service';
import { productService } from '../product.service';

// Mock axios for integration tests
const mockAxios = new MockAdapter(axios);

const API_URL = 'http://localhost:3000';

describe('API Integration Tests', () => {
  beforeEach(() => {
    mockAxios.reset();
    localStorage.clear();
  });

  afterAll(() => {
    mockAxios.restore();
  });

  describe('Authentication Flow', () => {
    it('should login and store token', async () => {
      const loginResponse = {
        access_token: 'mock-jwt-token',
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        },
      };

      mockAxios.onPost(`${API_URL}/auth/login`).reply(200, loginResponse);

      const result = await authService.login('test@example.com', 'password123');

      expect(result.access_token).toBe('mock-jwt-token');
      expect(localStorage.getItem('token')).toBe('mock-jwt-token');
    });

    it('should register new user', async () => {
      const registerData = {
        firstName: 'New',
        lastName: 'User',
        email: 'new@example.com',
        password: 'password123',
        roleId: 'business_owner',
      };

      mockAxios.onPost(`${API_URL}/auth/register`).reply(201, {
        message: 'Registration successful',
        userId: '123',
      });

      const result = await authService.register(registerData);

      expect(result.message).toContain('successful');
    });

    it('should logout and clear storage', async () => {
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('user', JSON.stringify({ id: '1' }));

      await authService.logout();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('Client API Integration', () => {
    it('should fetch clients with auth header', async () => {
      localStorage.setItem('token', 'test-token');

      const mockClients = [
        { id: '1', name: 'Client A', email: 'a@test.com' },
        { id: '2', name: 'Client B', email: 'b@test.com' },
      ];

      mockAxios.onGet(`${API_URL}/clients`).reply(200, mockClients);

      const result = await clientService.getClients();

      expect(result).toEqual(mockClients);
      
      // Verify auth header was sent
      const request = mockAxios.history.get[0];
      expect(request.headers?.Authorization).toBe('Bearer test-token');
    });

    it('should create client with correct data', async () => {
      localStorage.setItem('token', 'test-token');

      const newClient = {
        name: 'New Client',
        email: 'new@example.com',
        phone: '+1234567890',
        address: '123 Test St',
      };

      mockAxios.onPost(`${API_URL}/clients`).reply(201, {
        id: '3',
        ...newClient,
      });

      const result = await clientService.createClient(newClient);

      expect(result.name).toBe('New Client');
      
      // Verify request body
      const request = mockAxios.history.post[0];
      expect(JSON.parse(request.data)).toEqual(newClient);
    });

    it('should handle 401 unauthorized', async () => {
      mockAxios.onGet(`${API_URL}/clients`).reply(401, {
        message: 'Unauthorized',
      });

      await expect(clientService.getClients()).rejects.toThrow();
    });

    it('should handle 500 server error', async () => {
      mockAxios.onGet(`${API_URL}/clients`).reply(500, {
        message: 'Internal Server Error',
      });

      await expect(clientService.getClients()).rejects.toThrow();
    });
  });

  describe('Invoice API Integration', () => {
    it('should create invoice with items', async () => {
      localStorage.setItem('token', 'test-token');

      const invoiceData = {
        clientId: '1',
        items: [
          { productId: '1', quantity: 2, price: 100, description: 'Item 1' },
          { productId: '2', quantity: 1, price: 200, description: 'Item 2' },
        ],
        dueDate: '2024-12-31',
        notes: 'Test invoice',
      };

      mockAxios.onPost(`${API_URL}/invoices`).reply(201, {
        id: '1',
        invoiceNumber: 'INV-2024-001',
        totalAmount: 400,
        ...invoiceData,
      });

      const result = await invoiceService.createInvoice(invoiceData);

      expect(result.invoiceNumber).toBe('INV-2024-001');
      expect(result.totalAmount).toBe(400);
    });

    it('should update invoice status', async () => {
      localStorage.setItem('token', 'test-token');

      mockAxios.onPatch(`${API_URL}/invoices/1/status`).reply(200, {
        id: '1',
        status: 'paid',
      });

      const result = await invoiceService.updateInvoiceStatus('1', 'paid');

      expect(result.status).toBe('paid');
      
      // Verify request
      const request = mockAxios.history.patch[0];
      expect(JSON.parse(request.data)).toEqual({ status: 'paid' });
    });

    it('should download PDF invoice', async () => {
      localStorage.setItem('token', 'test-token');

      const pdfBlob = new Blob(['pdf-content'], { type: 'application/pdf' });
      mockAxios.onGet(`${API_URL}/invoices/1/pdf`).reply(200, pdfBlob, {
        'content-type': 'application/pdf',
      });

      const result = await invoiceService.downloadPdf('1');

      expect(result).toBeInstanceOf(Blob);
    });
  });

  describe('Product API Integration', () => {
    it('should update product stock', async () => {
      localStorage.setItem('token', 'test-token');

      mockAxios.onPatch(`${API_URL}/products/1`).reply(200, {
        id: '1',
        name: 'Product A',
        quantity: 75,
      });

      const result = await productService.updateProduct('1', { quantity: 75 });

      expect(result.quantity).toBe(75);
    });

    it('should get products for sales', async () => {
      localStorage.setItem('token', 'test-token');

      const products = [
        { id: '1', name: 'Product A', price: 100, quantity: 50 },
        { id: '2', name: 'Product B', price: 200, quantity: 30 },
      ];

      mockAxios.onGet(`${API_URL}/products/for-sales`).reply(200, products);

      const result = await productService.getProductsForSales();

      expect(result).toEqual(products);
    });
  });

  describe('Error Handling', () => {
    it('should retry on network error', async () => {
      localStorage.setItem('token', 'test-token');

      // First call fails, second succeeds
      mockAxios
        .onGet(`${API_URL}/clients`)
        .replyOnce(500)
        .onGet(`${API_URL}/clients`)
        .replyOnce(200, []);

      // Note: Actual retry logic would need to be implemented in the service
      const result = await clientService.getClients();
      expect(result).toEqual([]);
    });

    it('should handle timeout', async () => {
      localStorage.setItem('token', 'test-token');

      mockAxios.onGet(`${API_URL}/clients`).timeout();

      await expect(clientService.getClients()).rejects.toThrow();
    });
  });
});
