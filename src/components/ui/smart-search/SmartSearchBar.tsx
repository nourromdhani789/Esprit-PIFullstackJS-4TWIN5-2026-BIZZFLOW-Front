import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { smartSearchService, NaturalLanguageQuery, SearchResult } from '../../../services/smart-search.service';

interface SmartSearchBarProps {
  dataSource: Array<{ id: string; name?: string; email?: string; status?: string; type?: string } & Record<string, unknown>>;
  searchFields: string[];
  placeholder?: string;
  className?: string;
}

export const SmartSearchBar: React.FC<SmartSearchBarProps> = ({
  dataSource,
  searchFields,
  placeholder = 'Try "clients who didn\'t pay last month" or "invoices over 1000 TND"',
  className = '',
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedQuery, setParsedQuery] = useState<NaturalLanguageQuery | null>(null);
  const [showExamples, setShowExamples] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLDivElement>(null);

  const examples = [
    'clients who didn\'t pay last month',
    'invoices over 5000 TND',
    'unpaid invoices this week',
    'top clients this quarter',
    'expenses under 100 TND',
  ];

  // Generate navigation results when no dataSource available
  const generateNavigationResults = (naturalQuery: NaturalLanguageQuery, rawQuery: string): SearchResult[] => {
    const results: SearchResult[] = [];
    const type = naturalQuery.filters?.type;
    const amountRange = naturalQuery.filters?.amountRange;
    const status = naturalQuery.filters?.status;
    const timeContext = naturalQuery.timeContext;
    
    // Build query params based on filters
    const params = new URLSearchParams();
    if (amountRange?.min) params.set('minAmount', amountRange.min.toString());
    if (amountRange?.max) params.set('maxAmount', amountRange.max.toString());
    if (status) params.set('status', status);
    if (timeContext) params.set('time', timeContext);
    
    // Map query types to navigation paths with filters
    const getPathWithFilters = (basePath: string) => {
      const queryString = params.toString();
      return queryString ? `${basePath}?${queryString}` : basePath;
    };

    const navigationMap: Record<string, { basePath: string; title: string; subtitle: string }> = {
      'client': { basePath: '/clients', title: 'Go to Clients', subtitle: 'View filtered clients' },
      'customer': { basePath: '/clients', title: 'Go to Clients', subtitle: 'View filtered clients' },
      'invoice': { basePath: '/invoices', title: 'Go to Invoices', subtitle: `View ${status || 'all'} invoices${amountRange ? ` over ${amountRange.min} TND` : ''}` },
      'quote': { basePath: '/quotes', title: 'Go to Quotes', subtitle: 'View filtered quotes' },
      'expense': { basePath: '/expenses', title: 'Go to Expenses', subtitle: 'View filtered expenses' },
      'product': { basePath: '/products', title: 'Go to Products', subtitle: 'View filtered products' },
      'sales-order': { basePath: '/sales-orders', title: 'Go to Sales Orders', subtitle: 'View filtered sales orders' },
    };

    if (type && navigationMap[type]) {
      const nav = navigationMap[type];
      results.push({
        id: `nav-${type}`,
        title: nav.title,
        subtitle: nav.subtitle,
        type: type,
        relevanceScore: 1,
        matchedFields: ['navigation'],
        data: { path: getPathWithFilters(nav.basePath), filters: naturalQuery.filters }
      });
    }

    // Check for specific actions in query
    const queryLower = rawQuery.toLowerCase();
    if (queryLower.includes('create') || queryLower.includes('new') || queryLower.includes('add')) {
      if (queryLower.includes('invoice')) {
        results.push({
          id: 'action-create-invoice',
          title: 'Create New Invoice',
          subtitle: 'Start creating a new invoice',
          type: 'action',
          relevanceScore: 0.9,
          matchedFields: ['action'],
          data: { path: '/invoices/create' }
        });
      }
      if (queryLower.includes('client')) {
        results.push({
          id: 'action-create-client',
          title: 'Add New Client',
          subtitle: 'Add a new client to your list',
          type: 'action',
          relevanceScore: 0.9,
          matchedFields: ['action'],
          data: { path: '/clients', action: 'create' }
        });
      }
      if (queryLower.includes('quote')) {
        results.push({
          id: 'action-create-quote',
          title: 'Create New Quote',
          subtitle: 'Start creating a new quote',
          type: 'action',
          relevanceScore: 0.9,
          matchedFields: ['action'],
          data: { path: '/quotes/new' }
        });
      }
    }

    // Dashboard / Reports
    if (queryLower.includes('dashboard') || queryLower.includes('home') || queryLower.includes('overview')) {
      results.push({
        id: 'nav-dashboard',
        title: 'Go to Dashboard',
        subtitle: 'View your business overview',
        type: 'navigation',
        relevanceScore: 1,
        matchedFields: ['navigation'],
        data: { path: '/dashboard' }
      });
    }

    return results;
  };

  const processSearch = useCallback(async () => {
    if (!query.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsProcessing(true);
    try {
      const naturalQuery = await smartSearchService.processNaturalLanguageQuery(query);
      setParsedQuery(naturalQuery);

      // If no dataSource but we have a type filter, create navigation suggestions
      if (!dataSource || dataSource.length === 0) {
        const navResults = generateNavigationResults(naturalQuery, query);
        setResults(navResults);
        setShowResults(navResults.length > 0);
        setIsProcessing(false);
        return;
      }

      const searchResults = await smartSearchService.search(
        dataSource,
        naturalQuery,
        searchFields as (keyof typeof dataSource[0])[]
      );

      setResults(searchResults);
      setShowResults(searchResults.length > 0);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [query, dataSource, searchFields]);

  const getPathForResult = (result: SearchResult): string | null => {
    // Check if result has navigation path in data
    if (result.data?.path) {
      return result.data.path as string;
    }
    
    const type = result.type || parsedQuery?.filters?.type;
    
    switch (type) {
      case 'client':
      case 'customer':
        return `/clients/${result.id}`;
      case 'invoice':
        return `/invoices/${result.id}`;
      case 'quote':
      case 'estimation':
        return `/quotes/${result.id}`;
      case 'expense':
        return `/expenses`;
      case 'product':
        return `/products`;
      case 'sales-order':
        return `/sales-orders/${result.id}`;
      case 'action':
      case 'navigation':
        // These should have data.path, but fallback to root if not
        return '/';
      default:
        if (result.data?.clientName || result.data?.email) return `/clients/${result.id}`;
        if (result.data?.invoiceNumber) return `/invoices/${result.id}`;
        if (result.data?.quoteNumber) return `/quotes/${result.id}`;
        return null;
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setShowResults(false);
    setQuery('');
    setShowExamples(false);
    
    const path = getPathForResult(result);
    if (path) {
      navigate(path);
    }
  };

  const handleQuickAction = () => {
    if (parsedQuery?.filters?.type === 'invoice') {
      navigate('/invoices');
    } else if (parsedQuery?.filters?.type === 'client') {
      navigate('/clients');
    } else if (parsedQuery?.filters?.type === 'quote') {
      navigate('/quotes');
    } else if (parsedQuery?.filters?.type === 'expense') {
      navigate('/expenses');
    }
    setShowResults(false);
    setQuery('');
    setShowExamples(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && results.length > 0) {
      handleResultClick(results[0]);
    } else if (e.key === 'Escape') {
      setShowResults(false);
      setShowExamples(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (query.trim()) {
        processSearch();
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, processSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowResults(false);
        setShowExamples(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={inputRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowExamples(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <svg
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {isProcessing && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Search Examples */}
      {showExamples && !query && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {examples.map((example, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(example);
                  setShowExamples(false);
                }}
                className="text-sm px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full text-gray-700 dark:text-gray-300 transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results Dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
          <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {results.length} result{results.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={handleQuickAction}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              View all {parsedQuery?.filters?.type || 'results'} →
            </button>
          </div>
          
          {results.map((result, idx) => (
            <button
              key={result.id}
              onClick={() => handleResultClick(result)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                idx !== results.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{result.title}</p>
                  {result.subtitle && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{result.subtitle}</p>
                  )}
                </div>
                <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                  {result.type}
                </span>
              </div>
              {result.matchedFields.length > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  Matched: {result.matchedFields.join(', ')}
                </p>
              )}
            </button>
          ))}
          
          <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-xs text-center text-gray-500">
            Press Enter to open first result, or click any result to navigate
          </div>
        </div>
      )}

      {/* No Results */}
      {showResults && results.length === 0 && query && !isProcessing && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-gray-500 dark:text-gray-400 text-center">
            No results found for "{query}"
          </p>
          {parsedQuery?.filters?.type && (
            <button
              onClick={handleQuickAction}
              className="mt-2 w-full text-center text-sm text-blue-600 hover:text-blue-700"
            >
              View all {parsedQuery.filters.type}s →
            </button>
          )}
        </div>
      )}

      {/* Parsed Query Display */}
      {parsedQuery && query && !showResults && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-gray-500 dark:text-gray-400">Detected:</span>
          {parsedQuery.filters.type && parsedQuery.filters.type !== 'all' && (
            <button 
              onClick={handleQuickAction}
              className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 transition-colors"
            >
              View {parsedQuery.filters.type}s →
            </button>
          )}
          {parsedQuery.filters.status && (
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-md">
              Status: {parsedQuery.filters.status}
            </span>
          )}
          {parsedQuery.timeContext && (
            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-md">
              Time: {parsedQuery.timeContext}
            </span>
          )}
          {parsedQuery.filters.amountRange && (
            <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-md">
              Amount: {parsedQuery.filters.amountRange.min ? `> ${parsedQuery.filters.amountRange.min}` : `< ${parsedQuery.filters.amountRange.max}`}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// Hook for using smart search
export const useSmartSearch = <T extends { id: string }>(
  data: T[],
  searchFields: (keyof T)[]
) => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [parsedQuery, setParsedQuery] = useState<NaturalLanguageQuery | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setParsedQuery(null);
      return;
    }

    setIsSearching(true);
    try {
      const naturalQuery = await smartSearchService.processNaturalLanguageQuery(query);
      setParsedQuery(naturalQuery);

      const searchResults = await smartSearchService.search(data, naturalQuery, searchFields);
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [data, searchFields]);

  return { results, parsedQuery, isSearching, search };
};

export default SmartSearchBar;
