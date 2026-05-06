import { creditNoteService, CreateCreditNoteDto, UpdateCreditNoteDto } from '../credit-note.service';
import api from '../api';

jest.mock('../api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('CreditNoteService', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  const mockCreditNote = {
    id: 'cn-1', clientId: 'c-1', clientName: 'Test Client', amount: 500,
    reason: 'returned_goods' as const, date: '2024-01-15', status: 'draft' as const,
    businessId: 'b-1', createdAt: '2024-01-15T00:00:00Z',
  };

  describe('create', () => {
    it('should create a credit note', async () => {
      const data: CreateCreditNoteDto = { clientName: 'Test Client', amount: 500, reason: 'returned_goods' };
      mockedApi.post.mockResolvedValue({ data: mockCreditNote });
      const result = await creditNoteService.create(data);
      expect(result).toEqual(mockCreditNote);
      expect(mockedApi.post).toHaveBeenCalledWith('/credit-notes', data);
    });
    it('should throw with backend message', async () => {
      const err = { response: { data: { message: 'Invalid invoice' } } } as any;
      mockedApi.post.mockRejectedValue(err);
      await expect(creditNoteService.create({ clientName: 'X', amount: 0, reason: 'other' })).rejects.toThrow('Invalid invoice');
    });
    it('should throw default message', async () => {
      mockedApi.post.mockRejectedValue(new Error('fail'));
      await expect(creditNoteService.create({ clientName: 'X', amount: 0, reason: 'other' })).rejects.toThrow('Failed to create credit note');
    });
  });

  describe('getAll', () => {
    it('should fetch all credit notes', async () => {
      mockedApi.get.mockResolvedValue({ data: [mockCreditNote] });
      const result = await creditNoteService.getAll();
      expect(result).toEqual([mockCreditNote]);
      expect(mockedApi.get).toHaveBeenCalledWith('/credit-notes', { params: { status: undefined } });
    });
    it('should fetch with status filter', async () => {
      mockedApi.get.mockResolvedValue({ data: [mockCreditNote] });
      await creditNoteService.getAll('draft');
      expect(mockedApi.get).toHaveBeenCalledWith('/credit-notes', { params: { status: 'draft' } });
    });
    it('should throw on failure', async () => {
      const err = { response: { data: { message: 'Server error' } } } as any;
      mockedApi.get.mockRejectedValue(err);
      await expect(creditNoteService.getAll()).rejects.toThrow('Server error');
    });
  });

  describe('getById', () => {
    it('should fetch by id', async () => {
      mockedApi.get.mockResolvedValue({ data: mockCreditNote });
      const result = await creditNoteService.getById('cn-1');
      expect(result).toEqual(mockCreditNote);
      expect(mockedApi.get).toHaveBeenCalledWith('/credit-notes/cn-1');
    });
    it('should throw when not found', async () => {
      const err = { response: { data: { message: 'Not found' } } } as any;
      mockedApi.get.mockRejectedValue(err);
      await expect(creditNoteService.getById('cn-999')).rejects.toThrow('Not found');
    });
  });

  describe('update', () => {
    it('should update a credit note', async () => {
      const data: UpdateCreditNoteDto = { amount: 600 };
      mockedApi.patch.mockResolvedValue({ data: { ...mockCreditNote, amount: 600 } });
      const result = await creditNoteService.update('cn-1', data);
      expect(result.amount).toBe(600);
      expect(mockedApi.patch).toHaveBeenCalledWith('/credit-notes/cn-1', data);
    });
    it('should throw on failure', async () => {
      const err = { response: { data: { message: 'Update failed' } } } as any;
      mockedApi.patch.mockRejectedValue(err);
      await expect(creditNoteService.update('cn-1', {})).rejects.toThrow('Update failed');
    });
  });

  describe('approve', () => {
    it('should approve a credit note', async () => {
      mockedApi.patch.mockResolvedValue({ data: { ...mockCreditNote, status: 'approved' } });
      const result = await creditNoteService.approve('cn-1');
      expect(result.status).toBe('approved');
      expect(mockedApi.patch).toHaveBeenCalledWith('/credit-notes/cn-1/approve');
    });
    it('should throw on failure', async () => {
      const err = { response: { data: { message: 'Already approved' } } } as any;
      mockedApi.patch.mockRejectedValue(err);
      await expect(creditNoteService.approve('cn-1')).rejects.toThrow('Already approved');
    });
  });

  describe('apply', () => {
    it('should apply a credit note', async () => {
      mockedApi.post.mockResolvedValue({ data: { ...mockCreditNote, status: 'applied' } });
      const result = await creditNoteService.apply('cn-1');
      expect(result.status).toBe('applied');
      expect(mockedApi.post).toHaveBeenCalledWith('/credit-notes/cn-1/apply');
    });
    it('should throw on failure', async () => {
      const err = { response: { data: { message: 'Cannot apply' } } } as any;
      mockedApi.post.mockRejectedValue(err);
      await expect(creditNoteService.apply('cn-1')).rejects.toThrow('Cannot apply');
    });
  });

  describe('refund', () => {
    it('should refund a credit note', async () => {
      mockedApi.post.mockResolvedValue({ data: { ...mockCreditNote, status: 'refunded' } });
      const result = await creditNoteService.refund('cn-1');
      expect(result.status).toBe('refunded');
      expect(mockedApi.post).toHaveBeenCalledWith('/credit-notes/cn-1/refund');
    });
    it('should throw on failure', async () => {
      const err = { response: { data: { message: 'Cannot refund' } } } as any;
      mockedApi.post.mockRejectedValue(err);
      await expect(creditNoteService.refund('cn-1')).rejects.toThrow('Cannot refund');
    });
  });

  describe('cancel', () => {
    it('should cancel a credit note', async () => {
      mockedApi.patch.mockResolvedValue({ data: { ...mockCreditNote, status: 'cancelled' } });
      const result = await creditNoteService.cancel('cn-1');
      expect(result.status).toBe('cancelled');
      expect(mockedApi.patch).toHaveBeenCalledWith('/credit-notes/cn-1/cancel');
    });
    it('should throw on failure', async () => {
      const err = { response: { data: { message: 'Cannot cancel' } } } as any;
      mockedApi.patch.mockRejectedValue(err);
      await expect(creditNoteService.cancel('cn-1')).rejects.toThrow('Cannot cancel');
    });
  });

  describe('delete', () => {
    it('should delete a credit note', async () => {
      mockedApi.delete.mockResolvedValue({ data: undefined });
      await creditNoteService.delete('cn-1');
      expect(mockedApi.delete).toHaveBeenCalledWith('/credit-notes/cn-1');
    });
    it('should throw on failure', async () => {
      const err = { response: { data: { message: 'Cannot delete' } } } as any;
      mockedApi.delete.mockRejectedValue(err);
      await expect(creditNoteService.delete('cn-1')).rejects.toThrow('Cannot delete');
    });
  });
});
