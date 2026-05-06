import { quoteService, CreateQuoteDto, UpdateQuoteDto, SendQuoteEmailDto } from '../quote.service';
import api from '../api';

jest.mock('../api');

const mockedApi = api as jest.Mocked<typeof api>;

describe('QuoteService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockQuote = {
    id: 'q-1',
    clientId: 'c-1',
    businessId: 'b-1',
    status: 'draft' as const,
    quoteNumber: 'QUO-2024-001',
    issueDate: '2024-01-15',
    expiryDate: '2024-02-15',
    totalAmount: 1000,
    taxAmount: 0,
    subtotal: 1000,
    taxRate: 0,
    notes: 'Test quote',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
    items: [],
  };

  describe('getQuotes', () => {
    it('should fetch all quotes', async () => {
      mockedApi.get.mockResolvedValue({ data: [mockQuote] });
      const result = await quoteService.getQuotes();
      expect(result).toEqual([mockQuote]);
      expect(mockedApi.get).toHaveBeenCalledWith('/quotes');
    });
  });

  describe('getQuote', () => {
    it('should fetch a single quote by id', async () => {
      mockedApi.get.mockResolvedValue({ data: mockQuote });
      const result = await quoteService.getQuote('q-1');
      expect(result).toEqual(mockQuote);
      expect(mockedApi.get).toHaveBeenCalledWith('/quotes/q-1');
    });
  });

  describe('createQuote', () => {
    it('should create a new quote', async () => {
      const createData: CreateQuoteDto = {
        clientId: 'c-1',
        issueDate: '2024-01-15',
        expiryDate: '2024-02-15',
        items: [{ productId: 'p-1', quantity: 2, unitPrice: 500 }],
      };
      mockedApi.post.mockResolvedValue({ data: mockQuote });
      const result = await quoteService.createQuote(createData);
      expect(result).toEqual(mockQuote);
      expect(mockedApi.post).toHaveBeenCalledWith('/quotes', createData);
    });
  });

  describe('updateQuote', () => {
    it('should update a quote', async () => {
      const updateData: UpdateQuoteDto = { notes: 'Updated notes' };
      const updated = { ...mockQuote, notes: 'Updated notes' };
      mockedApi.patch.mockResolvedValue({ data: updated });
      const result = await quoteService.updateQuote('q-1', updateData);
      expect(result.notes).toBe('Updated notes');
      expect(mockedApi.patch).toHaveBeenCalledWith('/quotes/q-1', updateData);
    });
  });

  describe('deleteQuote', () => {
    it('should delete a quote', async () => {
      mockedApi.delete.mockResolvedValue({ data: undefined });
      await quoteService.deleteQuote('q-1');
      expect(mockedApi.delete).toHaveBeenCalledWith('/quotes/q-1');
    });
  });

  describe('markAsSent', () => {
    it('should mark quote as sent', async () => {
      const sent = { ...mockQuote, status: 'sent' as const };
      mockedApi.patch.mockResolvedValue({ data: sent });
      const result = await quoteService.markAsSent('q-1');
      expect(result.status).toBe('sent');
      expect(mockedApi.patch).toHaveBeenCalledWith('/quotes/q-1/send');
    });
  });

  describe('markAsAccepted', () => {
    it('should mark quote as accepted', async () => {
      const accepted = { ...mockQuote, status: 'accepted' as const };
      mockedApi.patch.mockResolvedValue({ data: accepted });
      const result = await quoteService.markAsAccepted('q-1');
      expect(result.status).toBe('accepted');
      expect(mockedApi.patch).toHaveBeenCalledWith('/quotes/q-1/accept');
    });
  });

  describe('markAsRejected', () => {
    it('should mark quote as rejected', async () => {
      const rejected = { ...mockQuote, status: 'rejected' as const };
      mockedApi.patch.mockResolvedValue({ data: rejected });
      const result = await quoteService.markAsRejected('q-1');
      expect(result.status).toBe('rejected');
      expect(mockedApi.patch).toHaveBeenCalledWith('/quotes/q-1/reject');
    });
  });

  describe('duplicateQuote', () => {
    it('should duplicate a quote', async () => {
      const duplicated = { ...mockQuote, id: 'q-2', quoteNumber: 'QUO-2024-002' };
      mockedApi.post.mockResolvedValue({ data: duplicated });
      const result = await quoteService.duplicateQuote('q-1');
      expect(result.id).toBe('q-2');
      expect(mockedApi.post).toHaveBeenCalledWith('/quotes/q-1/duplicate');
    });
  });

  describe('downloadPdf', () => {
    it('should download quote PDF', async () => {
      const blob = new Blob(['pdf'], { type: 'application/pdf' });
      mockedApi.get.mockResolvedValue({ data: blob });
      const result = await quoteService.downloadPdf('q-1');
      expect(result).toBeInstanceOf(Blob);
      expect(mockedApi.get).toHaveBeenCalledWith('/quotes/q-1/pdf', { responseType: 'blob' });
    });
  });

  describe('sendQuoteEmail', () => {
    it('should send quote email', async () => {
      const emailData: SendQuoteEmailDto = { email: 'client@test.com', subject: 'Quote' };
      mockedApi.post.mockResolvedValue({ data: { message: 'Email sent' } });
      const result = await quoteService.sendQuoteEmail('q-1', emailData);
      expect(result.message).toBe('Email sent');
      expect(mockedApi.post).toHaveBeenCalledWith('/quotes/q-1/send-email', emailData);
    });
  });

  describe('convertToSalesOrder', () => {
    it('should convert quote to sales order', async () => {
      mockedApi.post.mockResolvedValue({ data: { id: 'so-1' } });
      const result = await quoteService.convertToSalesOrder('q-1');
      expect(result.id).toBe('so-1');
      expect(mockedApi.post).toHaveBeenCalledWith('/quotes/q-1/convert-to-sales-order');
    });
  });

  describe('convertToInvoice', () => {
    it('should convert quote to invoice', async () => {
      mockedApi.post.mockResolvedValue({ data: { id: 'inv-1' } });
      const result = await quoteService.convertToInvoice('q-1');
      expect(result.id).toBe('inv-1');
      expect(mockedApi.post).toHaveBeenCalledWith('/quotes/q-1/convert-to-invoice');
    });
  });
});
