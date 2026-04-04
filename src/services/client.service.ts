import api from './api';

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  businessId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientDto {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface UpdateClientDto {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

class ClientService {
  async getClients(): Promise<Client[]> {
    const response = await api.get('/clients');
    return response.data;
  }

  async getClient(id: string): Promise<Client> {
    const response = await api.get(`/clients/${id}`);
    return response.data;
  }

  async createClient(data: CreateClientDto): Promise<Client> {
    const response = await api.post('/clients', data);
    return response.data;
  }

  async updateClient(id: string, data: UpdateClientDto): Promise<Client> {
    const response = await api.patch(`/clients/${id}`, data);
    return response.data;
  }

  async deleteClient(id: string): Promise<void> {
    await api.delete(`/clients/${id}`);
  }
}

export const clientService = new ClientService();
