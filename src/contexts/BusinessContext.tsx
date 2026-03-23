import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { businessService, Business } from '../services/business.service';

interface BusinessContextType {
  business: Business | null;
  loading: boolean;
  error: string | null;
  refreshBusiness: () => Promise<void>;
  updateBusinessColors: (colors: { primaryColor?: string; secondaryColor?: string; accentColor?: string }) => void;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBusiness = async () => {
    try {
      setLoading(true);
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
  };

  const refreshBusiness = async () => {
    await fetchBusiness();
  };

  const updateBusinessColors = (colors: { primaryColor?: string; secondaryColor?: string; accentColor?: string }) => {
    if (business) {
      const updatedBusiness = { ...business, ...colors };
      setBusiness(updatedBusiness);
      applyBusinessColors(updatedBusiness);
    }
  };

  // Apply business colors to CSS custom properties
  const applyBusinessColors = (businessData: Business) => {
    const root = document.documentElement;
    
    if (businessData.primaryColor) {
      const primary = businessData.primaryColor;
      // Set the main brand color (used by bg-brand-500, text-brand-500, etc.)
      root.style.setProperty('--color-brand-500', primary);
      
      // Generate lighter variants (25-400)
      root.style.setProperty('--color-brand-25', lightenColor(primary, 0.9));
      root.style.setProperty('--color-brand-50', lightenColor(primary, 0.85));
      root.style.setProperty('--color-brand-100', lightenColor(primary, 0.75));
      root.style.setProperty('--color-brand-200', lightenColor(primary, 0.6));
      root.style.setProperty('--color-brand-300', lightenColor(primary, 0.4));
      root.style.setProperty('--color-brand-400', lightenColor(primary, 0.2));
      
      // Generate darker variants (600-950)
      root.style.setProperty('--color-brand-600', darkenColor(primary, 0.15));
      root.style.setProperty('--color-brand-700', darkenColor(primary, 0.25));
      root.style.setProperty('--color-brand-800', darkenColor(primary, 0.35));
      root.style.setProperty('--color-brand-900', darkenColor(primary, 0.45));
      root.style.setProperty('--color-brand-950', darkenColor(primary, 0.55));
    }
    
    // Secondary color - used for headers and secondary elements
    if (businessData.secondaryColor) {
      const secondary = businessData.secondaryColor;
      // Map to blue-light palette for secondary elements
      root.style.setProperty('--color-blue-light-500', secondary);
      root.style.setProperty('--color-blue-light-400', lightenColor(secondary, 0.2));
      root.style.setProperty('--color-blue-light-300', lightenColor(secondary, 0.4));
      root.style.setProperty('--color-blue-light-600', darkenColor(secondary, 0.15));
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
    }
    
    // Store in localStorage for persistence across reloads
    localStorage.setItem('businessColors', JSON.stringify({
      primaryColor: businessData.primaryColor,
      secondaryColor: businessData.secondaryColor,
      accentColor: businessData.accentColor,
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
    const storedColors = localStorage.getItem('businessColors');
    const storedLogoUrl = localStorage.getItem('businessLogoUrl');
    
    if (storedColors) {
      const colors = JSON.parse(storedColors);
      const root = document.documentElement;
      
      // Primary color - buttons, links, primary actions
      if (colors.primaryColor) {
        const primary = colors.primaryColor;
        root.style.setProperty('--color-brand-500', primary);
        root.style.setProperty('--color-brand-25', lightenColor(primary, 0.9));
        root.style.setProperty('--color-brand-50', lightenColor(primary, 0.85));
        root.style.setProperty('--color-brand-100', lightenColor(primary, 0.75));
        root.style.setProperty('--color-brand-200', lightenColor(primary, 0.6));
        root.style.setProperty('--color-brand-300', lightenColor(primary, 0.4));
        root.style.setProperty('--color-brand-400', lightenColor(primary, 0.2));
        root.style.setProperty('--color-brand-600', darkenColor(primary, 0.15));
        root.style.setProperty('--color-brand-700', darkenColor(primary, 0.25));
        root.style.setProperty('--color-brand-800', darkenColor(primary, 0.35));
        root.style.setProperty('--color-brand-900', darkenColor(primary, 0.45));
        root.style.setProperty('--color-brand-950', darkenColor(primary, 0.55));
      }
      
      // Secondary color - headers, secondary elements
      if (colors.secondaryColor) {
        const secondary = colors.secondaryColor;
        root.style.setProperty('--color-blue-light-500', secondary);
        root.style.setProperty('--color-blue-light-400', lightenColor(secondary, 0.2));
        root.style.setProperty('--color-blue-light-300', lightenColor(secondary, 0.4));
        root.style.setProperty('--color-blue-light-600', darkenColor(secondary, 0.15));
      }
      
      // Accent color - highlights, special elements
      if (colors.accentColor) {
        const accent = colors.accentColor;
        root.style.setProperty('--color-orange-500', accent);
        root.style.setProperty('--color-orange-400', lightenColor(accent, 0.2));
        root.style.setProperty('--color-orange-300', lightenColor(accent, 0.4));
        root.style.setProperty('--color-orange-600', darkenColor(accent, 0.15));
        root.style.setProperty('--color-warning-500', accent);
      }
    }
    
    if (storedLogoUrl) {
      updateFavicon(storedLogoUrl);
    }
  }, []);

  useEffect(() => {
    fetchBusiness();
  }, []);

  return (
    <BusinessContext.Provider value={{ 
      business, 
      loading, 
      error, 
      refreshBusiness,
      updateBusinessColors 
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
