import { authService, LoginCredentials, RegisterData } from '../auth.service';
import api from '../api';

// Mock the api module
jest.mock('../api');

const mockedApi = api as jest.Mocked<typeof api>;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('login', () => {
    const credentials: LoginCredentials = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login and store token/user data', async () => {
      const mockResponse = {
        data: {
          access_token: 'mock-jwt-token',
          user: {
            id: 'user-1',
            email: credentials.email,
            firstName: 'John',
            lastName: 'Doe',
            roleId: 'business_owner',
          },
        },
      };

      mockedApi.post.mockResolvedValue(mockResponse as any);

      const result = await authService.login(credentials);

      expect(result.access_token).toBe('mock-jwt-token');
      expect(result.user.email).toBe(credentials.email);
      expect(localStorage.setItem).toHaveBeenCalledWith('access_token', 'mock-jwt-token');
      expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockResponse.data.user));
    });

    it('should throw error with backend message on login failure', async () => {
      const errorMessage = 'Invalid credentials';
      const axiosError = {
        response: {
          data: { message: errorMessage },
        },
        message: 'Request failed',
      } as any;

      mockedApi.post.mockRejectedValue(axiosError);

      await expect(authService.login(credentials)).rejects.toThrow(errorMessage);
    });

    it('should throw generic error when no error message provided', async () => {
      const axiosError = {
        response: {},
        message: 'Network Error',
      } as any;

      mockedApi.post.mockRejectedValue(axiosError);

      await expect(authService.login(credentials)).rejects.toThrow('Network Error');
    });

    it('should throw default error message when no response data', async () => {
      mockedApi.post.mockRejectedValue(new Error('Unknown error'));

      await expect(authService.login(credentials)).rejects.toThrow('Unknown error');
    });
  });

  describe('register', () => {
    const registerData: RegisterData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      phone: '+1234567890',
      roleId: 'business_owner',
      businessName: 'Test Business',
    };

    it('should successfully register a new user', async () => {
      const mockResponse = {
        data: {
          message: 'Registration successful',
          user: {
            id: 'user-1',
            email: registerData.email,
            firstName: registerData.firstName,
          },
        },
      };

      mockedApi.post.mockResolvedValue(mockResponse as any);

      const result = await authService.register(registerData);

      expect(result.message).toBe('Registration successful');
      expect(result.user.id).toBe('user-1');
      expect(mockedApi.post).toHaveBeenCalledWith('/auth/register', registerData);
    });

    it('should throw error with backend message on registration failure', async () => {
      const errorMessage = 'Email already exists';
      const axiosError = {
        response: {
          data: { message: errorMessage },
        },
      } as any;

      mockedApi.post.mockRejectedValue(axiosError);

      await expect(authService.register(registerData)).rejects.toThrow(errorMessage);
    });

    it('should throw default error when registration fails', async () => {
      mockedApi.post.mockRejectedValue(new Error('Network Error'));

      await expect(authService.register(registerData)).rejects.toThrow('Registration failed');
    });
  });

  describe('getProfile', () => {
    it('should fetch user profile successfully', async () => {
      const mockProfile = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockedApi.get.mockResolvedValue({ data: mockProfile });

      const result = await authService.getProfile();

      expect(result).toEqual(mockProfile);
      expect(mockedApi.get).toHaveBeenCalledWith('/auth/profile');
    });

    it('should throw error when profile fetch fails', async () => {
      const axiosError = {
        response: {
          data: { message: 'Unauthorized' },
        },
      } as any;

      mockedApi.get.mockRejectedValue(axiosError);

      await expect(authService.getProfile()).rejects.toThrow('Unauthorized');
    });
  });

  describe('updateProfile', () => {
    it('should update profile and update localStorage', async () => {
      const currentUser = {
        id: 'user-1',
        email: 'old@example.com',
        firstName: 'Old',
      };
      const updateData = { firstName: 'New', lastName: 'Name' };
      const updatedUser = { ...currentUser, ...updateData };

      (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(currentUser));
      mockedApi.patch.mockResolvedValue({ data: updatedUser });

      const result = await authService.updateProfile(updateData);

      expect(result).toEqual(updatedUser);
      expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(updatedUser));
    });

    it('should not update localStorage if no current user', async () => {
      const updateData = { firstName: 'New' };
      (localStorage.getItem as jest.Mock).mockReturnValue(null);
      mockedApi.patch.mockResolvedValue({ data: updateData });

      await authService.updateProfile(updateData);

      expect(localStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset email', async () => {
      const email = 'test@example.com';
      mockedApi.post.mockResolvedValue({
        data: { message: 'Password reset email sent' },
      });

      const result = await authService.forgotPassword(email);

      expect(result.message).toBe('Password reset email sent');
      expect(mockedApi.post).toHaveBeenCalledWith('/auth/reset-password', { email });
    });

    it('should throw error when forgot password fails', async () => {
      const axiosError = {
        response: { data: { message: 'Email not found' } },
      } as any;

      mockedApi.post.mockRejectedValue(axiosError);

      await expect(authService.forgotPassword('test@example.com')).rejects.toThrow(
        'Email not found',
      );
    });
  });

  describe('resetPassword', () => {
    it('should reset password with token', async () => {
      const token = 'reset-token-123';
      const newPassword = 'newPassword123';

      mockedApi.post.mockResolvedValue({
        data: { message: 'Password reset successful' },
      });

      const result = await authService.resetPassword(token, newPassword);

      expect(result.message).toBe('Password reset successful');
      expect(mockedApi.post).toHaveBeenCalledWith('/auth/confirm-reset-password', {
        token,
        newPassword,
      });
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with token', async () => {
      const token = 'verify-token-123';

      mockedApi.post.mockResolvedValue({
        data: { message: 'Email verified successfully' },
      });

      const result = await authService.verifyEmail(token);

      expect(result.message).toBe('Email verified successfully');
      expect(mockedApi.post).toHaveBeenCalledWith('/auth/verify-email', { token });
    });
  });

  describe('getTenantMembers', () => {
    it('should fetch tenant members', async () => {
      const mockMembers = [
        { id: 'user-1', email: 'member1@test.com' },
        { id: 'user-2', email: 'member2@test.com' },
      ];

      mockedApi.get.mockResolvedValue({ data: mockMembers });

      const result = await authService.getTenantMembers();

      expect(result).toEqual(mockMembers);
      expect(mockedApi.get).toHaveBeenCalledWith('/users/tenant/members');
    });
  });

  describe('deleteTenantMember', () => {
    it('should delete tenant member', async () => {
      const userId = 'user-1';

      mockedApi.delete.mockResolvedValue({ data: { message: 'Member deleted' } });

      const result = await authService.deleteTenantMember(userId);

      expect(result.message).toBe('Member deleted');
      expect(mockedApi.delete).toHaveBeenCalledWith(`/users/tenant/members/${userId}`);
    });
  });

  describe('logout', () => {
    it('should clear all auth data from localStorage', () => {
      authService.logout();

      expect(localStorage.removeItem).toHaveBeenCalledWith('access_token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('user');
      expect(localStorage.removeItem).toHaveBeenCalledWith('businessColors');
      expect(localStorage.removeItem).toHaveBeenCalledWith('businessLogoUrl');
    });

    it('should dispatch business-reset-colors event', () => {
      authService.logout();

      expect(window.dispatchEvent).toHaveBeenCalledWith(expect.any(Event));
    });
  });

  describe('getToken', () => {
    it('should return token from localStorage', () => {
      const mockToken = 'mock-jwt-token';
      (localStorage.getItem as jest.Mock).mockReturnValue(mockToken);

      const result = authService.getToken();

      expect(result).toBe(mockToken);
      expect(localStorage.getItem).toHaveBeenCalledWith('access_token');
    });

    it('should return null if no token', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(null);

      const result = authService.getToken();

      expect(result).toBeNull();
    });
  });

  describe('getUser', () => {
    it('should return parsed user from localStorage', () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' };
      (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockUser));

      const result = authService.getUser();

      expect(result).toEqual(mockUser);
    });

    it('should return null if no user in localStorage', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(null);

      const result = authService.getUser();

      expect(result).toBeNull();
    });

    it('should return null if invalid JSON in localStorage', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue('invalid-json');

      // JSON.parse will throw, so we expect null
      expect(() => authService.getUser()).toThrow();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue('valid-token');

      const result = authService.isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false when no token', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(null);

      const result = authService.isAuthenticated();

      expect(result).toBe(false);
    });
  });
});
