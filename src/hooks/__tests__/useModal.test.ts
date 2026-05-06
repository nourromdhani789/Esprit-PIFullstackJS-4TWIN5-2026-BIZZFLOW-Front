import { useModal } from '../useModal';
import { renderHook, act } from '@testing-library/react';

describe('useModal', () => {
  it('should initialize as closed by default', () => {
    const { result } = renderHook(() => useModal());
    expect(result.current.isOpen).toBe(false);
  });

  it('should initialize with custom initial state', () => {
    const { result } = renderHook(() => useModal(true));
    expect(result.current.isOpen).toBe(true);
  });

  it('should open modal', () => {
    const { result } = renderHook(() => useModal());
    act(() => { result.current.openModal(); });
    expect(result.current.isOpen).toBe(true);
  });

  it('should close modal', () => {
    const { result } = renderHook(() => useModal(true));
    act(() => { result.current.closeModal(); });
    expect(result.current.isOpen).toBe(false);
  });

  it('should toggle modal', () => {
    const { result } = renderHook(() => useModal());
    act(() => { result.current.toggleModal(); });
    expect(result.current.isOpen).toBe(true);
    act(() => { result.current.toggleModal(); });
    expect(result.current.isOpen).toBe(false);
  });

  it('should return stable callbacks', () => {
    const { result } = renderHook(() => useModal());
    const { openModal, closeModal, toggleModal } = result.current;
    act(() => { openModal(); });
    expect(result.current.openModal).toBe(openModal);
    expect(result.current.closeModal).toBe(closeModal);
    expect(result.current.toggleModal).toBe(toggleModal);
  });
});
