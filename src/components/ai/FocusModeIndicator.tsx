import React from 'react';
import AIBadge from './AIBadge';

interface FocusModeIndicatorProps {
  isActive: boolean;
  suggestedAction?: string;
  onToggle: () => void;
  className?: string;
}

/**
 * Focus Mode Indicator Component
 * 
 * Shows when Focus Mode is active with:
 * - Visual indicator banner
 * - Suggested action
 * - Toggle button
 * - AI branding
 */
export const FocusModeIndicator: React.FC<FocusModeIndicatorProps> = ({
  isActive,
  suggestedAction,
  onToggle,
  className = '',
}) => {
  if (!isActive) return null;

  return (
    <div className={`
      fixed top-20 left-1/2 -translate-x-1/2 z-40
      animate-fade-in-down
      ${className}
    `}>
      <div className="
        bg-gradient-to-r from-purple-600 to-indigo-600 
        text-white px-6 py-3 rounded-full
        shadow-lg shadow-purple-500/30
        flex items-center gap-4
        border border-white/20
        backdrop-blur-sm
      ">
        {/* Meditation icon */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold">Focus Mode ON</span>
              <AIBadge size="sm" variant="glow" text="AI" showIcon={false} className="!bg-white/20 !text-white" />
            </div>
            {suggestedAction && (
              <p className="text-xs text-purple-100">
                Suggested: {suggestedAction}
              </p>
            )}
          </div>
        </div>
        
        {/* Divider */}
        <div className="w-px h-8 bg-white/20" />
        
        {/* Toggle button */}
        <button
          onClick={onToggle}
          className="
            px-3 py-1.5 text-sm font-medium
            bg-white/20 hover:bg-white/30
            rounded-lg transition-colors
            flex items-center gap-1.5
          "
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Exit
        </button>
      </div>
    </div>
  );
};

export default FocusModeIndicator;
