import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

export interface FilterConfig<T extends Record<string, any>> {
  key: string;
  defaultValues: T;
  storageKey?: string;
}

export interface UseFilterReturn<T extends Record<string, any>> {
  filters: T;
  setFilter: <K extends keyof T>(key: K, value: T[K]) => void;
  setFilters: (filters: Partial<T>) => void;
  clearFilter: (key: keyof T) => void;
  clearAllFilters: () => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  getFilterChips: () => Array<{ key: keyof T; label: string; value: string; onRemove: () => void }>;
  saveFilters: (name: string) => void;
  loadSavedFilters: (name: string) => T | null;
  deleteSavedFilters: (name: string) => void;
  getSavedFilterNames: () => string[];
}

export function useFilters<T extends Record<string, any>>(
  config: FilterConfig<T>
): UseFilterReturn<T> {
  const [searchParams, setSearchParams] = useSearchParams();
  const { key, defaultValues, storageKey = `${key}_filters` } = config;

  // Initialize filters from URL params or defaults
  const [filters, setFiltersState] = useState<T>(() => {
    const urlFilters: Partial<T> = {};
    
    Object.keys(defaultValues).forEach((k) => {
      const paramValue = searchParams.get(k);
      if (paramValue !== null) {
        const defaultValue = defaultValues[k];
        
        // Type conversion based on default value type
        if (typeof defaultValue === 'boolean') {
          (urlFilters as any)[k] = paramValue === 'true';
        } else if (typeof defaultValue === 'number') {
          (urlFilters as any)[k] = Number(paramValue);
        } else {
          (urlFilters as any)[k] = paramValue;
        }
      }
    });

    return { ...defaultValues, ...urlFilters };
  });

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    
    Object.entries(filters).forEach(([k, value]) => {
      const defaultValue = defaultValues[k];
      
      // Only add to URL if different from default
      if (value !== defaultValue && value !== '' && value !== null && value !== undefined) {
        params.set(k, String(value));
      } else {
        params.delete(k);
      }
    });

    setSearchParams(params, { replace: true });
  }, [filters]);

  const setFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setFiltersState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setMultipleFilters = useCallback((newFilters: Partial<T>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilter = useCallback((key: keyof T) => {
    setFiltersState((prev) => ({ ...prev, [key]: defaultValues[key] }));
  }, [defaultValues]);

  const clearAllFilters = useCallback(() => {
    setFiltersState(defaultValues);
  }, [defaultValues]);

  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      return value !== defaultValues[key] && value !== '' && value !== null && value !== undefined;
    });
  }, [filters, defaultValues]);

  const activeFilterCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      return value !== defaultValues[key] && value !== '' && value !== null && value !== undefined;
    }).length;
  }, [filters, defaultValues]);

  // Save/Load filters from localStorage
  const saveFilters = useCallback((name: string) => {
    const savedFiltersKey = `${storageKey}_saved`;
    const existing = JSON.parse(localStorage.getItem(savedFiltersKey) || '{}');
    existing[name] = filters;
    localStorage.setItem(savedFiltersKey, JSON.stringify(existing));
  }, [filters, storageKey]);

  const loadSavedFilters = useCallback((name: string): T | null => {
    const savedFiltersKey = `${storageKey}_saved`;
    const existing = JSON.parse(localStorage.getItem(savedFiltersKey) || '{}');
    return existing[name] || null;
  }, [storageKey]);

  const deleteSavedFilters = useCallback((name: string) => {
    const savedFiltersKey = `${storageKey}_saved`;
    const existing = JSON.parse(localStorage.getItem(savedFiltersKey) || '{}');
    delete existing[name];
    localStorage.setItem(savedFiltersKey, JSON.stringify(existing));
  }, [storageKey]);

  const getSavedFilterNames = useCallback((): string[] => {
    const savedFiltersKey = `${storageKey}_saved`;
    const existing = JSON.parse(localStorage.getItem(savedFiltersKey) || '{}');
    return Object.keys(existing);
  }, [storageKey]);

  // Generate filter chips for UI display
  const getFilterChips = useCallback(() => {
    const chips: Array<{ key: keyof T; label: string; value: string; onRemove: () => void }> = [];
    
    // Friendly labels mapping
    const labelMap: Record<string, string> = {
      search: 'Search',
      status: 'Status',
      clientId: 'Client',
      converted: 'Converted',
      dateFrom: 'From',
      dateTo: 'To',
      minAmount: 'Min Amount',
      maxAmount: 'Max Amount',
      category: 'Category',
      productId: 'Product',
      type: 'Type',
      reason: 'Reason',
    };
    
    Object.entries(filters).forEach(([k, value]) => {
      if (value !== defaultValues[k] && value !== '' && value !== null && value !== undefined && value !== 'all') {
        let displayValue = String(value);
        
        // Format dates
        if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
          displayValue = new Date(value).toLocaleDateString();
        }
        
        // Format amounts with currency
        if ((k === 'minAmount' || k === 'maxAmount') && value) {
          displayValue = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(Number(value));
        }
        
        chips.push({
          key: k as keyof T,
          label: labelMap[k] || k,
          value: displayValue,
          onRemove: () => clearFilter(k as keyof T),
        });
      }
    });
    
    return chips;
  }, [filters, defaultValues, clearFilter]);

  return {
    filters,
    setFilter,
    setFilters: setMultipleFilters,
    clearFilter,
    clearAllFilters,
    hasActiveFilters,
    activeFilterCount,
    getFilterChips,
    saveFilters,
    loadSavedFilters,
    deleteSavedFilters,
    getSavedFilterNames,
  };
}

// Helper hook for debounced search
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
