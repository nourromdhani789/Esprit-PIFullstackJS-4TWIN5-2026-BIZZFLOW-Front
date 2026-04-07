import React from 'react';
import AIBadge from './AIBadge';

interface AIChatbotButtonProps {
  isOpen: boolean;
  onClick: () => void;
  hasUnread?: boolean;
  className?: string;
}

/**
 * Enhanced AI Chatbot Floating Button
 * 
 * Features:
 * - Glow effect with CSS animations
 * - Pulsing notification dot
 * - AI badge branding
 * - Smooth hover transitions
 */
export const AIChatbotButton: React.FC<AIChatbotButtonProps> = ({
  isOpen,
  onClick,
  hasUnread = false,
  className = '',
}) => {
  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      {/* Glow effect behind the button */}
      <div 
        className={`
          absolute inset-0 rounded-full 
          bg-purple-500 opacity-30 
          animate-ping-slow
          ${isOpen ? 'hidden' : 'block'}
        `} 
      />
      
      {/* Button */}
      <button
        onClick={onClick}
        className={`
          relative w-16 h-16 rounded-full 
          shadow-lg shadow-purple-500/40
          flex items-center justify-center
          transition-all duration-300 ease-out
          group
          ${isOpen 
            ? 'bg-red-500 hover:bg-red-600 rotate-45 scale-90' 
            : 'bg-gradient-to-br from-purple-600 to-blue-600 hover:scale-110 hover:shadow-xl hover:shadow-purple-500/50'
          }
        `}
        title={isOpen ? 'Close AI Assistant' : 'Open AI Assistant ✨'}
      >
        {/* Animated background gradient */}
        {!isOpen && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        )}
        
        {/* Icon */}
        <div className="relative z-10">
          {isOpen ? (
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg 
              className="w-8 h-8 text-white group-hover:animate-bounce" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" 
              />
            </svg>
          )}
        </div>
        
        {/* AI Badge on button */}
        {!isOpen && (
          <div className="absolute -top-1 -right-1">
            <AIBadge size="sm" variant="glow" text="" showIcon />
          </div>
        )}
        
        {/* Unread notification dot */}
        {hasUnread && !isOpen && (
          <div className="absolute -top-0.5 -left-0.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse" />
        )}
      </button>
      
      {/* Tooltip label */}
      {!isOpen && (
        <div className="
          absolute right-full mr-3 top-1/2 -translate-y-1/2
          bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg
          opacity-0 group-hover:opacity-100 
          transition-opacity duration-200
          whitespace-nowrap pointer-events-none
          flex items-center gap-1.5
        ">
          <span>Ask AI</span>
          <AIBadge size="sm" variant="glow" text="" showIcon={false} className="!px-1" />
        </div>
      )}
    </div>
  );
};

export default AIChatbotButton;
