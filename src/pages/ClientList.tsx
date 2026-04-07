import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import { clientService, Client } from "../services/client.service";
import { aiService } from "../services/ai.service";
import Button from "../components/ui/button/Button";
import Input from "../components/form/input/InputField";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../components/ui/table";

interface ClientWithStats extends Client {
  totalInvoiced: number;
  totalPaid: number;
  outstandingBalance: number;
  invoiceCount: number;
}

function formatTND(amount: number): string {
  return `TND ${Number(amount).toFixed(3)}`;
}

export default function ClientList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientWithStats[]>([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [emailValidation, setEmailValidation] = useState<{ isValid: boolean; message: string } | null>(null);
  const [isValidatingEmail, setIsValidatingEmail] = useState(false);
  const [showAutoFillModal, setShowAutoFillModal] = useState(false);
  const [autoFillText, setAutoFillText] = useState("");
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  // Additional filter states - initialize from URL
  const [hasActivityFilter, setHasActivityFilter] = useState<"all" | "with_invoices" | "without_invoices">(
    (searchParams.get('activity') as any) || "all"
  );

  // Show notification when filters are applied from Smart Search
  const smartSearchApplied = searchParams.has('search') || searchParams.has('activity');

  useEffect(() => {
    fetchClients();
  }, []);

  // Apply comprehensive filters
  useEffect(() => {
    let filtered = clients;

    // Search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (client) =>
          client.name.toLowerCase().includes(query) ||
          (client.email && client.email.toLowerCase().includes(query)) ||
          (client.phone && client.phone.toLowerCase().includes(query)) ||
          (client.address && client.address.toLowerCase().includes(query))
      );
    }

    // Activity filter
    if (hasActivityFilter === "with_invoices") {
      filtered = filtered.filter((client) => (client.invoiceCount || 0) > 0);
    } else if (hasActivityFilter === "without_invoices") {
      filtered = filtered.filter((client) => (client.invoiceCount || 0) === 0);
    }

    setFilteredClients(filtered);
  }, [clients, searchQuery, hasActivityFilter]);

  const clearFilters = () => {
    setSearchQuery("");
    setHasActivityFilter("all");
    setSearchParams({});
  };

  const hasActiveFilters = searchQuery || hasActivityFilter !== "all";

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const data = await clientService.getClients();
      setClients(data as ClientWithStats[]);
      setFilteredClients(data as ClientWithStats[]);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load clients");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      setError("Client name is required");
      return;
    }

    try {
      setIsLoading(true);
      if (editingClient) {
        await clientService.updateClient(editingClient.id, formData);
      } else {
        await clientService.createClient(formData);
      }
      await fetchClients();
      setShowAddModal(false);
      setEditingClient(null);
      setFormData({ name: "", email: "", phone: "", address: "" });
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to save client");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this client?")) return;
    try {
      setIsLoading(true);
      await clientService.deleteClient(id);
      await fetchClients();
    } catch (err: any) {
      setError(err.message || "Failed to delete client");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewProfile = (clientId: string) => {
    navigate(`/clients/${clientId}`);
  };

  const handleNewInvoice = (clientId: string) => {
    navigate(`/invoices/create?clientId=${clientId}`);
  };

  const resetForm = () => {
    setFormData({ name: "", email: "", phone: "", address: "" });
    setEditingClient(null);
    setError("");
    setEmailValidation(null);
  };

  // AI Email Validation
  const validateEmail = async (email: string) => {
    if (!email) {
      setEmailValidation(null);
      return;
    }
    setIsValidatingEmail(true);
    try {
      const result = await aiService.validateEmail(email);
      if (!result.isValid) {
        setEmailValidation({ isValid: false, message: "Invalid email format" });
      } else if (!result.isDeliverable) {
        setEmailValidation({ isValid: false, message: "Email may not be deliverable" });
      } else if (result.suggestions && result.suggestions.length > 0) {
        setEmailValidation({ isValid: true, message: `Did you mean: ${result.suggestions[0]}?` });
      } else {
        setEmailValidation({ isValid: true, message: "Email looks valid" });
      }
    } catch {
      setEmailValidation(null);
    } finally {
      setIsValidatingEmail(false);
    }
  };

  // AI Smart Auto-Fill
  const handleAutoFill = async () => {
    if (!autoFillText.trim()) return;
    setIsAutoFilling(true);
    try {
      const extracted = await aiService.extractClientInfo(autoFillText);
      setFormData((prev) => ({
        name: extracted.name || prev.name,
        email: extracted.email || prev.email,
        phone: extracted.phone || prev.phone,
        address: extracted.address || prev.address,
      }));
      setShowAutoFillModal(false);
      setAutoFillText("");
      if (extracted.email) {
        await validateEmail(extracted.email);
      }
    } catch (err) {
      console.error("Auto-fill failed:", err);
    } finally {
      setIsAutoFilling(false);
    }
  };

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const total = clients.length;
    const totalInvoiced = clients.reduce((sum, c) => sum + (c.totalInvoiced || 0), 0);
    const totalOutstanding = clients.reduce((sum, c) => sum + (c.outstandingBalance || 0), 0);
    const totalPaid = totalInvoiced - totalOutstanding;
    return { total, totalInvoiced, totalOutstanding, totalPaid };
  }, [clients]);

  return (
    <>
      <PageMeta title="Clients | Dashboard" description="Manage your clients" />
      <div className="p-4">
        <PageBreadcrumb pageTitle="Clients" />

        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Clients
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Manage your clients and view their history
              </p>
            </div>
            <Button onClick={() => { resetForm(); setShowAddModal(true); }}>
              + New Client
            </Button>
          </div>

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
                  onClick={clearFilters}
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

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Clients</p>
                  <h3 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{summaryStats.total}</h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Invoiced</p>
                  <h3 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{formatTND(summaryStats.totalInvoiced)}</h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Paid</p>
                  <h3 className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">{formatTND(summaryStats.totalPaid)}</h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Outstanding</p>
                  <h3 className="mt-2 text-2xl font-bold text-orange-600 dark:text-orange-400">{formatTND(summaryStats.totalOutstanding)}</h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white w-full md:w-64"
              />
              <select
                value={hasActivityFilter}
                onChange={(e) => setHasActivityFilter(e.target.value as any)}
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Clients</option>
                <option value="with_invoices">With Invoices</option>
                <option value="without_invoices">Without Invoices</option>
              </select>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Clear All
                </button>
              )}
            </div>
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mt-3">
                {searchQuery && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Search: {searchQuery}
                    <button onClick={() => setSearchQuery("")} className="ml-1 text-blue-600 hover:text-blue-800">×</button>
                  </span>
                )}
                {hasActivityFilter !== "all" && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Activity: {hasActivityFilter.replace("_", " ")}
                    <button onClick={() => setHasActivityFilter("all")} className="ml-1 text-green-600 hover:text-green-800">×</button>
                  </span>
                )}
              </div>
            )}
            <div className="text-sm text-gray-500 mt-2">
              Showing {filteredClients.length} of {clients.length} clients
            </div>
          </div>

          {/* Add/Edit Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-lg">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {editingClient ? "Edit Client" : "Add New Client"}
                    </h2>
                    {!editingClient && (
                      <Button
                        variant="outline"
                        onClick={() => setShowAutoFillModal(true)}
                        size="sm"
                        className="text-purple-600 border-purple-600 hover:bg-purple-50"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        AI Auto-Fill
                      </Button>
                    )}
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="Enter client name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => {
                          const email = e.target.value;
                          setFormData({ ...formData, email });
                          setTimeout(() => validateEmail(email), 500);
                        }}
                        className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="client@example.com"
                      />
                      {isValidatingEmail && (
                        <p className="mt-1 text-xs text-gray-500">Validating...</p>
                      )}
                      {emailValidation && !isValidatingEmail && (
                        <p className={`mt-1 text-xs ${emailValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                          {emailValidation.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="+1 234 567 890"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Address
                      </label>
                      <textarea
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none"
                        placeholder="Client address"
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowAddModal(false);
                          setEmailValidation(null);
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1"
                      >
                        {isLoading ? "Saving..." : (editingClient ? "Update" : "Save")}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* AI Auto-Fill Modal */}
          {showAutoFillModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-lg w-full">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  AI Smart Auto-Fill
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Paste client information (from email, PDF, or any text) and AI will extract the details.
                </p>
                <textarea
                  value={autoFillText}
                  onChange={(e) => setAutoFillText(e.target.value)}
                  placeholder="Paste client information here..."
                  className="w-full h-32 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none mb-4"
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowAutoFillModal(false)} size="sm">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAutoFill}
                    disabled={!autoFillText.trim() || isAutoFilling}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isAutoFilling ? "Extracting..." : "Extract Info"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Clients Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            {filteredClients.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                {searchQuery ? "No clients match your search." : "No clients yet. Click \"New Client\" to create one."}
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-gray-50 dark:bg-gray-700/50">
                  <TableRow>
                    <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Name
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Email
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Phone
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Invoices
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Total Invoiced
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Outstanding
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {client.name}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {client.email || "-"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {client.phone || "-"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center text-gray-600 dark:text-gray-300">
                        {client.invoiceCount || 0}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">
                        {formatTND(client.totalInvoiced || 0)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <span className={client.outstandingBalance > 0 ? "text-red-600 font-medium" : "text-green-600"}>
                          {formatTND(client.outstandingBalance || 0)}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleViewProfile(client.id)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            View Profile
                          </button>
                          <button
                            onClick={() => handleNewInvoice(client.id)}
                            className="text-green-600 hover:text-green-700 text-sm"
                          >
                            New Invoice
                          </button>
                          <button
                            onClick={() => handleEdit(client)}
                            className="text-gray-600 hover:text-gray-700 text-sm"
                          >
                            Edit
                          </button>
                          {(client.invoiceCount || 0) === 0 && (
                            <button
                              onClick={() => handleDelete(client.id)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
