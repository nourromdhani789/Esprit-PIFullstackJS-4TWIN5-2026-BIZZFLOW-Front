import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import { quoteService, CreateQuoteDto, CreateQuoteItemDto } from "../services/quote.service";
import { clientService, Client } from "../services/client.service";
import { productService, Product } from "../services/product.service";
import { useBusiness } from "../contexts/BusinessContext";
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

interface QuoteItemForm extends CreateQuoteItemDto {
  tempId: string;
  productName?: string;
}

interface QuoteFormData {
  clientId: string;
  notes: string;
  issueDate: string;
  expiryDate: string;
}

export default function CreateQuote() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const preselectedClientId = searchParams.get("clientId");
  
  // Get scan data from AI Scanner if available
  const scanData = (location.state as any)?.scanData;
  
  const { business, formatCurrency } = useBusiness();
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [items, setItems] = useState<QuoteItemForm[]>([]);
  const [formData, setFormData] = useState<QuoteFormData>({
    clientId: preselectedClientId || "",
    notes: "",
    issueDate: new Date().toISOString().split("T")[0],
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  });
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [_isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", email: "", phone: "", address: "" });

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const taxRate = business?.taxRate ?? 0;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  }, [items, business?.taxRate]);

  useEffect(() => {
    fetchProducts();
    fetchClients();
    // If scan data available, pre-fill form
    if (scanData) {
      handleScanData(scanData);
    }
  }, []);

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
    if (!scanData || scanData.documentType !== 'quote') return;
    
    // Pre-fill notes if available
    if (scanData.notes) {
      setFormData(prev => ({ ...prev, notes: scanData.notes }));
    }
    
    // Pre-fill dates if available
    if (scanData.issueDate) {
      setFormData(prev => ({ ...prev, issueDate: scanData.issueDate }));
    }
    if (scanData.expiryDate) {
      setFormData(prev => ({ ...prev, expiryDate: scanData.expiryDate }));
    }
    if (scanData.validDays) {
      setFormData(prev => ({ ...prev, validDays: scanData.validDays }));
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
          unitPrice: item.unitPrice || item.price || 0,
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
    const newItem: QuoteItemForm = {
      tempId: Math.random().toString(36).substring(7),
      productId: product.id,
      productName: product.name,
      quantity: qty,
      unitPrice: product.price,
      description: product.name,
    };

    setItems((prev) => [...prev, newItem]);
    setSelectedProduct("");
    setQuantity("1");
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
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to create client");
    }
  };

  const handleSubmit = async (saveAsDraft = true) => {
    if (!formData.clientId || items.length === 0) {
      setError("Please select a client and add at least one item");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const quoteData: CreateQuoteDto = {
        clientId: formData.clientId,
        notes: formData.notes || undefined,
        issueDate: formData.issueDate,
        expiryDate: formData.expiryDate,
        status: saveAsDraft ? 'draft' : 'sent',
        items: items.map(({ tempId, productName, ...item }) => item),
      };

      await quoteService.createQuote(quoteData);
      navigate("/quotes");
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to create quote");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedClient = clients.find((c) => c.id === formData.clientId);

  return (
    <div className="p-4">
      <PageBreadcrumb pageTitle="Create Quote" />

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create New Quote
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Create a quote for your client
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/quotes")}>
            Cancel
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400">
            {error}
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

          {showAddClient && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Add New Client</h3>
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
                    onChange={(e) => setNewClient((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="client@example.com"
                  />
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
                <Button variant="outline" onClick={() => setShowAddClient(false)} size="sm">Cancel</Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <Label>Issue Date *</Label>
              <Input
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, issueDate: e.target.value }))}
              />
            </div>
            <div>
              <Label>Expiry Date *</Label>
              <Input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, expiryDate: e.target.value }))}
              />
            </div>
          </div>

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
            </div>
            <div className="w-32 flex flex-col">
              <Label>Quantity</Label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
              />
            </div>
            <div className="flex flex-col">
              <Label className="opacity-0">Action</Label>
              <Button
                onClick={handleAddItem}
                disabled={!selectedProduct}
              >
                Add Item
              </Button>
            </div>
          </div>

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
                      {formatCurrency(Number(item.unitPrice))}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                      {formatCurrency(item.quantity * item.unitPrice)}
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Notes
          </h2>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Add any notes or terms..."
            className="w-full h-24 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none"
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => navigate("/quotes")}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting || items.length === 0 || !formData.clientId}
          >
            {isSubmitting ? "Saving..." : "Save as Draft"}
          </Button>
          <Button
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting || items.length === 0 || !formData.clientId}
          >
            {isSubmitting ? "Saving..." : "Save & Send"}
          </Button>
        </div>
      </div>
    </div>
  );
}
