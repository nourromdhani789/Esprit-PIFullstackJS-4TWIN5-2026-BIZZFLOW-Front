import { useState } from "react";
import { useNavigate } from "react-router";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import { expenseService } from "../services/expense.service";
import Button from "../components/ui/button/Button";

const categories = [
  { value: "meals", label: "Meals & Food" },
  { value: "travel", label: "Travel & Transportation" },
  { value: "supplies", label: "Office Supplies" },
  { value: "equipment", label: "Equipment" },
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

  const [formData, setFormData] = useState({
    amount: "",
    category: "other",
    date: new Date().toISOString().split("T")[0],
    supplier: "",
    description: "",
  });

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
        supplier: formData.supplier,
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

  return (
    <div className="p-4">
      <PageBreadcrumb pageTitle="Create Expense" />

      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create Expense (Manual)
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Supplier / Vendor
              </label>
              <input
                type="text"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                placeholder="e.g., Amazon, Walmart, Uber"
                className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
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
    </div>
  );
}
