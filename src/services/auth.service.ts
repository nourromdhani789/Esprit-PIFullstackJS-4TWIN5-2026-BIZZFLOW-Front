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

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
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
