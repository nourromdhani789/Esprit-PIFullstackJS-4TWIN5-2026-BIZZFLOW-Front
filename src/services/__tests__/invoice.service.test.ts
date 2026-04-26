import { 
  invoiceService, 
  Invoice, 
  CreateInvoiceDto, 
  UpdateInvoiceDto, 
  SendInvoiceEmailDto,
  InvoiceItem
} from '../invoice.service';
import api from '../api';

// Mock the api module
jest.mock('../api');

const mockedApi = api as jest.Mocked<typeof api>;

describe('InvoiceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getInvoices', () => {
    it('should fetch all invoices successfully', async () => {
      const mockInvoices: Invoice[] = [
        {
          id: 'inv-1',
          clientId: 'client-1',
          client: { id: 'client-1', name: 'Client One', email: '', phone: '', address: '' },
          businessId: 'business-1',
          status: 'paid',
          totalAmount: 1000,
          taxAmount: 100,
          subtotal: 900,
          invoiceNumber: 'INV-001',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          items: [],
        },
        {
          id: 'inv-2',
          clientId: 'client-2',
          client: { id: 'client-2', name: 'Client Two', email: '', phone: '', address: '' },
          businessId: 'business-1',
          status: 'unpaid',
          totalAmount: 500,
          taxAmount: 50,
          subtotal: 450,
          invoiceNumber: 'INV-002',
          dueDate: '2024-02-01',
          createdAt: '2024-01-02',
          updatedAt: '2024-01-02',
          items: [],
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockInvoices });

      const result = await invoiceService.getInvoices();

      expect(result).toEqual(mockInvoices);
      expect(result).toHaveLength(2);
      expect(mockedApi.get).toHaveBeenCalledWith('/invoices');
    });

    it('should return empty array if no invoices', async () => {
      mockedApi.get.mockResolvedValue({ data: [] });

      const result = await invoiceService.getInvoices();

      expect(result).toEqual([]);
    });
  });

  describe('getInvoice', () => {
    it('should fetch single invoice by id', async () => {
      const mockInvoice: Invoice = {
        id: 'inv-1',
        clientId: 'client-1',
        client: { id: 'client-1', name: 'Test Client', email: '', phone: '', address: '' },
        businessId: 'business-1',
        status: 'paid',
        totalAmount: 1000,
        taxAmount: 100,
        subtotal: 900,
        invoiceNumber: 'INV-001',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        items: [
          {
            id: 'item-1',
            productId: 'prod-1',
            quantity: 2,
            price: 450,
            description: 'Service',
            total: 900,
          },
        ],
      };

      mockedApi.get.mockResolvedValue({ data: mockInvoice });

      const result = await invoiceService.getInvoice('inv-1');

      expect(result).toEqual(mockInvoice);
      expect(mockedApi.get).toHaveBeenCalledWith('/invoices/inv-1');
    });

    it('should call API with correct endpoint and id', async () => {
      mockedApi.get.mockResolvedValue({ data: { id: 'inv-1', invoiceNumber: 'INV-001' } });
      await invoiceService.getInvoice('inv-1');
      expect(mockedApi.get).toHaveBeenCalledWith('/invoices/inv-1');
    });
  });

  describe('createInvoice', () => {
    const createData: CreateInvoiceDto = {
      clientId: 'client-1',
      status: 'unpaid',
      notes: 'Test invoice',
      dueDate: '2024-02-01',
      items: [
        { productId: 'prod-1', quantity: 2, price: 100, description: 'Item 1' },
        { productId: 'prod-2', quantity: 1, price: 50, description: 'Item 2' },
      ],
    };

    it('should create invoice successfully', async () => {
      const createdInvoice: Invoice = {
        id: 'new-inv-id',
        clientId: 'client-1',
        client: { id: 'client-1', name: 'Test Client', email: '', phone: '', address: '' },
        businessId: 'business-1',
        status: 'unpaid',
        totalAmount: 250,
        taxAmount: 25,
        subtotal: 225,
        notes: 'Test invoice',
        dueDate: '2024-02-01',
        invoiceNumber: 'INV-003',
        createdAt: '2024-01-15',
        updatedAt: '2024-01-15',
        items: [],
      };

      mockedApi.post.mockResolvedValue({ data: createdInvoice });

      const result = await invoiceService.createInvoice(createData);

      expect(result).toEqual(createdInvoice);
      expect(mockedApi.post).toHaveBeenCalledWith('/invoices', createData);
    });

    it('should create invoice with default status', async () => {
      const dataWithoutStatus: CreateInvoiceDto = {
        clientId: 'client-1',
        items: [{ productId: 'prod-1', quantity: 1, price: 100 }],
      };

      const createdInvoice: Invoice = {
        id: 'new-id',
        clientId: 'client-1',
        businessId: 'business-1',
        status: 'unpaid',
        totalAmount: 100,
        taxAmount: 0,
        subtotal: 100,
        invoiceNumber: 'INV-004',
        createdAt: '2024-01-15',
        updatedAt: '2024-01-15',
        items: [],
      };

      mockedApi.post.mockResolvedValue({ data: createdInvoice });

      const result = await invoiceService.createInvoice(dataWithoutStatus);

      expect(result).toBeDefined();
    });

    it('should call API with correct endpoint and data', async () => {
      mockedApi.post.mockResolvedValue({ data: { id: 'new-inv', ...createData } });
      await invoiceService.createInvoice(createData);
      expect(mockedApi.post).toHaveBeenCalledWith('/invoices', createData);
    });
  });

  describe('updateInvoice', () => {
    const updateData: UpdateInvoiceDto = {
      status: 'paid',
      notes: 'Updated notes',
    };

    it('should update invoice successfully', async () => {
      const updatedInvoice: Invoice = {
        id: 'inv-1',
        clientId: 'client-1',
        client: { id: 'client-1', name: 'Test Client', email: '', phone: '', address: '' },
        businessId: 'business-1',
        status: 'paid',
        totalAmount: 1000,
        taxAmount: 100,
        subtotal: 900,
        notes: 'Updated notes',
        invoiceNumber: 'INV-001',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-15',
        items: [],
      };

      mockedApi.patch.mockResolvedValue({ data: updatedInvoice });

      const result = await invoiceService.updateInvoice('inv-1', updateData);

      expect(result).toEqual(updatedInvoice);
      expect(mockedApi.patch).toHaveBeenCalledWith('/invoices/inv-1', updateData);
    });
  });

  describe('updateInvoiceStatus', () => {
    it('should update invoice status to paid', async () => {
      const updatedInvoice: Invoice = {
        id: 'inv-1',
        clientId: 'client-1',
        businessId: 'business-1',
        status: 'paid',
        totalAmount: 1000,
        taxAmount: 100,
        subtotal: 900,
        invoiceNumber: 'INV-001',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-15',
        items: [],
      };

      mockedApi.patch.mockResolvedValue({ data: updatedInvoice });

      const result = await invoiceService.updateInvoiceStatus('inv-1', 'paid');

      expect(result.status).toBe('paid');
      expect(mockedApi.patch).toHaveBeenCalledWith('/invoices/inv-1/status', { status: 'paid' });
    });

    it('should update invoice status to overdue', async () => {
      const updatedInvoice: Invoice = {
        id: 'inv-1',
        clientId: 'client-1',
        businessId: 'business-1',
        status: 'overdue',
        totalAmount: 500,
        taxAmount: 50,
        subtotal: 450,
        invoiceNumber: 'INV-002',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-15',
        items: [],
      };

      mockedApi.patch.mockResolvedValue({ data: updatedInvoice });

      const result = await invoiceService.updateInvoiceStatus('inv-1', 'overdue');

      expect(result.status).toBe('overdue');
    });
  });

  describe('deleteInvoice', () => {
    it('should delete invoice successfully', async () => {
      mockedApi.delete.mockResolvedValue({ data: undefined });

      await invoiceService.deleteInvoice('inv-1');

      expect(mockedApi.delete).toHaveBeenCalledWith('/invoices/inv-1');
    });

    it('should call API with correct endpoint for delete', async () => {
      mockedApi.delete.mockResolvedValue({ data: undefined });
      await invoiceService.deleteInvoice('inv-1');
      expect(mockedApi.delete).toHaveBeenCalledWith('/invoices/inv-1');
    });
  });

  describe('downloadPdf', () => {
    it('should download PDF as blob', async () => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });

      mockedApi.get.mockResolvedValue({ data: mockBlob });

      const result = await invoiceService.downloadPdf('inv-1');

      expect(result).toEqual(mockBlob);
      expect(mockedApi.get).toHaveBeenCalledWith('/invoices/inv-1/pdf', {
        responseType: 'blob',
      });
    });
  });

  describe('sendInvoiceEmail', () => {
    const emailData: SendInvoiceEmailDto = {
      email: 'client@test.com',
      subject: 'Your Invoice',
      message: 'Please find your invoice attached',
    };

    it('should send invoice email successfully', async () => {
      const mockResponse = { message: 'Email sent successfully' };

      mockedApi.post.mockResolvedValue({ data: mockResponse });

      const result = await invoiceService.sendInvoiceEmail('inv-1', emailData);

      expect(result.message).toBe('Email sent successfully');
      expect(mockedApi.post).toHaveBeenCalledWith('/invoices/inv-1/send-email', emailData);
    });

    it('should send email with minimal data', async () => {
      const minimalData: SendInvoiceEmailDto = {
        email: 'client@test.com',
      };

      const mockResponse = { message: 'Email sent successfully' };
      mockedApi.post.mockResolvedValue({ data: mockResponse });

      const result = await invoiceService.sendInvoiceEmail('inv-1', minimalData);

      expect(result).toBeDefined();
    });
  });

  describe('uploadScan', () => {
    it('should upload scanned invoice document', async () => {
      const mockFile = new File(['PDF content'], 'invoice.pdf', { type: 'application/pdf' });
      
      const mockResponse = {
        scanUrl: 'https://example.com/scan/123',
        aiExtracted: {
          totalAmount: 1000,
          date: '2024-01-15',
          clientName: 'Test Client',
          confidence: 0.95,
        },
      };

      mockedApi.post.mockResolvedValue({ data: mockResponse });

      const result = await invoiceService.uploadScan(mockFile);

      expect(result.scanUrl).toBe('https://example.com/scan/123');
      expect(result.aiExtracted.totalAmount).toBe(1000);
      expect(result.aiExtracted.confidence).toBe(0.95);
      expect(mockedApi.post).toHaveBeenCalledWith('/invoices/upload-scan', expect.any(FormData), {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    });

    it('should call API with FormData for file upload', async () => {
      const mockFile = new File(['PDF content'], 'invoice.pdf', { type: 'application/pdf' });
      mockedApi.post.mockResolvedValue({ data: { scanUrl: 'http://example.com/scan.pdf' } });
      await invoiceService.uploadScan(mockFile);
      expect(mockedApi.post).toHaveBeenCalledWith('/invoices/upload-scan', expect.any(FormData), {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    });
  });

  describe('calculateTotals', () => {
    it('should calculate correct totals for items', () => {
      const items: InvoiceItem[] = [
        { productId: 'prod-1', quantity: 2, price: 100 },
        { productId: 'prod-2', quantity: 1, price: 50 },
        { productId: 'prod-3', quantity: 3, price: 25 },
      ];

      const result = invoiceService.calculateTotals(items);

      // (2 * 100) + (1 * 50) + (3 * 25) = 200 + 50 + 75 = 325
      expect(result.subtotal).toBe(325);
      expect(result.taxAmount).toBe(0); // Tax is 0% in the service
      expect(result.totalAmount).toBe(325);
    });

    it('should handle empty items array', () => {
      const result = invoiceService.calculateTotals([]);

      expect(result.subtotal).toBe(0);
      expect(result.taxAmount).toBe(0);
      expect(result.totalAmount).toBe(0);
    });

    it('should handle single item', () => {
      const items: InvoiceItem[] = [
        { productId: 'prod-1', quantity: 5, price: 100 },
      ];

      const result = invoiceService.calculateTotals(items);

      expect(result.subtotal).toBe(500);
      expect(result.totalAmount).toBe(500);
    });

    it('should handle decimal prices', () => {
      const items: InvoiceItem[] = [
        { productId: 'prod-1', quantity: 2, price: 99.99 },
        { productId: 'prod-2', quantity: 1, price: 49.99 },
      ];

      const result = invoiceService.calculateTotals(items);

      // (2 * 99.99) + (1 * 49.99) = 199.98 + 49.99 = 249.97
      expect(result.subtotal).toBe(249.97);
    });
  });

  describe('service singleton', () => {
    it('should export singleton instance', () => {
      expect(invoiceService).toBeDefined();
      expect(typeof invoiceService.getInvoices).toBe('function');
      expect(typeof invoiceService.getInvoice).toBe('function');
      expect(typeof invoiceService.createInvoice).toBe('function');
      expect(typeof invoiceService.updateInvoice).toBe('function');
      expect(typeof invoiceService.updateInvoiceStatus).toBe('function');
      expect(typeof invoiceService.deleteInvoice).toBe('function');
      expect(typeof invoiceService.downloadPdf).toBe('function');
      expect(typeof invoiceService.sendInvoiceEmail).toBe('function');
      expect(typeof invoiceService.uploadScan).toBe('function');
      expect(typeof invoiceService.calculateTotals).toBe('function');
    });
  });
});
