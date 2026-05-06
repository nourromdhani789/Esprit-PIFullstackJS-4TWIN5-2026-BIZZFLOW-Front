import { newsService, NewsCategory } from '../news.service';

describe('NewsService', () => {
  describe('formatPublishedDate', () => {
    it('should return minutes ago for recent articles', () => {
      const date = new Date(Date.now() - 5 * 60000).toISOString();
      const result = newsService.formatPublishedDate(date);
      expect(result).toMatch(/^\d+m ago$/);
    });

    it('should return hours ago for articles within 24h', () => {
      const date = new Date(Date.now() - 3 * 3600000).toISOString();
      const result = newsService.formatPublishedDate(date);
      expect(result).toMatch(/^\d+h ago$/);
    });

    it('should return days ago for articles within a week', () => {
      const date = new Date(Date.now() - 3 * 86400000).toISOString();
      const result = newsService.formatPublishedDate(date);
      expect(result).toMatch(/^\d+d ago$/);
    });

    it('should return formatted date for older articles', () => {
      const date = new Date(Date.now() - 30 * 86400000).toISOString();
      const result = newsService.formatPublishedDate(date);
      expect(result).not.toMatch(/^\d+[mhd] ago$/);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('getBusinessNews', () => {
    it('should map stocks category to business', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'ok', totalResults: 0, articles: [] }),
      });
      (global as any).fetch = mockFetch;

      await newsService.getBusinessNews('stocks', 5);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('category=business'),
      );
    });

    it('should map finance category to business', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'ok', totalResults: 0, articles: [] }),
      });
      (global as any).fetch = mockFetch;

      await newsService.getBusinessNews('finance', 5);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('category=business'),
      );
    });

    it('should use provided category for valid categories', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'ok', totalResults: 0, articles: [] }),
      });
      (global as any).fetch = mockFetch;

      await newsService.getBusinessNews('technology', 5);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('category=technology'),
      );
    });

    it('should return empty array on fetch error', async () => {
      (global as any).fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      const result = await newsService.getBusinessNews();
      expect(result).toEqual([]);
    });

    it('should return empty array on non-ok response', async () => {
      (global as any).fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });
      const result = await newsService.getBusinessNews();
      expect(result).toEqual([]);
    });

    it('should add category to each article', async () => {
      const articles = [{ title: 'Test', description: null, url: 'http://test.com', urlToImage: null, publishedAt: new Date().toISOString(), source: { name: 'TestSource' } }];
      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'ok', totalResults: 1, articles }),
      });
      const result = await newsService.getBusinessNews('business');
      expect(result[0].category).toBe('business');
    });
  });
});
