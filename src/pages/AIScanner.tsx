import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  CloudArrowUpIcon, 
  DocumentTextIcon, 
  SparklesIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon,
  TrashIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import PageBreadcrumb from '../components/common/PageBreadCrumb';
import PageMeta from '../components/common/PageMeta';
import Button from '../components/ui/button/Button';
import { 
  uploadDocument, 
  getDocuments, 
  deleteDocument, 
  retryProcessing,
  formatConfidence,
  getConfidenceColor,
  getDocumentTypeName,
  ProcessedDocument,
  DocumentType,
  ExtractedData,
} from '../services/document-processing.service';
import { useNavigate } from "react-router";

/**
 * AI Scanner Page
 * 
 * Allows users to:
 * - Upload documents (images/PDFs) for AI processing
 * - View processing status
 * - See extracted data with document-type specific fields
 * - Edit/correct extracted data
 * - Create documents (invoices/quotes/sales orders) from scans
 */

export default function AIScanner() {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [documents, setDocuments] = useState<ProcessedDocument[]>([]);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<ProcessedDocument | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [filter, setFilter] = useState<DocumentType | 'all'>('all');
  const [expandedText, setExpandedText] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Record<string, any>>({});

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, [filter]);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const typeParam = filter === 'all' ? undefined : filter;
      const response = await getDocuments({ documentType: typeParam, limit: 50 });
      setDocuments(response.data.documents);
      setTotalDocuments(response.data.total);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 300);

      const response = await uploadDocument(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Show result
      const newDoc: ProcessedDocument = {
        ...response.data,
        id: response.data.documentId,
        originalFilename: file.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tenantId: '',
        mimeType: file.type,
        fileSize: file.size,
        status: 'completed',
        confidenceLevel: response.data.confidenceLevel,
        classificationConfidence: response.data.confidence,
        isDataCorrected: false,
      };
      setSelectedDocument(newDoc);
      setEditedData(response.data.extractedData || {});
      setShowResultModal(true);

      // Refresh list
      loadDocuments();

    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload and process document. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 20 * 1024 * 1024, // 20MB
    maxFiles: 1,
    disabled: isUploading,
  });

  // Handle document deletion
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await deleteDocument(id);
      loadDocuments();
      if (selectedDocument?.id === id) {
        setShowResultModal(false);
        setSelectedDocument(null);
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete document');
    }
  };

  // Handle retry
  const handleRetry = async (id: string) => {
    try {
      await retryProcessing(id);
      loadDocuments();
    } catch (error) {
      console.error('Retry failed:', error);
      alert('Failed to retry processing');
    }
  };

  // Handle document creation
  const handleCreateDocument = (type: DocumentType) => {
    let route = '';
    switch (type) {
      case 'invoice':
        route = '/invoices/create';
        break;
      case 'quote':
        route = '/quotes/new';
        break;
      case 'sales_order':
        route = '/sales-orders/new';
        break;
      default:
        return;
    }
    
    // Navigate to the create page with pre-filled data
    navigate(route, {
      state: { 
        scanData: isEditing ? editedData : selectedDocument?.extractedData 
      },
    });
    
    setShowResultModal(false);
  };

  // Handle save edits
  const handleSaveEdits = async () => {
    if (!selectedDocument) return;
    
    try {
      // TODO: Call API to save edits
      setIsEditing(false);
      setSelectedDocument({
        ...selectedDocument,
        userCorrectedData: editedData,
        isDataCorrected: true,
      });
      alert('Changes saved successfully');
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save changes');
    }
  };

  // Render extracted data fields based on document type
  const renderExtractedFields = (data: ExtractedData | undefined, editing: boolean) => {
    if (!data || data.documentType === 'unknown') {
      return (
        <div className="text-gray-500 text-center py-4">
          No structured data extracted
        </div>
      );
    }

    const renderField = (label: string, key: string, value: any, type: 'text' | 'number' | 'date' = 'text') => {
      if (!editing && !value && value !== 0) return null;
      
      return (
        <div key={key} className="flex flex-col sm:flex-row sm:items-center py-2 border-b border-gray-100 last:border-0">
          <label className="text-sm font-medium text-gray-600 sm:w-1/3">{label}</label>
          {editing ? (
            <input
              type={type}
              value={editedData[key] ?? value ?? ''}
              onChange={(e) => setEditedData({ ...editedData, [key]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value })}
              className="mt-1 sm:mt-0 sm:w-2/3 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder={`Enter ${label.toLowerCase()}`}
            />
          ) : (
            <span className="text-sm text-gray-900 sm:w-2/3">
              {type === 'number' && value !== undefined ? value.toFixed(2) : value || '-'}
            </span>
          )}
        </div>
      );
    };

    const fields: React.ReactNode[] = [];

    if (data.documentType === 'invoice') {
      const d = data as ExtractedData & { invoiceNumber?: string; date?: string; dueDate?: string; clientName?: string; clientEmail?: string; clientPhone?: string; subtotal?: number; taxAmount?: number; taxRate?: number; totalAmount?: number; notes?: string; };
      fields.push(
        renderField('Invoice Number', 'invoiceNumber', d.invoiceNumber),
        renderField('Date', 'date', d.date, 'date'),
        renderField('Due Date', 'dueDate', d.dueDate, 'date'),
        renderField('Client Name', 'clientName', d.clientName),
        renderField('Client Email', 'clientEmail', d.clientEmail),
        renderField('Client Phone', 'clientPhone', d.clientPhone),
        renderField('Subtotal', 'subtotal', d.subtotal, 'number'),
        renderField('Tax Amount', 'taxAmount', d.taxAmount, 'number'),
        renderField('Tax Rate', 'taxRate', d.taxRate, 'number'),
        renderField('Total Amount', 'totalAmount', d.totalAmount, 'number'),
        renderField('Notes', 'notes', d.notes),
      );
    } else if (data.documentType === 'quote') {
      const d = data as ExtractedData & { quoteNumber?: string; issueDate?: string; expiryDate?: string; validDays?: number; clientName?: string; clientEmail?: string; clientPhone?: string; subtotal?: number; taxAmount?: number; taxRate?: number; totalAmount?: number; notes?: string; };
      fields.push(
        renderField('Quote Number', 'quoteNumber', d.quoteNumber),
        renderField('Issue Date', 'issueDate', d.issueDate, 'date'),
        renderField('Expiry Date', 'expiryDate', d.expiryDate, 'date'),
        renderField('Valid Days', 'validDays', d.validDays, 'number'),
        renderField('Client Name', 'clientName', d.clientName),
        renderField('Client Email', 'clientEmail', d.clientEmail),
        renderField('Client Phone', 'clientPhone', d.clientPhone),
        renderField('Subtotal', 'subtotal', d.subtotal, 'number'),
        renderField('Tax Amount', 'taxAmount', d.taxAmount, 'number'),
        renderField('Tax Rate', 'taxRate', d.taxRate, 'number'),
        renderField('Total Amount', 'totalAmount', d.totalAmount, 'number'),
        renderField('Notes', 'notes', d.notes),
      );
    } else if (data.documentType === 'sales_order') {
      const d = data as ExtractedData & { salesOrderNumber?: string; issueDate?: string; expectedDeliveryDate?: string; clientName?: string; clientEmail?: string; clientPhone?: string; subtotal?: number; taxAmount?: number; taxRate?: number; totalAmount?: number; notes?: string; };
      fields.push(
        renderField('Sales Order Number', 'salesOrderNumber', d.salesOrderNumber),
        renderField('Issue Date', 'issueDate', d.issueDate, 'date'),
        renderField('Expected Delivery', 'expectedDeliveryDate', d.expectedDeliveryDate, 'date'),
        renderField('Client Name', 'clientName', d.clientName),
        renderField('Client Email', 'clientEmail', d.clientEmail),
        renderField('Client Phone', 'clientPhone', d.clientPhone),
        renderField('Subtotal', 'subtotal', d.subtotal, 'number'),
        renderField('Tax Amount', 'taxAmount', d.taxAmount, 'number'),
        renderField('Tax Rate', 'taxRate', d.taxRate, 'number'),
        renderField('Total Amount', 'totalAmount', d.totalAmount, 'number'),
        renderField('Notes', 'notes', d.notes),
      );
    }

    return <div className="space-y-1">{fields.filter(Boolean)}</div>;
  };

  return (
    <>
      <PageMeta title="AI Document Scanner | TwinBusiness" description="AI-powered document scanning and processing" />
      
      <PageBreadcrumb pageTitle="AI Scanner" />
      
      <div className="space-y-6">
        {/* Upload Area */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30">
              <SparklesIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                AI Document Scanner
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Upload invoices, quotes, or sales orders for automatic data extraction
              </p>
            </div>
          </div>

          <div
            {...getRootProps()}
            className={`
              relative cursor-pointer rounded-xl border-2 border-dashed p-8 transition-colors
              ${isDragActive 
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                : 'border-gray-300 hover:border-primary-400 dark:border-gray-700 dark:hover:border-primary-600'
              }
              ${isUploading ? 'pointer-events-none opacity-60' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            <div className="flex flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                {isUploading ? (
                  <ArrowPathIcon className="h-8 w-8 animate-spin text-primary-600" />
                ) : (
                  <CloudArrowUpIcon className="h-8 w-8 text-gray-400" />
                )}
              </div>
              
              {isUploading ? (
                <div className="w-full max-w-xs">
                  <p className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    Processing document...
                  </p>
                  <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                    <div 
                      className="h-full rounded-full bg-primary-600 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{uploadProgress}%</p>
                </div>
              ) : (
                <>
                  <p className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    {isDragActive ? 'Drop the file here' : 'Drag & drop a file here, or click to select'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Supports: JPG, PNG, PDF (Max 10MB for images, 20MB for PDFs)
                  </p>
                </>
              )}
            </div>
          </div>

          {fileRejections.length > 0 && (
            <div className="mt-4 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">
                    File upload failed
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {fileRejections[0].errors[0]?.message}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Document List */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Processed Documents ({totalDocuments})
            </h3>
            
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as DocumentType | 'all')}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800"
            >
              <option value="all">All Types</option>
              <option value="invoice">Invoices</option>
              <option value="quote">Quotes</option>
              <option value="sales_order">Sales Orders</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <ArrowPathIcon className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MagnifyingGlassIcon className="mb-4 h-12 w-12 text-gray-300" />
              <p className="text-gray-500 dark:text-gray-400">
                No documents processed yet. Upload your first document above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="pb-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Document</th>
                    <th className="pb-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Type</th>
                    <th className="pb-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Confidence</th>
                    <th className="pb-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Status</th>
                    <th className="pb-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Date</th>
                    <th className="pb-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                            <DocumentTextIcon className="h-5 w-5 text-gray-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {doc.originalFilename}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(doc.fileSize / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          doc.documentType === 'invoice' ? 'bg-blue-100 text-blue-800' :
                          doc.documentType === 'quote' ? 'bg-green-100 text-green-800' :
                          doc.documentType === 'sales_order' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {getDocumentTypeName(doc.documentType)}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getConfidenceColor(doc.confidenceLevel)}`}>
                          {formatConfidence(doc.classificationConfidence)}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          doc.status === 'completed' ? 'bg-green-100 text-green-800' :
                          doc.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-gray-500">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedDocument(doc);
                              setEditedData(doc.extractedData || {});
                              setIsEditing(false);
                              setShowResultModal(true);
                            }}
                            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700"
                            title="View"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          
                          {doc.status === 'failed' && (
                            <button
                              onClick={() => handleRetry(doc.id)}
                              className="rounded p-1.5 text-yellow-500 hover:bg-yellow-50 hover:text-yellow-700"
                              title="Retry"
                            >
                              <ArrowPathIcon className="h-4 w-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="rounded p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700"
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Result Modal */}
      {showResultModal && selectedDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  selectedDocument.confidenceLevel === 'high' ? 'bg-green-100 text-green-600' :
                  selectedDocument.confidenceLevel === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-red-100 text-red-600'
                }`}>
                  {selectedDocument.status === 'completed' ? (
                    <CheckCircleIcon className="h-6 w-6" />
                  ) : (
                    <ExclamationTriangleIcon className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Processing Results
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedDocument.originalFilename}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowResultModal(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Classification Result */}
            <div className="mb-6 rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-gray-500">Detected Type</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {getDocumentTypeName(selectedDocument.documentType)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Confidence</p>
                  <p className={`text-lg font-semibold ${
                    selectedDocument.confidenceLevel === 'high' ? 'text-green-600' :
                    selectedDocument.confidenceLevel === 'medium' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {formatConfidence(selectedDocument.classificationConfidence)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Processing Time</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedDocument.processingTimeMs ? `${selectedDocument.processingTimeMs}ms` : '-'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Extracted Data */}
              <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Extracted Data
                    {selectedDocument.isDataCorrected && (
                      <span className="ml-2 text-xs text-yellow-600">(edited)</span>
                    )}
                  </h4>
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false);
                            setEditedData(selectedDocument.extractedData || {});
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveEdits}
                        >
                          Save
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-1"
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
                
                {renderExtractedFields(
                  (isEditing ? { ...selectedDocument.extractedData, ...editedData } : selectedDocument.extractedData) as ExtractedData,
                  isEditing
                )}

                {/* Create Document Button */}
                {selectedDocument.documentType !== 'unknown' && (
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      onClick={() => handleCreateDocument(selectedDocument.documentType)}
                      className="w-full"
                    >
                      <PlusIcon className="mr-2 h-4 w-4" />
                      Create {getDocumentTypeName(selectedDocument.documentType)} from this Data
                    </Button>
                    <p className="mt-2 text-center text-xs text-gray-500">
                      You'll be taken to the form with pre-filled data
                    </p>
                  </div>
                )}
              </div>

              {/* Extracted Text */}
              <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Extracted Text
                  </h4>
                  <button
                    onClick={() => setExpandedText(!expandedText)}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    {expandedText ? 'Show Less' : 'Show All'}
                  </button>
                </div>
                <div className={`overflow-y-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300 ${
                  expandedText ? 'max-h-96' : 'max-h-48'
                }`}>
                  <pre className="whitespace-pre-wrap font-mono">
                    {selectedDocument.extractedText || 'No text extracted'}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
