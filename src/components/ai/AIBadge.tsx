import React from 'react';

interface AIBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'subtle' | 'glow';
  showIcon?: boolean;
  text?: string;
  className?: string;
}

/**
 * AI Badge Component
 * 
 * Displays an AI indicator with sparkles icon
 * Use this to label AI-powered features throughout the app
 */
export const AIBadge: React.FC<AIBadgeProps> = ({
  size = 'sm',
  variant = 'default',
  showIcon = true,
  text = 'AI',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const variantClasses = {
    default: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 dark:shadow-[0_0_10px_rgba(168,85,247,0.3)]',
    subtle: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
    glow: 'bg-purple-500 text-white shadow-lg shadow-purple-500/30 dark:shadow-[0_0_20px_rgba(168,85,247,0.5)] animate-pulse',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-medium
        transition-all duration-200
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      title="Powered by AI"
    >
      {showIcon && (
        <svg
          className={`${iconSizes[size]} ${variant === 'glow' ? 'animate-spin-slow' : ''}`}
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
      )}
      <span>{text}</span>
    </span>
  );
};

export default AIBadge;
