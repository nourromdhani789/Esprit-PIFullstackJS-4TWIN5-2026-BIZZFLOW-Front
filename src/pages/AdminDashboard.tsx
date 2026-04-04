import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { adminDashboardService, DashboardMetrics, RecentUser, RecentBusiness, UserGrowthData, RevenueData } from '../services/admin-dashboard.service';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import {
  GroupIcon,
  BoxIcon,
  UserIcon,
  PageIcon,
  DollarLineIcon,
  CalenderIcon,
  AlertIcon,
} from '../icons';

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: number;
  color: string;
  prefix?: string;
  suffix?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, color, prefix = '', suffix = '' }) => {
  const formatValue = (val: number) => {
    if (prefix === '$') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(val);
    }
    return `${prefix}${new Intl.NumberFormat('en-US').format(val)}${suffix}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {formatValue(value)}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// Loading Spinner Component
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center py-8">
    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
);
interface RecentUsersTableProps {
  users: RecentUser[];
  loading: boolean;
}

const RecentUsersTable: React.FC<RecentUsersTableProps> = ({ users, loading }) => {
  if (loading) {
    return <LoadingSpinner />;
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'PLATFORM_ADMIN':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'BUSINESS_OWNER':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'BUSINESS_ADMIN':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'ACCOUNTANT':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const formatRoleName = (role: string) => {
    return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th className="px-4 py-3 rounded-tl-lg">Name</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 rounded-tr-lg">Created</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                {user.firstName} {user.lastName}
              </td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{user.email}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.roleId)}`}>
                  {formatRoleName(user.roleId)}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  user.isActive
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                }`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                {new Date(user.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Recent Businesses Table Component
interface RecentBusinessesTableProps {
  businesses: RecentBusiness[];
  loading: boolean;
}

const RecentBusinessesTable: React.FC<RecentBusinessesTableProps> = ({ businesses, loading }) => {
  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th className="px-4 py-3 rounded-tl-lg">Business Name</th>
            <th className="px-4 py-3">Owner</th>
            <th className="px-4 py-3">Owner Email</th>
            <th className="px-4 py-3 rounded-tr-lg">Created</th>
          </tr>
        </thead>
        <tbody>
          {businesses.map((business) => (
            <tr key={business.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                {business.name}
                {business.legalName && business.legalName !== business.name && (
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    {business.legalName}
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{business.ownerName}</td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{business.ownerEmail}</td>
              <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                {new Date(business.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Charts Component
interface DashboardChartsProps {
  userGrowthData: UserGrowthData[];
  revenueData: RevenueData[];
  loading: boolean;
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({ userGrowthData, revenueData, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 h-80 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 h-80 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const userChartOptions: ApexOptions = {
    chart: {
      type: 'area',
      height: 310,
      fontFamily: 'Outfit, sans-serif',
      toolbar: { show: false },
    },
    colors: ['#465FFF'],
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: { opacityFrom: 0.55, opacityTo: 0 },
    },
    dataLabels: { enabled: false },
    grid: {
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    xaxis: {
      categories: userGrowthData.map(d => d.date),
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { fontSize: '12px', colors: ['#6B7280'] },
      },
    },
    tooltip: {
      x: { format: 'dd MMM yyyy' },
    },
  };

  const userChartSeries = [
    {
      name: 'New Users',
      data: userGrowthData.map(d => d.count),
    },
  ];

  const revenueChartOptions: ApexOptions = {
    chart: {
      type: 'bar',
      height: 310,
      fontFamily: 'Outfit, sans-serif',
      toolbar: { show: false },
    },
    colors: ['#10B981'],
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '60%',
      },
    },
    dataLabels: { enabled: false },
    grid: {
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    xaxis: {
      categories: revenueData.map(d => d.date),
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { fontSize: '12px', colors: ['#6B7280'] },
        formatter: (value: number) => `$${value.toLocaleString()}`,
      },
    },
    tooltip: {
      y: {
        formatter: (value: number) => `$${value.toLocaleString()}`,
      },
    },
  };

  const revenueChartSeries = [
    {
      name: 'Revenue',
      data: revenueData.map(d => d.amount),
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <GroupIcon className="w-5 h-5 text-blue-600" />
          User Growth (Last 7 Days)
        </h3>
        <Chart options={userChartOptions} series={userChartSeries} type="area" height={280} />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <DollarLineIcon className="w-5 h-5 text-green-600" />
          Revenue (Last 7 Days)
        </h3>
        <Chart options={revenueChartOptions} series={revenueChartSeries} type="bar" height={280} />
      </div>
    </div>
  );
};

// Main Admin Dashboard Component
const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { hasRole, isLoading: authLoading } = useAuth();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentBusinesses, setRecentBusinesses] = useState<RecentBusiness[]>([]);
  const [userGrowthData, setUserGrowthData] = useState<UserGrowthData[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user has PLATFORM_ADMIN role
  useEffect(() => {
    if (!authLoading && !hasRole('PLATFORM_ADMIN')) {
      navigate('/', { replace: true });
    }
  }, [authLoading, hasRole, navigate]);

  // Fetch all dashboard data
  useEffect(() => {
    if (!hasRole('PLATFORM_ADMIN')) return;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [
          metricsData,
          usersData,
          businessesData,
          growthData,
          revData,
        ] = await Promise.all([
          adminDashboardService.getDashboardMetrics(),
          adminDashboardService.getRecentUsers(5),
          adminDashboardService.getRecentBusinesses(5),
          adminDashboardService.getUserGrowth(7),
          adminDashboardService.getRevenue(7),
        ]);

        setMetrics(metricsData);
        setRecentUsers(usersData);
        setRecentBusinesses(businessesData);
        setUserGrowthData(growthData);
        setRevenueData(revData);
      } catch (err: any) {
        console.error('Failed to fetch dashboard data:', err);
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [hasRole]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Don't render if not admin
  if (!hasRole('PLATFORM_ADMIN')) {
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Admin Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Monitor system-wide activity, user growth, and financial metrics
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <CalenderIcon className="w-4 h-4" />
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
          <AlertIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Total Users"
          value={metrics?.totalUsers || 0}
          icon={<GroupIcon className="w-6 h-6 text-blue-600" />}
          color="bg-blue-50 dark:bg-blue-900/20"
        />
        <MetricCard
          title="Total Businesses"
          value={metrics?.totalBusinesses || 0}
          icon={<BoxIcon className="w-6 h-6 text-purple-600" />}
          color="bg-purple-50 dark:bg-purple-900/20"
        />
        <MetricCard
          title="Active Users"
          value={metrics?.activeUsers || 0}
          icon={<UserIcon className="w-6 h-6 text-green-600" />}
          color="bg-green-50 dark:bg-green-900/20"
        />
        <MetricCard
          title="Inactive Users"
          value={metrics?.inactiveUsers || 0}
          icon={<UserIcon className="w-6 h-6 text-red-600" />}
          color="bg-red-50 dark:bg-red-900/20"
        />
        <MetricCard
          title="New Users This Week"
          value={metrics?.newUsersThisWeek || 0}
          icon={<GroupIcon className="w-6 h-6 text-orange-600" />}
          color="bg-orange-50 dark:bg-orange-900/20"
        />
        <MetricCard
          title="Total Invoices"
          value={metrics?.totalInvoices || 0}
          icon={<PageIcon className="w-6 h-6 text-cyan-600" />}
          color="bg-cyan-50 dark:bg-cyan-900/20"
        />
        <MetricCard
          title="Total Revenue"
          value={metrics?.totalRevenue || 0}
          icon={<DollarLineIcon className="w-6 h-6 text-emerald-600" />}
          color="bg-emerald-50 dark:bg-emerald-900/20"
          prefix="$"
        />
      </div>

      {/* Charts */}
      <DashboardCharts
        userGrowthData={userGrowthData}
        revenueData={revenueData}
        loading={loading}
      />

      {/* Recent Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <GroupIcon className="w-5 h-5 text-blue-600" />
              Recent Users
            </h3>
          </div>
          <RecentUsersTable users={recentUsers} loading={loading} />
        </div>

        {/* Recent Businesses */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <BoxIcon className="w-5 h-5 text-purple-600" />
              Recent Businesses
            </h3>
          </div>
          <RecentBusinessesTable businesses={recentBusinesses} loading={loading} />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
