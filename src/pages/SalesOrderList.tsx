import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import { useBusiness } from "../contexts/BusinessContext";
import { salesOrderService, SalesOrder } from "../services/sales-order.service";
import { clientService, Client } from "../services/client.service";
import Button from "../components/ui/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import Badge from "../components/ui/badge/Badge";
import { useFilters, useDebouncedValue } from "../hooks/useFilters";

const statusColors = {
  draft: "warning",
  confirmed: "primary",
  delivered: "success",
  cancelled: "error",
} as const;

const statusLabels = {
  draft: "Draft",
  confirmed: "Confirmed",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

interface SalesOrderFilters {
  search: string;
  status: string;
  clientId: string;
  dateFrom: string;
  dateTo: string;
}

const defaultFilters: SalesOrderFilters = {
  search: "",
  status: "all",
  clientId: "",
  dateFrom: "",
  dateTo: "",
};

export default function SalesOrderList() {
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { formatCurrency } = useBusiness();

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
  } = useFilters<SalesOrderFilters>({
    key: "sales-orders",
    defaultValues: {
      ...defaultFilters,
      status: searchParams.get('status') || 'all',
      dateFrom: searchParams.get('dateFrom') || '',
      dateTo: searchParams.get('dateTo') || '',
    },
  });

  // Show notification when filters are applied from Smart Search
  const smartSearchApplied = searchParams.has('status') || searchParams.has('dateFrom') || searchParams.has('dateTo');

  // Debounced search
  const debouncedSearch = useDebouncedValue(filters.search, 300);

  // Load clients for filter dropdown
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const data = await clientService.getClients();
        setClients(data);
      } catch (err) {
        console.error("Failed to load clients for filters");
      }
    };
    fetchClients();
  }, []);

  const fetchSalesOrders = async () => {
    try {
      setIsLoading(true);
      const data = await salesOrderService.getSalesOrders();
      setSalesOrders(data);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load sales orders");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesOrders();
  }, []);

  const handleDownloadPdf = async (id: string, orderNumber: string) => {
    try {
      const blob = await salesOrderService.downloadPdf(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `sales-order-${orderNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || "Failed to download PDF");
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      await salesOrderService.confirmOrder(id);
      await fetchSalesOrders();
    } catch (err: any) {
      setError(err.message || "Failed to confirm order");
    }
  };

  const handleDeliver = async (id: string) => {
    try {
      await salesOrderService.deliverOrder(id);
      await fetchSalesOrders();
    } catch (err: any) {
      setError(err.message || "Failed to mark as delivered");
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this sales order?")) return;
    try {
      await salesOrderService.cancelOrder(id);
      await fetchSalesOrders();
    } catch (err: any) {
      setError(err.message || "Failed to cancel order");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sales order?")) return;
    try {
      await salesOrderService.deleteSalesOrder(id);
      await fetchSalesOrders();
    } catch (err: any) {
      setError(err.message || "Failed to delete sales order");
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await salesOrderService.duplicateSalesOrder(id);
      await fetchSalesOrders();
    } catch (err: any) {
      setError(err.message || "Failed to duplicate sales order");
    }
  };

  // Apply filters
  const filteredOrders = useMemo(() => {
    let filtered = salesOrders;

    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter((o) =>
        o.salesOrderNumber?.toLowerCase().includes(query) ||
        o.client?.name?.toLowerCase().includes(query) ||
        o.client?.email?.toLowerCase().includes(query) ||
        o.notes?.toLowerCase().includes(query)
      );
    }

    if (filters.status !== "all") {
      filtered = filtered.filter((o) => o.status === filters.status);
    }

    if (filters.clientId) {
      filtered = filtered.filter((o) => o.clientId === filters.clientId);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(
        (o) => new Date(o.issueDate) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(
        (o) => new Date(o.issueDate) <= new Date(filters.dateTo)
      );
    }

    return filtered;
  }, [salesOrders, debouncedSearch, filters]);

  // Calculate summary stats based on filtered results
  const summaryStats = useMemo(() => {
    const total = filteredOrders.length;
    const confirmed = filteredOrders.filter((o) => o.status === "confirmed").length;
    const delivered = filteredOrders.filter((o) => o.status === "delivered").length;
    const cancelled = filteredOrders.filter((o) => o.status === "cancelled").length;
    const totalAmount = filteredOrders.reduce(
      (sum, o) => sum + Number(o.totalAmount),
      0
    );
    return { total, confirmed, delivered, cancelled, totalAmount };
  }, [filteredOrders]);

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
        setFilter(key as keyof SalesOrderFilters, value as any);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <PageBreadcrumb pageTitle="Sales Orders" />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Sales Orders
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Manage your customer orders
            </p>
          </div>
          <Button onClick={() => navigate("/sales-orders/new")}>
            + New Sales Order
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400">Showing</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{summaryStats.total}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400">Confirmed</p>
            <p className="text-2xl font-bold text-blue-600">{summaryStats.confirmed}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400">Delivered</p>
            <p className="text-2xl font-bold text-green-600">{summaryStats.delivered}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400">Cancelled</p>
            <p className="text-2xl font-bold text-red-600">{summaryStats.cancelled}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Value</p>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(summaryStats.totalAmount)}</p>
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

        {/* Filter Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Search orders..."
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
              <option value="draft">Draft</option>
              <option value="confirmed">Confirmed</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={filters.clientId}
              onChange={(e) => setFilter("clientId", e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white min-w-[150px]"
            >
              <option value="">All Clients</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
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
            Showing {filteredOrders.length} of {salesOrders.length} orders
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50 dark:bg-gray-700/50">
              <TableRow>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Order #
                </TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Client
                </TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Date
                </TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Delivery Date
                </TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Amount
                </TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    {hasActiveFilters ? "No orders match your filters." : "No sales orders found. Create your first order to get started."}
                  </td>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <TableCell className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        #{order.salesOrderNumber}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {order.client?.name || "Client"}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {new Date(order.issueDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {order.expectedDeliveryDate 
                        ? new Date(order.expectedDeliveryDate).toLocaleDateString() 
                        : "-"}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                      {formatCurrency(Number(order.totalAmount))}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge color={statusColors[order.status]}>
                        {statusLabels[order.status].toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/sales-orders/${order.id}`)}
                        >
                          View
                        </Button>
                        {order.status === 'draft' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600"
                              onClick={() => handleConfirm(order.id)}
                            >
                              Confirm
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600"
                              onClick={() => handleDelete(order.id)}
                            >
                              Delete
                            </Button>
                          </>
                        )}
                        {order.status === 'confirmed' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-blue-600"
                              onClick={() => handleDeliver(order.id)}
                            >
                              Deliver
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-orange-600"
                              onClick={() => handleCancel(order.id)}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                        {(order.status === 'confirmed' || order.status === 'delivered') && !order.convertedToInvoiceId && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/sales-orders/${order.id}`)}
                          >
                            Convert
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDuplicate(order.id)}
                        >
                          Duplicate
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
