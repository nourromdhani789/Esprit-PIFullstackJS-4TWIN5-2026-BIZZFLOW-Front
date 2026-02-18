import api from './api';
import { AxiosError } from 'axios';

export interface CreateInvitationData {
  email: string;
  roleId: string;
  message?: string;
}

export interface AcceptInvitationData {
  token: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  phone?: string;
}

export interface Invitation {
  id: string;
  email: string;
  token: string;
  invitedBy: string;
  tenantId: string;
  roleId: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  expiresAt: string;
  acceptedAt?: string;
  acceptedByUserId?: string;
  createdAt: string;
  updatedAt: string;
}

export const invitationService = {
  async createInvitation(data: CreateInvitationData): Promise<{ message: string; invitation: Invitation }> {
    try {
      const response = await api.post('/auth/invite', data);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to create invitation');
    }
  },

  async acceptInvitation(data: AcceptInvitationData): Promise<{ message: string; user: any }> {
    try {
      const response = await api.post('/auth/accept-invitation', data);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to accept invitation');
    }
  },

  async getPendingInvitations(): Promise<{ invitations: Invitation[] }> {
    try {
      const response = await api.get('/auth/invitations/pending');
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to get pending invitations');
    }
  },

  async revokeInvitation(invitationId: string): Promise<{ message: string }> {
    try {
      const response = await api.delete(`/auth/invitations/${invitationId}`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to revoke invitation');
    }
  },

  async validateInvitationToken(token: string): Promise<{ valid: boolean; invitation?: Invitation }> {
    try {
      const response = await api.get(`/auth/invitations/validate/${token}`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Invalid or expired invitation token');
    }
  }
};
