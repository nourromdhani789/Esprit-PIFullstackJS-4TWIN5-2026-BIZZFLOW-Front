import { CurrencyConverter } from '../components/tools';
import PageMeta from '../components/common/PageMeta';
import PageBreadcrumb from '../components/common/PageBreadCrumb';

const popularPairs = [
  { from: 'USD', to: 'EUR', rate: '0.92' },
  { from: 'EUR', to: 'USD', rate: '1.09' },
  { from: 'USD', to: 'TND', rate: '3.11' },
  { from: 'GBP', to: 'USD', rate: '1.27' },
];

const supportedCurrencies = [
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸', type: 'Fiat' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺', type: 'Fiat' },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧', type: 'Fiat' },
  { code: 'TND', name: 'Tunisian Dinar', flag: '🇹🇳', type: 'Fiat' },
  { code: 'BTC', name: 'Bitcoin', flag: '₿', type: 'Crypto' },
  { code: 'ETH', name: 'Ethereum', flag: 'Ξ', type: 'Crypto' },
];

export default function CurrencyTool() {
  return (
    <>
      <PageMeta
        title="Currency Converter | BizFlow AI"
        description="Real-time currency conversion with live exchange rates"
      />
      <PageBreadcrumb pageTitle="Currency Converter" />

      <div className="p-4 min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            💱 Currency Exchange
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Convert between 20+ fiat currencies and cryptocurrencies with real-time rates.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Live Rates</span>
          </div>
          <div className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-500 dark:text-gray-400">Currencies: </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">20+</span>
          </div>
          <div className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-500 dark:text-gray-400">Crypto: </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">6</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Currency Converter - Takes 2 columns */}
          <div className="lg:col-span-2">
            <CurrencyConverter />
          </div>

          {/* Sidebar - Takes 1 column */}
          <div className="lg:col-span-1 space-y-4">
            {/* Popular Rates */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Popular Rates
              </h3>
              <div className="space-y-3">
                {popularPairs.map((pair, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">{pair.from}</span>
                      <span className="text-gray-400">→</span>
                      <span className="font-medium text-gray-900 dark:text-white">{pair.to}</span>
                    </div>
                    <span className="text-sm font-medium text-brand-600 dark:text-brand-400">{pair.rate}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Supported Currencies */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Supported Currencies
              </h3>
              <div className="space-y-2">
                {supportedCurrencies.map((curr) => (
                  <div key={curr.code} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{curr.flag}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{curr.code}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{curr.name}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${curr.type === 'Crypto' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'}`}>
                      {curr.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
              <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                💡 About Exchange Rates
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                Rates are fetched live from CurrencyAPI and updated hourly. Crypto rates include Bitcoin, Ethereum, and more.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
