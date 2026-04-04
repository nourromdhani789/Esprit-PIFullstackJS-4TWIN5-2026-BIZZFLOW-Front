import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import api from "../services/api";

interface ClientProfile {
  client: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    createdAt: string;
  };
  stats: {
    totalInvoiced: number;
    totalPaid: number;
    outstandingBalance: number;
    overdueAmount: number;
    invoiceCount: number;
    creditNoteCount: number;
  };
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    date: string;
    dueDate: string;
    totalAmount: number;
    status: string;
    itemCount: number;
  }>;
  creditNotes: Array<{
    id: string;
    date: string;
    amount: number;
    reason: string;
    status: string;
    reference: string;
  }>;
  payments: Array<{
    id: string;
    date: string;
    amount: number;
    method: string;
    reference: string;
  }>;
}

function formatTND(amount: number): string {
  return `TND ${Number(amount).toFixed(3)}`;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString();
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    unpaid: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    overdue: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    draft: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 line-through",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.draft}`}>
      {status}
    </span>
  );
}

export default function ClientProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"invoices" | "creditNotes" | "payments">("invoices");

  useEffect(() => {
    if (id) {
      fetchProfile();
    }
  }, [id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/clients/${id}/profile`);
      setProfile(response.data);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load client profile");
    } finally {
      setLoading(false);
    }
  };

  const handleNewInvoice = () => {
    navigate(`/invoices/create?clientId=${id}`);
  };

  const handleEdit = () => {
    navigate(`/clients?id=${id}&edit=true`);
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
            <p className="text-gray-500">Client not found</p>
            <Link to="/clients" className="text-blue-600 hover:underline mt-4 inline-block">
              ← Back to Clients
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { client, stats, invoices, creditNotes, payments } = profile;

  return (
    <>
      <PageMeta title={`${client.name} | Client Profile`} description="Client profile and history" />
      <div className="p-4">
        <PageBreadcrumb pageTitle="Client Profile" />

        <div className="max-w-6xl mx-auto">
          {/* Back Link */}
          <Link to="/clients" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Clients
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
                  {client.name}
                </h1>
                <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                  {client.email && (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {client.email}
                    </span>
                  )}
                  {client.phone && (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {client.phone}
                    </span>
                  )}
                  {client.address && (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {client.address}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  Member since {formatDate(client.createdAt)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleEdit}>
                  Edit Client
                </Button>
                <Button onClick={handleNewInvoice}>
                  + New Invoice
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Invoiced</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatTND(stats.totalInvoiced)}
              </h3>
              <p className="text-xs text-gray-400 mt-1">{stats.invoiceCount} invoices</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Paid</p>
              <h3 className="text-2xl font-bold text-green-600 mt-1">
                {formatTND(stats.totalPaid)}
              </h3>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Outstanding Balance</p>
              <h3 className={`text-2xl font-bold mt-1 ${stats.outstandingBalance > 0 ? "text-red-600" : "text-green-600"}`}>
                {formatTND(stats.outstandingBalance)}
              </h3>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Overdue Amount</p>
              <h3 className={`text-2xl font-bold mt-1 ${stats.overdueAmount > 0 ? "text-red-600" : "text-green-600"}`}>
                {formatTND(stats.overdueAmount)}
              </h3>
              {stats.overdueAmount > 0 && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Action needed
                </p>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab("invoices")}
                  className={`py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === "invoices"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Invoices ({invoices.length})
                </button>
                <button
                  onClick={() => setActiveTab("creditNotes")}
                  className={`py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === "creditNotes"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Credit Notes ({creditNotes.length})
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
              {activeTab === "invoices" && (
                <>
                  {invoices.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No invoices for this client yet.</p>
                      <Button onClick={handleNewInvoice} className="mt-4">
                        Create First Invoice
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Invoice #</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Due Date</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Amount</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Status</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoices.map((invoice) => (
                            <tr key={invoice.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                              <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">{invoice.invoiceNumber || "-"}</td>
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatDate(invoice.date)}</td>
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{invoice.dueDate ? formatDate(invoice.dueDate) : "-"}</td>
                              <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatTND(invoice.totalAmount)}</td>
                              <td className="px-4 py-3 text-center whitespace-nowrap">{getStatusBadge(invoice.status)}</td>
                              <td className="px-4 py-3 text-right whitespace-nowrap">
                                <Link to={`/invoices/${invoice.id}`} className="text-blue-600 hover:underline text-sm">View</Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {activeTab === "creditNotes" && (
                <>
                  {creditNotes.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No credit notes for this client.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Date</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Amount</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Reason</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Reference</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Status</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {creditNotes.map((cn) => (
                            <tr key={cn.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatDate(cn.date)}</td>
                              <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatTND(cn.amount)}</td>
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap capitalize">{cn.reason.replace(/_/g, " ")}</td>
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{cn.reference || "-"}</td>
                              <td className="px-4 py-3 text-center whitespace-nowrap">{getStatusBadge(cn.status)}</td>
                              <td className="px-4 py-3 text-right whitespace-nowrap">
                                <Link to={`/credit-notes?id=${cn.id}`} className="text-blue-600 hover:underline text-sm">View</Link>
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
                      <p className="text-gray-500">No payments recorded for this client.</p>
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
