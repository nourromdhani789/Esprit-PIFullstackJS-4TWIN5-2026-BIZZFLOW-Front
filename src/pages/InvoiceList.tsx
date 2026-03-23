import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import { invoiceService, Invoice } from "../services/invoice.service";
import Button from "../components/ui/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import Badge from "../components/ui/badge/Badge";

const statusColors = {
  paid: "success",
  unpaid: "error",
  overdue: "warning",
} as const;

export default function InvoiceList() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const data = await invoiceService.getInvoices();
      setInvoices(data);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load invoices");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleDownloadPdf = async (id: string, invoiceNumber: string) => {
    try {
      const blob = await invoiceService.downloadPdf(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || "Failed to download PDF");
    }
  };

  const handleUpdateStatus = async (id: string, status: "paid" | "unpaid" | "overdue") => {
    try {
      await invoiceService.updateInvoiceStatus(id, status);
      await fetchInvoices();
    } catch (err: any) {
      setError(err.message || "Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    try {
      await invoiceService.deleteInvoice(id);
      await fetchInvoices();
    } catch (err: any) {
      setError(err.message || "Failed to delete invoice");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <PageBreadcrumb pageTitle="Invoices" />

      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Invoices
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Manage and track your invoices
            </p>
          </div>
          <Button onClick={() => navigate("/invoices/create")}>
            + Create Invoice
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50 dark:bg-gray-700/50">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Invoice #
                </TableCell>
                <TableCell
                  isHeader
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Client
                </TableCell>
                <TableCell
                  isHeader
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Date
                </TableCell>
                <TableCell
                  isHeader
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Amount
                </TableCell>
                <TableCell
                  isHeader
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Status
                </TableCell>
                <TableCell
                  isHeader
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    No invoices found. Create your first invoice to get started.
                  </td>
                </TableRow>
              ) : (
                invoices.map((invoice) => (
                  <TableRow key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <TableCell className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        #{invoice.invoiceNumber}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {invoice.clientName || "Client"}
                      </div>
                      {invoice.clientEmail && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {invoice.clientEmail}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                      ${Number(invoice.totalAmount).toFixed(2)}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge color={statusColors[invoice.status]}>
                        {invoice.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/invoices/${invoice.id}`)}
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadPdf(invoice.id, invoice.invoiceNumber)}
                        >
                          PDF
                        </Button>
                        {invoice.status !== "paid" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600"
                            onClick={() => handleUpdateStatus(invoice.id, "paid")}
                          >
                            Mark Paid
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600"
                          onClick={() => handleDelete(invoice.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
