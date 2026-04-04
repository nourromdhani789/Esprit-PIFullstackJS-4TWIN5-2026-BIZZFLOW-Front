import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import { expenseService } from "../services/expense.service";
import { supplierService, Supplier } from "../services/supplier.service";
import Button from "../components/ui/button/Button";
import Label from "../components/form/Label";
import Input from "../components/form/input/InputField";
import { Modal } from "../components/ui/modal";

const categories = [
  { value: "meals", label: "Meals & Food" },
  { value: "travel", label: "Travel & Transportation" },
  { value: "supplies", label: "Office Supplies" },
  { value: "equipment", label: "Equipment" },
  { value: "raw-material", label: "Raw Material" },
  { value: "software", label: "Software & Subscriptions" },
  { value: "rent", label: "Rent & Utilities" },
  { value: "marketing", label: "Marketing & Advertising" },
  { value: "other", label: "Other" },
];

export default function CreateExpense() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierFormData, setSupplierFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [isCreatingSupplier, setIsCreatingSupplier] = useState(false);

  const [formData, setFormData] = useState({
    amount: "",
    category: "other",
    date: new Date().toISOString().split("T")[0],
    supplierId: "",
    description: "",
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const data = await supplierService.getSuppliers();
      setSuppliers(data);
    } catch (err: any) {
      setError(err.message || "Failed to load suppliers");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || !formData.date) {
      setError("Amount and date are required");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      await expenseService.createExpense({
        amount: parseFloat(formData.amount),
        category: formData.category,
        date: formData.date,
        supplierId: formData.supplierId || undefined,
        description: formData.description,
      });

      setSuccess("Expense created successfully!");
      setTimeout(() => {
        navigate("/expenses");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to create expense");
      setIsLoading(false);
    }
  };

  const handleCreateSupplier = async () => {
    if (!supplierFormData.name) {
      setError("Supplier name is required");
      return;
    }

    try {
      setIsCreatingSupplier(true);
      const newSupplier = await supplierService.createSupplier({
        name: supplierFormData.name,
        email: supplierFormData.email || undefined,
        phone: supplierFormData.phone || undefined,
        address: supplierFormData.address || undefined,
      });

      // Refresh suppliers list and select the new one
      await fetchSuppliers();
      setFormData((prev) => ({ ...prev, supplierId: newSupplier.id }));

      // Close modal and reset form
      setIsSupplierModalOpen(false);
      setSupplierFormData({ name: "", email: "", phone: "", address: "" });
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to create supplier");
    } finally {
      setIsCreatingSupplier(false);
    }
  };

  const selectedSupplier = suppliers.find((s) => s.id === formData.supplierId);

  const handleCloseSupplierModal = () => {
    setIsSupplierModalOpen(false);
    setSupplierFormData({ name: "", email: "", phone: "", address: "" });
  };

  return (
    <div className="p-4">
      <PageBreadcrumb pageTitle="Create Expense" />

      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create Expense
          </h1>
          <Button variant="outline" onClick={() => navigate("/expenses/upload")}>
            Or Upload Receipt
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

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount ($) *
              </label>
              <input
                type="number"
                name="amount"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                required
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            {/* Supplier */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Supplier / Vendor
                </label>
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(true)}
                  className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium"
                >
                  + Add New Supplier
                </button>
              </div>
              <select
                name="supplierId"
                value={formData.supplierId}
                onChange={handleChange}
                className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select a supplier...</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name} {supplier.email ? `(${supplier.email})` : ""}
                  </option>
                ))}
              </select>

              {/* Selected Supplier Details */}
              {selectedSupplier && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm">
                    <span className="font-medium text-blue-900 dark:text-blue-300">{selectedSupplier.name}</span>
                    {selectedSupplier.email && (
                      <span className="text-gray-600 dark:text-gray-400 ml-2">({selectedSupplier.email})</span>
                    )}
                  </div>
                  {/* Outstanding Balance Badge */}
                  {(selectedSupplier.outstandingBalance || 0) > 0 && (
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-orange-600 dark:text-orange-400">
                        You have an outstanding balance of <strong>TND {Number(selectedSupplier.outstandingBalance).toFixed(3)}</strong> with this supplier
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Add details about this expense..."
                rows={3}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/expenses")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? "Creating..." : "Create Expense"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Add Supplier Modal */}
      <Modal
        isOpen={isSupplierModalOpen}
        onClose={handleCloseSupplierModal}
        className="max-w-lg"
      >
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Add New Supplier
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Supplier Name *</Label>
              <Input
                type="text"
                value={supplierFormData.name}
                onChange={(e) => setSupplierFormData({ ...supplierFormData, name: e.target.value })}
                placeholder="Enter supplier name"
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={supplierFormData.email}
                onChange={(e) => setSupplierFormData({ ...supplierFormData, email: e.target.value })}
                placeholder="supplier@example.com"
              />
            </div>

            <div>
              <Label>Phone</Label>
              <Input
                type="tel"
                value={supplierFormData.phone}
                onChange={(e) => setSupplierFormData({ ...supplierFormData, phone: e.target.value })}
                placeholder="+1 234 567 890"
              />
            </div>

            <div className="md:col-span-2">
              <Label>Address</Label>
              <textarea
                value={supplierFormData.address}
                onChange={(e) => setSupplierFormData({ ...supplierFormData, address: e.target.value })}
                placeholder="Supplier address..."
                className="w-full h-20 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={handleCloseSupplierModal}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateSupplier}
              disabled={!supplierFormData.name || isCreatingSupplier}
            >
              {isCreatingSupplier ? "Creating..." : "Add Supplier"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
