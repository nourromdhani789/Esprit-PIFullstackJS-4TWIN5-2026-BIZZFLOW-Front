import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import { expenseService, Expense } from "../services/expense.service";
import Button from "../components/ui/button/Button";
import Badge, { BadgeColor } from "../components/ui/badge/Badge";
import { useAuth } from "../context/AuthContext";

const statusColors = {
  pending: "warning",
  approved: "success",
  rejected: "error",
} as const;

const categoryColors: Record<string, BadgeColor> = {
  meals: "primary",
  travel: "info",
  supplies: "success",
  equipment: "dark",
  software: "primary",
  rent: "info",
  utilities: "warning",
  marketing: "success",
  other: "light",
};

export default function ExpenseList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isAdmin = user?.roleId === "admin" || user?.roleId === "owner";

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      const status = filter === "all" ? undefined : filter;
      const data = await expenseService.getExpenses(status);
      setExpenses(data);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load expenses");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [filter]);

  const handleApprove = async (id: string, status: "approved" | "rejected") => {
    try {
      await expenseService.approveExpense(id, status);
      setSuccess(`Expense ${status} successfully`);
      fetchExpenses();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || `Failed to ${status} expense`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    try {
      await expenseService.deleteExpense(id);
      setSuccess("Expense deleted successfully");
      fetchExpenses();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to delete expense");
    }
  };

  const getReceiptUrl = (receiptUrl?: string) => {
    if (!receiptUrl) return null;
    return `${import.meta.env.VITE_API_URL || "http://localhost:3000"}${receiptUrl}`;
  };

  return (
    <div className="p-4">
      <PageBreadcrumb pageTitle="Expense Management" />

      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Expenses
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/expenses/create")}>
            Add Manually
          </Button>
          <Button onClick={() => navigate("/expenses/upload")}>
            Upload Receipt
          </Button>
        </div>
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

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {["all", "pending", "approved", "rejected"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              filter === status
                ? "bg-brand-500 text-white"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Receipt
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                    </div>
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No expenses found
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <Badge color={categoryColors[expense.category] || "light"}>
                        {expense.category}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {expense.supplier || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      ${Number(expense.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge color={statusColors[expense.status]}>
                        {expense.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {expense.receiptUrl ? (
                        <a
                          href={getReceiptUrl(expense.receiptUrl) || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-500 hover:text-brand-600 text-sm"
                        >
                          View Receipt
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">No receipt</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {isAdmin && expense.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(expense.id, "approved")}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() => handleApprove(expense.id, "rejected")}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          onClick={() => handleDelete(expense.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
