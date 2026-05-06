import React from 'react';
import { renderHook, act } from '@testing-library/react';

const mockGetUser = jest.fn();
const mockLogin = jest.fn();
const mockLogout = jest.fn();

jest.mock('../../services/auth.service', () => ({
  authService: {
    getUser: mockGetUser,
    login: mockLogin,
    logout: mockLogout,
    getToken: jest.fn(),
    isAuthenticated: jest.fn(),
  },
}));

import { AuthProvider, useAuth } from '../AuthContext';

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it('should initialize with no user and loading false after mount', async () => {
    mockGetUser.mockReturnValue(null);
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should initialize with stored user', async () => {
    const storedUser = { id: '1', email: 'test@test.com', firstName: 'Test', lastName: 'User', roleId: 'admin' };
    mockGetUser.mockReturnValue(storedUser);
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toEqual(storedUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should login successfully', async () => {
    const mockUser = { id: '1', email: 'test@test.com', firstName: 'Test', lastName: 'User', roleId: 'admin' };
    mockGetUser.mockReturnValue(null);
    mockLogin.mockResolvedValue({ user: mockUser, access_token: 'tok' });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('test@test.com', 'password');
    });

    expect(mockLogin).toHaveBeenCalledWith({ email: 'test@test.com', password: 'password' });
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should logout successfully', async () => {
    const storedUser = { id: '1', email: 'test@test.com', firstName: 'Test', lastName: 'User', roleId: 'admin' };
    mockGetUser.mockReturnValue(storedUser);
    mockLogout.mockImplementation(() => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(true);

    act(() => {
      result.current.logout();
    });

    expect(mockLogout).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  describe('hasRole', () => {
    it('should return false when no user', async () => {
      mockGetUser.mockReturnValue(null);
      const { result } = renderHook(() => useAuth(), { wrapper });
      expect(result.current.hasRole('admin')).toBe(false);
    });

    it('should return true when user has matching role', async () => {
      const storedUser = { id: '1', email: 'test@test.com', firstName: 'Test', lastName: 'User', roleId: 'admin' };
      mockGetUser.mockReturnValue(storedUser);
      const { result } = renderHook(() => useAuth(), { wrapper });
      expect(result.current.hasRole('admin')).toBe(true);
    });

    it('should return false when user has different role', async () => {
      const storedUser = { id: '1', email: 'test@test.com', firstName: 'Test', lastName: 'User', roleId: 'employee' };
      mockGetUser.mockReturnValue(storedUser);
      const { result } = renderHook(() => useAuth(), { wrapper });
      expect(result.current.hasRole('admin')).toBe(false);
    });

    it('should check against array of roles', async () => {
      const storedUser = { id: '1', email: 'test@test.com', firstName: 'Test', lastName: 'User', roleId: 'manager' };
      mockGetUser.mockReturnValue(storedUser);
      const { result } = renderHook(() => useAuth(), { wrapper });
      expect(result.current.hasRole(['admin', 'manager'])).toBe(true);
      expect(result.current.hasRole(['admin', 'employee'])).toBe(false);
    });
  });

  it('should throw when useAuth is used outside AuthProvider', () => {
    const consoleError = console.error;
    console.error = jest.fn();
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within an AuthProvider');
    console.error = consoleError;
  });
});
