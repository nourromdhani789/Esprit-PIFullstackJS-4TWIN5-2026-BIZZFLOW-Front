import api from './api';

/**
 * AI Document Processing Service
 * 
 * Frontend service for interacting with the AI document processing backend API
 */

export type DocumentType = 'invoice' | 'quote' | 'sales_order' | 'unknown';
export type ProcessingStatus = 'pending' | 'classifying' | 'extracting_text' | 'extracting_data' | 'completed' | 'failed';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface ExtractedInvoiceData {
  documentType: 'invoice';
  invoiceNumber?: string;
  date?: string;
  dueDate?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  subtotal?: number;
  taxAmount?: number;
  taxRate?: number;
  totalAmount?: number;
  notes?: string;
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

export interface ExtractedQuoteData {
  documentType: 'quote';
  quoteNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  validDays?: number;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  subtotal?: number;
  taxAmount?: number;
  taxRate?: number;
  totalAmount?: number;
  notes?: string;
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

export interface ExtractedSalesOrderData {
  documentType: 'sales_order';
  salesOrderNumber?: string;
  issueDate?: string;
  expectedDeliveryDate?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  subtotal?: number;
  taxAmount?: number;
  taxRate?: number;
  totalAmount?: number;
  notes?: string;
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

export type ExtractedData = ExtractedInvoiceData | ExtractedQuoteData | ExtractedSalesOrderData | { documentType: 'unknown' };

export interface ProcessedDocument {
  id: string;
  tenantId: string;
  businessId?: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  documentType: DocumentType;
  classificationConfidence: number;
  confidenceLevel: ConfidenceLevel;
  status: ProcessingStatus;
  processingError?: string;
  processingTimeMs?: number;
  extractedText?: string;
  extractedData?: ExtractedData;
  userCorrectedData?: Record<string, any>;
  isDataCorrected: boolean;
  createdDocumentId?: string;
  createdDocumentType?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadResponse {
  success: boolean;
  data: {
    documentId: string;
    documentType: DocumentType;
    confidence: number;
    confidenceLevel: ConfidenceLevel;
    extractedText: string;
    extractedData: ExtractedData;
    processingTime: number;
  };
}

export interface DocumentsListResponse {
  success: boolean;
  data: {
    documents: ProcessedDocument[];
    total: number;
  };
}

/**
 * Upload and process a document image
 * @param file - The image/PDF file to upload
 * @param businessId - Optional business ID
 */
export async function uploadDocument(file: File, businessId?: string): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (businessId) {
    formData.append('businessId', businessId);
  }

  const response = await api.post<UploadResponse>('/document-processing/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

/**
 * Get all processed documents for the current tenant
 */
export async function getDocuments(
  params?: {
    documentType?: DocumentType;
    status?: ProcessingStatus;
    limit?: number;
    offset?: number;
  }
): Promise<DocumentsListResponse> {
  const response = await api.get<DocumentsListResponse>('/document-processing', {
    params,
  });
  return response.data;
}

/**
 * Get a specific document by ID
 */
export async function getDocument(id: string): Promise<{ success: boolean; data: ProcessedDocument }> {
  const response = await api.get<{ success: boolean; data: ProcessedDocument }>(`/document-processing/${id}`);
  return response.data;
}

/**
 * Update extracted data with user corrections
 */
export async function updateExtractedData(
  id: string,
  correctedData: Record<string, any>
): Promise<{ success: boolean; message: string; data: ProcessedDocument }> {
  const response = await api.patch<{ success: boolean; message: string; data: ProcessedDocument }>(
    `/document-processing/${id}/data`,
    { correctedData }
  );
  return response.data;
}

/**
 * Mark document as having created a business document
 */
export async function markDocumentCreated(
  id: string,
  createdDocumentId: string,
  createdDocumentType: 'invoice' | 'quote' | 'sales_order'
): Promise<{ success: boolean; message: string }> {
  const response = await api.post<{ success: boolean; message: string }>(
    `/document-processing/${id}/create-document`,
    { createdDocumentId, createdDocumentType }
  );
  return response.data;
}

/**
 * Download the original uploaded file
 */
export function downloadDocumentUrl(id: string): string {
  return `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/document-processing/${id}/download`;
}

/**
 * Retry processing a failed document
 */
export async function retryProcessing(id: string): Promise<{ success: boolean; message: string; data: UploadResponse['data'] }> {
  const response = await api.post<{ success: boolean; message: string; data: UploadResponse['data'] }>(
    `/document-processing/${id}/retry`
  );
  return response.data;
}

/**
 * Delete a processed document
 */
export async function deleteDocument(id: string): Promise<{ success: boolean; message: string }> {
  const response = await api.delete<{ success: boolean; message: string }>(`/document-processing/${id}`);
  return response.data;
}

/**
 * Get the appropriate form route based on document type
 */
export function getCreateDocumentRoute(documentType: DocumentType): string {
  switch (documentType) {
    case 'invoice':
      return '/create-invoice';
    case 'quote':
      return '/create-quote';
    case 'sales_order':
      return '/create-sales-order';
    default:
      return '/invoices';
  }
}

/**
 * Format confidence as percentage string
 */
export function formatConfidence(confidence: number): string {
  return `${(confidence * 100).toFixed(1)}%`;
}

/**
 * Get confidence level color
 */
export function getConfidenceColor(level: ConfidenceLevel): string {
  switch (level) {
    case 'high':
      return 'text-green-600 bg-green-100';
    case 'medium':
      return 'text-yellow-600 bg-yellow-100';
    case 'low':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

/**
 * Get document type display name
 */
export function getDocumentTypeName(type: DocumentType): string {
  switch (type) {
    case 'invoice':
      return 'Invoice';
    case 'quote':
      return 'Quote';
    case 'sales_order':
      return 'Sales Order';
    default:
      return 'Unknown';
  }
}

/**
 * Get document type icon
 */
export function getDocumentTypeIcon(type: DocumentType): string {
  switch (type) {
    case 'invoice':
      return 'receipt';
    case 'quote':
      return 'document-text';
    case 'sales_order':
      return 'clipboard-document';
    default:
      return 'question-mark';
  }
}
