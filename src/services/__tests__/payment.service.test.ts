import { paymentService, Payment, Cash, CreatePaymentDto, UpdatePaymentDto, PaymentFilterDto } from '../payment.service';
import api from '../api';

jest.mock('../api');

const mockedApi = api as jest.Mocked<typeof api>;

describe('PaymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('create', () => {
    const createData: CreatePaymentDto = {
      type: 'IN',
      amount: 1000,
      method: 'cash',
      reference: 'INV-001',
      referenceId: 'inv-1',
      referenceType: 'invoice',
      description: 'Payment for invoice INV-001',
      date: new Date('2024-01-15'),
    };

    it('should create payment successfully', async () => {
      const createdPayment: Payment = {
        id: 'pay-1',
        ...createData,
        date: '2024-01-15',
        businessId: 'business-1',
        createdAt: '2024-01-15',
      };

      mockedApi.post.mockResolvedValue({ data: createdPayment });

      const result = await paymentService.create(createData);

      expect(result).toEqual(createdPayment);
      expect(mockedApi.post).toHaveBeenCalledWith('/payments', createData);
    });

    it('should create outgoing payment', async () => {
      const outgoingData: CreatePaymentDto = {
        type: 'OUT',
        amount: 500,
        method: 'bank',
        description: 'Supplier payment',
      };

      const createdPayment: Payment = {
        id: 'pay-2',
        ...outgoingData,
        date: '2024-01-15',
        businessId: 'business-1',
        createdAt: '2024-01-15',
      };

      mockedApi.post.mockResolvedValue({ data: createdPayment });

      const result = await paymentService.create(outgoingData);

      expect(result.type).toBe('OUT');
      expect(result.amount).toBe(500);
    });

    it('should handle error on create failure', async () => {
      const errorMessage = 'Insufficient funds';
      mockedApi.post.mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      await expect(paymentService.create(createData)).rejects.toThrow(errorMessage);
    });

    it('should throw default error when no response message', async () => {
      mockedApi.post.mockRejectedValue(new Error('Network Error'));

      await expect(paymentService.create(createData)).rejects.toThrow('Failed to create payment');
    });
  });

  describe('getAll', () => {
    it('should fetch all payments without filters', async () => {
      const mockPayments: Payment[] = [
        {
          id: 'pay-1',
          type: 'IN',
          amount: 1000,
          method: 'cash',
          reference: 'INV-001',
          date: '2024-01-15',
          businessId: 'business-1',
          createdAt: '2024-01-15',
        },
        {
          id: 'pay-2',
          type: 'OUT',
          amount: 500,
          method: 'bank',
          description: 'Expense payment',
          date: '2024-01-14',
          businessId: 'business-1',
          createdAt: '2024-01-14',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockPayments });

      const result = await paymentService.getAll();

      expect(result).toEqual(mockPayments);
      expect(result).toHaveLength(2);
      expect(mockedApi.get).toHaveBeenCalledWith('/payments', { params: undefined });
    });

    it('should fetch payments with filters', async () => {
      const filters: PaymentFilterDto = {
        type: 'IN',
        method: 'cash',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      const mockPayments: Payment[] = [
        {
          id: 'pay-1',
          type: 'IN',
          amount: 1000,
          method: 'cash',
          date: '2024-01-15',
          businessId: 'business-1',
          createdAt: '2024-01-15',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockPayments });

      const result = await paymentService.getAll(filters);

      expect(result).toEqual(mockPayments);
      expect(mockedApi.get).toHaveBeenCalledWith('/payments', { params: filters });
    });

    it('should handle error on getAll failure', async () => {
      mockedApi.get.mockRejectedValue({
        response: { data: { message: 'Database error' } },
      });

      await expect(paymentService.getAll()).rejects.toThrow('Database error');
    });
  });

  describe('getById', () => {
    it('should fetch payment by id', async () => {
      const mockPayment: Payment = {
        id: 'pay-1',
        type: 'IN',
        amount: 1500,
        method: 'transfer',
        reference: 'INV-002',
        referenceId: 'inv-2',
        referenceType: 'invoice',
        description: 'Invoice payment',
        date: '2024-01-15',
        businessId: 'business-1',
        createdAt: '2024-01-15',
      };

      mockedApi.get.mockResolvedValue({ data: mockPayment });

      const result = await paymentService.getById('pay-1');

      expect(result).toEqual(mockPayment);
      expect(mockedApi.get).toHaveBeenCalledWith('/payments/pay-1');
    });

    it('should handle error on getById failure', async () => {
      mockedApi.get.mockRejectedValue({
        response: { data: { message: 'Payment not found' } },
      });

      await expect(paymentService.getById('pay-999')).rejects.toThrow('Payment not found');
    });
  });

  describe('update', () => {
    const updateData: UpdatePaymentDto = {
      amount: 2000,
      description: 'Updated description',
    };

    it('should update payment successfully', async () => {
      const updatedPayment: Payment = {
        id: 'pay-1',
        type: 'IN',
        amount: 2000,
        method: 'cash',
        description: 'Updated description',
        date: '2024-01-15',
        businessId: 'business-1',
        createdAt: '2024-01-15',
      };

      mockedApi.patch.mockResolvedValue({ data: updatedPayment });

      const result = await paymentService.update('pay-1', updateData);

      expect(result).toEqual(updatedPayment);
      expect(mockedApi.patch).toHaveBeenCalledWith('/payments/pay-1', updateData);
    });

    it('should update payment method', async () => {
      const methodUpdate: UpdatePaymentDto = {
        method: 'card',
      };

      const updatedPayment: Payment = {
        id: 'pay-1',
        type: 'IN',
        amount: 1000,
        method: 'card',
        date: '2024-01-15',
        businessId: 'business-1',
        createdAt: '2024-01-15',
      };

      mockedApi.patch.mockResolvedValue({ data: updatedPayment });

      const result = await paymentService.update('pay-1', methodUpdate);

      expect(result.method).toBe('card');
    });

    it('should handle error on update failure', async () => {
      mockedApi.patch.mockRejectedValue({
        response: { data: { message: 'Update failed' } },
      });

      await expect(paymentService.update('pay-1', updateData)).rejects.toThrow('Update failed');
    });
  });

  describe('delete', () => {
    it('should delete payment successfully', async () => {
      mockedApi.delete.mockResolvedValue({ data: undefined });

      await paymentService.delete('pay-1');

      expect(mockedApi.delete).toHaveBeenCalledWith('/payments/pay-1');
    });

    it('should handle error on delete failure', async () => {
      mockedApi.delete.mockRejectedValue({
        response: { data: { message: 'Cannot delete processed payment' } },
      });

      await expect(paymentService.delete('pay-1')).rejects.toThrow('Cannot delete processed payment');
    });
  });

  describe('getCashBalance', () => {
    it('should return cash balance', async () => {
      mockedApi.get.mockResolvedValue({ data: 5000 });

      const result = await paymentService.getCashBalance();

      expect(result).toBe(5000);
      expect(mockedApi.get).toHaveBeenCalledWith('/cash/balance');
    });

    it('should return zero balance', async () => {
      mockedApi.get.mockResolvedValue({ data: 0 });

      const result = await paymentService.getCashBalance();

      expect(result).toBe(0);
    });

    it('should handle error on getCashBalance failure', async () => {
      mockedApi.get.mockRejectedValue({
        response: { data: { message: 'Cash account not found' } },
      });

      await expect(paymentService.getCashBalance()).rejects.toThrow('Cash account not found');
    });
  });

  describe('getCashDetails', () => {
    it('should return cash details', async () => {
      const mockCash: Cash = {
        id: 'cash-1',
        currentBalance: 10000,
        businessId: 'business-1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-15',
      };

      mockedApi.get.mockResolvedValue({ data: mockCash });

      const result = await paymentService.getCashDetails();

      expect(result).toEqual(mockCash);
      expect(mockedApi.get).toHaveBeenCalledWith('/cash');
    });

    it('should handle error on getCashDetails failure', async () => {
      mockedApi.get.mockRejectedValue({
        response: { data: { message: 'Unauthorized' } },
      });

      await expect(paymentService.getCashDetails()).rejects.toThrow('Unauthorized');
    });
  });

  describe('service singleton', () => {
    it('should export service object with all methods', () => {
      expect(paymentService).toBeDefined();
      expect(typeof paymentService.create).toBe('function');
      expect(typeof paymentService.getAll).toBe('function');
      expect(typeof paymentService.getById).toBe('function');
      expect(typeof paymentService.update).toBe('function');
      expect(typeof paymentService.delete).toBe('function');
      expect(typeof paymentService.getCashBalance).toBe('function');
      expect(typeof paymentService.getCashDetails).toBe('function');
    });
  });

  describe('edge cases', () => {
    it('should handle all payment methods', async () => {
      const methods: Array<'cash' | 'bank' | 'card' | 'check' | 'transfer'> = ['cash', 'bank', 'card', 'check', 'transfer'];
      
      for (const method of methods) {
        const paymentData: CreatePaymentDto = {
          type: 'IN',
          amount: 100,
          method,
        };

        const createdPayment: Payment = {
          id: `pay-${method}`,
          ...paymentData,
          date: '2024-01-15',
          businessId: 'business-1',
          createdAt: '2024-01-15',
        };

        mockedApi.post.mockResolvedValue({ data: createdPayment });

        const result = await paymentService.create(paymentData);
        expect(result.method).toBe(method);
      }
    });

    it('should handle payment with check method', async () => {
      const checkPayment: CreatePaymentDto = {
        type: 'OUT',
        amount: 2500,
        method: 'check',
        reference: 'Check #1234',
        description: 'Rent payment',
      };

      const createdPayment: Payment = {
        id: 'pay-check',
        ...checkPayment,
        date: '2024-01-15',
        businessId: 'business-1',
        createdAt: '2024-01-15',
      };

      mockedApi.post.mockResolvedValue({ data: createdPayment });

      const result = await paymentService.create(checkPayment);

      expect(result.method).toBe('check');
      expect(result.reference).toBe('Check #1234');
    });

    it('should handle large payment amounts', async () => {
      const largePayment: CreatePaymentDto = {
        type: 'IN',
        amount: 1000000,
        method: 'transfer',
      };

      const createdPayment: Payment = {
        id: 'pay-large',
        ...largePayment,
        date: '2024-01-15',
        businessId: 'business-1',
        createdAt: '2024-01-15',
      };

      mockedApi.post.mockResolvedValue({ data: createdPayment });

      const result = await paymentService.create(largePayment);

      expect(result.amount).toBe(1000000);
    });

    it('should handle negative cash balance', async () => {
      mockedApi.get.mockResolvedValue({ data: -500 });

      const result = await paymentService.getCashBalance();

      expect(result).toBe(-500);
    });
  });
});
