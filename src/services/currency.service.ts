// CurrencyAPI Service - Real-time Currency Conversion
// No storage - fetches live rates only

const CURRENCY_API_KEY = 'cur_live_dSk7PycwrnlPzC0XdUQKiqOrRQ9pSz0uRZJ4jKzj';
const CURRENCY_API_URL = 'https://api.currencyapi.com/v3';

export interface CurrencyRates {
  [code: string]: {
    code: string;
    value: number;
  };
}

export interface CurrencyResponse {
  meta: {
    last_updated_at: string;
  };
  data: CurrencyRates;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  type: 'fiat' | 'crypto';
}

export const currencyService = {
  // Supported currencies with metadata
  getSupportedCurrencies(): Currency[] {
    return [
      // Major Fiat Currencies
      { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', type: 'fiat' },
      { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', type: 'fiat' },
      { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', type: 'fiat' },
      { code: 'TND', name: 'Tunisian Dinar', symbol: 'DT', flag: '🇹🇳', type: 'fiat' },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', type: 'fiat' },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', type: 'fiat' },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦', type: 'fiat' },
      { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', flag: '🇨🇭', type: 'fiat' },
      { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳', type: 'fiat' },
      { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪', type: 'fiat' },
      { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿', type: 'fiat' },
      { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬', type: 'fiat' },
      { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰', type: 'fiat' },
      { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴', type: 'fiat' },
      { code: 'MXN', name: 'Mexican Peso', symbol: '$', flag: '🇲🇽', type: 'fiat' },
      { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳', type: 'fiat' },
      { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷', type: 'fiat' },
      { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦', type: 'fiat' },
      { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪', type: 'fiat' },
      { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦', type: 'fiat' },
      { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷', type: 'fiat' },
      { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', flag: '🇪🇬', type: 'fiat' },
      { code: 'QAR', name: 'Qatari Riyal', symbol: '﷼', flag: '🇶🇦', type: 'fiat' },
      
      // Cryptocurrencies
      { code: 'BTC', name: 'Bitcoin', symbol: '₿', flag: '₿', type: 'crypto' },
      { code: 'ETH', name: 'Ethereum', symbol: 'Ξ', flag: 'Ξ', type: 'crypto' },
      { code: 'USDT', name: 'Tether', symbol: '₮', flag: '₮', type: 'crypto' },
      { code: 'BNB', name: 'BNB', symbol: 'B', flag: 'B', type: 'crypto' },
      { code: 'XRP', name: 'XRP', symbol: '✕', flag: '✕', type: 'crypto' },
      { code: 'SOL', name: 'Solana', symbol: '◎', flag: '◎', type: 'crypto' },
    ];
  },

  // Fetch latest exchange rates
  async getLatestRates(baseCurrency: string = 'USD'): Promise<CurrencyResponse> {
    try {
      const response = await fetch(
        `${CURRENCY_API_URL}/latest?apikey=${CURRENCY_API_KEY}&base_currency=${baseCurrency}`
      );
      
      if (!response.ok) {
        throw new Error(`CurrencyAPI error: ${response.status}`);
      }
      
      const data: CurrencyResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Currency fetch error:', error);
      throw error;
    }
  },

  // Convert amount between currencies
  async convert(from: string, to: string, amount: number): Promise<number> {
    try {
      if (from === to) return amount;
      
      const rates = await this.getLatestRates(from);
      const rate = rates.data[to]?.value;
      
      if (!rate) {
        throw new Error(`Exchange rate not found for ${to}`);
      }
      
      return amount * rate;
    } catch (error) {
      console.error('Conversion error:', error);
      throw error;
    }
  },


  // Format currency amount
  formatAmount(amount: number, currencyCode: string): string {
    const currency = this.getSupportedCurrencies().find(c => c.code === currencyCode);
    
    if (!currency) {
      return `${amount.toFixed(2)} ${currencyCode}`;
    }

    // Handle crypto differently (more decimals)
    const decimals = currency.type === 'crypto' && (currencyCode === 'BTC' || currencyCode === 'ETH') ? 6 : 2;
    
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);
  },

  // Get currency symbol
  getSymbol(currencyCode: string): string {
    const currency = this.getSupportedCurrencies().find(c => c.code === currencyCode);
    return currency?.symbol || currencyCode;
  }
};
