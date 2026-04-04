import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import { salesOrderService, SalesOrder } from "../services/sales-order.service";
import { useBusiness } from "../contexts/BusinessContext";
import Button from "../components/ui/button/Button";
import Badge from "../components/ui/badge/Badge";

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

export default function SalesOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { formatCurrency } = useBusiness();
  const [salesOrder, setSalesOrder] = useState<SalesOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({ email: "", message: "" });
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchSalesOrder = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const data = await salesOrderService.getSalesOrder(id);
      setSalesOrder(data);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load sales order");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesOrder();
  }, [id]);

  const handleDownloadPdf = async () => {
    if (!salesOrder) return;
    try {
      const blob = await salesOrderService.downloadPdf(salesOrder.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `sales-order-${salesOrder.salesOrderNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || "Failed to download PDF");
    }
  };

  const handleConfirm = async () => {
    if (!salesOrder) return;
    try {
      await salesOrderService.confirmOrder(salesOrder.id);
      await fetchSalesOrder();
    } catch (err: any) {
      setError(err.message || "Failed to confirm order");
    }
  };

  const handleDeliver = async () => {
    if (!salesOrder) return;
    try {
      await salesOrderService.deliverOrder(salesOrder.id);
      await fetchSalesOrder();
    } catch (err: any) {
      setError(err.message || "Failed to mark as delivered");
    }
  };

  const handleCancel = async () => {
    if (!salesOrder) return;
    if (!confirm("Are you sure you want to cancel this sales order?")) return;
    try {
      await salesOrderService.cancelOrder(salesOrder.id);
      await fetchSalesOrder();
    } catch (err: any) {
      setError(err.message || "Failed to cancel order");
    }
  };

  const handleSendEmailClick = async () => {
    if (!salesOrder) return;
    if (salesOrder.client?.email) {
      await sendEmailDirectly(salesOrder.client.email);
    } else {
      setShowEmailModal(true);
    }
  };

  const sendEmailDirectly = async (email: string) => {
    if (!salesOrder) return;
    try {
      setIsSendingEmail(true);
      setError("");
      const response = await salesOrderService.sendSalesOrderEmail(salesOrder.id, { email, message: emailData.message });
      showToast('success', response.message || `Sales order sent successfully to ${email}`);
      setEmailData({ email: "", message: "" });
      setShowEmailModal(false);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to send sales order";
      showToast('error', errorMsg);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleConvertToInvoice = async () => {
    if (!salesOrder) return;
    if (!confirm("Convert this sales order to an invoice?")) return;
    try {
      const invoice = await salesOrderService.convertToInvoice(salesOrder.id);
      showToast('success', `Converted to Invoice #${invoice.invoiceNumber}`);
      await fetchSalesOrder();
      navigate(`/invoices/${invoice.id}`);
    } catch (err: any) {
      showToast('error', err.message || "Failed to convert to invoice");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!salesOrder) {
    return (
      <div className="p-4">
        <PageBreadcrumb pageTitle="Sales Order Not Found" />
        <div className="max-w-4xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Sales Order Not Found
          </h2>
          <Button onClick={() => navigate("/sales-orders")}>
            Back to Sales Orders
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <PageBreadcrumb pageTitle={`Sales Order #${salesOrder.salesOrderNumber}`} />

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Sales Order #{salesOrder.salesOrderNumber}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Created on {new Date(salesOrder.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/sales-orders")}>
              Back
            </Button>
            <Button variant="outline" onClick={handleDownloadPdf}>
              Download PDF
            </Button>
            <Button
              variant="outline"
              onClick={handleSendEmailClick}
              disabled={isSendingEmail}
            >
              {isSendingEmail ? "Sending..." : "Send Email"}
            </Button>
          </div>
        </div>

        {toast && (
          <div className={`mb-4 p-4 text-sm rounded-lg ${
            toast.type === 'success' 
              ? 'text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400' 
              : 'text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {toast.message}
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
              <Badge color={statusColors[salesOrder.status]}>
                {statusLabels[salesOrder.status].toUpperCase()}
              </Badge>
            </div>
            <div className="flex gap-2">
              {salesOrder.status === 'draft' && (
                <Button size="sm" onClick={handleConfirm}>
                  Confirm Order
                </Button>
              )}
              {salesOrder.status === 'confirmed' && (
                <>
                  <Button size="sm" onClick={handleDeliver}>
                    Mark as Delivered
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600" onClick={handleCancel}>
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Client
              </h3>
              <p className="font-semibold text-gray-900 dark:text-white">
                {salesOrder.client?.name || "Client"}
              </p>
              {salesOrder.client?.email && (
                <p className="text-gray-600 dark:text-gray-400">{salesOrder.client.email}</p>
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                From
              </h3>
              <p className="font-semibold text-gray-900 dark:text-white">
                {salesOrder.business?.name || "Your Business"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Issue Date
              </h3>
              <p className="text-gray-900 dark:text-white">
                {new Date(salesOrder.issueDate).toLocaleDateString()}
              </p>
            </div>
            {salesOrder.expectedDeliveryDate && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Expected Delivery Date
                </h3>
                <p className="text-gray-900 dark:text-white">
                  {new Date(salesOrder.expectedDeliveryDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
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
                  Unit Price
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {salesOrder.items?.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="px-4 py-3 text-gray-900 dark:text-white">
                    {item.description || item.product?.name || "Item"}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-900 dark:text-white">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                    {formatCurrency(Number(item.unitPrice))}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                    {formatCurrency(Number(item.total))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 flex justify-end">
            <div className="w-72 space-y-3">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal:</span>
                <span>{formatCurrency(Number(salesOrder.subtotal))}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Tax:</span>
                <span>{formatCurrency(Number(salesOrder.taxAmount))}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white pt-3 border-t border-gray-200 dark:border-gray-700">
                <span>Total:</span>
                <span>{formatCurrency(Number(salesOrder.totalAmount))}</span>
              </div>
            </div>
          </div>
        </div>

        {salesOrder.notes && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Notes
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{salesOrder.notes}</p>
          </div>
        )}

        {/* Source Document */}
        {salesOrder.sourceQuoteId && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2">
              Source Document
            </h2>
            <p className="text-blue-700 dark:text-blue-400">
              Created from Quote: <button className="underline font-medium" onClick={() => navigate(`/quotes/${salesOrder.sourceQuoteId}`)}>View →</button>
            </p>
          </div>
        )}

        {/* Conversion Section */}
        {(salesOrder.status === 'confirmed' || salesOrder.status === 'delivered') && !salesOrder.convertedToInvoiceId && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-4">
              Convert this Sales Order
            </h2>
            <Button onClick={handleConvertToInvoice}>
              → Convert to Invoice
            </Button>
          </div>
        )}

        {/* Already Converted */}
        {salesOrder.convertedToInvoiceId && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-green-900 dark:text-green-300 mb-2">
              Converted
            </h2>
            <p className="text-green-700 dark:text-green-400">
              Converted to Invoice: <button className="underline font-medium" onClick={() => navigate(`/invoices/${salesOrder.convertedToInvoiceId}`)}>View →</button>
            </p>
          </div>
        )}

        {/* Email Modal */}
        {showEmailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Send Sales Order via Email
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                This client has no email address. Please provide one.
              </p>
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
                <Button variant="outline" onClick={() => setShowEmailModal(false)} disabled={isSendingEmail}>
                  Cancel
                </Button>
                <Button onClick={() => sendEmailDirectly(emailData.email)} disabled={!emailData.email || isSendingEmail}>
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
