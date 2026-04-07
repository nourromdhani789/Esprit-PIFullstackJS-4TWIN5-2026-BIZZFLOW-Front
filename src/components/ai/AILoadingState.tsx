import React from 'react';

interface AILoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * AI Loading State Component
 * 
 * Shows animated loading indicator with AI branding
 * Messages like "✨ AI is analyzing...", "🤖 Generating insights..."
 */
export const AILoadingState: React.FC<AILoadingStateProps> = ({
  message = 'AI is analyzing...',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'text-xs gap-2',
    md: 'text-sm gap-3',
    lg: 'text-base gap-4',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div className={`inline-flex items-center ${sizeClasses[size]} ${className}`}>
      {/* Animated sparkles icon */}
      <svg
        className={`${iconSizes[size]} text-purple-500 animate-pulse`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
        />
      </svg>
      
      {/* Loading text with gradient animation */}
      <span className="font-medium text-purple-600 dark:text-purple-400">
        <span className="animate-pulse">{message}</span>
      </span>
      
      {/* Animated dots */}
      <span className="flex gap-0.5">
        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </span>
    </div>
  );
};

interface AIGeneratingStateProps {
  action?: string;
  className?: string;
}

/**
 * AI Generating State - Full width card version
 * 
 * For when AI is generating reports, insights, etc.
 */
export const AIGeneratingState: React.FC<AIGeneratingStateProps> = ({
  action = 'Generating',
  className = '',
}) => {
  return (
    <div className={`
      flex flex-col items-center justify-center
      p-8 bg-gradient-to-br from-purple-50 to-blue-50 
      dark:from-purple-900/20 dark:to-blue-900/20
      rounded-xl border border-purple-200 dark:border-purple-800
      ${className}
    `}>
      {/* Animated brain/sparkles icon */}
      <div className="relative mb-4">
        <div className="absolute inset-0 bg-purple-500 rounded-full blur-xl opacity-30 animate-pulse" />
        <div className="relative w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg">
          <svg
            className="w-8 h-8 text-purple-600 animate-spin-slow"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
      </div>
      
      {/* Loading message */}
      <h4 className="text-lg font-semibold text-purple-900 dark:text-purple-300 mb-1">
        {action}
      </h4>
      <p className="text-sm text-purple-600 dark:text-purple-400">
        <span className="animate-pulse">✨ AI is working on it</span>
      </p>
      
      {/* Progress bar */}
      <div className="w-48 h-1 bg-purple-200 dark:bg-purple-800 rounded-full mt-4 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-loading-bar" />
      </div>
    </div>
  );
};

export default AILoadingState;
