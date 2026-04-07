import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface FocusModeContextType {
  isFocusMode: boolean;
  toggleFocusMode: () => void;
  enableFocusMode: () => void;
  disableFocusMode: () => void;
  isElementVisible: (elementType: 'primary' | 'secondary' | 'sidebar' | 'action') => boolean;
  suggestedAction: string | null;
}

const FocusModeContext = createContext<FocusModeContextType | undefined>(undefined);

const STORAGE_KEY = 'bizflow_focus_mode';

interface FocusModeProviderProps {
  children: ReactNode;
}

export const FocusModeProvider: React.FC<FocusModeProviderProps> = ({ children }) => {
  const [isFocusMode, setIsFocusMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : false;
    }
    return false;
  });

  const [suggestedAction, setSuggestedAction] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(isFocusMode));
    console.log('Focus Mode:', isFocusMode ? 'ON' : 'OFF');
    
    // Apply focus mode styles - blur sidebar and header, highlight main content
    if (isFocusMode) {
      document.body.classList.add('focus-mode-active');
      
      // Blur sidebar - target the aside element which is the sidebar
      const sidebar = document.querySelector('aside') as HTMLElement;
      if (sidebar) {
        sidebar.style.filter = 'blur(4px)';
        sidebar.style.opacity = '0.4';
        sidebar.style.pointerEvents = 'none';
        sidebar.style.transition = 'all 0.3s ease';
      }
      
      // Dim header but keep it usable
      const header = document.querySelector('header') as HTMLElement;
      if (header) {
        header.style.filter = 'blur(2px)';
        header.style.opacity = '0.7';
        header.style.transition = 'all 0.3s ease';
      }
      
      // Highlight main content
      const mainContent = document.querySelector('main') as HTMLElement;
      if (mainContent) {
        mainContent.style.boxShadow = '0 0 0 4px rgba(147, 51, 234, 0.3)';
        mainContent.style.borderRadius = '12px';
        mainContent.style.transition = 'all 0.3s ease';
        mainContent.style.position = 'relative';
        mainContent.style.zIndex = '10';
      }
    } else {
      document.body.classList.remove('focus-mode-active');
      
      // Restore sidebar
      const sidebar = document.querySelector('aside') as HTMLElement;
      if (sidebar) {
        sidebar.style.filter = '';
        sidebar.style.opacity = '';
        sidebar.style.pointerEvents = '';
      }
      
      // Restore header
      const header = document.querySelector('header') as HTMLElement;
      if (header) {
        header.style.filter = '';
        header.style.opacity = '';
      }
      
      // Restore main content
      const mainContent = document.querySelector('main') as HTMLElement;
      if (mainContent) {
        mainContent.style.boxShadow = '';
        mainContent.style.borderRadius = '';
        mainContent.style.position = '';
        mainContent.style.zIndex = '';
      }
    }
  }, [isFocusMode]);

  useEffect(() => {
    if (!isFocusMode) return;

    // Detect current page context and suggest main action
    const path = window.location.pathname;
    let action: string | null = null;

    if (path.includes('/invoices/create')) {
      action = 'Create and save the invoice';
    } else if (path.includes('/quotes/create')) {
      action = 'Create and save the quote';
    } else if (path.includes('/clients')) {
      action = 'Add or manage clients';
    } else if (path.includes('/expenses')) {
      action = 'Record a new expense';
    } else if (path.includes('/reports')) {
      action = 'Generate reports';
    } else if (path.includes('/settings')) {
      action = 'Update business settings';
    }

    setSuggestedAction(action);
  }, [isFocusMode]);

  const toggleFocusMode = () => setIsFocusMode((prev: boolean) => !prev);
  const enableFocusMode = () => setIsFocusMode(true);
  const disableFocusMode = () => setIsFocusMode(false);

  const isElementVisible = (elementType: 'primary' | 'secondary' | 'sidebar' | 'action'): boolean => {
    if (!isFocusMode) return true;

    switch (elementType) {
      case 'primary':
      case 'action':
        return true; // Always show primary actions
      case 'secondary':
      case 'sidebar':
        return false; // Hide secondary elements in focus mode
      default:
        return true;
    }
  };

  return (
    <FocusModeContext.Provider
      value={{
        isFocusMode,
        toggleFocusMode,
        enableFocusMode,
        disableFocusMode,
        isElementVisible,
        suggestedAction,
      }}
    >
      {children}
    </FocusModeContext.Provider>
  );
};

export const useFocusMode = (): FocusModeContextType => {
  const context = useContext(FocusModeContext);
  if (context === undefined) {
    throw new Error('useFocusMode must be used within a FocusModeProvider');
  }
  return context;
};

// HOC for focus-aware components
export const withFocusMode = <P extends object>(
  Component: React.ComponentType<P>,
  elementType: 'primary' | 'secondary' | 'sidebar' | 'action'
): React.FC<P> => {
  return (props: P) => {
    const { isElementVisible, isFocusMode } = useFocusMode();
    
    if (!isElementVisible(elementType)) {
      return null;
    }

    // Add focus mode styling
    const focusClass = isFocusMode && elementType === 'action' 
      ? 'focus-highlight ring-2 ring-blue-500 ring-offset-2' 
      : '';

    return <Component {...props} className={focusClass} />;
  };
};

export default FocusModeContext;
