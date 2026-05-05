import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import ClientList from '../ClientList';
import { clientService } from '../../services/client.service';
import { aiService } from '../../services/ai.service';

// Mock services
jest.mock('../../services/client.service');
jest.mock('../../services/ai.service');

const mockClients = [
  {
    id: '1',
    name: 'Test Client',
    email: 'test@example.com',
    phone: '+1234567890',
    address: '123 Test St',
    totalInvoiced: 1000,
    totalPaid: 500,
    outstandingBalance: 500,
    invoiceCount: 2,
  },
  {
    id: '2',
    name: 'Another Client',
    email: 'another@example.com',
    phone: '+0987654321',
    address: '456 Another St',
    totalInvoiced: 2000,
    totalPaid: 2000,
    outstandingBalance: 0,
    invoiceCount: 1,
  },
];

describe('ClientList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (clientService.getClients as jest.Mock).mockResolvedValue(mockClients);
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <ClientList />
      </BrowserRouter>
    );
  };

  it('should render loading state initially', () => {
    renderComponent();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should render clients list after loading', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Test Client')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Another Client')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('should filter clients by search query', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Test Client')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'Test' } });

    expect(screen.getByText('Test Client')).toBeInTheDocument();
    expect(screen.queryByText('Another Client')).not.toBeInTheDocument();
  });

  it('should filter clients by activity - with invoices', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Test Client')).toBeInTheDocument();
    });

    const filterSelect = screen.getByLabelText(/activity filter/i);
    fireEvent.change(filterSelect, { target: { value: 'with_invoices' } });

    await waitFor(() => {
      expect(screen.getByText('Test Client')).toBeInTheDocument();
      expect(screen.getByText('Another Client')).toBeInTheDocument();
    });
  });

  it('should show add client modal when clicking add button', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Test Client')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /add client/i });
    fireEvent.click(addButton);

    expect(screen.getByText(/add new client/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('should create new client successfully', async () => {
    (clientService.createClient as jest.Mock).mockResolvedValue({
      id: '3',
      name: 'New Client',
      email: 'new@example.com',
    });

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Test Client')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /add client/i });
    fireEvent.click(addButton);

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'New Client' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '+1111111111' } });

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(clientService.createClient).toHaveBeenCalledWith({
        name: 'New Client',
        email: 'new@example.com',
        phone: '+1111111111',
        address: '',
      });
    });
  });

  it('should edit existing client', async () => {
    (clientService.updateClient as jest.Mock).mockResolvedValue({
      ...mockClients[0],
      name: 'Updated Client',
    });

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Test Client')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    fireEvent.click(editButtons[0]);

    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'Updated Client' } });

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(clientService.updateClient).toHaveBeenCalledWith('1', expect.any(Object));
    });
  });

  it('should delete client after confirmation', async () => {
    (clientService.deleteClient as jest.Mock).mockResolvedValue(undefined);
    window.confirm = jest.fn(() => true);

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Test Client')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(clientService.deleteClient).toHaveBeenCalledWith('1');
    });
  });

  it('should format currency correctly', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('TND 1,000.000')).toBeInTheDocument();
      expect(screen.getByText('TND 500.000')).toBeInTheDocument();
    });
  });

  it('should handle error when fetching clients fails', async () => {
    (clientService.getClients as jest.Mock).mockRejectedValue(new Error('Network error'));

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
