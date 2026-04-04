import { useState, useEffect, type FormEvent, useMemo } from 'react';
import { stockMovementService, StockMovement as StockMovementType, CreateStockMovementDto } from '../services/stock-movement.service';
import { productService } from '../services/product.service';
import PageMeta from '../components/common/PageMeta';
import PageBreadcrumb from '../components/common/PageBreadCrumb';
import Button from '../components/ui/button/Button';
import Label from '../components/form/Label';
import { Modal } from '../components/ui/modal';
import { useFilters, useDebouncedValue } from '../hooks/useFilters';

interface Product {
  id: string;
  name: string;
}

interface StockMovementFilters {
  search: string;
  type: string;
  reason: string;
  productId: string;
  dateFrom: string;
  dateTo: string;
}

const defaultFilters: StockMovementFilters = {
  search: "",
  type: "all",
  reason: "all",
  productId: "",
  dateFrom: "",
  dateTo: "",
};

const movementReasons = [
  { value: "all", label: "All Reasons" },
  { value: "purchase", label: "Purchase" },
  { value: "sale", label: "Sale" },
  { value: "adjustment", label: "Adjustment" },
  { value: "return", label: "Return" },
  { value: "damage", label: "Damage" },
];

export default function StockMovement() {
  const [movements, setMovements] = useState<StockMovementType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<CreateStockMovementDto>({
    productId: '',
    type: 'IN',
    quantity: 1,
    reason: 'purchase',
    notes: '',
  });

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
  } = useFilters<StockMovementFilters>({
    key: "stock-movements",
    defaultValues: defaultFilters,
  });

  // Debounced search
  const debouncedSearch = useDebouncedValue(filters.search, 300);

  const handleCloseModal = () => {
    setShowModal(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [movementsData, productsData] = await Promise.all([
        stockMovementService.getAll(),
        productService.getProducts(),
      ]);
      setMovements(movementsData);
      setProducts(productsData);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await stockMovementService.create(formData);
      setShowModal(false);
      setFormData({
        productId: '',
        type: 'IN',
        quantity: 1,
        reason: 'purchase',
        notes: '',
      });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Apply filters
  const filteredMovements = useMemo(() => {
    let filtered = movements;

    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter((m) =>
        m.product?.name?.toLowerCase().includes(query) ||
        m.notes?.toLowerCase().includes(query)
      );
    }

    if (filters.type !== "all") {
      filtered = filtered.filter((m) => m.type === filters.type);
    }

    if (filters.reason !== "all") {
      filtered = filtered.filter((m) => m.reason === filters.reason);
    }

    if (filters.productId) {
      filtered = filtered.filter((m) => m.productId === filters.productId);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(
        (m) => new Date(m.date) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(
        (m) => new Date(m.date) <= new Date(filters.dateTo)
      );
    }

    return filtered;
  }, [movements, debouncedSearch, filters]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const total = filteredMovements.length;
    const stockIn = filteredMovements.filter((m) => m.type === "IN").length;
    const stockOut = filteredMovements.filter((m) => m.type === "OUT").length;
    const totalIn = filteredMovements
      .filter((m) => m.type === "IN")
      .reduce((sum, m) => sum + m.quantity, 0);
    const totalOut = filteredMovements
      .filter((m) => m.type === "OUT")
      .reduce((sum, m) => sum + m.quantity, 0);
    return { total, stockIn, stockOut, totalIn, totalOut };
  }, [filteredMovements]);

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
        setFilter(key as keyof StockMovementFilters, value as any);
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

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      purchase: 'Purchase',
      sale: 'Sale',
      adjustment: 'Adjustment',
      return: 'Return',
      damage: 'Damage',
    };
    return labels[reason] || reason;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <PageMeta title="Stock Movement | Dashboard" description="Track stock movements" />
      <PageBreadcrumb pageTitle="Stock Movement" />

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Stock Movements
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Track inventory changes and record stock in/out activity.
            </p>
          </div>
          <Button type="button" onClick={() => setShowModal(true)}>
            + Add Movement
          </Button>
        </div>
        {error && (
          <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400">Showing</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{summaryStats.total}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400">Stock In</p>
            <p className="text-2xl font-bold text-green-600">{summaryStats.stockIn}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400">Stock Out</p>
            <p className="text-2xl font-bold text-red-600">{summaryStats.stockOut}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total In Qty</p>
            <p className="text-2xl font-bold text-green-600">{summaryStats.totalIn}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Out Qty</p>
            <p className="text-2xl font-bold text-red-600">{summaryStats.totalOut}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Search movements..."
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
              <option value="IN">Stock In</option>
              <option value="OUT">Stock Out</option>
            </select>
            <select
              value={filters.reason}
              onChange={(e) => setFilter("reason", e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              {movementReasons.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>
            <select
              value={filters.productId}
              onChange={(e) => setFilter("productId", e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white min-w-[150px]"
            >
              <option value="">All Products</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
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
            Showing {filteredMovements.length} of {movements.length} movements
          </div>
        </div>

        {/* Movements Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Quantity</th>
                  <th className="px-6 py-3">Reason</th>
                  <th className="px-6 py-3">Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                      {hasActiveFilters ? "No movements match your filters." : "No stock movements yet. Click \"Add Movement\" to create your first record."}
                    </td>
                  </tr>
                ) : (
                  filteredMovements.map((movement) => (
                    <tr key={movement.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">{new Date(movement.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{movement.product?.name || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          movement.type === 'IN'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {movement.type === 'IN' ? 'Stock In' : 'Stock Out'}
                        </span>
                      </td>
                      <td className="px-6 py-4">{movement.quantity}</td>
                      <td className="px-6 py-4">{getReasonLabel(movement.reason)}</td>
                      <td className="px-6 py-4 max-w-xs truncate">{movement.notes || '-'}</td>
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

        {/* Add Movement Modal */}
        <Modal isOpen={showModal} onClose={handleCloseModal} className="max-w-xl" showCloseButton>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Add Stock Movement
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="stock-product" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Product</label>
                  <select
                    id="stock-product"
                    required
                    value={formData.productId}
                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">{products.length === 0 ? "No products available" : "Select Product"}</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>{product.name}</option>
                    ))}
                  </select>
                  {products.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">No products found. Please create products first.</p>
                  )}
                </div>

                <div>
                  <label htmlFor="stock-type" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                  <select
                    id="stock-type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'IN' | 'OUT' })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="IN">Stock In</option>
                    <option value="OUT">Stock Out</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="stock-quantity" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</label>
                  <input
                    id="stock-quantity"
                    type="number"
                    required
                    min={1}
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="stock-reason" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Reason</label>
                  <select
                    id="stock-reason"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value as CreateStockMovementDto['reason'] })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="purchase">Purchase</option>
                    <option value="sale">Sale</option>
                    <option value="adjustment">Adjustment</option>
                    <option value="return">Return</option>
                    <option value="damage">Damage</option>
                  </select>
                </div>

                <div>
                  <Label>Notes</Label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Add a note about this movement"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={handleCloseModal}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!formData.productId || !formData.quantity}>
                    Save Movement
                  </Button>
                </div>
              </form>
            </div>
          </Modal>
        </div>
      </div>
  );
}
