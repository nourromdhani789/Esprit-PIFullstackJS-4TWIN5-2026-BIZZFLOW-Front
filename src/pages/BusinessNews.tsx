import { useState, useEffect } from 'react';
import { NewsWidget } from '../components/tools';
import { newsService, NewsArticle } from '../services/news.service';
import PageMeta from '../components/common/PageMeta';
import PageBreadcrumb from '../components/common/PageBreadCrumb';

export default function BusinessNews() {
  const [featured, setFeatured] = useState<NewsArticle | null>(null);
  const [stats, setStats] = useState({ total: 0, sources: 0 });

  useEffect(() => {
    newsService.getBusinessNews('business', 1).then(articles => {
      if (articles.length > 0) {
        setFeatured(articles[0]);
      }
    });
    
    // Mock stats for display
    setStats({ total: 50, sources: 12 });
  }, []);

  return (
    <>
      <PageMeta
        title="Business News | BizFlow AI"
        description="Latest business, finance, and stock market news from around the world"
      />
      <PageBreadcrumb pageTitle="Business News" />

      <div className="p-4 min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            📰 Business & Finance News
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Stay updated with the latest business, finance, and stock market headlines.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Live Updates</span>
          </div>
          <div className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-500 dark:text-gray-400">Sources: </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{stats.sources}+</span>
          </div>
          <div className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-500 dark:text-gray-400">Articles: </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{stats.total}+</span>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* News Widget - Takes 2 columns */}
          <div className="lg:col-span-2">
            <NewsWidget />
          </div>

          {/* Sidebar Info - Takes 1 column */}
          <div className="lg:col-span-1 space-y-4">
            {/* Featured/Top Story */}
            {featured && (
              <div className="bg-gradient-to-br from-brand-50 to-purple-50 dark:from-brand-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-brand-100 dark:border-brand-800">
                <span className="px-2 py-1 bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 rounded text-xs font-medium mb-3 inline-block">
                  🔥 Top Story
                </span>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                  {featured.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                  {featured.description}
                </p>
                <a 
                  href={featured.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-brand-600 dark:text-brand-400 hover:underline"
                >
                  Read more →
                </a>
              </div>
            )}

            {/* Categories */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Categories
              </h3>
              <div className="space-y-2">
                {['Business', 'Finance', 'Stocks', 'Technology', 'Economy'].map((cat) => (
                  <button 
                    key={cat}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <span className="text-gray-700 dark:text-gray-300">{cat}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">→</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Popular Sources */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Sources
              </h3>
              <div className="flex flex-wrap gap-2">
                {['BBC', 'Reuters', 'Bloomberg', 'CNBC', 'WSJ', 'FT'].map((source) => (
                  <span 
                    key={source}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                  >
                    {source}
                  </span>
                ))}
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
              <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                💡 News API
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                News is fetched live from NewsAPI with real-time updates from trusted sources worldwide.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
