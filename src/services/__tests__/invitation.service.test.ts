import { invitationService, CreateInvitationData, AcceptInvitationData } from '../invitation.service';
import api from '../api';

jest.mock('../api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('InvitationService', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  const mockInvitation = {
    id: 'inv-1', email: 'user@test.com', token: 'tok-1', invitedBy: 'admin',
    tenantId: 't-1', roleId: 'employee', status: 'PENDING' as const,
    expiresAt: '2024-12-31T00:00:00Z', createdAt: '2024-01-15T00:00:00Z', updatedAt: '2024-01-15T00:00:00Z',
  };

  describe('createInvitation', () => {
    it('should create an invitation', async () => {
      const data: CreateInvitationData = { email: 'user@test.com', roleId: 'employee' };
      mockedApi.post.mockResolvedValue({ data: { message: 'Invitation sent', invitation: mockInvitation } });
      const result = await invitationService.createInvitation(data);
      expect(result.message).toBe('Invitation sent');
      expect(result.invitation).toEqual(mockInvitation);
      expect(mockedApi.post).toHaveBeenCalledWith('/auth/invite', data);
    });
    it('should throw with backend message on failure', async () => {
      const err = { response: { data: { message: 'Already invited' } } } as any;
      mockedApi.post.mockRejectedValue(err);
      await expect(invitationService.createInvitation({ email: 'x@x.com', roleId: 'employee' })).rejects.toThrow('Already invited');
    });
    it('should throw default message', async () => {
      mockedApi.post.mockRejectedValue(new Error('fail'));
      await expect(invitationService.createInvitation({ email: 'x@x.com', roleId: 'employee' })).rejects.toThrow('Failed to create invitation');
    });
  });

  describe('acceptInvitation', () => {
    it('should accept an invitation', async () => {
      const data: AcceptInvitationData = { token: 'tok-1', email: 'user@test.com', firstName: 'John', lastName: 'Doe', password: 'pass123' };
      mockedApi.post.mockResolvedValue({ data: { message: 'Accepted', user: { id: 'u-1' } } });
      const result = await invitationService.acceptInvitation(data);
      expect(result.message).toBe('Accepted');
      expect(mockedApi.post).toHaveBeenCalledWith('/auth/accept-invitation', data);
    });
    it('should throw on failure', async () => {
      const data: AcceptInvitationData = { token: 'tok-1', email: 'x@x.com', firstName: 'J', lastName: 'D', password: 'p' };
      const err = { response: { data: { message: 'Invalid token' } } } as any;
      mockedApi.post.mockRejectedValue(err);
      await expect(invitationService.acceptInvitation(data)).rejects.toThrow('Invalid token');
    });
  });

  describe('revokeInvitation', () => {
    it('should revoke an invitation', async () => {
      mockedApi.delete.mockResolvedValue({ data: { message: 'Revoked' } });
      const result = await invitationService.revokeInvitation('inv-1');
      expect(result.message).toBe('Revoked');
      expect(mockedApi.delete).toHaveBeenCalledWith('/auth/invitations/inv-1');
    });
    it('should throw on failure', async () => {
      const err = { response: { data: { message: 'Not found' } } } as any;
      mockedApi.delete.mockRejectedValue(err);
      await expect(invitationService.revokeInvitation('inv-999')).rejects.toThrow('Not found');
    });
  });

  describe('validateInvitationToken', () => {
    it('should validate an invitation token', async () => {
      mockedApi.get.mockResolvedValue({ data: { valid: true, invitation: mockInvitation } });
      const result = await invitationService.validateInvitationToken('tok-1');
      expect(result.valid).toBe(true);
      expect(mockedApi.get).toHaveBeenCalledWith('/auth/invitations/validate/tok-1');
    });
    it('should throw on invalid token', async () => {
      const err = { response: { data: { message: 'Expired' } } } as any;
      mockedApi.get.mockRejectedValue(err);
      await expect(invitationService.validateInvitationToken('bad')).rejects.toThrow('Expired');
    });
  });

  describe('getPendingInvitations', () => {
    it('should fetch pending invitations', async () => {
      mockedApi.get.mockResolvedValue({ data: { invitations: [mockInvitation] } });
      const result = await invitationService.getPendingInvitations();
      expect(result.invitations).toEqual([mockInvitation]);
      expect(mockedApi.get).toHaveBeenCalledWith('/auth/invitations/pending');
    });
    it('should throw on failure', async () => {
      const err = { response: { data: { message: 'Unauthorized' } } } as any;
      mockedApi.get.mockRejectedValue(err);
      await expect(invitationService.getPendingInvitations()).rejects.toThrow('Unauthorized');
    });
  });
});
