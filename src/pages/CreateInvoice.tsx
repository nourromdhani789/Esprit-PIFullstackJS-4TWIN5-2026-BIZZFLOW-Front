import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import { invoiceService, CreateInvoiceDto, CreateInvoiceItemDto } from "../services/invoice.service";
import { productService, Product } from "../services/product.service";
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
  clientName: string;
  clientEmail: string;
  clientId: string;
  notes: string;
  dueDate: string;
}

export default function CreateInvoice() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<InvoiceItemForm[]>([]);
  const [formData, setFormData] = useState<InvoiceFormData>({
    clientName: "",
    clientEmail: "",
    clientId: "",
    notes: "",
    dueDate: "",
  });
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const taxRate = 0;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  }, [items]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const data = await productService.getProducts();
      setProducts(data);
    } catch (err: any) {
      setError(err.message || "Failed to load products");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = () => {
    if (!selectedProduct || !quantity) return;

    const product = products.find((p) => p.id === selectedProduct);
    if (!product) return;

    const newItem: InvoiceItemForm = {
      tempId: Math.random().toString(36).substring(7),
      productId: product.id,
      productName: product.name,
      quantity: parseInt(quantity) || 1,
      price: product.price,
      description: product.name,
    };

    setItems((prev) => [...prev, newItem]);
    setSelectedProduct("");
    setQuantity("1");
  };

  const handleRemoveItem = (tempId: string) => {
    setItems((prev) => prev.filter((item) => item.tempId !== tempId));
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
        clientId: formData.clientId || Math.random().toString(36).substring(7),
        clientName: formData.clientName,
        clientEmail: formData.clientEmail || undefined,
        notes: formData.notes || undefined,
        dueDate: formData.dueDate || undefined,
        items: items.map(({ tempId, productName, ...item }) => item),
      };

      await invoiceService.createInvoice(invoiceData);
      navigate("/invoices");
    } catch (err: any) {
      setError(err.message || "Failed to create invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <PageBreadcrumb pageTitle="Create Invoice" />

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create New Invoice
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Add products and create an invoice for your client
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

        {/* Client Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Client Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Client Name *</Label>
              <Input
                type="text"
                value={formData.clientName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, clientName: e.target.value }))
                }
                placeholder="Enter client name"
              />
            </div>
            <div>
              <Label>Client Email</Label>
              <Input
                type="email"
                value={formData.clientEmail}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, clientEmail: e.target.value }))
                }
                placeholder="client@example.com"
              />
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
        </div>

        {/* Add Items */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Add Items
          </h2>

          <div className="flex gap-4 items-end mb-4">
            <div className="flex-1">
              <Label>Product</Label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select a product...</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - ${Number(product.price).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-32">
              <Label>Quantity</Label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
              />
            </div>
            <Button
              onClick={handleAddItem}
              disabled={!selectedProduct}
            >
              Add Item
            </Button>
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
                      ${Number(item.price).toFixed(2)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                      ${(item.quantity * item.price).toFixed(2)}
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
                  <span>${Number(totals.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Tax:</span>
                  <span>${Number(totals.taxAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span>Total:</span>
                  <span>${Number(totals.total).toFixed(2)}</span>
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
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, notes: e.target.value }))
            }
            placeholder="Add any notes or payment instructions..."
            className="w-full h-24 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none"
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => navigate("/invoices")}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || items.length === 0 || !formData.clientName}
          >
            {isSubmitting ? "Creating..." : "Create Invoice"}
          </Button>
        </div>
      </div>
    </div>
  );
}
