import { currencyService } from '../currency.service';

describe('CurrencyService', () => {
  describe('getSupportedCurrencies', () => {
    it('should return array of currencies', () => {
      const currencies = currencyService.getSupportedCurrencies();
      expect(currencies.length).toBeGreaterThan(0);
      expect(currencies[0]).toHaveProperty('code');
      expect(currencies[0]).toHaveProperty('name');
      expect(currencies[0]).toHaveProperty('symbol');
      expect(currencies[0]).toHaveProperty('type');
    });

    it('should include USD', () => {
      const currencies = currencyService.getSupportedCurrencies();
      const usd = currencies.find(c => c.code === 'USD');
      expect(usd).toBeDefined();
      expect(usd!.name).toBe('US Dollar');
      expect(usd!.type).toBe('fiat');
    });

    it('should include TND', () => {
      const currencies = currencyService.getSupportedCurrencies();
      const tnd = currencies.find(c => c.code === 'TND');
      expect(tnd).toBeDefined();
      expect(tnd!.name).toBe('Tunisian Dinar');
    });

    it('should include crypto currencies', () => {
      const currencies = currencyService.getSupportedCurrencies();
      const btc = currencies.find(c => c.code === 'BTC');
      expect(btc).toBeDefined();
      expect(btc!.type).toBe('crypto');
    });
  });

  describe('formatAmount', () => {
    it('should format fiat amount with 2 decimals', () => {
      const result = currencyService.formatAmount(1234.5, 'USD');
      expect(result).toContain('1,234.50');
    });

    it('should format BTC with 6 decimals', () => {
      const result = currencyService.formatAmount(0.123456, 'BTC');
      expect(result).toContain('0.123456');
    });

    it('should format unknown currency with code suffix', () => {
      const result = currencyService.formatAmount(100, 'XYZ');
      expect(result).toContain('100.00');
      expect(result).toContain('XYZ');
    });
  });

  describe('getSymbol', () => {
    it('should return symbol for known currency', () => {
      expect(currencyService.getSymbol('USD')).toBe('$');
      expect(currencyService.getSymbol('EUR')).toBe('€');
      expect(currencyService.getSymbol('GBP')).toBe('£');
    });

    it('should return code for unknown currency', () => {
      expect(currencyService.getSymbol('XYZ')).toBe('XYZ');
    });
  });

  describe('convert', () => {
    it('should return same amount when from === to', async () => {
      const result = await currencyService.convert('USD', 'USD', 100);
      expect(result).toBe(100);
    });
  });
});
