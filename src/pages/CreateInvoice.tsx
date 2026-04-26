import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import { invoiceService, CreateInvoiceDto, CreateInvoiceItemDto } from "../services/invoice.service";
import { clientService, Client } from "../services/client.service";
import { productService, Product } from "../services/product.service";
import { useBusiness } from "../contexts/BusinessContext";
import { useFocusMode } from "../contexts/FocusModeContext";
import api from "../services/api";
import { aiService, AnomalyResult } from "../services/ai.service";
import { AIBadge } from "../components/ai/AIBadge";
import { AIActionButtons } from "../components/ai/AIActionButtons";
import Button from "../components/ui/button/Button";
import Label from "../components/form/Label";
import Input from "../components/form/input/InputField";
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

interface InvoiceFormData {
  clientId: string;
  notes: string;
  dueDate: string;
}

export default function CreateInvoice() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const preselectedClientId = searchParams.get("clientId");
  
  // Get scan data from AI Scanner if available
  const scanData = (location.state as any)?.scanData;
  
  const { business, formatCurrency } = useBusiness();
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientOutstanding, setClientOutstanding] = useState<number | null>(null);
  const [items, setItems] = useState<InvoiceItemForm[]>([]);
  const [formData, setFormData] = useState<InvoiceFormData>({
    clientId: preselectedClientId || "",
    notes: "",
    dueDate: "",
  });
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [stockError, setStockError] = useState("");
  const [_isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", email: "", phone: "", address: "" });
  const [emailValidation, setEmailValidation] = useState<{ isValid: boolean; message: string } | null>(null);
  const [isValidatingEmail, setIsValidatingEmail] = useState(false);
  const [anomalyResult, setAnomalyResult] = useState<AnomalyResult | null>(null);
  const [showAutoFillModal, setShowAutoFillModal] = useState(false);
  const [autoFillText, setAutoFillText] = useState("");
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const taxRate = business?.taxRate ?? 0;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  }, [items, business?.taxRate]);

  const selectedProductObj = products.find((p) => p.id === selectedProduct);
  const availableStock = selectedProductObj?.quantity ?? 0;
  const isStorable = selectedProductObj?.productType === 'storable';

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = parseInt(value) || 0;
    
    // Only validate stock for storable products
    if (isStorable && selectedProductObj && numValue > availableStock) {
      setStockError(`Maximum available stock is ${availableStock}`);
      setQuantity(availableStock.toString());
    } else {
      setStockError("");
      setQuantity(value);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchClients();
    // If preselected client, fetch their outstanding balance
    if (preselectedClientId) {
      fetchClientOutstanding(preselectedClientId);
    }
    // If scan data available, pre-fill form
    if (scanData) {
      handleScanData(scanData);
    }
  }, []);

  // Fetch outstanding balance when client changes
  useEffect(() => {
    if (formData.clientId) {
      fetchClientOutstanding(formData.clientId);
    } else {
      setClientOutstanding(null);
    }
  }, [formData.clientId]);

  // AI Anomaly Detection - runs when invoice data changes
  useEffect(() => {
    const detectAnomalies = async () => {
      console.log('Detecting anomalies...', { items: items.length, clientId: formData.clientId, total: totals.total });
      if (items.length > 0 && formData.clientId) {
        const client = clients.find((c) => c.id === formData.clientId);
        console.log('Client found:', client?.name);
        const result = await aiService.detectInvoiceAnomaly({
          amount: totals.total,
          clientName: client?.name || "",
          items: items.map((item) => ({
            name: item.productName || "",
            quantity: item.quantity,
            price: item.price,
          })),
          paymentTerms: formData.notes,
        });
        console.log('Anomaly result:', result);
        setAnomalyResult(result);
      } else {
        setAnomalyResult(null);
      }
    };

    detectAnomalies();
  }, [items, totals.total, formData.clientId, formData.notes, clients]);

  const fetchClientOutstanding = async (clientId: string) => {
    try {
      const response = await api.get(`/clients/${clientId}/profile`);
      setClientOutstanding(response.data.stats.outstandingBalance);
    } catch {
      // Silently fail - warning is optional
      setClientOutstanding(null);
    }
  };

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const data = await productService.getProductsForSales();
      setProducts(data);
    } catch (err: any) {
      setError(err.message || "Failed to load products");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const data = await clientService.getClients();
      setClients(data);
    } catch (err: any) {
      setError(err.message || "Failed to load clients");
    }
  };

  // Handle scan data from AI Scanner
  const handleScanData = (scanData: any) => {
    if (!scanData || scanData.documentType !== 'invoice') return;
    
    // Pre-fill notes if available
    if (scanData.notes) {
      setFormData(prev => ({ ...prev, notes: scanData.notes }));
    }
    
    // Pre-fill due date if available
    if (scanData.dueDate) {
      setFormData(prev => ({ ...prev, dueDate: scanData.dueDate }));
    }
    
    // Handle client from scan data
    if (scanData.clientName) {
      // Try to find matching client by name from scan (only if clients loaded)
      const matchedClient = clients.length > 0 ? clients.find(c => 
        c.name.toLowerCase().includes(scanData.clientName.toLowerCase()) ||
        scanData.clientName.toLowerCase().includes(c.name.toLowerCase())
      ) : null;
      
      if (matchedClient) {
        setFormData(prev => ({ ...prev, clientId: matchedClient.id }));
        fetchClientOutstanding(matchedClient.id);
      } else {
        // No match found - open Add New Client modal with pre-filled data
        setNewClient({
          name: scanData.clientName || "",
          email: scanData.clientEmail || "",
          phone: scanData.clientPhone || "",
          address: scanData.clientAddress || "",
        });
        setShowAddClient(true);
      }
    }
    
    // Add items if available
    if (scanData.items && scanData.items.length > 0 && products.length > 0) {
      const scanItems = scanData.items.map((item: any, idx: number) => {
        // Try to match product by name
        const matchedProduct = products.find(p => 
          p.name.toLowerCase().includes(item.description?.toLowerCase() || '') ||
          (item.description && item.description.toLowerCase().includes(p.name.toLowerCase()))
        );
        
        return {
          tempId: `scan-${idx}-${Math.random().toString(36).substr(2, 9)}`,
          productId: matchedProduct?.id || '',
          productName: matchedProduct?.name || item.description || 'Unknown Product',
          quantity: item.quantity || 1,
          price: item.unitPrice || item.price || 0,
          description: item.description || '',
        };
      });
      
      setItems(scanItems);
    }
  };

  const handleAddItem = () => {
    if (!selectedProduct || !quantity) return;

    const product = products.find((p) => p.id === selectedProduct);
    if (!product) return;

    const qty = parseInt(quantity) || 1;
    
    // Only validate stock for storable products
    if (product.productType === 'storable' && qty > product.quantity) {
      setStockError(`Maximum available stock is ${product.quantity}`);
      return;
    }

    const newItem: InvoiceItemForm = {
      tempId: Math.random().toString(36).substring(7),
      productId: product.id,
      productName: product.name,
      quantity: qty,
      price: product.price,
      description: product.name,
    };

    setItems((prev) => [...prev, newItem]);
    setSelectedProduct("");
    setQuantity("1");
    setStockError("");
  };

  const handleRemoveItem = (tempId: string) => {
    setItems((prev) => prev.filter((item) => item.tempId !== tempId));
  };

  const handleAddClient = async () => {
    if (!newClient.name) {
      setError("Client name is required");
      return;
    }
    try {
      const client = await clientService.createClient(newClient);
      setClients((prev) => [...prev, client]);
      setFormData((prev) => ({ ...prev, clientId: client.id }));
      setShowAddClient(false);
      setNewClient({ name: "", email: "", phone: "", address: "" });
      setEmailValidation(null);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to create client");
    }
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
    console.log('Auto-fill starting with text:', autoFillText.substring(0, 100));
    try {
      const extracted = await aiService.extractClientInfo(autoFillText);
      console.log('Extracted info:', extracted);
      setNewClient((prev) => ({
        name: extracted.name || prev.name,
        email: extracted.email || prev.email,
        phone: extracted.phone || prev.phone,
        address: extracted.address || prev.address,
      }));
      console.log('Updated newClient state');
      setShowAutoFillModal(false);
      setAutoFillText("");
      // Validate the extracted email
      if (extracted.email) {
        await validateEmail(extracted.email);
      }
    } catch (err) {
      console.error("Auto-fill failed:", err);
      alert("Auto-fill failed: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.clientId || items.length === 0) {
      setError("Please select a client and add at least one item");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const invoiceData: CreateInvoiceDto = {
        clientId: formData.clientId,
        notes: formData.notes || undefined,
        dueDate: formData.dueDate || undefined,
        items: items.map(({ tempId, productName, ...item }) => item),
      };

      await invoiceService.createInvoice(invoiceData);
      navigate("/invoices");
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to create invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const { isFocusMode: _isFocusMode, suggestedAction: _suggestedAction } = useFocusMode();
  
  const selectedClient = clients.find((c) => c.id === formData.clientId);

  return (
    <div className="p-4">
      <PageBreadcrumb pageTitle="Create Invoice" />

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create New Invoice
            </h1>
            <AIBadge text="AI-Powered" />
          </div>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Select a client and add products to create an invoice
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/invoices")}>
            Cancel
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        {/* AI Anomaly Detection Badge */}
        {anomalyResult && anomalyResult.isAnomaly && (
          <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="flex items-center gap-2 text-orange-800 dark:text-orange-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="font-medium">AI Anomaly Detected ({Math.round(anomalyResult.confidence * 100)}% confidence)</span>
            </div>
            <ul className="mt-2 text-sm text-orange-700 dark:text-orange-400 list-disc list-inside">
              {anomalyResult.reasons.map((reason, idx) => (
                <li key={idx}>{reason}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Client Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Client Information
            </h2>
            <Button variant="outline" onClick={() => setShowAddClient(true)} size="sm">
              + Add New Client
            </Button>
          </div>

          {/* Add Client Modal */}
          {showAddClient && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900 dark:text-white">Add New Client</h3>
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
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    type="text"
                    value={newClient.name}
                    onChange={(e) => setNewClient((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter client name"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newClient.email}
                    onChange={(e) => {
                      const email = e.target.value;
                      setNewClient((prev) => ({ ...prev, email }));
                      // Debounce email validation
                      setTimeout(() => validateEmail(email), 500);
                    }}
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
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    value={newClient.phone}
                    onChange={(e) => setNewClient((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 234 567 890"
                  />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input
                    type="text"
                    value={newClient.address}
                    onChange={(e) => setNewClient((prev) => ({ ...prev, address: e.target.value }))}
                    placeholder="Client address"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddClient} size="sm">Save Client</Button>
                <Button variant="outline" onClick={() => {
                  setShowAddClient(false);
                  setEmailValidation(null);
                }} size="sm">Cancel</Button>
              </div>
            </div>
          )}

          {/* Outstanding Balance Warning */}
          {clientOutstanding !== null && clientOutstanding > 0 && (
            <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="font-medium">Outstanding Balance Warning</span>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                This client has an outstanding balance of <strong>TND {clientOutstanding.toFixed(3)}</strong>
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Select Client *</Label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData((prev) => ({ ...prev, clientId: e.target.value }))}
                className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select a client...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} {client.email ? `(${client.email})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, dueDate: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Selected Client Details */}
          {selectedClient && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Selected Client</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                <div><span className="text-gray-600 dark:text-gray-400">Name:</span> {selectedClient.name}</div>
                {selectedClient.email && <div><span className="text-gray-600 dark:text-gray-400">Email:</span> {selectedClient.email}</div>}
                {selectedClient.phone && <div><span className="text-gray-600 dark:text-gray-400">Phone:</span> {selectedClient.phone}</div>}
              </div>
            </div>
          )}
        </div>

        {/* Add Items */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Add Items
          </h2>

          <div className="flex gap-4 items-start mb-4">
            <div className="flex-1">
              <Label>Product</Label>
              <select
                value={selectedProduct}
                onChange={(e) => {
                  setSelectedProduct(e.target.value);
                  setStockError("");
                  setQuantity("1");
                }}
                className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select a product...</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - {formatCurrency(Number(product.price))}
                  </option>
                ))}
              </select>
              {selectedProductObj && isStorable && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Available stock: {availableStock}
                </p>
              )}
            </div>
            <div className="w-32 flex flex-col">
              <Label>Quantity</Label>
              <Input
                type="number"
                value={quantity}
                onChange={handleQuantityChange}
                min="1"
                max={isStorable && availableStock > 0 ? String(availableStock) : undefined}
              />
              {stockError && (
                <p className="mt-1 text-xs text-red-500">{stockError}</p>
              )}
            </div>
            <div className="flex flex-col">
              <Label className="opacity-0">Action</Label>
              <Button
                onClick={handleAddItem}
                disabled={!selectedProduct || !!stockError}
              >
                Add Item
              </Button>
            </div>
          </div>

          {/* Items Table */}
          {items.length > 0 && (
            <Table>
              <TableHeader className="bg-gray-50 dark:bg-gray-700/50">
                <TableRow>
                  <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Product
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Quantity
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Unit Price
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Total
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.tempId}>
                    <TableCell className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {item.productName}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center text-gray-900 dark:text-white">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right text-gray-900 dark:text-white">
                      {formatCurrency(Number(item.price))}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                      {formatCurrency(item.quantity * item.price)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleRemoveItem(item.tempId)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Totals */}
          {items.length > 0 && (
            <div className="mt-6 flex justify-end">
              <div className="w-72 space-y-3">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(Number(totals.subtotal))}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Tax ({business?.taxRate ?? 0}%):</span>
                  <span>{formatCurrency(Number(totals.taxAmount))}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span>Total:</span>
                  <span>{formatCurrency(Number(totals.total))}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            Notes
            <AIBadge size="sm" />
          </h2>
          <textarea
            value={formData.notes}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, notes: e.target.value }))
            }
            placeholder="Add any notes or payment instructions..."
            className="w-full h-24 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none"
          />
          <AIActionButtons
            text={formData.notes}
            onTextChange={(newText) => setFormData((prev) => ({ ...prev, notes: newText }))}
            className="mt-3"
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => navigate("/invoices")}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || items.length === 0 || !formData.clientId}
          >
            {isSubmitting ? "Creating..." : "Create Invoice"}
          </Button>
        </div>
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
      </div>
    </div>
  );
}
