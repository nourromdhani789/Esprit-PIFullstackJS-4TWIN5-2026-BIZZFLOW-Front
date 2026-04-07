import React from 'react';
import AIBadge from './AIBadge';

interface AISmartSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  interpretedQuery?: string;
  isLoading?: boolean;
  className?: string;
}

/**
 * AI-Enhanced Smart Search Component
 * 
 * Features:
 * - Natural language placeholder
 * - Shows interpreted query
 * - AI badge
 * - Loading state
 */
export const AISmartSearch: React.FC<AISmartSearchProps> = ({
  query,
  onQueryChange,
  onSearch,
  interpretedQuery,
  isLoading = false,
  className = '',
}) => {
  const placeholderExamples = [
    'Try: "Unpaid invoices from last month"',
    'Try: "Clients who owe more than 1000 TND"',
    'Try: "Show me expenses this quarter"',
    'Try: "Best selling products"',
  ];

  const [placeholderIndex, setPlaceholderIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholderExamples.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input Container */}
      <div className="relative">
        {/* AI Icon */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
          <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-md">
            <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Input */}
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholderExamples[placeholderIndex]}
          className="
            w-full pl-14 pr-32 py-3.5
            bg-white dark:bg-gray-800
            border-2 border-purple-200 dark:border-purple-800
            rounded-xl
            text-gray-900 dark:text-white
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10
            transition-all duration-200
          "
        />

        {/* Right side actions */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {/* AI Badge */}
          <AIBadge size="sm" />
          
          {/* Search Button */}
          <button
            onClick={onSearch}
            disabled={isLoading}
            className="
              px-4 py-2
              bg-purple-600 hover:bg-purple-700
              text-white font-medium
              rounded-lg
              transition-colors
              disabled:opacity-50
              flex items-center gap-2
            "
          >
            {isLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Thinking...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Search</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Interpreted Query Display */}
      {interpretedQuery && query && (
        <div className="mt-2 flex items-center gap-2 text-sm animate-fade-in">
          <span className="text-gray-500 dark:text-gray-400">Understanding:</span>
          <span className="text-purple-600 dark:text-purple-400 font-medium">
            {interpretedQuery}
          </span>
          <AIBadge size="sm" variant="subtle" showIcon={false} text="AI" />
        </div>
      )}

      {/* Tips */}
      {!query && (
        <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Use natural language
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Filter by dates, amounts, status
          </span>
        </div>
      )}
    </div>
  );
};

export default AISmartSearch;
