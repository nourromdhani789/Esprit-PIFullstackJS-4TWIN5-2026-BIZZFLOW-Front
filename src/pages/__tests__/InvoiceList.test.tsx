import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import InvoiceList from '../InvoiceList';
import { invoiceService } from '../../services/invoice.service';

jest.mock('../../services/invoice.service');

const mockInvoices = [
  {
    id: '1',
    invoiceNumber: 'INV-2024-001',
    clientName: 'Test Client',
    totalAmount: 1190,
    status: 'sent',
    date: '2024-01-15',
    dueDate: '2024-02-15',
  },
  {
    id: '2',
    invoiceNumber: 'INV-2024-002',
    clientName: 'Another Client',
    totalAmount: 2380,
    status: 'paid',
    date: '2024-01-20',
    dueDate: '2024-02-20',
  },
  {
    id: '3',
    invoiceNumber: 'INV-2024-003',
    clientName: 'New Client',
    totalAmount: 500,
    status: 'draft',
    date: '2024-01-25',
    dueDate: '2024-02-25',
  },
];

describe('InvoiceList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (invoiceService.getInvoices as jest.Mock).mockResolvedValue(mockInvoices);
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <InvoiceList />
      </BrowserRouter>
    );
  };

  it('should render invoices list', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('INV-2024-001')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Test Client')).toBeInTheDocument();
    expect(screen.getByText('TND 1,190.000')).toBeInTheDocument();
  });

  it('should filter invoices by status', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('INV-2024-001')).toBeInTheDocument();
    });

    const statusFilter = screen.getByLabelText(/status/i);
    fireEvent.change(statusFilter, { target: { value: 'paid' } });

    expect(screen.queryByText('INV-2024-001')).not.toBeInTheDocument();
    expect(screen.getByText('INV-2024-002')).toBeInTheDocument();
  });

  it('should filter invoices by date range', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('INV-2024-001')).toBeInTheDocument();
    });

    const fromDate = screen.getByLabelText(/from/i);
    fireEvent.change(fromDate, { target: { value: '2024-01-20' } });

    expect(screen.queryByText('INV-2024-001')).not.toBeInTheDocument();
    expect(screen.getByText('INV-2024-002')).toBeInTheDocument();
  });

  it('should navigate to create invoice page', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('INV-2024-001')).toBeInTheDocument();
    });

    const createButton = screen.getByRole('button', { name: /create invoice/i });
    expect(createButton).toBeInTheDocument();
  });

  it('should show invoice actions dropdown', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('INV-2024-001')).toBeInTheDocument();
    });

    const actionButtons = screen.getAllByRole('button', { name: /actions/i });
    fireEvent.click(actionButtons[0]);

    expect(screen.getByText(/view/i)).toBeInTheDocument();
    expect(screen.getByText(/edit/i)).toBeInTheDocument();
    expect(screen.getByText(/download pdf/i)).toBeInTheDocument();
  });

  it('should mark invoice as paid', async () => {
    (invoiceService.updateInvoiceStatus as jest.Mock).mockResolvedValue({
      ...mockInvoices[0],
      status: 'paid',
    });

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('INV-2024-001')).toBeInTheDocument();
    });

    const actionButtons = screen.getAllByRole('button', { name: /actions/i });
    fireEvent.click(actionButtons[0]);

    const markPaidButton = screen.getByText(/mark as paid/i);
    fireEvent.click(markPaidButton);

    await waitFor(() => {
      expect(invoiceService.updateInvoiceStatus).toHaveBeenCalledWith('1', 'paid');
    });
  });

  it('should delete invoice after confirmation', async () => {
    (invoiceService.deleteInvoice as jest.Mock).mockResolvedValue(undefined);
    window.confirm = jest.fn(() => true);

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('INV-2024-001')).toBeInTheDocument();
    });

    const actionButtons = screen.getAllByRole('button', { name: /actions/i });
    fireEvent.click(actionButtons[0]);

    const deleteButton = screen.getByText(/delete/i);
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(invoiceService.deleteInvoice).toHaveBeenCalledWith('1');
    });
  });

  it('should display correct status badges', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('sent')).toBeInTheDocument();
      expect(screen.getByText('paid')).toBeInTheDocument();
      expect(screen.getByText('draft')).toBeInTheDocument();
    });
  });

  it('should calculate totals correctly', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText(/total invoiced/i)).toBeInTheDocument();
      expect(screen.getByText(/total paid/i)).toBeInTheDocument();
      expect(screen.getByText(/outstanding/i)).toBeInTheDocument();
    });
  });
});
