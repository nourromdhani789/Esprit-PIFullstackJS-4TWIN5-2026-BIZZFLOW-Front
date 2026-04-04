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
  navbarColor?: string;
  sidebarColor?: string;
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
  navbarColor?: string;
  sidebarColor?: string;
  accentColor?: string;
}

export const businessService = {
  async getMyBusiness(): Promise<Business | null> {
    try {
      const response = await api.get('/businesses/my-business');
      const data = response.data;
      // Ensure taxRate is a number
      if (data && data.taxRate !== undefined && data.taxRate !== null) {
        data.taxRate = Number(data.taxRate);
      }
      return data;
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

  async uploadLogo(file: File): Promise<{ logoUrl: string; message: string }> {
    try {
      const formData = new FormData();
      formData.append('logo', file);
      
      const response = await api.post('/businesses/upload-logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to upload logo');
    }
  },
};
