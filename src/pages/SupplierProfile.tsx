import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import { supplierService, type SupplierProfile } from "../services/supplier.service";

function formatTND(amount: number): string {
  return `TND ${Number(amount || 0).toFixed(3)}`;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString();
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    pending: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    received: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    draft: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.draft}`}>
      {status}
    </span>
  );
}

export default function SupplierProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<SupplierProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"purchaseOrders" | "expenses" | "payments">("purchaseOrders");

  useEffect(() => {
    if (id) {
      fetchProfile();
    }
  }, [id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await supplierService.getSupplierProfile(id!);
      setProfile(data);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load supplier profile");
    } finally {
      setLoading(false);
    }
  };

  const handleNewOrder = () => {
    navigate(`/purchase-orders/create?supplierId=${id}`);
  };

  const handleEdit = () => {
    navigate(`/suppliers?id=${id}&edit=true`);
  };

  const handleNewExpense = () => {
    navigate(`/expenses/create?supplierId=${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-500">Supplier not found</p>
            <Link to="/suppliers" className="text-blue-600 hover:underline mt-4 inline-block">
              ← Back to Suppliers
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { supplier, stats, purchaseOrders, expenses, payments } = profile;

  return (
    <>
      <PageMeta title={`${supplier.name} | Supplier Profile`} description="Supplier profile and purchase history" />
      <div className="p-4">
        <PageBreadcrumb pageTitle="Supplier Profile" />

        <div className="max-w-6xl mx-auto">
          {/* Back Link */}
          <Link to="/suppliers" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Suppliers
          </Link>

          {error && (
            <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {supplier.name}
                </h1>
                <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                  {supplier.email && (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {supplier.email}
                    </span>
                  )}
                  {supplier.phone && (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {supplier.phone}
                    </span>
                  )}
                  {supplier.address && (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {supplier.address}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  Supplier since {formatDate(supplier.createdAt)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleEdit}>
                  Edit Supplier
                </Button>
                <Button onClick={handleNewOrder}>
                  + New Purchase Order
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Purchased</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatTND(stats.totalPurchased)}
              </h3>
              <p className="text-xs text-gray-400 mt-1">{stats.orderCount} orders</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Paid</p>
              <h3 className="text-2xl font-bold text-green-600 mt-1">
                {formatTND(stats.totalPaid)}
              </h3>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Outstanding Balance</p>
              <h3 className={`text-2xl font-bold mt-1 ${stats.outstandingBalance > 0 ? "text-orange-600" : "text-green-600"}`}>
                {formatTND(stats.outstandingBalance)}
              </h3>
              {stats.outstandingBalance > 0 && (
                <p className="text-xs text-orange-500 mt-1 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Amount owed to supplier
                </p>
              )}
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Orders</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.orderCount}
              </h3>
              <p className="text-xs text-gray-400 mt-1">{stats.expenseCount} expenses</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab("purchaseOrders")}
                  className={`py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === "purchaseOrders"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Purchase Orders ({purchaseOrders.length})
                </button>
                <button
                  onClick={() => setActiveTab("expenses")}
                  className={`py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === "expenses"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Expenses ({expenses.length})
                </button>
                <button
                  onClick={() => setActiveTab("payments")}
                  className={`py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === "payments"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Payments ({payments.length})
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-4">
              {activeTab === "purchaseOrders" && (
                <>
                  {purchaseOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No purchase orders for this supplier yet.</p>
                      <Button onClick={handleNewOrder} className="mt-4">
                        Create First Order
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Order #</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Items</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Total Amount</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Status</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {purchaseOrders.map((order) => (
                            <tr key={order.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                              <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">{order.orderNumber || "-"}</td>
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatDate(order.date)}</td>
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{order.itemCount}</td>
                              <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatTND(order.totalAmount)}</td>
                              <td className="px-4 py-3 text-center whitespace-nowrap">{getStatusBadge(order.status)}</td>
                              <td className="px-4 py-3 text-right whitespace-nowrap">
                                <Link to={`/purchase-orders/${order.id}`} className="text-blue-600 hover:underline text-sm">View</Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {activeTab === "expenses" && (
                <>
                  {expenses.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No expenses recorded for this supplier.</p>
                      <Button onClick={handleNewExpense} className="mt-4">
                        Record First Expense
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Date</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Amount</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Category</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Status</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Receipt</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expenses.map((expense) => (
                            <tr key={expense.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatDate(expense.date)}</td>
                              <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatTND(expense.amount)}</td>
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap capitalize">{expense.category.replace(/_/g, " ")}</td>
                              <td className="px-4 py-3 text-center whitespace-nowrap">{getStatusBadge(expense.status)}</td>
                              <td className="px-4 py-3 text-center whitespace-nowrap">
                                {expense.receiptUrl ? (
                                  <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">View</a>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right whitespace-nowrap">
                                <Link to={`/expenses/${expense.id}`} className="text-blue-600 hover:underline text-sm">View</Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {activeTab === "payments" && (
                <>
                  {payments.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No payments recorded for this supplier.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Date</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Amount</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Method</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Reference</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map((payment) => (
                            <tr key={payment.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatDate(payment.date)}</td>
                              <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatTND(payment.amount)}</td>
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap capitalize">{payment.method}</td>
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{payment.reference || "-"}</td>
                              <td className="px-4 py-3 text-right whitespace-nowrap">
                                <Link to={`/payments?id=${payment.id}`} className="text-blue-600 hover:underline text-sm">View</Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
