import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { reportingService, DashboardData } from "../../services/reporting.service";
import Button from "../../components/ui/button/Button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";

// KPI Card Component
function KPICard({
  title,
  amount,
  icon,
  trend,
  trendUp,
  color,
}: {
  title: string;
  amount: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  color: "blue" | "green" | "red" | "purple";
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    green: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
    red: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <h3 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{amount}</h3>
          {trend && (
            <p className={`mt-1 text-sm ${trendUp ? "text-green-500" : "text-red-500"}`}>
              {trendUp ? "↑" : "↓"} {trend}
            </p>
          )}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// Chart Card Component
function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      {children}
    </div>
  );
}

// Recent Activity Table
function RecentTable({
  title,
  data,
  type,
}: {
  title: string;
  data: any[];
  type: "invoice" | "expense";
}) {
  const statusColors: Record<string, string> = {
    paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    unpaid: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="pb-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                {type === "invoice" ? "Invoice #" : "Date"}
              </th>
              <th className="pb-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                {type === "invoice" ? "Client" : "Category"}
              </th>
              <th className="pb-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
              <th className="pb-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-4 text-center text-sm text-gray-500">
                  No {type}s found
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 last:border-0 dark:border-gray-800">
                  <td className="py-3 text-sm text-gray-900 dark:text-white">
                    {type === "invoice"
                      ? item.invoiceNumber || "N/A"
                      : new Date(item.date).toLocaleDateString()}
                  </td>
                  <td className="py-3 text-sm text-gray-600 dark:text-gray-400">
                    {type === "invoice" ? item.clientName || item.clientId : item.category}
                  </td>
                  <td className="py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        statusColors[item.status] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 text-right text-sm font-medium text-gray-900 dark:text-white">
                    ${Number(item.totalAmount || item.amount).toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Home() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      setError("");
      const data = await reportingService.getDashboard();
      setDashboardData(data);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setExporting("csv");
      const blob = await reportingService.exportCSV();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `financial-report-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || "Failed to export CSV");
    } finally {
      setExporting(null);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExporting("pdf");
      const blob = await reportingService.exportPDF();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `financial-report-${new Date().toISOString().split("T")[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || "Failed to export PDF");
    } finally {
      setExporting(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const chartData = dashboardData?.monthlyTrend || [];

  return (
    <>
      <PageMeta
        title="Dashboard | Financial Management System"
        description="Financial dashboard with revenue, expenses, and profit analytics"
      />
      <PageBreadcrumb pageTitle="Dashboard" />

      <div className="p-4">
        {/* Header with Export Buttons */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Overview of your business performance
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={exporting === "csv" || isLoading}
              size="sm"
            >
              {exporting === "csv" ? "Exporting..." : "Export CSV"}
            </Button>
            <Button
              variant="outline"
              onClick={handleExportPDF}
              disabled={exporting === "pdf" || isLoading}
              size="sm"
            >
              {exporting === "pdf" ? "Exporting..." : "Export PDF"}
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                title="Total Revenue"
                amount={formatCurrency(dashboardData?.kpis.totalRevenue || 0)}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                color="green"
              />
              <KPICard
                title="Total Expenses"
                amount={formatCurrency(dashboardData?.kpis.totalExpenses || 0)}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                color="red"
              />
              <KPICard
                title="Net Profit"
                amount={formatCurrency(dashboardData?.kpis.profit || 0)}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                }
                color="blue"
                trend={`${dashboardData?.kpis.profitMargin || 0}% margin`}
                trendUp={(dashboardData?.kpis.profit || 0) >= 0}
              />
              <KPICard
                title="Profit Margin"
                amount={`${dashboardData?.kpis.profitMargin || 0}%`}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                }
                color="purple"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue vs Expenses Trend */}
              <ChartCard title="Revenue vs Expenses (6 Months)">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={{ fill: "#22c55e" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="expenses"
                        name="Expenses"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={{ fill: "#ef4444" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              {/* Profit Trend */}
              <ChartCard title="Monthly Profit Trend">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Bar
                        dataKey="profit"
                        name="Profit"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentTable
                title="Recent Invoices"
                data={dashboardData?.recentInvoices || []}
                type="invoice"
              />
              <RecentTable
                title="Recent Expenses"
                data={dashboardData?.recentExpenses || []}
                type="expense"
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

