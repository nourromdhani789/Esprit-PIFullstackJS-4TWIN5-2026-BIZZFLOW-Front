import api from './api';
import { AxiosError } from 'axios';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  roleId: string;
  businessName?: string;
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roleId: string;
    tenantId?: string;
  };
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/login', credentials);
      const { access_token, user } = response.data;
      
      // Store token and user data
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string; error?: string }>;
      console.error('Login error:', axiosError.response?.data);
      console.error('Full error:', axiosError);
      
      // Try to get specific error message from backend
      const errorMessage = axiosError.response?.data?.message 
        || axiosError.response?.data?.error 
        || axiosError.message 
        || 'Login failed';
      throw new Error(errorMessage);
    }
  },

  async register(data: RegisterData): Promise<{ message: string; user: any }> {
    try {
      const response = await api.post('/auth/register', data);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Registration failed');
    }
  },

  async getProfile(): Promise<any> {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to get profile');
    }
  },

  async updateProfile(data: Partial<RegisterData>): Promise<any> {
    try {
      const response = await api.patch('/users/profile', data);
      // Update local storage with new user data
      const currentUser = this.getUser();
      if (currentUser) {
        const updatedUser = { ...currentUser, ...response.data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to update profile');
    }
  },

  async getTenantMembers(): Promise<any[]> {
    try {
      const response = await api.get('/users/tenant/members');
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to get tenant members');
    }
  },

  async deleteTenantMember(userId: string): Promise<any> {
    try {
      const response = await api.delete(`/users/tenant/members/${userId}`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to delete tenant member');
    }
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      const response = await api.post('/auth/reset-password', { email });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to send password reset email');
    }
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    try {
      const response = await api.post('/auth/confirm-reset-password', { token, newPassword });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to reset password');
    }
  },

  async verifyEmail(token: string): Promise<{ message: string }> {
    try {
      const response = await api.post('/auth/verify-email', { token });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to verify email');
    }
  },

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('businessColors');
    localStorage.removeItem('businessLogoUrl');
    // Trigger any context listening for style reset on logout
    window.dispatchEvent(new Event('business-reset-colors'));
  },

  getToken(): string | null {
    return localStorage.getItem('access_token');
  },

  getUser(): any | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
};
