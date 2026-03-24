import { useState, ChangeEvent } from "react";
import { useNavigate } from "react-router";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import { expenseService, ScanReceiptResponse } from "../services/expense.service";
import Button from "../components/ui/button/Button";

const categories = [
  "meals",
  "travel",
  "supplies",
  "equipment",
  "software",
  "rent",
  "utilities",
  "marketing",
  "other",
];

export default function UploadReceipt() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState("other");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [scanResult, setScanResult] = useState<ScanReceiptResponse | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Editable extracted data
  const [extractedData, setExtractedData] = useState({
    amount: "",
    date: "",
    supplier: "",
    description: "",
  });

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
      const result = await expenseService.uploadReceipt(file);
      setScanResult(result);
      
      // Populate editable fields with extracted data
      setExtractedData({
        amount: result.aiExtracted.amount.toString(),
        date: result.aiExtracted.date,
        supplier: result.aiExtracted.supplier,
        description: "",
      });
    } catch (err: any) {
      setError(err.message || "Failed to upload receipt");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveExpense = async () => {
    if (!scanResult) return;

    try {
      setIsSaving(true);
      setError("");

      await expenseService.createExpense({
        amount: parseFloat(extractedData.amount),
        category,
        date: extractedData.date,
        receiptUrl: scanResult.receiptUrl,
        supplier: extractedData.supplier,
        description: extractedData.description,
      });

      setSuccess("Expense saved successfully!");
      setTimeout(() => {
        navigate("/expenses");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to save expense");
      setIsSaving(false);
    }
  };

  const getReceiptUrl = (receiptUrl?: string) => {
    if (!receiptUrl) return null;
    return `${import.meta.env.VITE_API_URL || "http://localhost:3000"}${receiptUrl}`;
  };

  return (
    <div className="p-4">
      <PageBreadcrumb pageTitle="Upload Receipt" />

      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Upload Receipt
          </h1>
          <Button variant="outline" onClick={() => navigate("/expenses/create")}>
            Or Enter Manually
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

        {/* Upload Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Receipt File *
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
                "Upload & Scan"
              )}
            </Button>
          </form>
        </div>

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

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={extractedData.amount}
                  onChange={(e) => setExtractedData({ ...extractedData, amount: e.target.value })}
                  className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  value={extractedData.date}
                  onChange={(e) => setExtractedData({ ...extractedData, date: e.target.value })}
                  className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Supplier
                </label>
                <input
                  type="text"
                  value={extractedData.supplier}
                  onChange={(e) => setExtractedData({ ...extractedData, supplier: e.target.value })}
                  className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={extractedData.description}
                  onChange={(e) => setExtractedData({ ...extractedData, description: e.target.value })}
                  placeholder="Add optional description..."
                  className="w-full h-24 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none"
                />
              </div>
            </div>

            {/* Receipt Preview */}
            {scanResult.receiptUrl && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Receipt Preview
                </h3>
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {scanResult.receiptUrl.endsWith('.pdf') ? (
                    <a
                      href={getReceiptUrl(scanResult.receiptUrl) || "#"}
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
                      src={getReceiptUrl(scanResult.receiptUrl) || ""}
                      alt="Receipt"
                      className="max-h-64 w-full object-contain"
                    />
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setScanResult(null);
                  setFile(null);
                  setExtractedData({ amount: "", date: "", supplier: "", description: "" });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveExpense}
                disabled={isSaving || !extractedData.amount || !extractedData.date}
                className="flex-1"
              >
                {isSaving ? "Saving..." : "Confirm & Save Expense"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
