import { businessService, CreateBusinessDto } from '../business.service';
import api from '../api';

jest.mock('../api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('BusinessService', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  const mockBusiness = {
    id: 'b-1', name: 'Test Business', status: 'active', tenantId: 't-1',
    taxRate: 19, createdAt: '2024-01-15T00:00:00Z', updatedAt: '2024-01-15T00:00:00Z',
  };

  describe('getMyBusiness', () => {
    it('should fetch business data', async () => {
      mockedApi.get.mockResolvedValue({ data: mockBusiness });
      const result = await businessService.getMyBusiness();
      expect(result).toEqual(mockBusiness);
      expect(mockedApi.get).toHaveBeenCalledWith('/businesses/my-business');
    });

    it('should convert taxRate to number', async () => {
      mockedApi.get.mockResolvedValue({ data: { ...mockBusiness, taxRate: '19' } });
      const result = await businessService.getMyBusiness();
      expect(result!.taxRate).toBe(19);
      expect(typeof result!.taxRate).toBe('number');
    });

    it('should return null on 404', async () => {
      const err = { response: { status: 404 } } as any;
      mockedApi.get.mockRejectedValue(err);
      const result = await businessService.getMyBusiness();
      expect(result).toBeNull();
    });

    it('should throw with backend message on other errors', async () => {
      const err = { response: { data: { message: 'Unauthorized' }, status: 401 } } as any;
      mockedApi.get.mockRejectedValue(err);
      await expect(businessService.getMyBusiness()).rejects.toThrow('Unauthorized');
    });

    it('should throw default message when no response message', async () => {
      const err = { response: { status: 500 } } as any;
      mockedApi.get.mockRejectedValue(err);
      await expect(businessService.getMyBusiness()).rejects.toThrow('Failed to get business');
    });
  });

  describe('createBusiness', () => {
    it('should create a business', async () => {
      const data: CreateBusinessDto = { name: 'New Business', taxRate: 19 };
      mockedApi.post.mockResolvedValue({ data: mockBusiness });
      const result = await businessService.createBusiness(data);
      expect(result).toEqual(mockBusiness);
      expect(mockedApi.post).toHaveBeenCalledWith('/businesses', data);
    });
    it('should throw on failure', async () => {
      const err = { response: { data: { message: 'Business exists' } } } as any;
      mockedApi.post.mockRejectedValue(err);
      await expect(businessService.createBusiness({ name: 'X' })).rejects.toThrow('Business exists');
    });
    it('should throw default message', async () => {
      mockedApi.post.mockRejectedValue(new Error('fail'));
      await expect(businessService.createBusiness({ name: 'X' })).rejects.toThrow('Failed to create business');
    });
  });

  describe('updateBusiness', () => {
    it('should update a business', async () => {
      const updated = { ...mockBusiness, name: 'Updated' };
      mockedApi.patch.mockResolvedValue({ data: updated });
      const result = await businessService.updateBusiness('b-1', { name: 'Updated' });
      expect(result.name).toBe('Updated');
      expect(mockedApi.patch).toHaveBeenCalledWith('/businesses/b-1', { name: 'Updated' });
    });
    it('should throw on failure', async () => {
      const err = { response: { data: { message: 'Update failed' } } } as any;
      mockedApi.patch.mockRejectedValue(err);
      await expect(businessService.updateBusiness('b-1', {})).rejects.toThrow('Update failed');
    });
  });

  describe('uploadLogo', () => {
    it('should upload a logo', async () => {
      const file = new File(['logo'], 'logo.png', { type: 'image/png' });
      const response = { logoUrl: 'http://example.com/logo.png', message: 'Logo uploaded' };
      mockedApi.post.mockResolvedValue({ data: response });
      const result = await businessService.uploadLogo(file);
      expect(result.logoUrl).toBe('http://example.com/logo.png');
      expect(mockedApi.post).toHaveBeenCalledWith('/businesses/upload-logo', expect.any(FormData), {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    });
    it('should throw on failure', async () => {
      const file = new File(['logo'], 'logo.png', { type: 'image/png' });
      const err = { response: { data: { message: 'File too large' } } } as any;
      mockedApi.post.mockRejectedValue(err);
      await expect(businessService.uploadLogo(file)).rejects.toThrow('File too large');
    });
  });
});
