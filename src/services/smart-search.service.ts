import { GROQ_API_KEY, GROQ_API_URL } from './ai.service';

export interface SearchFilters {
  type?: 'client' | 'invoice' | 'quote' | 'expense' | 'product' | 'all';
  status?: string;
  dateRange?: { from?: Date; to?: Date };
  amountRange?: { min?: number; max?: number };
}

export interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  data: Record<string, unknown>;
  relevanceScore: number;
  matchedFields: string[];
}

export interface NaturalLanguageQuery {
  original: string;
  keywords: string[];
  intent: 'search' | 'filter' | 'aggregate' | 'compare';
  filters: SearchFilters;
  timeContext?: string;
}

class SmartSearchService {
  // Level 1: Keyword-based search (required)
  async processNaturalLanguageQuery(query: string): Promise<NaturalLanguageQuery> {
    const normalizedQuery = query.toLowerCase().trim();
    
    // Extract keywords
    const keywords = this.extractKeywords(normalizedQuery);
    
    // Determine intent
    const intent = this.detectIntent(normalizedQuery);
    
    // Extract filters
    const filters = this.extractFilters(normalizedQuery);
    
    // Extract time context
    const timeContext = this.extractTimeContext(normalizedQuery);

    return {
      original: query,
      keywords,
      intent,
      filters,
      timeContext,
    };
  }

  private extractKeywords(query: string): string[] {
    // Remove common words and extract meaningful keywords
    const stopWords = new Set([
      'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'who', 'what', 'where', 'when', 'why', 'how', 'is', 'are', 'was', 'were', 'be', 'been',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
      'show', 'me', 'find', 'get', 'list', 'all', 'any', 'my', 'this', 'that'
    ]);

    return query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
  }

  private detectIntent(query: string): 'search' | 'filter' | 'aggregate' | 'compare' {
    if (query.includes('compare') || query.includes('versus') || query.includes('vs')) {
      return 'compare';
    }
    if (query.includes('total') || query.includes('sum') || query.includes('average') || query.includes('count')) {
      return 'aggregate';
    }
    if (query.includes('didn') || query.includes('not pay') || query.includes('overdue') || query.includes('unpaid')) {
      return 'filter';
    }
    return 'search';
  }

  private extractFilters(query: string): SearchFilters {
    const filters: SearchFilters = { type: 'all' };

    // Detect entity type
    if (query.includes('client') || query.includes('customer')) {
      filters.type = 'client';
    } else if (query.includes('invoice')) {
      filters.type = 'invoice';
    } else if (query.includes('quote') || query.includes('estimation')) {
      filters.type = 'quote';
    } else if (query.includes('expense') || query.includes('spending')) {
      filters.type = 'expense';
    } else if (query.includes('product')) {
      filters.type = 'product';
    }

    // Detect status
    if (query.includes('unpaid') || query.includes('didn') || query.includes('not pay') || query.includes('outstanding')) {
      filters.status = 'unpaid';
    } else if (query.includes('paid') || query.includes('completed')) {
      filters.status = 'paid';
    } else if (query.includes('pending')) {
      filters.status = 'pending';
    } else if (query.includes('overdue')) {
      filters.status = 'overdue';
    } else if (query.includes('draft')) {
      filters.status = 'draft';
    }

    // Detect date range
    const dateRange: { from?: Date; to?: Date } = {};
    
    if (query.includes('today')) {
      const today = new Date();
      dateRange.from = today;
      dateRange.to = today;
    } else if (query.includes('yesterday')) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      dateRange.from = yesterday;
      dateRange.to = yesterday;
    } else if (query.includes('this week')) {
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      dateRange.from = startOfWeek;
      dateRange.to = new Date();
    } else if (query.includes('last week')) {
      const now = new Date();
      const lastWeekStart = new Date(now.setDate(now.getDate() - now.getDay() - 7));
      const lastWeekEnd = new Date(now.setDate(now.getDate() + 6));
      dateRange.from = lastWeekStart;
      dateRange.to = lastWeekEnd;
    } else if (query.includes('this month')) {
      const now = new Date();
      dateRange.from = new Date(now.getFullYear(), now.getMonth(), 1);
      dateRange.to = new Date();
    } else if (query.includes('last month')) {
      const now = new Date();
      dateRange.from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      dateRange.to = new Date(now.getFullYear(), now.getMonth(), 0);
    }

    if (dateRange.from || dateRange.to) {
      filters.dateRange = dateRange;
    }

    // Detect amount range - improved patterns
    // Matches: "over 100", "more than 50", "above 1000", "less than 500", "under 100", "below 50"
    // Also: "price is over 5", "amount over 100", "is greater than 50", etc.
    const amountPatterns = [
      // Pattern: (price/amount/is) + (optional words) + (over/more than/above) + number
      { regex: /(?:price|amount|cost|value|total)?(?:\s+is)?\s+(over|more than|above|greater than|higher than|>+)\s+(\d+(?:\.\d+)?)/i, direction: 'min' },
      // Pattern: (price/amount/is) + (optional words) + (under/less than/below) + number
      { regex: /(?:price|amount|cost|value|total)?(?:\s+is)?\s+(under|less than|below|lower than|smaller than|<+)\s+(\d+(?:\.\d+)?)/i, direction: 'max' },
      // Pattern: number + TND/DT with optional comparison words
      { regex: /(?:over|more than|above)\s+(\d+(?:\.\d+)?)\s*(?:TND|DT|din?ar)?/i, direction: 'min' },
      { regex: /(?:under|less than|below)\s+(\d+(?:\.\d+)?)\s*(?:TND|DT|din?ar)?/i, direction: 'max' },
    ];

    for (const pattern of amountPatterns) {
      const match = query.match(pattern.regex);
      if (match) {
        const amount = parseFloat(match[1] || match[2]);
        if (!isNaN(amount)) {
          if (pattern.direction === 'min') {
            filters.amountRange = { ...(filters.amountRange || {}), min: amount };
          } else {
            filters.amountRange = { ...(filters.amountRange || {}), max: amount };
          }
          break; // Stop after first match
        }
      }
    }

    return filters;
  }

  private extractTimeContext(query: string): string | undefined {
    const timePatterns = [
      'today', 'yesterday', 'this week', 'last week', 
      'this month', 'last month', 'this quarter', 'last quarter',
      'this year', 'last year'
    ];
    
    for (const pattern of timePatterns) {
      if (query.includes(pattern)) {
        return pattern;
      }
    }
    return undefined;
  }

  // Search across data sources
  async search<T extends { id: string }>(
    items: T[],
    query: NaturalLanguageQuery,
    searchFields: (keyof T)[]
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    
    for (const item of items) {
      let relevanceScore = 0;
      const matchedFields: string[] = [];

      for (const field of searchFields) {
        const value = String(item[field] ?? '').toLowerCase();
        
        for (const keyword of query.keywords) {
          if (value.includes(keyword.toLowerCase())) {
            relevanceScore += 1;
            if (!matchedFields.includes(String(field))) {
              matchedFields.push(String(field));
            }
          }
        }
      }

      if (relevanceScore > 0) {
        results.push({
          id: item.id,
          type: query.filters.type || 'unknown',
          title: this.extractTitle(item),
          subtitle: this.extractSubtitle(item),
          data: item as Record<string, unknown>,
          relevanceScore,
          matchedFields,
        });
      }
    }

    // Sort by relevance
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  // Level 2: AI-enhanced semantic search (optional, requires Groq API)
  async semanticSearch(query: string, context: string): Promise<string> {
    if (!GROQ_API_KEY) {
      throw new Error('Groq API key not configured for semantic search');
    }

    const response = await fetch(`${GROQ_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: `You are a search assistant. Given a user query and context, provide relevant search results. Be concise and specific.`
          },
          {
            role: 'user',
            content: `Query: "${query}"\n\nContext: ${context}`
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error('Semantic search failed');
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'No results found';
  }

  private extractTitle(item: Record<string, unknown>): string {
    const titleFields = ['name', 'title', 'clientName', 'productName', 'description', 'id'];
    for (const field of titleFields) {
      if (item[field]) {
        return String(item[field]);
      }
    }
    return 'Untitled';
  }

  private extractSubtitle(item: Record<string, unknown>): string | undefined {
    const subtitleFields = ['email', 'status', 'amount', 'date', 'category'];
    for (const field of subtitleFields) {
      if (item[field]) {
        return `${field}: ${item[field]}`;
      }
    }
    return undefined;
  }
}

export const smartSearchService = new SmartSearchService();
export default smartSearchService;
