import React from 'react';
import AIBadge from './AIBadge';

interface AIResultCardProps {
  title?: string;
  children: React.ReactNode;
  type?: 'insight' | 'suggestion' | 'analysis' | 'recommendation';
  confidence?: number;
  className?: string;
  onApply?: () => void;
  onDismiss?: () => void;
}

/**
 * AI Result Card Component
 * 
 * Visually distinguishes AI-generated output with:
 * - AI badge header
 * - Different background colors based on type
 * - Confidence indicator
 * - Apply/Dismiss actions
 */
export const AIResultCard: React.FC<AIResultCardProps> = ({
  title = 'AI Insight',
  children,
  type = 'insight',
  confidence,
  className = '',
  onApply,
  onDismiss,
}) => {
  const typeStyles = {
    insight: {
      container: 'bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20',
      border: 'border-purple-200 dark:border-purple-800',
      icon: 'text-purple-600',
      iconBg: 'bg-purple-100 dark:bg-purple-800',
    },
    suggestion: {
      container: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
      border: 'border-green-200 dark:border-green-800',
      icon: 'text-green-600',
      iconBg: 'bg-green-100 dark:bg-green-800',
    },
    analysis: {
      container: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
      border: 'border-amber-200 dark:border-amber-800',
      icon: 'text-amber-600',
      iconBg: 'bg-amber-100 dark:bg-amber-800',
    },
    recommendation: {
      container: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'text-blue-600',
      iconBg: 'bg-blue-100 dark:bg-blue-800',
    },
  };

  const styles = typeStyles[type];

  const typeIcons = {
    insight: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    ),
    suggestion: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
    analysis: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    ),
    recommendation: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    ),
  };

  return (
    <div className={`
      relative rounded-xl border-2 p-4
      ${styles.container}
      ${styles.border}
      ${className}
    `}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* Type Icon */}
          <div className={`w-8 h-8 rounded-lg ${styles.iconBg} flex items-center justify-center`}>
            <svg className={`w-4 h-4 ${styles.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {typeIcons[type]}
            </svg>
          </div>
          
          {/* Title & AI Badge */}
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900 dark:text-white">{title}</h4>
            <AIBadge size="sm" />
          </div>
        </div>
        
        {/* Confidence Badge */}
        {confidence !== undefined && (
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {Math.round(confidence * 100)}% confidence
          </span>
        )}
      </div>
      
      {/* Content */}
      <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
        {children}
      </div>
      
      {/* Actions */}
      {(onApply || onDismiss) && (
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
          {onApply && (
            <button
              onClick={onApply}
              className="
                inline-flex items-center gap-1.5 px-3 py-1.5
                text-xs font-medium rounded-lg
                bg-purple-600 text-white
                hover:bg-purple-700
                transition-colors
              "
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Apply
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="
                inline-flex items-center gap-1.5 px-3 py-1.5
                text-xs font-medium rounded-lg
                text-gray-600 hover:text-gray-800
                hover:bg-gray-100 dark:hover:bg-gray-700
                transition-colors
              "
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Dismiss
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AIResultCard;
