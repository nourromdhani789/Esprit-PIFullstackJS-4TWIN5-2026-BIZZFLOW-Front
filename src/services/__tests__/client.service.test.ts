import { clientService, Client, CreateClientDto, UpdateClientDto } from '../client.service';
import api from '../api';

// Mock the api module
jest.mock('../api');

const mockedApi = api as jest.Mocked<typeof api>;

describe('ClientService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getClients', () => {
    it('should fetch all clients successfully', async () => {
      const mockClients: Client[] = [
        {
          id: 'client-1',
          name: 'Client One',
          email: 'client1@test.com',
          phone: '+1234567890',
          address: '123 Test St',
          businessId: 'business-1',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
        {
          id: 'client-2',
          name: 'Client Two',
          email: 'client2@test.com',
          phone: '+0987654321',
          address: '456 Test Ave',
          businessId: 'business-1',
          createdAt: '2024-01-02',
          updatedAt: '2024-01-02',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockClients });

      const result = await clientService.getClients();

      expect(result).toEqual(mockClients);
      expect(result).toHaveLength(2);
      expect(mockedApi.get).toHaveBeenCalledWith('/clients');
    });

    it('should return empty array if no clients', async () => {
      mockedApi.get.mockResolvedValue({ data: [] });

      const result = await clientService.getClients();

      expect(result).toEqual([]);
    });

    it('should call API with correct endpoint', async () => {
      mockedApi.get.mockResolvedValue({ data: [] });
      await clientService.getClients();
      expect(mockedApi.get).toHaveBeenCalledWith('/clients');
    });
  });

  describe('getClient', () => {
    it('should fetch single client by id', async () => {
      const mockClient: Client = {
        id: 'client-1',
        name: 'Test Client',
        email: 'client@test.com',
        phone: '+1234567890',
        address: '123 Test St',
        businessId: 'business-1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      mockedApi.get.mockResolvedValue({ data: mockClient });

      const result = await clientService.getClient('client-1');

      expect(result).toEqual(mockClient);
      expect(mockedApi.get).toHaveBeenCalledWith('/clients/client-1');
    });

    it('should call API with correct endpoint and id', async () => {
      mockedApi.get.mockResolvedValue({ data: { id: 'client-1', name: 'Test' } });
      await clientService.getClient('client-1');
      expect(mockedApi.get).toHaveBeenCalledWith('/clients/client-1');
    });
  });

  describe('createClient', () => {
    const createData: CreateClientDto = {
      name: 'New Client',
      email: 'newclient@test.com',
      phone: '+1234567890',
      address: '789 New Street',
    };

    it('should create client successfully', async () => {
      const createdClient: Client = {
        id: 'new-client-id',
        ...createData,
        businessId: 'business-1',
        createdAt: '2024-01-15',
        updatedAt: '2024-01-15',
      };

      mockedApi.post.mockResolvedValue({ data: createdClient });

      const result = await clientService.createClient(createData);

      expect(result).toEqual(createdClient);
      expect(mockedApi.post).toHaveBeenCalledWith('/clients', createData);
    });

    it('should create client with minimal data', async () => {
      const minimalData: CreateClientDto = {
        name: 'Minimal Client',
      };

      const createdClient: Client = {
        id: 'minimal-id',
        ...minimalData,
        businessId: 'business-1',
        createdAt: '2024-01-15',
        updatedAt: '2024-01-15',
      };

      mockedApi.post.mockResolvedValue({ data: createdClient });

      const result = await clientService.createClient(minimalData);

      expect(result.name).toBe('Minimal Client');
    });

    it('should call API with correct endpoint and data', async () => {
      mockedApi.post.mockResolvedValue({ data: { id: 'new-id', ...createData, businessId: 'biz-1' } });
      await clientService.createClient(createData);
      expect(mockedApi.post).toHaveBeenCalledWith('/clients', createData);
    });
  });

  describe('updateClient', () => {
    const updateData: UpdateClientDto = {
      name: 'Updated Name',
      email: 'updated@test.com',
    };

    it('should update client successfully', async () => {
      const updatedClient: Client = {
        id: 'client-1',
        name: 'Updated Name',
        email: 'updated@test.com',
        phone: '+1234567890',
        address: '123 Test St',
        businessId: 'business-1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-15',
      };

      mockedApi.patch.mockResolvedValue({ data: updatedClient });

      const result = await clientService.updateClient('client-1', updateData);

      expect(result).toEqual(updatedClient);
      expect(mockedApi.patch).toHaveBeenCalledWith('/clients/client-1', updateData);
    });

    it('should update client with partial data', async () => {
      const partialUpdate: UpdateClientDto = {
        phone: '+9999999999',
      };

      const updatedClient: Client = {
        id: 'client-1',
        name: 'Original Name',
        email: 'original@test.com',
        phone: '+9999999999',
        address: '123 Test St',
        businessId: 'business-1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-15',
      };

      mockedApi.patch.mockResolvedValue({ data: updatedClient });

      const result = await clientService.updateClient('client-1', partialUpdate);

      expect(result.phone).toBe('+9999999999');
    });

    it('should call API with correct endpoint and data for update', async () => {
      mockedApi.patch.mockResolvedValue({ data: { id: 'client-1', ...updateData } });
      await clientService.updateClient('client-1', updateData);
      expect(mockedApi.patch).toHaveBeenCalledWith('/clients/client-1', updateData);
    });
  });

  describe('deleteClient', () => {
    it('should delete client successfully', async () => {
      mockedApi.delete.mockResolvedValue({ data: undefined });

      await clientService.deleteClient('client-1');

      expect(mockedApi.delete).toHaveBeenCalledWith('/clients/client-1');
    });

    it('should call API with correct endpoint for delete', async () => {
      mockedApi.delete.mockResolvedValue({ data: undefined });
      await clientService.deleteClient('client-1');
      expect(mockedApi.delete).toHaveBeenCalledWith('/clients/client-1');
    });
  });

  describe('service singleton', () => {
    it('should export singleton instance', () => {
      expect(clientService).toBeDefined();
      expect(typeof clientService.getClients).toBe('function');
      expect(typeof clientService.getClient).toBe('function');
      expect(typeof clientService.createClient).toBe('function');
      expect(typeof clientService.updateClient).toBe('function');
      expect(typeof clientService.deleteClient).toBe('function');
    });
  });

  describe('API integration', () => {
    it('should use correct API endpoints for all operations', async () => {
      mockedApi.get.mockResolvedValue({ data: [] });
      mockedApi.post.mockResolvedValue({ data: {} });
      mockedApi.patch.mockResolvedValue({ data: {} });
      mockedApi.delete.mockResolvedValue({ data: undefined });

      await clientService.getClients();
      expect(mockedApi.get).toHaveBeenCalledWith('/clients');

      await clientService.getClient('client-1');
      expect(mockedApi.get).toHaveBeenCalledWith('/clients/client-1');

      await clientService.createClient({ name: 'Test' });
      expect(mockedApi.post).toHaveBeenCalledWith('/clients', { name: 'Test' });

      await clientService.updateClient('client-1', { name: 'Updated' });
      expect(mockedApi.patch).toHaveBeenCalledWith('/clients/client-1', { name: 'Updated' });

      await clientService.deleteClient('client-1');
      expect(mockedApi.delete).toHaveBeenCalledWith('/clients/client-1');
    });
  });
});
