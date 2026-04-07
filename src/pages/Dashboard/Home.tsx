import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { reportingService, DashboardData } from "../../services/reporting.service";
import { activityService, Activity } from "../../services/activity.service";
import { paymentService } from "../../services/payment.service";
import Button from "../../components/ui/button/Button";
import { useBusiness } from "../../contexts/BusinessContext";
import { AIReportGenerator } from "../../components/ui/report-generator/AIReportGenerator";
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

// Smart KPI Card Component with Sparkline
function KPICard({
  title,
  amount,
  icon,
  trend,
  trendUp,
  color,
  sparklineData,
}: {
  title: string;
  amount: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  color: "blue" | "green" | "red" | "purple";
  sparklineData?: number[];
}) {
  const colorClasses = {
    blue: {
      bg: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20",
      text: "text-blue-600 dark:text-blue-400",
      icon: "bg-blue-500 text-white shadow-blue-500/30 dark:shadow-blue-400/20",
      border: "border-blue-200 dark:border-blue-800",
      spark: "#3b82f6",
    },
    green: {
      bg: "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20",
      text: "text-green-600 dark:text-green-400",
      icon: "bg-green-500 text-white shadow-green-500/30 dark:shadow-green-400/20",
      border: "border-green-200 dark:border-green-800",
      spark: "#22c55e",
    },
    red: {
      bg: "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20",
      text: "text-red-600 dark:text-red-400",
      icon: "bg-red-500 text-white shadow-red-500/30 dark:shadow-red-400/20",
      border: "border-red-200 dark:border-red-800",
      spark: "#ef4444",
    },
    purple: {
      bg: "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20",
      text: "text-purple-600 dark:text-purple-400",
      icon: "bg-purple-500 text-white shadow-purple-500/30 dark:shadow-purple-400/20",
      border: "border-purple-200 dark:border-purple-800",
      spark: "#a855f7",
    },
  };

  const colors = colorClasses[color];

  // Generate sparkline path
  const generateSparkline = (data: number[]) => {
    if (data.length < 2) return "";
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const width = 60;
    const height = 20;
    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    });
    return `M ${points.join(" L ")}`;
  };

  return (
    <div className={`rounded-2xl border ${colors.border} ${colors.bg} p-5 shadow-sm hover:shadow-md transition-all duration-300`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <h3 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{amount}</h3>
          {trend && (
            <p className={`mt-1 text-sm flex items-center gap-1 ${trendUp ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full ${trendUp ? "bg-green-100 dark:bg-green-900/40" : "bg-red-100 dark:bg-red-900/40"}`}>
                {trendUp ? "↑" : "↓"}
              </span>
              {trend}
            </p>
          )}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-lg ${colors.icon}`}>
          {icon}
        </div>
      </div>
      
      {/* Sparkline */}
      {sparklineData && sparklineData.length > 1 && (
        <div className="mt-4">
          <svg width="100%" height="30" viewBox="0 0 60 20" preserveAspectRatio="none">
            <path
              d={generateSparkline(sparklineData)}
              fill="none"
              stroke={colors.spark}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-60"
            />
          </svg>
        </div>
      )}
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
    <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 dark:border-gray-700 dark:from-gray-800/50 dark:to-gray-900/50 shadow-sm">
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
  formatCurrency,
}: {
  title: string;
  data: any[];
  type: "invoice" | "expense";
  formatCurrency: (value: number) => string;
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
                    {formatCurrency(Number(item.totalAmount || item.amount || 0))}
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

// Top Clients Section
function TopClientsSection({
  clients,
  formatCurrency,
}: {
  clients: any[];
  formatCurrency: (value: number) => string;
}) {
  const navigate = useNavigate();

  if (clients.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Top Clients This Month
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Your highest revenue clients
            </p>
          </div>
        </div>
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <p className="text-gray-500 dark:text-gray-400">
            No client data yet. Start by creating your first invoice.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Top Clients This Month
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Your highest revenue clients
          </p>
        </div>
        <button
          onClick={() => navigate('/clients')}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View All →
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="pb-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                Client
              </th>
              <th className="pb-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                Invoices
              </th>
              <th className="pb-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Invoiced
              </th>
              <th className="pb-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
                Outstanding
              </th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr
                key={client.clientId}
                className="border-b border-gray-100 last:border-0 dark:border-gray-800"
              >
                <td className="py-3">
                  <button
                    onClick={() => navigate(`/clients/${client.clientId}`)}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    {client.clientName}
                  </button>
                </td>
                <td className="py-3 text-sm text-center text-gray-600 dark:text-gray-400">
                  {client.invoiceCount}
                </td>
                <td className="py-3 text-sm text-right text-gray-900 dark:text-white font-medium">
                  {formatCurrency(client.totalInvoiced)}
                </td>
                <td className="py-3 text-right">
                  <span
                    className={
                      client.outstandingBalance > 0
                        ? 'text-sm text-orange-600 font-medium'
                        : 'text-sm text-green-600'
                    }
                  >
                    {formatCurrency(client.outstandingBalance)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Activity Feed Section
function ActivityFeedSection({
  activities,
  isLoading,
  error,
}: {
  activities: Activity[];
  isLoading: boolean;
  error: string;
}) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Latest actions in your business</p>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Latest actions in your business</p>
          </div>
        </div>
        <div className="text-center py-8 text-red-500">
          <p>Failed to load activity</p>
        </div>
      </div>
    );
  }

  const groupedActivities = activityService.groupActivitiesByDate(activities.slice(0, 10));

  if (activities.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Latest actions in your business</p>
          </div>
          <button
            onClick={() => navigate('/activity')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all →
          </button>
        </div>
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <p className="text-gray-500 dark:text-gray-400">
            No activity yet. Start by creating your first invoice or adding a client.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Latest actions in your business</p>
        </div>
        <button
          onClick={() => navigate('/activity')}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View all →
        </button>
      </div>

      <div className="space-y-6">
        {groupedActivities.map((group) => (
          <div key={group.date}>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
              {group.date}
            </h4>
            <div className="space-y-3">
              {group.items.map((activity) => (
                <button
                  key={activity.id}
                  onClick={() => navigate(activity.link)}
                  className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0 ${activityService.getEntityColor(activity.entityType)}`}>
                    <span className="text-lg">{activity.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>by {activity.userEmail.split('@')[0]}</span>
                      <span>·</span>
                      <span>{activityService.formatTimeAgo(activity.createdAt)}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);
  const [paymentStats, setPaymentStats] = useState({ totalIn: 0, totalOut: 0 });
  const { formatCurrency } = useBusiness();

  useEffect(() => {
    loadDashboard();
    loadActivities();
    loadPaymentStats();
  }, []);

  const loadPaymentStats = async () => {
    try {
      const payments = await paymentService.getAll();
      const totalIn = payments
        .filter((p) => p.type === "IN")
        .reduce((sum, p) => sum + Number(p.amount), 0);
      const totalOut = payments
        .filter((p) => p.type === "OUT")
        .reduce((sum, p) => sum + Number(p.amount), 0);
      setPaymentStats({ totalIn, totalOut });
    } catch (err: any) {
      console.error("Failed to load payment stats:", err);
    }
  };

  const loadActivities = async () => {
    try {
      setActivitiesLoading(true);
      setActivitiesError("");
      const response = await activityService.getDashboardActivities(10);
      setActivities(response.activities);
    } catch (err: any) {
      setActivitiesError(err.message || "Failed to load activities");
    } finally {
      setActivitiesLoading(false);
    }
  };

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
      link.download = `financial-report-${new Date().toISOString().split("T")[0]}.pdf`;
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

  const chartData = dashboardData?.monthlyTrend || [];
  
  // Generate sparkline data from monthly trend
  const revenueSparkline = chartData.map(d => d.revenue || 0);
  const expenseSparkline = chartData.map(d => d.expenses || 0);
  const profitSparkline = chartData.map(d => d.profit || 0);

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
            {/* AI Report Generator */}
            <div className="mb-6">
              <AIReportGenerator
                data={{
                  period: 'This Month',
                  totalSales: dashboardData?.kpis.totalRevenue || 0,
                  totalExpenses: dashboardData?.kpis.totalExpenses || 0,
                  invoiceCount: dashboardData?.kpis.totalInvoices || 0,
                  topClients: dashboardData?.topClients?.slice(0, 3).map(c => ({
                    name: c.clientName,
                    total: c.totalInvoiced,
                  })) || [],
                  comparisonData: {
                    growthRate: dashboardData?.kpis.profitMargin || 0,
                  },
                }}
              />
            </div>

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
                trend="vs last month"
                trendUp={true}
                sparklineData={revenueSparkline}
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
                trend="vs last month"
                trendUp={false}
                sparklineData={expenseSparkline}
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
                sparklineData={profitSparkline}
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
                trend="Healthy range"
                trendUp={(dashboardData?.kpis.profitMargin || 0) > 20}
              />
            </div>

            {/* Money In/Out KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <KPICard
                title="Money In (Payments)"
                amount={formatCurrency(paymentStats.totalIn)}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                }
                color="green"
              />
              <KPICard
                title="Money Out (Payments)"
                amount={formatCurrency(paymentStats.totalOut)}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                  </svg>
                }
                color="red"
              />
            </div>

            {/* Entity Count Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KPICard
                title="Products"
                amount={String(dashboardData?.kpis.totalProducts || 0)}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                }
                color="blue"
              />
              <KPICard
                title="Clients"
                amount={String(dashboardData?.kpis.totalClients || 0)}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
                color="purple"
              />
              <KPICard
                title="Invoices"
                amount={String(dashboardData?.kpis.totalInvoices || 0)}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
                color="green"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue vs Expenses Trend */}
              <ChartCard title="Revenue vs Expenses (6 Months)">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={200}>
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
                        formatter={(value: any) => value !== undefined && typeof value === 'number' ? formatCurrency(value) : ''}
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
                  <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={200}>
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
                        formatter={(value: any) => value !== undefined && typeof value === 'number' ? formatCurrency(value) : ''}
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
                formatCurrency={formatCurrency}
              />
              <RecentTable
                title="Recent Expenses"
                data={dashboardData?.recentExpenses || []}
                type="expense"
                formatCurrency={formatCurrency}
              />
            </div>

            {/* Top Clients Section */}
            <TopClientsSection
              clients={dashboardData?.topClients || []}
              formatCurrency={formatCurrency}
            />

            {/* Recent Activity Feed */}
            <ActivityFeedSection
              activities={activities}
              isLoading={activitiesLoading}
              error={activitiesError}
            />
          </div>
        )}
      </div>
    </>
  );
}

