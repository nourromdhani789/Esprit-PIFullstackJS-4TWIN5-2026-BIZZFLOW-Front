import { useState, useEffect, useCallback } from 'react';
import { currencyService, Currency } from '../../services/currency.service';

interface CurrencyConverterProps {
  className?: string;
}

export function CurrencyConverter({ className = '' }: CurrencyConverterProps) {
  // State
  const [amount, setAmount] = useState<string>('100');
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('TND');
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [rates, setRates] = useState<Record<string, number>>({});
  const [showAllCurrencies, setShowAllCurrencies] = useState(false);

  const currencies = currencyService.getSupportedCurrencies();
  
  // Popular currencies for quick select
  const popularCurrencies = ['USD', 'EUR', 'GBP', 'TND', 'BTC', 'ETH'];
  const displayedCurrencies = showAllCurrencies 
    ? currencies 
    : currencies.filter(c => popularCurrencies.includes(c.code));

  // Fetch rates on mount
  const fetchRates = useCallback(async () => {
    try {
      const response = await currencyService.getLatestRates(fromCurrency);
      const rateMap: Record<string, number> = {};
      Object.entries(response.data).forEach(([code, data]) => {
        rateMap[code] = data.value;
      });
      setRates(rateMap);
    } catch (err) {
      console.error('Failed to fetch rates:', err);
    }
  }, [fromCurrency]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  // Auto-convert when inputs change
  useEffect(() => {
    const numAmount = parseFloat(amount);
    if (!isNaN(numAmount) && numAmount > 0 && rates[toCurrency]) {
      const rate = rates[toCurrency];
      setConvertedAmount(numAmount * rate);
    }
  }, [amount, fromCurrency, toCurrency, rates]);

  // Swap currencies
  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  // Get currency details
  const getCurrency = (code: string): Currency | undefined => {
    return currencies.find(c => c.code === code);
  };

  const fromCurr = getCurrency(fromCurrency);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💱</span>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Currency Converter
          </h3>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
          <span>Live rates</span>
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Amount Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Amount
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-lg">
            {fromCurr?.symbol}
          </span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Currency Selection */}
      <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center mb-6">
        {/* From Currency */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            From
          </label>
          <select
            value={fromCurrency}
            onChange={(e) => setFromCurrency(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {displayedCurrencies.map((curr) => (
              <option key={curr.code} value={curr.code}>
                {curr.flag} {curr.code} - {curr.name}
              </option>
            ))}
          </select>
        </div>

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          className="mt-5 p-2 text-gray-500 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
          title="Swap currencies"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </button>

        {/* To Currency */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            To
          </label>
          <select
            value={toCurrency}
            onChange={(e) => setToCurrency(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {displayedCurrencies.map((curr) => (
              <option key={curr.code} value={curr.code}>
                {curr.flag} {curr.code} - {curr.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Show All Toggle */}
      <button
        onClick={() => setShowAllCurrencies(!showAllCurrencies)}
        className="mb-6 text-sm text-brand-600 dark:text-brand-400 hover:underline"
      >
        {showAllCurrencies ? 'Show popular currencies only' : 'Show all currencies'}
      </button>

      {/* Result */}
      <div className="bg-gradient-to-r from-brand-50 to-blue-50 dark:from-brand-900/20 dark:to-blue-900/20 rounded-xl p-4 mb-4">
        {convertedAmount !== null ? (
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              {currencyService.formatAmount(parseFloat(amount) || 0, fromCurrency)} {fromCurrency} =
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {currencyService.formatAmount(convertedAmount, toCurrency)} {toCurrency}
            </p>
            {rates[toCurrency] && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                1 {fromCurrency} = {currencyService.formatAmount(rates[toCurrency], toCurrency)} {toCurrency}
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-400 dark:text-gray-500">
            Enter an amount to convert
          </div>
        )}
      </div>

      {/* Quick Conversions */}
      {rates[toCurrency] && parseFloat(amount) > 0 && (
        <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Quick reference</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[1, 10, 100, 1000].map((ref) => (
              <div
                key={ref}
                className="flex justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <span className="text-gray-600 dark:text-gray-400">{ref} {fromCurrency}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {currencyService.formatAmount(ref * rates[toCurrency], toCurrency)} {toCurrency}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
