import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { SidebarProvider, useSidebar } from '../SidebarContext';

describe('SidebarContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SidebarProvider>{children}</SidebarProvider>
  );

  it('should initialize with expanded sidebar', () => {
    const { result } = renderHook(() => useSidebar(), { wrapper });
    expect(result.current.isExpanded).toBe(true);
    expect(result.current.isMobileOpen).toBe(false);
    expect(result.current.isHovered).toBe(false);
    expect(result.current.activeItem).toBeNull();
    expect(result.current.openSubmenu).toBeNull();
  });

  it('should toggle sidebar', () => {
    const { result } = renderHook(() => useSidebar(), { wrapper });
    expect(result.current.isExpanded).toBe(true);
    act(() => { result.current.toggleSidebar(); });
    expect(result.current.isExpanded).toBe(false);
    act(() => { result.current.toggleSidebar(); });
    expect(result.current.isExpanded).toBe(true);
  });

  it('should toggle mobile sidebar', () => {
    const { result } = renderHook(() => useSidebar(), { wrapper });
    expect(result.current.isMobileOpen).toBe(false);
    act(() => { result.current.toggleMobileSidebar(); });
    expect(result.current.isMobileOpen).toBe(true);
    act(() => { result.current.toggleMobileSidebar(); });
    expect(result.current.isMobileOpen).toBe(false);
  });

  it('should set hovered state', () => {
    const { result } = renderHook(() => useSidebar(), { wrapper });
    act(() => { result.current.setIsHovered(true); });
    expect(result.current.isHovered).toBe(true);
    act(() => { result.current.setIsHovered(false); });
    expect(result.current.isHovered).toBe(false);
  });

  it('should set active item', () => {
    const { result } = renderHook(() => useSidebar(), { wrapper });
    act(() => { result.current.setActiveItem('dashboard'); });
    expect(result.current.activeItem).toBe('dashboard');
    act(() => { result.current.setActiveItem(null); });
    expect(result.current.activeItem).toBeNull();
  });

  it('should toggle submenu', () => {
    const { result } = renderHook(() => useSidebar(), { wrapper });
    act(() => { result.current.toggleSubmenu('invoices'); });
    expect(result.current.openSubmenu).toBe('invoices');
    act(() => { result.current.toggleSubmenu('invoices'); });
    expect(result.current.openSubmenu).toBeNull();
  });

  it('should switch to different submenu', () => {
    const { result } = renderHook(() => useSidebar(), { wrapper });
    act(() => { result.current.toggleSubmenu('invoices'); });
    expect(result.current.openSubmenu).toBe('invoices');
    act(() => { result.current.toggleSubmenu('products'); });
    expect(result.current.openSubmenu).toBe('products');
  });

  it('should throw when useSidebar is used outside SidebarProvider', () => {
    const consoleError = console.error;
    console.error = jest.fn();
    expect(() => renderHook(() => useSidebar())).toThrow('useSidebar must be used within a SidebarProvider');
    console.error = consoleError;
  });
});
