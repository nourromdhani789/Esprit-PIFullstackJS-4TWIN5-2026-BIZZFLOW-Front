import { productService, Product, CreateProductDto, UpdateProductDto } from '../product.service';
import api from '../api';

jest.mock('../api');

const mockedApi = api as jest.Mocked<typeof api>;

describe('ProductService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getProducts', () => {
    it('should fetch all products successfully', async () => {
      const mockProducts: Product[] = [
        {
          id: 'prod-1',
          name: 'Product One',
          price: 100,
          quantity: 50,
          category: 'Electronics',
          description: 'Test product',
          minimumStock: 10,
          usedFor: 'sales',
          productType: 'storable',
          businessId: 'business-1',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
        {
          id: 'prod-2',
          name: 'Product Two',
          price: 200,
          quantity: 30,
          category: 'Furniture',
          usedFor: 'both',
          productType: 'storable',
          businessId: 'business-1',
          createdAt: '2024-01-02',
          updatedAt: '2024-01-02',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockProducts });

      const result = await productService.getProducts();

      expect(result).toEqual(mockProducts);
      expect(result).toHaveLength(2);
      expect(mockedApi.get).toHaveBeenCalledWith('/products');
    });

    it('should return empty array if no products', async () => {
      mockedApi.get.mockResolvedValue({ data: [] });

      const result = await productService.getProducts();

      expect(result).toEqual([]);
    });
  });

  describe('getProductsForSales', () => {
    it('should fetch products for sales', async () => {
      const mockProducts: Product[] = [
        {
          id: 'prod-1',
          name: 'Sales Product',
          price: 100,
          quantity: 50,
          usedFor: 'sales',
          productType: 'storable',
          businessId: 'business-1',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockProducts });

      const result = await productService.getProductsForSales();

      expect(result).toEqual(mockProducts);
      expect(mockedApi.get).toHaveBeenCalledWith('/products/for-sales');
    });
  });

  describe('getProductsForPurchases', () => {
    it('should fetch products for purchases', async () => {
      const mockProducts: Product[] = [
        {
          id: 'prod-1',
          name: 'Purchase Product',
          price: 50,
          quantity: 100,
          usedFor: 'purchases',
          productType: 'storable',
          businessId: 'business-1',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockProducts });

      const result = await productService.getProductsForPurchases();

      expect(result).toEqual(mockProducts);
      expect(mockedApi.get).toHaveBeenCalledWith('/products/for-purchases');
    });
  });

  describe('getProduct', () => {
    it('should fetch single product by id', async () => {
      const mockProduct: Product = {
        id: 'prod-1',
        name: 'Test Product',
        price: 150,
        quantity: 75,
        category: 'Electronics',
        description: 'A test product',
        minimumStock: 20,
        usedFor: 'both',
        productType: 'storable',
        businessId: 'business-1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      mockedApi.get.mockResolvedValue({ data: mockProduct });

      const result = await productService.getProduct('prod-1');

      expect(result).toEqual(mockProduct);
      expect(mockedApi.get).toHaveBeenCalledWith('/products/prod-1');
    });

    it('should call API with correct endpoint and id', async () => {
      mockedApi.get.mockResolvedValue({ data: { id: 'prod-1', name: 'Test' } });
      await productService.getProduct('prod-1');
      expect(mockedApi.get).toHaveBeenCalledWith('/products/prod-1');
    });
  });

  describe('createProduct', () => {
    const createData: CreateProductDto = {
      name: 'New Product',
      price: 99.99,
      category: 'Electronics',
      description: 'New test product',
      initialQuantity: 100,
      minimumStock: 10,
      usedFor: 'sales',
      productType: 'storable',
    };

    it('should create product successfully', async () => {
      const createdProduct: Product = {
        id: 'new-prod-id',
        ...createData,
        quantity: 100,
        businessId: 'business-1',
        createdAt: '2024-01-15',
        updatedAt: '2024-01-15',
      };

      mockedApi.post.mockResolvedValue({ data: createdProduct });

      const result = await productService.createProduct(createData);

      expect(result).toEqual(createdProduct);
      expect(mockedApi.post).toHaveBeenCalledWith('/products', createData);
    });

    it('should create product with minimal data', async () => {
      const minimalData: CreateProductDto = {
        name: 'Minimal Product',
        price: 50,
      };

      const createdProduct: Product = {
        id: 'minimal-id',
        name: 'Minimal Product',
        price: 50,
        quantity: 0,
        usedFor: 'both',
        productType: 'storable',
        businessId: 'business-1',
        createdAt: '2024-01-15',
        updatedAt: '2024-01-15',
      };

      mockedApi.post.mockResolvedValue({ data: createdProduct });

      const result = await productService.createProduct(minimalData);

      expect(result.name).toBe('Minimal Product');
      expect(result.price).toBe(50);
    });

    it('should create service type product', async () => {
      const serviceData: CreateProductDto = {
        name: 'Consulting Service',
        price: 200,
        productType: 'service',
        usedFor: 'sales',
      };

      const createdProduct: Product = {
        id: 'service-id',
        ...serviceData,
        quantity: 0,
        businessId: 'business-1',
        createdAt: '2024-01-15',
        updatedAt: '2024-01-15',
      };

      mockedApi.post.mockResolvedValue({ data: createdProduct });

      const result = await productService.createProduct(serviceData);

      expect(result.productType).toBe('service');
    });
  });

  describe('updateProduct', () => {
    const updateData: UpdateProductDto = {
      name: 'Updated Name',
      price: 149.99,
    };

    it('should update product successfully', async () => {
      const updatedProduct: Product = {
        id: 'prod-1',
        name: 'Updated Name',
        price: 149.99,
        quantity: 50,
        category: 'Electronics',
        usedFor: 'sales',
        productType: 'storable',
        businessId: 'business-1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-15',
      };

      mockedApi.patch.mockResolvedValue({ data: updatedProduct });

      const result = await productService.updateProduct('prod-1', updateData);

      expect(result).toEqual(updatedProduct);
      expect(mockedApi.patch).toHaveBeenCalledWith('/products/prod-1', updateData);
    });

    it('should update product with partial data', async () => {
      const partialUpdate: UpdateProductDto = {
        quantity: 25,
      };

      const updatedProduct: Product = {
        id: 'prod-1',
        name: 'Original Name',
        price: 100,
        quantity: 25,
        usedFor: 'sales',
        productType: 'storable',
        businessId: 'business-1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-15',
      };

      mockedApi.patch.mockResolvedValue({ data: updatedProduct });

      const result = await productService.updateProduct('prod-1', partialUpdate);

      expect(result.quantity).toBe(25);
    });

    it('should update product minimum stock', async () => {
      const stockUpdate: UpdateProductDto = {
        minimumStock: 5,
      };

      const updatedProduct: Product = {
        id: 'prod-1',
        name: 'Test Product',
        price: 100,
        quantity: 50,
        minimumStock: 5,
        usedFor: 'sales',
        productType: 'storable',
        businessId: 'business-1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-15',
      };

      mockedApi.patch.mockResolvedValue({ data: updatedProduct });

      const result = await productService.updateProduct('prod-1', stockUpdate);

      expect(result.minimumStock).toBe(5);
    });
  });

  describe('deleteProduct', () => {
    it('should delete product successfully', async () => {
      mockedApi.delete.mockResolvedValue({ data: undefined });

      await productService.deleteProduct('prod-1');

      expect(mockedApi.delete).toHaveBeenCalledWith('/products/prod-1');
    });

    it('should call API with correct endpoint for delete', async () => {
      mockedApi.delete.mockResolvedValue({ data: undefined });
      await productService.deleteProduct('prod-1');
      expect(mockedApi.delete).toHaveBeenCalledWith('/products/prod-1');
    });
  });

  describe('service singleton', () => {
    it('should export singleton instance', () => {
      expect(productService).toBeDefined();
      expect(typeof productService.getProducts).toBe('function');
      expect(typeof productService.getProductsForSales).toBe('function');
      expect(typeof productService.getProductsForPurchases).toBe('function');
      expect(typeof productService.getProduct).toBe('function');
      expect(typeof productService.createProduct).toBe('function');
      expect(typeof productService.updateProduct).toBe('function');
      expect(typeof productService.deleteProduct).toBe('function');
    });
  });

  describe('API integration', () => {
    it('should use correct API endpoints for all operations', async () => {
      mockedApi.get.mockResolvedValue({ data: [] });
      mockedApi.post.mockResolvedValue({ data: {} });
      mockedApi.patch.mockResolvedValue({ data: {} });
      mockedApi.delete.mockResolvedValue({ data: undefined });

      await productService.getProducts();
      expect(mockedApi.get).toHaveBeenCalledWith('/products');

      await productService.getProductsForSales();
      expect(mockedApi.get).toHaveBeenCalledWith('/products/for-sales');

      await productService.getProductsForPurchases();
      expect(mockedApi.get).toHaveBeenCalledWith('/products/for-purchases');

      await productService.getProduct('prod-1');
      expect(mockedApi.get).toHaveBeenCalledWith('/products/prod-1');

      await productService.createProduct({ name: 'Test', price: 100 });
      expect(mockedApi.post).toHaveBeenCalledWith('/products', { name: 'Test', price: 100 });

      await productService.updateProduct('prod-1', { name: 'Updated' });
      expect(mockedApi.patch).toHaveBeenCalledWith('/products/prod-1', { name: 'Updated' });

      await productService.deleteProduct('prod-1');
      expect(mockedApi.delete).toHaveBeenCalledWith('/products/prod-1');
    });
  });

  describe('edge cases', () => {
    it('should handle product with zero quantity', async () => {
      const mockProduct: Product = {
        id: 'prod-1',
        name: 'Out of Stock Product',
        price: 100,
        quantity: 0,
        usedFor: 'sales',
        productType: 'storable',
        businessId: 'business-1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      mockedApi.get.mockResolvedValue({ data: mockProduct });

      const result = await productService.getProduct('prod-1');

      expect(result.quantity).toBe(0);
    });

    it('should handle consumable product type', async () => {
      const mockProduct: Product = {
        id: 'prod-1',
        name: 'Consumable Product',
        price: 10,
        quantity: 1000,
        usedFor: 'purchases',
        productType: 'consumable',
        businessId: 'business-1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      mockedApi.get.mockResolvedValue({ data: mockProduct });

      const result = await productService.getProduct('prod-1');

      expect(result.productType).toBe('consumable');
    });

    it('should handle decimal prices correctly', async () => {
      const createData: CreateProductDto = {
        name: 'Precise Price Product',
        price: 99.999,
      };

      const createdProduct: Product = {
        id: 'prod-1',
        ...createData,
        quantity: 0,
        usedFor: 'both',
        productType: 'storable',
        businessId: 'business-1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      mockedApi.post.mockResolvedValue({ data: createdProduct });

      const result = await productService.createProduct(createData);

      expect(result.price).toBe(99.999);
    });
  });
});
