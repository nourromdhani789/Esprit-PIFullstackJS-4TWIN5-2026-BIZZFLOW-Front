import useGoBack from '../useGoBack';
import { renderHook } from '@testing-library/react';

const mockNavigate = jest.fn();
jest.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}));

describe('useGoBack', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should go back when history state has idx > 0', () => {
    Object.defineProperty(window, 'history', {
      value: { state: { idx: 2 }, length: 5, scrollRestoration: 'auto' },
      writable: true,
    });

    const { result } = renderHook(() => useGoBack());
    result.current();
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('should navigate to / when no history state', () => {
    Object.defineProperty(window, 'history', {
      value: { state: null, length: 1, scrollRestoration: 'auto' },
      writable: true,
    });

    const { result } = renderHook(() => useGoBack());
    result.current();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('should navigate to / when idx is 0', () => {
    Object.defineProperty(window, 'history', {
      value: { state: { idx: 0 }, length: 1, scrollRestoration: 'auto' },
      writable: true,
    });

    const { result } = renderHook(() => useGoBack());
    result.current();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
