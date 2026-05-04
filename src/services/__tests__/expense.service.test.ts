import { expenseService, Expense, CreateExpenseData, UpdateExpenseData } from '../expense.service';
import api from '../api';

jest.mock('../api');

const mockedApi = api as jest.Mocked<typeof api>;

describe('ExpenseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getExpenses', () => {
    it('should fetch all expenses without status filter', async () => {
      const mockExpenses: Expense[] = [
        {
          id: 'exp-1',
          amount: 150.50,
          category: 'Office Supplies',
          date: '2024-01-15',
          status: 'approved',
          description: 'Printer paper',
          businessId: 'business-1',
          createdAt: '2024-01-15',
        },
        {
          id: 'exp-2',
          amount: 500,
          category: 'Travel',
          date: '2024-01-10',
          status: 'pending',
          description: 'Business trip',
          businessId: 'business-1',
          createdAt: '2024-01-10',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockExpenses });

      const result = await expenseService.getExpenses();

      expect(result).toEqual(mockExpenses);
      expect(mockedApi.get).toHaveBeenCalledWith('/expenses', { params: {} });
    });

    it('should fetch expenses with status filter', async () => {
      const mockExpenses: Expense[] = [
        {
          id: 'exp-1',
          amount: 150.50,
          category: 'Office Supplies',
          date: '2024-01-15',
          status: 'pending',
          businessId: 'business-1',
          createdAt: '2024-01-15',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockExpenses });

      const result = await expenseService.getExpenses('pending');

      expect(result).toEqual(mockExpenses);
      expect(mockedApi.get).toHaveBeenCalledWith('/expenses', { params: { status: 'pending' } });
    });

    it('should return empty array if no expenses', async () => {
      mockedApi.get.mockResolvedValue({ data: [] });

      const result = await expenseService.getExpenses();

      expect(result).toEqual([]);
    });
  });

  describe('getExpense', () => {
    it('should fetch single expense by id', async () => {
      const mockExpense: Expense = {
        id: 'exp-1',
        amount: 200,
        category: 'Utilities',
        date: '2024-01-15',
        status: 'approved',
        description: 'Electricity bill',
        supplierId: 'supp-1',
        supplier: {
          id: 'supp-1',
          name: 'Power Company',
          email: 'billing@power.com',
          phone: '+1234567890',
        },
        businessId: 'business-1',
        createdAt: '2024-01-15',
      };

      mockedApi.get.mockResolvedValue({ data: mockExpense });

      const result = await expenseService.getExpense('exp-1');

      expect(result).toEqual(mockExpense);
      expect(mockedApi.get).toHaveBeenCalledWith('/expenses/exp-1');
    });

    it('should handle expense without supplier', async () => {
      const mockExpense: Expense = {
        id: 'exp-1',
        amount: 50,
        category: 'Miscellaneous',
        date: '2024-01-15',
        status: 'approved',
        businessId: 'business-1',
        createdAt: '2024-01-15',
      };

      mockedApi.get.mockResolvedValue({ data: mockExpense });

      const result = await expenseService.getExpense('exp-1');

      expect(result.supplier).toBeUndefined();
    });
  });

  describe('createExpense', () => {
    const createData: CreateExpenseData = {
      amount: 100,
      category: 'Office Supplies',
      date: '2024-01-15',
      description: 'Stationery',
      supplierId: 'supp-1',
    };

    it('should create expense successfully', async () => {
      const createdExpense: Expense = {
        id: 'new-exp-id',
        ...createData,
        status: 'pending',
        businessId: 'business-1',
        createdAt: '2024-01-15',
      };

      mockedApi.post.mockResolvedValue({ data: createdExpense });

      const result = await expenseService.createExpense(createData);

      expect(result).toEqual(createdExpense);
      expect(result.status).toBe('pending');
      expect(mockedApi.post).toHaveBeenCalledWith('/expenses', createData);
    });

    it('should create expense with receipt URL', async () => {
      const dataWithReceipt: CreateExpenseData = {
        amount: 250,
        category: 'Equipment',
        date: '2024-01-15',
        receiptUrl: 'https://example.com/receipt.pdf',
      };

      const createdExpense: Expense = {
        id: 'new-exp-id',
        ...dataWithReceipt,
        status: 'pending',
        businessId: 'business-1',
        createdAt: '2024-01-15',
      };

      mockedApi.post.mockResolvedValue({ data: createdExpense });

      const result = await expenseService.createExpense(dataWithReceipt);

      expect(result.receiptUrl).toBe('https://example.com/receipt.pdf');
    });

    it('should create expense with minimal data', async () => {
      const minimalData: CreateExpenseData = {
        amount: 50,
        category: 'Miscellaneous',
        date: '2024-01-15',
      };

      const createdExpense: Expense = {
        id: 'minimal-id',
        ...minimalData,
        status: 'pending',
        businessId: 'business-1',
        createdAt: '2024-01-15',
      };

      mockedApi.post.mockResolvedValue({ data: createdExpense });

      const result = await expenseService.createExpense(minimalData);

      expect(result.amount).toBe(50);
    });
  });

  describe('updateExpense', () => {
    const updateData: UpdateExpenseData = {
      amount: 150,
      description: 'Updated description',
    };

    it('should update expense successfully', async () => {
      const updatedExpense: Expense = {
        id: 'exp-1',
        amount: 150,
        category: 'Office Supplies',
        date: '2024-01-15',
        status: 'pending',
        description: 'Updated description',
        businessId: 'business-1',
        createdAt: '2024-01-15',
      };

      mockedApi.patch.mockResolvedValue({ data: updatedExpense });

      const result = await expenseService.updateExpense('exp-1', updateData);

      expect(result).toEqual(updatedExpense);
      expect(mockedApi.patch).toHaveBeenCalledWith('/expenses/exp-1', updateData);
    });

    it('should update expense status', async () => {
      const statusUpdate: UpdateExpenseData = {
        status: 'approved',
      };

      const updatedExpense: Expense = {
        id: 'exp-1',
        amount: 100,
        category: 'Office Supplies',
        date: '2024-01-15',
        status: 'approved',
        businessId: 'business-1',
        createdAt: '2024-01-15',
      };

      mockedApi.patch.mockResolvedValue({ data: updatedExpense });

      const result = await expenseService.updateExpense('exp-1', statusUpdate);

      expect(result.status).toBe('approved');
    });
  });

  describe('deleteExpense', () => {
    it('should delete expense successfully', async () => {
      mockedApi.delete.mockResolvedValue({ data: undefined });

      await expenseService.deleteExpense('exp-1');

      expect(mockedApi.delete).toHaveBeenCalledWith('/expenses/exp-1');
    });
  });

  describe('approveExpense', () => {
    it('should approve expense', async () => {
      const approvedExpense: Expense = {
        id: 'exp-1',
        amount: 100,
        category: 'Office Supplies',
        date: '2024-01-15',
        status: 'approved',
        businessId: 'business-1',
        createdAt: '2024-01-15',
      };

      mockedApi.patch.mockResolvedValue({ data: approvedExpense });

      const result = await expenseService.approveExpense('exp-1', 'approved');

      expect(result.status).toBe('approved');
      expect(mockedApi.patch).toHaveBeenCalledWith('/expenses/exp-1/approve', { status: 'approved' });
    });

    it('should reject expense', async () => {
      const rejectedExpense: Expense = {
        id: 'exp-1',
        amount: 1000,
        category: 'Entertainment',
        date: '2024-01-15',
        status: 'rejected',
        businessId: 'business-1',
        createdAt: '2024-01-15',
      };

      mockedApi.patch.mockResolvedValue({ data: rejectedExpense });

      const result = await expenseService.approveExpense('exp-1', 'rejected');

      expect(result.status).toBe('rejected');
      expect(mockedApi.patch).toHaveBeenCalledWith('/expenses/exp-1/approve', { status: 'rejected' });
    });
  });

  describe('uploadReceipt', () => {
    it('should upload receipt file successfully', async () => {
      const mockFile = new File(['receipt content'], 'receipt.pdf', { type: 'application/pdf' });
      const mockResponse = {
        receiptUrl: 'https://example.com/receipts/123.pdf',
        aiExtracted: {
          amount: 150.50,
          date: '2024-01-15',
          supplier: 'Office Depot',
          confidence: 0.95,
        },
      };

      mockedApi.post.mockResolvedValue({ data: mockResponse });

      const result = await expenseService.uploadReceipt(mockFile);

      expect(result.receiptUrl).toBe('https://example.com/receipts/123.pdf');
      expect(result.aiExtracted.amount).toBe(150.50);
      expect(result.aiExtracted.confidence).toBe(0.95);
      expect(mockedApi.post).toHaveBeenCalledWith(
        '/expenses/upload-receipt',
        expect.any(FormData),
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
    });

    it('should handle AI extraction without supplier', async () => {
      const mockFile = new File(['receipt content'], 'receipt.jpg', { type: 'image/jpeg' });
      const mockResponse = {
        receiptUrl: 'https://example.com/receipts/456.jpg',
        aiExtracted: {
          amount: 75.00,
          date: '2024-01-10',
          confidence: 0.88,
        },
      };

      mockedApi.post.mockResolvedValue({ data: mockResponse });

      const result = await expenseService.uploadReceipt(mockFile);

      expect(result.aiExtracted.supplier).toBeUndefined();
    });
  });

  describe('service singleton', () => {
    it('should export service object with all methods', () => {
      expect(expenseService).toBeDefined();
      expect(typeof expenseService.getExpenses).toBe('function');
      expect(typeof expenseService.getExpense).toBe('function');
      expect(typeof expenseService.createExpense).toBe('function');
      expect(typeof expenseService.updateExpense).toBe('function');
      expect(typeof expenseService.deleteExpense).toBe('function');
      expect(typeof expenseService.approveExpense).toBe('function');
      expect(typeof expenseService.uploadReceipt).toBe('function');
    });
  });

  describe('edge cases', () => {
    it('should handle expense with rejected status', async () => {
      const mockExpense: Expense = {
        id: 'exp-1',
        amount: 500,
        category: 'Travel',
        date: '2024-01-15',
        status: 'rejected',
        description: 'Rejected expense',
        businessId: 'business-1',
        createdAt: '2024-01-15',
      };

      mockedApi.get.mockResolvedValue({ data: mockExpense });

      const result = await expenseService.getExpense('exp-1');

      expect(result.status).toBe('rejected');
    });

    it('should handle expense with large amount', async () => {
      const createData: CreateExpenseData = {
        amount: 1000000,
        category: 'Equipment',
        date: '2024-01-15',
        description: 'Major equipment purchase',
      };

      const createdExpense: Expense = {
        id: 'large-exp',
        ...createData,
        status: 'pending',
        businessId: 'business-1',
        createdAt: '2024-01-15',
      };

      mockedApi.post.mockResolvedValue({ data: createdExpense });

      const result = await expenseService.createExpense(createData);

      expect(result.amount).toBe(1000000);
    });

    it('should handle expense with decimal amount', async () => {
      const createData: CreateExpenseData = {
        amount: 99.99,
        category: 'Office Supplies',
        date: '2024-01-15',
      };

      const createdExpense: Expense = {
        id: 'decimal-exp',
        ...createData,
        status: 'pending',
        businessId: 'business-1',
        createdAt: '2024-01-15',
      };

      mockedApi.post.mockResolvedValue({ data: createdExpense });

      const result = await expenseService.createExpense(createData);

      expect(result.amount).toBe(99.99);
    });
  });
});
