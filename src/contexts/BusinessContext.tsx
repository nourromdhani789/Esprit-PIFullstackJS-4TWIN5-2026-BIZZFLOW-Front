import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { businessService, Business } from '../services/business.service';
import { useAuth } from '../context/AuthContext';

interface BusinessContextType {
  business: Business | null;
  loading: boolean;
  error: string | null;
  refreshBusiness: () => Promise<void>;
  updateBusinessColors: (colors: { primaryColor?: string; secondaryColor?: string; navbarColor?: string; sidebarColor?: string; accentColor?: string }) => void;
  formatCurrency: (amount: number) => string;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Safely get auth - may not be available during initial render
  try {
    const auth = useAuth();
    void auth?.user;
  } catch (e) {
    // AuthContext not available yet
  }

  const fetchBusiness = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get user inside the callback to always have latest value
      let currentUser = null;
      try {
        const auth = useAuth();
        currentUser = auth?.user || null;
      } catch (e) {
        // Auth not available
      }
      
      // Skip business fetch for platform admins who don't have a business
      if (currentUser?.roleId === 'PLATFORM_ADMIN') {
        setBusiness(null);
        setLoading(false);
        return;
      }
      
      const data = await businessService.getMyBusiness();
      setBusiness(data);
      setError(null);
      
      // Apply business colors to CSS variables
      if (data) {
        applyBusinessColors(data);
        updateFavicon(data.logoUrl);
      }
    } catch (err) {
      setError('Failed to load business data');
      console.error('Error loading business:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshBusiness = async () => {
    await fetchBusiness();
  };

  const formatCurrency = (amount: number) => {
    const currency = business?.currency || "USD";
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
      }).format(amount);
    } catch (error) {
      return `${currency} ${amount.toFixed(2)}`;
    }
  };

  const updateBusinessColors = (colors: { primaryColor?: string; secondaryColor?: string; navbarColor?: string; sidebarColor?: string; accentColor?: string }) => {
    if (business) {
      const updatedBusiness = { ...business, ...colors };
      setBusiness(updatedBusiness);
      applyBusinessColors(updatedBusiness);
    }
  };

  const getContrastColor = (hex: string) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? '#111827' : '#ffffff';
  };

  // Reset to default CSS variables (from tailwind theme) for logout/new session
  const resetBusinessColors = () => {
    const root = document.documentElement;
    root.style.removeProperty('--color-sidebar-bg');
    root.style.removeProperty('--color-sidebar-text');
    root.style.removeProperty('--color-navbar-bg');
    root.style.removeProperty('--color-navbar-text');
    root.style.removeProperty('--color-background');
    root.style.removeProperty('--color-panel-bg');
    root.style.removeProperty('--color-panel-text');
    root.style.removeProperty('--color-button-bg');
    root.style.removeProperty('--color-button-text');
    localStorage.removeItem('businessColors');
    localStorage.removeItem('businessLogoUrl');
  };

  // Apply business colors to CSS custom properties
  const applyBusinessColors = (businessData: Business) => {
    const root = document.documentElement;

    if (businessData.primaryColor) {
      const primary = businessData.primaryColor;
      const primaryText = getContrastColor(primary);

      // Button color palette
      root.style.setProperty('--color-button-bg', primary);
      root.style.setProperty('--color-button-text', primaryText);
      root.style.setProperty('--color-brand-500', primary);
      root.style.setProperty('--color-brand-600', darkenColor(primary, 0.15));
      root.style.setProperty('--color-brand-700', darkenColor(primary, 0.25));
    }
    
    // Secondary color - used for panel backgrounds and base backgrounds (default white)
    if (businessData.secondaryColor) {
      const secondary = businessData.secondaryColor;
      const secondaryText = getContrastColor(secondary);

      root.style.setProperty('--color-panel-bg', secondary);
      root.style.setProperty('--color-panel-text', secondaryText);
      root.style.setProperty('--color-background', lightenColor(secondary, 0.92));

      // Do not override the global blue palette; keep category / payments and other (blue) components consistent with original look
    }

    // Navbar color - used for top navigation bar
    if (businessData.navbarColor) {
      const navbar = businessData.navbarColor;
      const navbarText = getContrastColor(navbar);

      root.style.setProperty('--color-navbar-bg', navbar);
      root.style.setProperty('--color-navbar-text', navbarText);
    }

    // Sidebar color - used for left sidebar
    if (businessData.sidebarColor) {
      const sidebar = businessData.sidebarColor;
      const sidebarText = getContrastColor(sidebar);

      root.style.setProperty('--color-sidebar-bg', sidebar);
      root.style.setProperty('--color-sidebar-text', sidebarText);
    }
    
    // Accent color - used for highlights and special elements
    if (businessData.accentColor) {
      const accent = businessData.accentColor;
      // Map to orange/warning palette for accents
      root.style.setProperty('--color-orange-500', accent);
      root.style.setProperty('--color-orange-400', lightenColor(accent, 0.2));
      root.style.setProperty('--color-orange-300', lightenColor(accent, 0.4));
      root.style.setProperty('--color-orange-600', darkenColor(accent, 0.15));
      // Also set warning colors
      root.style.setProperty('--color-warning-500', accent);

      // map accent to silver aesthetic palettes often used in theme
      root.style.setProperty('--color-yellow-500', accent);
      root.style.setProperty('--color-yellow-400', lightenColor(accent, 0.2));
      root.style.setProperty('--color-yellow-600', darkenColor(accent, 0.15));
    }
    
    // Store in localStorage for persistence across reloads
    localStorage.setItem('businessColors', JSON.stringify({
      primaryColor: businessData.primaryColor || '#3B82F6',
      secondaryColor: businessData.secondaryColor || '#FFFFFF',
      navbarColor: businessData.navbarColor || '#FFFFFF',
      sidebarColor: businessData.sidebarColor || '#FFFFFF',
      accentColor: businessData.accentColor || '#F59E0B',
    }));

    // Store logo URL
    if (businessData.logoUrl) {
      localStorage.setItem('businessLogoUrl', businessData.logoUrl);
    }
  };

  // Helper to lighten a hex color
  const lightenColor = (hex: string, percent: number) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(255 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
  };

  // Helper to darken a hex color
  const darkenColor = (hex: string, percent: number) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(255 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
  };

  // Update favicon dynamically
  const updateFavicon = (logoUrl?: string) => {
    if (!logoUrl) return;
    
    // Remove existing favicons
    const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
    existingFavicons.forEach(fav => fav.remove());
    
    // Create new favicon link
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    link.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${logoUrl}`;
    document.head.appendChild(link);
    
    // Also update apple-touch-icon
    const appleLink = document.createElement('link');
    appleLink.rel = 'apple-touch-icon';
    appleLink.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${logoUrl}`;
    document.head.appendChild(appleLink);
  };

  // Load colors from localStorage on mount (for instant UI before API loads)
  useEffect(() => {
    const resetOnLogout = () => {
      resetBusinessColors();
      setBusiness(null);
    };

    window.addEventListener('business-reset-colors', resetOnLogout);

    const storedColors = localStorage.getItem('businessColors');
    const storedLogoUrl = localStorage.getItem('businessLogoUrl');

    if (storedColors) {
      try {
        const colors = JSON.parse(storedColors);
        applyBusinessColors(colors as Business);
      } catch (error) {
        console.warn('Invalid businessColors in localStorage, resetting', error);
        resetBusinessColors();
      }
    }

    if (storedLogoUrl) {
      updateFavicon(storedLogoUrl);
    }

    return () => {
      window.removeEventListener('business-reset-colors', resetOnLogout);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchBusiness();
    } else {
      setLoading(false);
    }
  }, []);

  // Listen for login events to re-fetch business
  useEffect(() => {
    const handleLogin = () => {
      fetchBusiness();
    };
    
    window.addEventListener('auth-login', handleLogin);
    return () => window.removeEventListener('auth-login', handleLogin);
  }, [fetchBusiness]);


  return (
    <BusinessContext.Provider value={{ 
      business, 
      loading, 
      error, 
      refreshBusiness,
      updateBusinessColors,
      formatCurrency,  
    }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
}
