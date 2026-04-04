import { useState, useEffect } from "react";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";

interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  details: any;
  createdAt: string;
}

const actionLabels: Record<string, string> = {
  created_invoice: "Created Invoice",
  updated_invoice: "Updated Invoice",
  changed_invoice_status_paid: "Marked Invoice as Paid",
  changed_invoice_status_unpaid: "Marked Invoice as Unpaid",
  changed_invoice_status_overdue: "Marked Invoice as Overdue",
  deleted_invoice: "Deleted Invoice",
  created_expense: "Created Expense",
  approved_expense: "Approved Expense",
  rejected_expense: "Rejected Expense",
  deleted_expense: "Deleted Expense",
  created_product: "Created Product",
  updated_product: "Updated Product",
  deleted_product: "Deleted Product",
  created_purchase_order: "Created Purchase Order",
  received_purchase_order: "Received Purchase Order",
  created_credit_note: "Created Credit Note",
  approved_credit_note: "Approved Credit Note",
  applied_credit_note: "Applied Credit Note",
  refunded_credit_note: "Refunded Credit Note",
  cancelled_credit_note: "Cancelled Credit Note",
  adjusted_stock: "Adjusted Stock",
  stock_movement_in: "Stock Movement (In)",
  stock_movement_out: "Stock Movement (Out)",
  started_stock_take: "Started Stock Take",
  completed_stock_take: "Completed Stock Take",
  user_created: "User Created",
  user_role_changed: "User Role Changed",
};

const entityTypeColors: Record<string, string> = {
  Invoice: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  Expense: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  Product: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  PurchaseOrder: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  CreditNote: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  StockMovement: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  StockTake: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
  User: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
};

function formatActionLabel(action: string): string {
  return actionLabels[action] || action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function formatDate(date: string): string {
  return new Date(date).toLocaleString();
}

export default function AuditLogs() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [entityType, setEntityType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Check if user is admin
  const isAdmin = user?.roleId === "PLATFORM_ADMIN" || user?.roleId === "BUSINESS_ADMIN" || user?.roleId === "BUSINESS_OWNER";

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
      return;
    }
    fetchLogs();
  }, [isAdmin, navigate]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (entityType) params.entityType = entityType;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const response = await api.get("/audit-logs", { params });
      setLogs(response.data);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    fetchLogs();
  };

  const clearFilters = () => {
    setEntityType("");
    setDateFrom("");
    setDateTo("");
    fetchLogs();
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <PageMeta title="Audit Logs | Dashboard" description="System audit trail" />
      <PageBreadcrumb pageTitle="Audit Logs" />

      <div className="p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Audit Trail
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Track every important action in the system
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Module
                </label>
                <select
                  value={entityType}
                  onChange={(e) => setEntityType(e.target.value)}
                  className="w-40 h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All</option>
                  <option value="Invoice">Invoice</option>
                  <option value="Expense">Expense</option>
                  <option value="Product">Product</option>
                  <option value="PurchaseOrder">Purchase Order</option>
                  <option value="CreditNote">Credit Note</option>
                  <option value="StockMovement">Stock Movement</option>
                  <option value="StockTake">Stock Take</option>
                  <option value="User">User</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-40 h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-40 h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={applyFilters}
                  className="h-10 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Apply Filters
                </button>
                <button
                  onClick={clearFilters}
                  className="h-10 px-4 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No audit logs found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Action
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Module
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <>
                        <tr
                          key={log.id}
                          className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                          onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                        >
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                            {formatDate(log.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            <div className="font-medium">{log.userEmail}</div>
                            <div className="text-xs text-gray-500">
                              {log.userId === 'system' ? 'System' : log.userId.slice(0, 8) + '...'}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {formatActionLabel(log.action)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                entityTypeColors[log.entityType] || "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {log.entityType}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                            <button className="text-blue-600 hover:underline text-sm">
                              {expandedId === log.id ? "Hide" : "View"} Details
                              <span className="ml-1">{expandedId === log.id ? "▲" : "▼"}</span>
                            </button>
                          </td>
                        </tr>
                        {expandedId === log.id && (
                          <tr className="bg-gray-50 dark:bg-gray-700/30">
                            <td colSpan={5} className="px-4 py-3">
                              <div className="text-sm">
                                <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Entity ID: {log.entityId}
                                </p>
                                <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-xs overflow-x-auto">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              <strong>Note:</strong> Audit logs are read-only and cannot be modified or deleted. They provide a permanent record of all system activities for compliance and security purposes.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
