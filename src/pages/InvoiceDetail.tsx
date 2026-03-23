import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import { invoiceService, Invoice } from "../services/invoice.service";
import Button from "../components/ui/button/Button";
import Badge from "../components/ui/badge/Badge";

const statusColors = {
  paid: "success",
  unpaid: "error",
  overdue: "warning",
} as const;

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({ email: "", subject: "", message: "" });
  const [emailSuccess, setEmailSuccess] = useState("");

  const fetchInvoice = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const data = await invoiceService.getInvoice(id);
      setInvoice(data);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load invoice");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    try {
      const blob = await invoiceService.downloadPdf(invoice.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || "Failed to download PDF");
    }
  };

  const handleUpdateStatus = async (status: "paid" | "unpaid" | "overdue") => {
    if (!invoice) return;
    try {
      await invoiceService.updateInvoiceStatus(invoice.id, status);
      await fetchInvoice();
    } catch (err: any) {
      setError(err.message || "Failed to update status");
    }
  };

  const handleSendEmail = async () => {
    if (!invoice || !emailData.email) return;
    try {
      setIsSendingEmail(true);
      setError("");
      await invoiceService.sendInvoiceEmail(invoice.id, {
        email: emailData.email,
        subject: emailData.subject || undefined,
        message: emailData.message || undefined,
      });
      setEmailSuccess("Invoice sent successfully!");
      setShowEmailModal(false);
      setEmailData({ email: "", subject: "", message: "" });
    } catch (err: any) {
      setError(err.message || "Failed to send invoice");
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-4">
        <PageBreadcrumb pageTitle="Invoice Not Found" />
        <div className="max-w-4xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Invoice Not Found
          </h2>
          <Button onClick={() => navigate("/invoices")}>
            Back to Invoices
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <PageBreadcrumb pageTitle={`Invoice #${invoice.invoiceNumber}`} />

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Invoice #{invoice.invoiceNumber}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Created on {new Date(invoice.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/invoices")}>
              Back
            </Button>
            <Button variant="outline" onClick={handleDownloadPdf}>
              Download PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowEmailModal(true)}
              disabled={!invoice.clientEmail && !emailData.email}
            >
              Send Email
            </Button>
          </div>
        </div>

        {emailSuccess && (
          <div className="mb-4 p-4 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-900/30 dark:text-green-400">
            {emailSuccess}
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Status
              </h2>
              <Badge color={statusColors[invoice.status]}>
                {invoice.status.toUpperCase()}
              </Badge>
            </div>
            <div className="text-right">
              {invoice.status !== "paid" && (
                <Button
                  size="sm"
                  onClick={() => handleUpdateStatus("paid")}
                >
                  Mark as Paid
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Bill To
              </h3>
              <p className="font-semibold text-gray-900 dark:text-white">
                {invoice.clientName || "Client"}
              </p>
              {invoice.clientEmail && (
                <p className="text-gray-600 dark:text-gray-400">{invoice.clientEmail}</p>
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                From
              </h3>
              <p className="font-semibold text-gray-900 dark:text-white">
                {invoice.business?.name || "Your Business"}
              </p>
            </div>
          </div>

          {invoice.dueDate && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Due Date
              </h3>
              <p className="text-gray-900 dark:text-white">
                {new Date(invoice.dueDate).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Items
          </h2>
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Description
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Quantity
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Price
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="px-4 py-3 text-gray-900 dark:text-white">
                    {item.description || item.product?.name || "Item"}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-900 dark:text-white">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                    ${Number(item.price).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                    ${Number(item.total).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 flex justify-end">
            <div className="w-72 space-y-3">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal:</span>
                <span>${Number(invoice.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Tax:</span>
                <span>${Number(invoice.taxAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white pt-3 border-t border-gray-200 dark:border-gray-700">
                <span>Total:</span>
                <span>${Number(invoice.totalAmount).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Notes
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{invoice.notes}</p>
          </div>
        )}

        {/* Send Email Modal */}
        {showEmailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Send Invoice via Email
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    To Email *
                  </label>
                  <input
                    type="email"
                    value={emailData.email}
                    onChange={(e) => setEmailData({ ...emailData, email: e.target.value })}
                    placeholder="client@example.com"
                    className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Subject (optional)
                  </label>
                  <input
                    type="text"
                    value={emailData.subject}
                    onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                    placeholder={`Invoice #${invoice.invoiceNumber}`}
                    className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Message (optional)
                  </label>
                  <textarea
                    value={emailData.message}
                    onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                    placeholder="Add a custom message..."
                    className="w-full h-24 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowEmailModal(false)}
                  disabled={isSendingEmail}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendEmail}
                  disabled={!emailData.email || isSendingEmail}
                >
                  {isSendingEmail ? "Sending..." : "Send Email"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
