import { useFocusMode } from '../../../contexts/FocusModeContext';

interface FocusModeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const FocusModeToggle: React.FC<FocusModeToggleProps> = ({ 
  className = '',
  showLabel = true 
}) => {
  const { isFocusMode, toggleFocusMode, suggestedAction } = useFocusMode();

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        onClick={toggleFocusMode}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
          ${isFocusMode 
            ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
          }
        `}
        title={isFocusMode ? 'Exit Focus Mode' : 'Enter Focus Mode'}
      >
        <svg 
          className="w-5 h-5" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          {isFocusMode ? (
            <>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </>
          ) : (
            <>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </>
          )}
        </svg>
        {showLabel && (
          <span>{isFocusMode ? 'Focus Mode: ON' : 'Focus Mode'}</span>
        )}
      </button>

      {isFocusMode && suggestedAction && (
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-sm animate-pulse">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Next: {suggestedAction}</span>
        </div>
      )}
    </div>
  );
};

export default FocusModeToggle;
