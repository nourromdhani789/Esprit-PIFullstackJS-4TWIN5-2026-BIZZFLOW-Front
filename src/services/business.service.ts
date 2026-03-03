import api from './api';
import { AxiosError } from 'axios';

export interface Business {
  id: string;
  name: string;
  legalName?: string;
  taxNumber?: string;
  currency?: string;
  taxRate?: number;
  address?: string;
  phone?: string;
  website?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  status: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBusinessDto {
  name: string;
  legalName?: string;
  taxNumber?: string;
  currency?: string;
  taxRate?: number;
  address?: string;
  phone?: string;
  website?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
}

export const businessService = {
  async getMyBusiness(): Promise<Business | null> {
    try {
      const response = await api.get('/businesses/my-business');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to get business');
    }
  },

  async createBusiness(data: CreateBusinessDto): Promise<Business> {
    try {
      const response = await api.post('/businesses', data);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to create business');
    }
  },

  async updateBusiness(id: string, data: Partial<CreateBusinessDto>): Promise<Business> {
    try {
      const response = await api.patch(`/businesses/${id}`, data);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to update business');
    }
  },
};
