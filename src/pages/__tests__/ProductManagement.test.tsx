import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import ProductManagement from '../ProductManagement';
import { productService } from '../../services/product.service';

jest.mock('../../services/product.service');

const mockProducts = [
  {
    id: '1',
    name: 'Product A',
    description: 'Description A',
    price: 100,
    quantity: 50,
    productType: 'storable',
    minimumStock: 10,
  },
  {
    id: '2',
    name: 'Product B',
    description: 'Description B',
    price: 200,
    quantity: 5,
    productType: 'storable',
    minimumStock: 10,
  },
  {
    id: '3',
    name: 'Service C',
    description: 'Description C',
    price: 300,
    quantity: 0,
    productType: 'service',
    minimumStock: 0,
  },
];

describe('ProductManagement Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (productService.getProducts as jest.Mock).mockResolvedValue(mockProducts);
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <ProductManagement />
      </BrowserRouter>
    );
  };

  it('should render products list', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Product A')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Product B')).toBeInTheDocument();
    expect(screen.getByText('TND 100.000')).toBeInTheDocument();
  });

  it('should show low stock warning', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Product B')).toBeInTheDocument();
    });

    const lowStockBadge = screen.getByText(/low stock/i);
    expect(lowStockBadge).toBeInTheDocument();
  });

  it('should filter by product type', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Product A')).toBeInTheDocument();
    });

    const typeFilter = screen.getByLabelText(/type/i);
    fireEvent.change(typeFilter, { target: { value: 'service' } });

    expect(screen.queryByText('Product A')).not.toBeInTheDocument();
    expect(screen.getByText('Service C')).toBeInTheDocument();
  });

  it('should filter by stock status', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Product A')).toBeInTheDocument();
    });

    const stockFilter = screen.getByLabelText(/stock status/i);
    fireEvent.change(stockFilter, { target: { value: 'low' } });

    expect(screen.getByText('Product B')).toBeInTheDocument();
    expect(screen.queryByText('Product A')).not.toBeInTheDocument();
  });

  it('should create new product', async () => {
    (productService.createProduct as jest.Mock).mockResolvedValue({
      id: '4',
      name: 'New Product',
      price: 150,
    });

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Product A')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /add product/i });
    fireEvent.click(addButton);

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'New Product' } });
    fireEvent.change(screen.getByLabelText(/price/i), { target: { value: '150' } });
    fireEvent.change(screen.getByLabelText(/quantity/i), { target: { value: '100' } });

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(productService.createProduct).toHaveBeenCalledWith(expect.objectContaining({
        name: 'New Product',
        price: 150,
      }));
    });
  });

  it('should update product quantity', async () => {
    (productService.updateProduct as jest.Mock).mockResolvedValue({
      ...mockProducts[0],
      quantity: 75,
    });

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Product A')).toBeInTheDocument();
    });

    const adjustButtons = screen.getAllByRole('button', { name: /adjust/i });
    fireEvent.click(adjustButtons[0]);

    const quantityInput = screen.getByLabelText(/new quantity/i);
    fireEvent.change(quantityInput, { target: { value: '75' } });

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(productService.updateProduct).toHaveBeenCalledWith('1', expect.any(Object));
    });
  });

  it('should delete product after confirmation', async () => {
    (productService.deleteProduct as jest.Mock).mockResolvedValue(undefined);
    window.confirm = jest.fn(() => true);

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Product A')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(productService.deleteProduct).toHaveBeenCalledWith('1');
    });
  });

  it('should display product type badges', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('storable')).toBeInTheDocument();
      expect(screen.getByText('service')).toBeInTheDocument();
    });
  });

  it('should search products by name', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Product A')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'Product B' } });

    expect(screen.queryByText('Product A')).not.toBeInTheDocument();
    expect(screen.getByText('Product B')).toBeInTheDocument();
  });
});
