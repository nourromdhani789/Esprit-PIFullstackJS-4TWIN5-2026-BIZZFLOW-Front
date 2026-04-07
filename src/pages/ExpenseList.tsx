import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
import axios from "axios";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import { expenseService, Expense } from "../services/expense.service";
import Button from "../components/ui/button/Button";
import Badge, { BadgeColor } from "../components/ui/badge/Badge";
import { useAuth } from "../context/AuthContext";
import { useFilters, useDebouncedValue } from "../hooks/useFilters";

const statusColors = {
  pending: "warning",
  approved: "success",
  rejected: "error",
} as const;

const categoryColors: Record<string, BadgeColor> = {
  meals: "primary",
  travel: "info",
  supplies: "success",
  equipment: "dark",
  "raw-material": "warning",
  software: "primary",
  rent: "info",
  utilities: "warning",
  marketing: "success",
  other: "light",
};

interface ExpenseFilters {
  search: string;
  status: string;
  category: string;
  dateFrom: string;
  dateTo: string;
  minAmount: string;
  maxAmount: string;
}

const defaultFilters: ExpenseFilters = {
  search: "",
  status: "all",
  category: "",
  dateFrom: "",
  dateTo: "",
  minAmount: "",
  maxAmount: "",
};

const expenseCategories = [
  { value: "", label: "All Categories" },
  { value: "meals", label: "Meals" },
  { value: "travel", label: "Travel" },
  { value: "supplies", label: "Supplies" },
  { value: "equipment", label: "Equipment" },
  { value: "raw-material", label: "Raw Material" },
  { value: "software", label: "Software" },
  { value: "rent", label: "Rent" },
  { value: "utilities", label: "Utilities" },
  { value: "marketing", label: "Marketing" },
  { value: "other", label: "Other" },
];

export default function ExpenseList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filter hook - initialize from URL params
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
  } = useFilters<ExpenseFilters>({
    key: "expenses",
    defaultValues: {
      ...defaultFilters,
      status: searchParams.get('status') || 'all',
      category: searchParams.get('category') || '',
      dateFrom: searchParams.get('dateFrom') || '',
      dateTo: searchParams.get('dateTo') || '',
      minAmount: searchParams.get('minAmount') || '',
      maxAmount: searchParams.get('maxAmount') || '',
    },
  });

  // Show notification when filters are applied from Smart Search
  const smartSearchApplied = searchParams.has('status') || searchParams.has('category') || searchParams.has('minAmount');

  // Debounced search
  const debouncedSearch = useDebouncedValue(filters.search, 300);

  const isAdmin = user?.roleId === "PLATFORM_ADMIN" || user?.roleId === "BUSINESS_OWNER" || user?.roleId === "BUSINESS_ADMIN";

  // Fetch all expenses (backend handles status, we filter client-side for other fields)
  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      const status = filters.status === "all" ? undefined : filters.status;
      const data = await expenseService.getExpenses(status);
      setExpenses(data);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load expenses");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [filters.status]);

  const handleApprove = async (id: string, status: "approved" | "rejected") => {
    try {
      await expenseService.approveExpense(id, status);
      setSuccess(`Expense ${status} successfully`);
      fetchExpenses();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      let msg = `Failed to ${status} expense.`;

      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data as any;
        if (data?.message) {
          msg = data.message;
        } else {
          msg = `Unable to ${status} expense. Status ${err.response.status} ${err.response.statusText}.`;
        }
      } else if (err?.message) {
        msg = err.message;
      }

      setError(msg);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    try {
      await expenseService.deleteExpense(id);
      setSuccess("Expense deleted successfully");
      fetchExpenses();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to delete expense");
    }
  };

  const getReceiptUrl = (receiptUrl?: string) => {
    if (!receiptUrl) return null;
    return `${import.meta.env.VITE_API_URL || "http://localhost:3000"}${receiptUrl}`;
  };

  // Apply client-side filters
  const filteredExpenses = useMemo(() => {
    let filtered = expenses;

    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter((e) =>
        e.supplier?.name?.toLowerCase().includes(query) ||
        e.description?.toLowerCase().includes(query) ||
        e.category?.toLowerCase().includes(query)
      );
    }

    if (filters.category) {
      filtered = filtered.filter((e) => e.category === filters.category);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(
        (e) => new Date(e.date) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(
        (e) => new Date(e.date) <= new Date(filters.dateTo)
      );
    }

    if (filters.minAmount) {
      filtered = filtered.filter(
        (e) => Number(e.amount) >= Number(filters.minAmount)
      );
    }

    if (filters.maxAmount) {
      filtered = filtered.filter(
        (e) => Number(e.amount) <= Number(filters.maxAmount)
      );
    }

    return filtered;
  }, [expenses, debouncedSearch, filters]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const total = filteredExpenses.length;
    const pending = filteredExpenses.filter((e) => e.status === "pending").length;
    const approved = filteredExpenses.filter((e) => e.status === "approved").length;
    const rejected = filteredExpenses.filter((e) => e.status === "rejected").length;
    const totalAmount = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    return { total, pending, approved, rejected, totalAmount };
  }, [filteredExpenses]);

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
        setFilter(key as keyof ExpenseFilters, value as any);
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

  return (
    <div className="p-4">
      <PageBreadcrumb pageTitle="Expense Management" />

      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Expenses
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/expenses/create")}>
            Add Manually
          </Button>
          <Button onClick={() => navigate("/expenses/upload")}>
            Upload Receipt
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">Showing</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{summaryStats.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
          <p className="text-2xl font-bold text-orange-600">{summaryStats.pending}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">Approved</p>
          <p className="text-2xl font-bold text-green-600">{summaryStats.approved}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">Rejected</p>
          <p className="text-2xl font-bold text-red-600">{summaryStats.rejected}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Amount</p>
          <p className="text-2xl font-bold text-purple-600">TND {summaryStats.totalAmount.toFixed(2)}</p>
        </div>
      </div>

        {/* Smart Search Notification */}
        {smartSearchApplied && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-blue-800 dark:text-blue-200 font-medium">
                  Filters applied from Smart Search
                </span>
              </div>
              <button
                onClick={() => {
                  clearAllFilters();
                  setSearchParams({});
                }}
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
              >
                Clear filters
              </button>
            </div>
          </div>
        )}

      {error && (
        <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-900/30 dark:text-green-400">
          {success}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search expenses..."
            value={filters.search}
            onChange={(e) => setFilter("search", e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white w-full md:w-64"
          />
          <select
            value={filters.status}
            onChange={(e) => setFilter("status", e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={filters.category}
            onChange={(e) => setFilter("category", e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white min-w-[150px]"
          >
            {expenseCategories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
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
              Clear All ({activeFilterCount})
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
          Showing {filteredExpenses.length} of {expenses.length} expenses
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Receipt
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    {hasActiveFilters ? "No expenses match your filters." : "No expenses found"}
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <Badge color={categoryColors[expense.category] || "light"}>
                        {expense.category}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {expense.supplier?.name || expense.supplierId || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      TND {Number(expense.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge color={statusColors[expense.status]}>
                        {expense.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {expense.receiptUrl ? (
                        <a
                          href={getReceiptUrl(expense.receiptUrl) || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-500 hover:text-brand-600 text-sm"
                        >
                          View Receipt
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">No receipt</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {isAdmin && expense.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(expense.id, "approved")}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() => handleApprove(expense.id, "rejected")}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          onClick={() => handleDelete(expense.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
      </div>
    </div>
  );
}
