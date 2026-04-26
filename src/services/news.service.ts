// NewsAPI Service - Business/Finance News
// No storage - fetches live data only

const NEWS_API_KEY = '5fbc2aa1bbc54cd2b4e63bac70cfef9f';
const NEWS_API_URL = 'https://newsapi.org/v2';

export interface NewsArticle {
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  source: {
    name: string;
  };
  category?: string;
}

export interface NewsResponse {
  status: string;
  totalResults: number;
  articles: NewsArticle[];
}

export type NewsCategory = 'business' | 'finance' | 'stocks' | 'technology' | 'general';

export const newsService = {
  // Fetch top business headlines (uses /top-headlines which works on free plan)
  async getBusinessNews(category: NewsCategory = 'business', pageSize: number = 10): Promise<NewsArticle[]> {
    try {
      // Free plan only supports /top-headlines, not /everything
      // Map 'stocks' and 'finance' to 'business' since those aren't valid categories
      const apiCategory = category === 'stocks' || category === 'finance' ? 'business' : category;
      // Free plan requires country parameter (using 'us' for US news)
      const response = await fetch(
        `${NEWS_API_URL}/top-headlines?country=us&category=${apiCategory}&pageSize=${pageSize}&apiKey=${NEWS_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`NewsAPI error: ${response.status}`);
      }
      
      const data: NewsResponse = await response.json();
      
      if (data.status !== 'ok') {
        throw new Error('Failed to fetch news');
      }
      
      // Add category to each article
      return data.articles.map(article => ({
        ...article,
        category
      }));
    } catch (error) {
      console.error('News fetch error:', error);
      return [];
    }
  },

  // Format date for display
  formatPublishedDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }
};
