import { useState, useEffect, type FormEvent, useMemo } from 'react';
import { paymentService, Payment, CreatePaymentDto } from '../services/payment.service';
import PageMeta from '../components/common/PageMeta';
import PageBreadcrumb from '../components/common/PageBreadCrumb';
import { useBusiness } from '../contexts/BusinessContext';
import Button from '../components/ui/button/Button';
import Label from '../components/form/Label';
import Input from '../components/form/input/InputField';
import { Modal } from '../components/ui/modal';
import { useFilters, useDebouncedValue } from '../hooks/useFilters';

interface PaymentFilters {
  search: string;
  type: string;
  method: string;
  dateFrom: string;
  dateTo: string;
  minAmount: string;
  maxAmount: string;
}

const defaultFilters: PaymentFilters = {
  search: "",
  type: "all",
  method: "all",
  dateFrom: "",
  dateTo: "",
  minAmount: "",
  maxAmount: "",
};

const paymentMethods = [
  { value: "all", label: "All Methods" },
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank Transfer" },
  { value: "card", label: "Card" },
  { value: "check", label: "Check" },
  { value: "transfer", label: "Transfer" },
];

export default function Payments() {
  const { formatCurrency } = useBusiness();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [cashBalance, setCashBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Filter hook
  const {
    filters,
    setFilter,
    clearAllFilters,
    hasActiveFilters,
    activeFilterCount,
    getFilterChips,
    saveFilters,
    loadSavedFilters,
    deleteSavedFilters,
    getSavedFilterNames,
  } = useFilters<PaymentFilters>({
    key: "payments",
    defaultValues: defaultFilters,
  });

  // Debounced search
  const debouncedSearch = useDebouncedValue(filters.search, 300);

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const [formData, setFormData] = useState<CreatePaymentDto>({
    type: 'IN',
    amount: 0,
    method: 'cash',
    description: '',
    reference: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [paymentsData, balance] = await Promise.all([
        paymentService.getAll(),
        paymentService.getCashBalance(),
      ]);
      setPayments(paymentsData);
      setCashBalance(balance);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await paymentService.create(formData);
      setShowModal(false);
      setFormData({ type: 'IN', amount: 0, method: 'cash', description: '', reference: '' });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Apply filters
  const filteredPayments = useMemo(() => {
    let filtered = payments;

    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter((p) =>
        p.description?.toLowerCase().includes(query) ||
        p.reference?.toLowerCase().includes(query)
      );
    }

    if (filters.type !== "all") {
      filtered = filtered.filter((p) => p.type === filters.type);
    }

    if (filters.method !== "all") {
      filtered = filtered.filter((p) => p.method === filters.method);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(
        (p) => new Date(p.date) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(
        (p) => new Date(p.date) <= new Date(filters.dateTo)
      );
    }

    if (filters.minAmount) {
      filtered = filtered.filter(
        (p) => Number(p.amount) >= Number(filters.minAmount)
      );
    }

    if (filters.maxAmount) {
      filtered = filtered.filter(
        (p) => Number(p.amount) <= Number(filters.maxAmount)
      );
    }

    return filtered;
  }, [payments, debouncedSearch, filters]);

  // Calculate summary stats (reserved for future use)
  const _summaryStats = useMemo(() => {
    const total = filteredPayments.length;
    const totalIn = filteredPayments
      .filter((p) => p.type === "IN")
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const totalOut = filteredPayments
      .filter((p) => p.type === "OUT")
      .reduce((sum, p) => sum + Number(p.amount), 0);
    return { total, totalIn, totalOut };
  }, [filteredPayments]);
  void _summaryStats;

  // Save/Load filters modal state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [savedFilterNames, setSavedFilterNames] = useState<string[]>([]);

  const handleSaveFilters = () => {
    if (filterName.trim()) {
      saveFilters(filterName.trim());
      setFilterName("");
      setShowSaveModal(false);
    }
  };

  const handleLoadFilters = (name: string) => {
    const saved = loadSavedFilters(name);
    if (saved) {
      Object.entries(saved).forEach(([key, value]) => {
        setFilter(key as keyof PaymentFilters, value as any);
      });
    }
    setShowLoadModal(false);
  };

  const handleDeleteSavedFilter = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSavedFilters(name);
    setSavedFilterNames(getSavedFilterNames());
  };

  const openLoadModal = () => {
    setSavedFilterNames(getSavedFilterNames());
    setShowLoadModal(true);
  };

  const filterChips = getFilterChips();

  const getTypeBadge = (type: string) => {
    return type === 'IN' ? (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
        Money In
      </span>
    ) : (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
        Money Out
      </span>
    );
  };

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Cash',
      bank: 'Bank Transfer',
      card: 'Card',
      check: 'Check',
      transfer: 'Transfer',
    };
    return labels[method] || method;
  };

  const totalIn = payments.filter(p => p.type === 'IN').reduce((sum, p) => sum + Number(p.amount), 0);
  const totalOut = payments.filter(p => p.type === 'OUT').reduce((sum, p) => sum + Number(p.amount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Payments & Cash | Dashboard" description="Manage payments and cash register" />
      <PageBreadcrumb pageTitle="Payments & Cash" />

      <div className="space-y-6">
        {/* Cash Balance Card */}
        <div className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Current Cash Balance</p>
              <h2 className="text-4xl font-bold">{formatCurrency(Number(cashBalance))}</h2>
            </div>
            <div className="rounded-full bg-white/20 p-4">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
            <p className="text-green-700 dark:text-green-300">Total Money In</p>
            <h3 className="text-2xl font-bold text-green-800 dark:text-green-200">{formatCurrency(Number(totalIn))}</h3>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-red-700 dark:text-red-300">Total Money Out</p>
            <h3 className="text-2xl font-bold text-red-800 dark:text-red-200">{formatCurrency(Number(totalOut))}</h3>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Search payments..."
              value={filters.search}
              onChange={(e) => setFilter("search", e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white w-full md:w-64"
            />
            <select
              value={filters.type}
              onChange={(e) => setFilter("type", e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value="IN">Money In</option>
              <option value="OUT">Money Out</option>
            </select>
            <select
              value={filters.method}
              onChange={(e) => setFilter("method", e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white min-w-[150px]"
            >
              {paymentMethods.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
            <input
              type="date"
              placeholder="From"
              value={filters.dateFrom}
              onChange={(e) => setFilter("dateFrom", e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <input
              type="date"
              placeholder="To"
              value={filters.dateTo}
              onChange={(e) => setFilter("dateTo", e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <input
              type="number"
              placeholder="Min amount"
              value={filters.minAmount}
              onChange={(e) => setFilter("minAmount", e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white w-32"
            />
            <input
              type="number"
              placeholder="Max amount"
              value={filters.maxAmount}
              onChange={(e) => setFilter("maxAmount", e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white w-32"
            />
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Clear All ({String(activeFilterCount)})
              </button>
            )}
          </div>

          {/* Filter Chips */}
          {filterChips.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {filterChips.map((chip) => (
                <span
                  key={String(chip.key)}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                >
                  {chip.label}: {chip.value}
                  <button
                    onClick={chip.onRemove}
                    className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-400"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Save/Load Filters */}
          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowSaveModal(true)}
              className="text-sm text-brand-500 hover:text-brand-600 font-medium"
            >
              Save Filters
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={openLoadModal}
              className="text-sm text-brand-500 hover:text-brand-600 font-medium"
            >
              Load Filters
            </button>
          </div>

          <div className="text-sm text-gray-500 mt-2">
            Showing {filteredPayments.length} of {payments.length} payments
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Payment History</h2>
          <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Payment
          </Button>
        </div>

        {/* Payments Table */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Method</th>
                  <th className="px-6 py-3">Reference</th>
                  <th className="px-6 py-3">Description</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      {hasActiveFilters ? "No payments match your filters." : "No payments found."}
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr key={payment.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">{new Date(payment.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4">{getTypeBadge(payment.type)}</td>
                      <td className="px-6 py-4 font-medium">TND {Number(payment.amount).toFixed(2)}</td>
                      <td className="px-6 py-4">{getMethodLabel(payment.method)}</td>
                      <td className="px-6 py-4">{payment.reference || '-'}</td>
                      <td className="px-6 py-4 max-w-xs truncate">{payment.description || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Save Modal */}
        {showSaveModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-96">
              <h3 className="text-lg font-semibold mb-4">Save Filters</h3>
              <input
                type="text"
                placeholder="Filter name"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white mb-4"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSaveModal(false)}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveFilters}>
                  Save
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Load Modal */}
        {showLoadModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-96 max-h-96 overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Load Filters</h3>
              {savedFilterNames.length === 0 ? (
                <p className="text-gray-500">No saved filters</p>
              ) : (
                <div className="space-y-2">
                  {savedFilterNames.map((name) => (
                    <div
                      key={name}
                      onClick={() => handleLoadFilters(name)}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <span>{name}</span>
                      <button
                        onClick={(e) => handleDeleteSavedFilter(name, e)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-end mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLoadModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        <Modal isOpen={showModal} onClose={handleCloseModal} className="max-w-md">
          <div className="p-6">
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Add Payment</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Type</Label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'IN' | 'OUT' })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="IN">Money In</option>
                  <option value="OUT">Money Out</option>
                </select>
              </div>

              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label>Method</Label>
                <select
                  value={formData.method}
                  onChange={(e) => setFormData({ ...formData, method: e.target.value as CreatePaymentDto['method'] })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="card">Card</option>
                  <option value="check">Check</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>

              <div>
                <Label>Reference</Label>
                <Input
                  type="text"
                  value={formData.reference || ''}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  placeholder="Optional reference"
                />
              </div>

              <div>
                <Label>Description</Label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button type="submit">Save Payment</Button>
              </div>
            </form>
          </div>
        </Modal>
      </div>
    </>
  );
}
