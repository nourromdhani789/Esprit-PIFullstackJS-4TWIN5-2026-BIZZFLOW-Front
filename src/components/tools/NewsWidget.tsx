import { useState, useEffect, useCallback } from 'react';
import { newsService, NewsArticle, NewsCategory } from '../../services/news.service';

interface NewsWidgetProps {
  className?: string;
  initialCategory?: NewsCategory;
}

export function NewsWidget({ className = '', initialCategory = 'business' }: NewsWidgetProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [category, setCategory] = useState<NewsCategory>(initialCategory);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  // Fetch news
  const fetchNews = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await newsService.getBusinessNews(category, 6);
      setArticles(data);
    } catch (err) {
      setError('Failed to load news');
      console.error('News fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [category]);

  // Initial fetch and category change
  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // Category options
  const categories: { value: NewsCategory; label: string; icon: string }[] = [
    { value: 'business', label: 'Business', icon: '💼' },
    { value: 'finance', label: 'Finance', icon: '💰' },
    { value: 'stocks', label: 'Stocks', icon: '📈' },
  ];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📰</span>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Business News
          </h3>
        </div>
        <button
          onClick={fetchNews}
          disabled={isLoading}
          className="p-2 text-gray-400 hover:text-brand-500 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Refresh news"
        >
          <svg className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-4">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              category === cat.value
                ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <span className="mr-1">{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="text-center py-6">
          <span className="text-3xl mb-2 block">⚠️</span>
          <p className="text-gray-500 dark:text-gray-400">{error}</p>
          <button
            onClick={fetchNews}
            className="mt-3 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm hover:bg-brand-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Articles List */}
      {!isLoading && !error && articles.length > 0 && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {articles.map((article, index) => (
            <article
              key={index}
              onClick={() => setSelectedArticle(article)}
              className="group flex gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
            >
              {/* Thumbnail */}
              <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-700 flex-shrink-0 overflow-hidden">
                {article.urlToImage ? (
                  <img
                    src={article.urlToImage}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    📰
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {article.title}
                </h4>
                {article.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                    {article.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400 dark:text-gray-500">
                  <span className="font-medium">{article.source.name}</span>
                  <span>•</span>
                  <span>{newsService.formatPublishedDate(article.publishedAt)}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && articles.length === 0 && (
        <div className="text-center py-6">
          <span className="text-3xl mb-2 block">📭</span>
          <p className="text-gray-500 dark:text-gray-400">No news articles found</p>
        </div>
      )}

      {/* Article Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-black/50 z-[999999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header Image */}
            {selectedArticle.urlToImage && (
              <div className="h-48 overflow-hidden rounded-t-2xl">
                <img
                  src={selectedArticle.urlToImage}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            
            <div className="p-6">
              {/* Source & Date */}
              <div className="flex items-center gap-2 mb-3 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-medium">{selectedArticle.source.name}</span>
                <span>•</span>
                <span>{newsService.formatPublishedDate(selectedArticle.publishedAt)}</span>
              </div>

              {/* Title */}
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                {selectedArticle.title}
              </h2>

              {/* Description */}
              {selectedArticle.description && (
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {selectedArticle.description}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <a
                  href={selectedArticle.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-4 py-2 bg-brand-500 text-white text-center rounded-lg hover:bg-brand-600 transition-colors"
                >
                  Read Full Article
                </a>
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
