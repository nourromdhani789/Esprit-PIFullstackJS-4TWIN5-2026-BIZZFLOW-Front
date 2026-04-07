import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import { invoiceService, Invoice } from "../services/invoice.service";
import { aiService } from "../services/ai.service";
import { formatTextForTTS } from "../services/tts.service";
import { AudioPlayer } from "../components/ui/audio-player/AudioPlayer";
import { useBusiness } from "../contexts/BusinessContext";
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
  const { formatCurrency } = useBusiness();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({ email: "", message: "" });
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showTranslationModal, setShowTranslationModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [translatedText, setTranslatedText] = useState("");
  const [summaryText, setSummaryText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState("fr");

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

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

  const handleSendEmailClick = async () => {
    if (!invoice) return;
    
    // If client has email, send directly without modal
    if (invoice.client?.email) {
      await sendEmailDirectly(invoice.client.email);
    } else {
      // Open modal for missing email
      setShowEmailModal(true);
    }
  };

  const sendEmailDirectly = async (email: string) => {
    if (!invoice) return;
    try {
      setIsSendingEmail(true);
      setError("");
      const response = await invoiceService.sendInvoiceEmail(invoice.id, {
        email,
        message: emailData.message || undefined,
      });
      showToast('success', response.message || `Invoice sent successfully to ${email}`);
      setEmailData({ email: "", message: "" });
      setShowEmailModal(false);
      await fetchInvoice(); // Refresh to show updated client email
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to send invoice";
      if (errorMsg.includes('no email') || errorMsg.includes('provide')) {
        setShowEmailModal(true);
      }
      showToast('error', errorMsg);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSendEmailFromModal = async () => {
    if (!emailData.email) return;
    await sendEmailDirectly(emailData.email);
  };

  // AI Document Translation
  const handleTranslate = async () => {
    if (!invoice) return;
    setIsTranslating(true);
    try {
      const textToTranslate = `Invoice #${invoice.invoiceNumber}\n\nBill To: ${invoice.client?.name || "Client"}\n${invoice.client?.email || ""}\n\nItems:\n${invoice.items?.map((item) => `${item.description || item.product?.name}: ${item.quantity} x ${formatCurrency(Number(item.price))}`).join("\n")}\n\nTotal: ${formatCurrency(Number(invoice.totalAmount))}\n\nNotes: ${invoice.notes || ""}`;
      
      const translated = await aiService.translateDocument(textToTranslate, targetLanguage);
      setTranslatedText(translated);
    } catch (err) {
      showToast('error', 'Translation failed');
    } finally {
      setIsTranslating(false);
    }
  };

  // AI Document Summarization
  const handleSummarize = async () => {
    if (!invoice) return;
    setIsSummarizing(true);
    try {
      const textToSummarize = `Invoice #${invoice.invoiceNumber} for ${invoice.client?.name || "Client"}. Status: ${invoice.status}. Total amount: ${formatCurrency(Number(invoice.totalAmount))}. Items: ${invoice.items?.map((item) => `${item.description || item.product?.name} (${item.quantity})`).join(", ")}. ${invoice.notes ? `Notes: ${invoice.notes}` : ""}`;
      
      const summary = await aiService.summarizeDocument(textToSummarize);
      setSummaryText(summary);
    } catch (err) {
      showToast('error', 'Summarization failed');
    } finally {
      setIsSummarizing(false);
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
                {invoice.client?.name || "Client"}
              </p>
              {invoice.client?.email && (
                <p className="text-gray-600 dark:text-gray-400">{invoice.client.email}</p>
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
                    {formatCurrency(Number(item.price))}
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
                <span>{formatCurrency(Number(invoice.subtotal))}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Tax:</span>
                <span>{formatCurrency(Number(invoice.taxAmount))}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white pt-3 border-t border-gray-200 dark:border-gray-700">
                <span>Total:</span>
                <span>{formatCurrency(Number(invoice.totalAmount))}</span>
              </div>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Notes
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{invoice.notes}</p>
          </div>
        )}

        {/* AI Features Section */}
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-purple-900 dark:text-purple-300 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AI Features
          </h2>
          <div className="flex flex-wrap gap-3 items-center">
            <Button
              variant="outline"
              onClick={() => setShowTranslationModal(true)}
              size="sm"
              className="text-purple-600 border-purple-600 hover:bg-purple-50"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              Translate Document
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowSummaryModal(true);
                handleSummarize();
              }}
              size="sm"
              className="text-purple-600 border-purple-600 hover:bg-purple-50"
              disabled={isSummarizing}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {isSummarizing ? "Generating..." : "Generate Summary"}
            </Button>
            {invoice && (
              <AudioPlayer
                text={formatTextForTTS({
                  invoiceNumber: invoice.invoiceNumber,
                  clientName: invoice.client?.name,
                  total: invoice.totalAmount,
                  status: invoice.status,
                  items: invoice.items?.map(item => ({
                    name: item.description || item.product?.name || 'Item',
                    quantity: item.quantity,
                    price: Number(item.price || 0),
                  })),
                  dueDate: invoice.dueDate,
                })}
                label="🔊 Listen"
              />
            )}
          </div>
        </div>

        {(invoice.sourceQuoteId || invoice.sourceSalesOrderId) && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2">
              Source Document
            </h2>
            {invoice.sourceQuoteId && (
              <p className="text-blue-700 dark:text-blue-400">
                Created from Quote: <button className="underline font-medium" onClick={() => navigate(`/quotes/${invoice.sourceQuoteId}`)}>View →</button>
              </p>
            )}
            {invoice.sourceSalesOrderId && (
              <p className="text-blue-700 dark:text-blue-400">
                Created from Sales Order: <button className="underline font-medium" onClick={() => navigate(`/sales-orders/${invoice.sourceSalesOrderId}`)}>View →</button>
              </p>
            )}
          </div>
        )}

        {/* AI Translation Modal */}
        {showTranslationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                AI Document Translation
              </h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Language
                </label>
                <select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="fr">French</option>
                  <option value="es">Spanish</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                  <option value="ar">Arabic</option>
                  <option value="zh">Chinese</option>
                </select>
              </div>
              <Button
                onClick={handleTranslate}
                disabled={isTranslating}
                className="w-full mb-4"
              >
                {isTranslating ? "Translating..." : "Translate"}
              </Button>
              {translatedText && (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Translation Result:</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{translatedText}</p>
                </div>
              )}
              <div className="flex justify-end mt-4">
                <Button variant="outline" onClick={() => setShowTranslationModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* AI Summary Modal */}
        {showSummaryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg mx-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                AI Document Summary
              </h2>
              {isSummarizing ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                  <span className="ml-3 text-gray-600 dark:text-gray-400">Generating summary...</span>
                </div>
              ) : summaryText ? (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{summaryText}</p>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No summary available.</p>
              )}
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setShowSummaryModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Send Email Modal - Only shown when client has no email */}
        {showEmailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Send Invoice via Email
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                This client has no email address. Please provide one to send the invoice.
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
                <Button
                  variant="outline"
                  onClick={() => setShowEmailModal(false)}
                  disabled={isSendingEmail}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendEmailFromModal}
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
