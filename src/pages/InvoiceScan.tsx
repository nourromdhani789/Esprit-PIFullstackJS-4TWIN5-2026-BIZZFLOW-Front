import { useState, ChangeEvent } from "react";
import { useNavigate } from "react-router";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import { invoiceService, ScanInvoiceResponse, CreateInvoiceDto, CreateInvoiceItemDto } from "../services/invoice.service";
import Button from "../components/ui/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../components/ui/table";

interface InvoiceItemForm extends CreateInvoiceItemDto {
  tempId: string;
  productName?: string;
}

export default function InvoiceScan() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scanResult, setScanResult] = useState<ScanInvoiceResponse | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Editable extracted data
  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    totalAmount: "",
    date: "",
    notes: "",
  });

  const [items, setItems] = useState<InvoiceItemForm[]>([]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "application/pdf"];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError("Please upload an image (JPEG, PNG, GIF) or PDF file");
        return;
      }
      // Validate file size (5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }
      setFile(selectedFile);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    try {
      setIsUploading(true);
      setError("");
      const result = await invoiceService.uploadScan(file);
      setScanResult(result);

      // Populate editable fields with extracted data
      setFormData({
        clientName: result.aiExtracted.clientName,
        clientEmail: "",
        totalAmount: result.aiExtracted.totalAmount.toString(),
        date: result.aiExtracted.date,
        notes: "AI-scanned invoice document",
      });

      // Add one default item with the total amount
      const newItem: InvoiceItemForm = {
        tempId: Math.random().toString(36).substring(7),
        productId: "scanned-item",
        quantity: 1,
        price: result.aiExtracted.totalAmount,
        description: "Scanned invoice item",
      };
      setItems([newItem]);
    } catch (err: any) {
      setError(err.message || "Failed to upload and scan document");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddItem = () => {
    const newItem: InvoiceItemForm = {
      tempId: Math.random().toString(36).substring(7),
      productId: "manual-item",
      quantity: 1,
      price: 0,
      description: "Manual item",
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = (tempId: string) => {
    setItems((prev) => prev.filter((item) => item.tempId !== tempId));
  };

  const handleUpdateItem = (tempId: string, field: keyof InvoiceItemForm, value: any) => {
    setItems((prev) =>
      prev.map((item) =>
        item.tempId === tempId ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSubmit = async () => {
    if (!formData.clientName || items.length === 0) {
      setError("Please fill in client name and add at least one item");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const invoiceData: CreateInvoiceDto = {
        clientId: "scanned-client",
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        notes: formData.notes,
        dueDate: formData.date,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          description: item.description,
        })),
      };

      await invoiceService.createInvoice(invoiceData);
      setSuccess("Invoice created successfully!");
      setTimeout(() => {
        navigate("/invoices");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to create invoice");
      setIsSubmitting(false);
    }
  };

  const totals = items.reduce(
    (acc, item) => ({
      subtotal: acc.subtotal + item.quantity * item.price,
      taxAmount: 0,
      total: acc.total + item.quantity * item.price,
    }),
    { subtotal: 0, taxAmount: 0, total: 0 }
  );

  const getScanUrl = (scanUrl?: string) => {
    if (!scanUrl) return null;
    return `${import.meta.env.VITE_API_URL || "http://localhost:3000"}${scanUrl}`;
  };

  return (
    <div className="p-4">
      <PageBreadcrumb pageTitle="Scan Invoice" />

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Upload & Scan Invoice
          </h1>
          <Button variant="outline" onClick={() => navigate("/invoices/create")}>
            Or Create Manually
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-900/30 dark:text-green-400">
            {success}
          </div>
        )}

        {/* Upload Section */}
        {!scanResult && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Invoice Document *
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,application/pdf"
                  onChange={handleFileChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Accepted formats: JPEG, PNG, GIF, PDF (max 5MB)
                </p>
              </div>

              <Button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Scanning with AI...
                  </span>
                ) : (
                  "Upload & Scan with AI"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* AI Extraction Results */}
        {scanResult && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                AI Extraction Results
              </h2>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
                Confidence: {Math.round(scanResult.aiExtracted.confidence * 100)}%
              </span>
            </div>

            {/* Document Preview */}
            {scanResult.scanUrl && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Document Preview
                </h3>
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {scanResult.scanUrl.endsWith('.pdf') ? (
                    <a
                      href={getScanUrl(scanResult.scanUrl) || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center h-32 bg-gray-100 dark:bg-gray-700 text-brand-500 hover:text-brand-600"
                    >
                      <svg className="w-8 h-8 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      View PDF
                    </a>
                  ) : (
                    <img
                      src={getScanUrl(scanResult.scanUrl) || ""}
                      alt="Scanned document"
                      className="max-h-64 w-full object-contain"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Client Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Client Name *
                </label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Client Email
                </label>
                <input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Invoice Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Invoice Items *
                </h3>
                <Button size="sm" variant="outline" onClick={handleAddItem}>
                  + Add Item
                </Button>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50 dark:bg-gray-700/50">
                    <TableRow>
                      <TableCell isHeader className="px-4 py-2 text-left text-xs font-semibold">
                        Description
                      </TableCell>
                      <TableCell isHeader className="px-4 py-2 text-center text-xs font-semibold w-24">
                        Qty
                      </TableCell>
                      <TableCell isHeader className="px-4 py-2 text-right text-xs font-semibold w-32">
                        Price
                      </TableCell>
                      <TableCell isHeader className="px-4 py-2 text-right text-xs font-semibold w-24">
                        Total
                      </TableCell>
                      <TableCell isHeader className="px-4 py-2 text-center text-xs font-semibold w-20">
                        Action
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.tempId}>
                        <TableCell className="px-2 py-2">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleUpdateItem(item.tempId, "description", e.target.value)}
                            className="w-full h-9 rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          />
                        </TableCell>
                        <TableCell className="px-2 py-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(item.tempId, "quantity", parseInt(e.target.value) || 1)}
                            className="w-full h-9 rounded border border-gray-300 bg-white px-2 py-1 text-sm text-center dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          />
                        </TableCell>
                        <TableCell className="px-2 py-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.price}
                            onChange={(e) => handleUpdateItem(item.tempId, "price", parseFloat(e.target.value) || 0)}
                            className="w-full h-9 rounded border border-gray-300 bg-white px-2 py-1 text-sm text-right dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          />
                        </TableCell>
                        <TableCell className="px-4 py-2 text-right text-gray-900 dark:text-white font-medium">
                          TND {(item.quantity * item.price).toFixed(2)}
                        </TableCell>
                        <TableCell className="px-2 py-2 text-center">
                          <button
                            onClick={() => handleRemoveItem(item.tempId)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Totals */}
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Total:</span>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    TND {totals.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setScanResult(null);
                  setFile(null);
                  setFormData({ clientName: "", clientEmail: "", totalAmount: "", date: "", notes: "" });
                  setItems([]);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.clientName || items.length === 0}
                className="flex-1"
              >
                {isSubmitting ? "Creating Invoice..." : "Confirm & Create Invoice"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
