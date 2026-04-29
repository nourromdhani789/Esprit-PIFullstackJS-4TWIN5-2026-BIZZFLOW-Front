import React, { useState, useEffect } from 'react';
import { adminDashboardService, ActivityLog as ApiActivityLog } from '../../services/admin-dashboard.service';

interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  businessName?: string;
  tenantId?: string;
  action: 'LOGIN' | 'LOGOUT' | 'PASSWORD_CHANGE' | 'PROFILE_UPDATE' | 'USER_CREATED' | 'USER_UPDATED' | 'USER_DELETED' | 'BUSINESS_CREATED' | 'BUSINESS_UPDATED' | 'SETTINGS_CHANGED';
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

const AdminActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState('TODAY');

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, dateRange]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      let startDate: string | undefined;
      let endDate: string | undefined;
      const now = new Date();
      
      if (dateRange === 'TODAY') {
        startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        endDate = new Date(now.setHours(23, 59, 59, 999)).toISOString();
      } else if (dateRange === 'YESTERDAY') {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        startDate = new Date(yesterday.setHours(0, 0, 0, 0)).toISOString();
        endDate = new Date(yesterday.setHours(23, 59, 59, 999)).toISOString();
      } else if (dateRange === 'WEEK') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = weekAgo.toISOString();
      } else if (dateRange === 'MONTH') {
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        startDate = monthAgo.toISOString();
      }
      
      const response = await adminDashboardService.getPlatformActivityLogs(
        1,
        100,
        actionFilter === 'ALL' ? undefined : actionFilter,
        undefined,
        undefined,
        startDate,
        endDate
      );
      
      // Transform API response to match our interface
      const transformedLogs: ActivityLog[] = response.logs.map((log: ApiActivityLog) => ({
        id: log.id,
        userId: log.userId,
        userName: log.userName,
        userEmail: log.userEmail,
        businessName: log.businessName,
        tenantId: log.tenantId,
        action: log.action as ActivityLog['action'],
        details: log.details,
        ipAddress: log.ipAddress,
        timestamp: log.timestamp,
      }));
      
      setLogs(transformedLogs);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.tenantId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    
    // Date range filtering
    let matchesDate = true;
    const logDate = new Date(log.timestamp);
    const now = new Date();
    
    if (dateRange === 'TODAY') {
      matchesDate = logDate.toDateString() === now.toDateString();
    } else if (dateRange === 'YESTERDAY') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      matchesDate = logDate.toDateString() === yesterday.toDateString();
    } else if (dateRange === 'WEEK') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      matchesDate = logDate >= weekAgo;
    } else if (dateRange === 'MONTH') {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      matchesDate = logDate >= monthAgo;
    }
    
    return matchesSearch && matchesAction && matchesDate;
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return (
          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
          </div>
        );
      case 'LOGOUT':
        return (
          <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600 dark:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
        );
      case 'PASSWORD_CHANGE':
        return (
          <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        );
      case 'USER_CREATED':
      case 'BUSINESS_CREATED':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        );
      case 'USER_UPDATED':
      case 'BUSINESS_UPDATED':
      case 'PROFILE_UPDATE':
      case 'SETTINGS_CHANGED':
        return (
          <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
        );
      case 'USER_DELETED':
        return (
          <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600 dark:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return 'text-green-600 dark:text-green-400';
      case 'LOGOUT':
        return 'text-red-600 dark:text-red-400';
      case 'PASSWORD_CHANGE':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'USER_CREATED':
      case 'BUSINESS_CREATED':
        return 'text-blue-600 dark:text-blue-400';
      case 'USER_UPDATED':
      case 'BUSINESS_UPDATED':
      case 'PROFILE_UPDATE':
      case 'SETTINGS_CHANGED':
        return 'text-purple-600 dark:text-purple-400';
      case 'USER_DELETED':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Platform Activity Logs
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Track login, logout, and all platform activities across all businesses
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-blue-600">{logs.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Activities</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-green-600">
            {logs.filter(l => l.action === 'LOGIN').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Logins Today</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-purple-600">
            {logs.filter(l => l.action === 'USER_CREATED').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">New Users</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-orange-600">
            {logs.filter(l => l.action === 'BUSINESS_CREATED').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">New Businesses</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            {/* Search */}
            <div className="relative w-full md:w-96">
              <input
                type="text"
                placeholder="Search by user, business, or action..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="ALL">All Actions</option>
                <option value="LOGIN">Login</option>
                <option value="LOGOUT">Logout</option>
                <option value="PASSWORD_CHANGE">Password Change</option>
                <option value="PROFILE_UPDATE">Profile Update</option>
                <option value="USER_CREATED">User Created</option>
                <option value="USER_UPDATED">User Updated</option>
                <option value="USER_DELETED">User Deleted</option>
                <option value="BUSINESS_CREATED">Business Created</option>
                <option value="BUSINESS_UPDATED">Business Updated</option>
                <option value="SETTINGS_CHANGED">Settings Changed</option>
              </select>

              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="TODAY">Today</option>
                <option value="YESTERDAY">Yesterday</option>
                <option value="WEEK">Last 7 Days</option>
                <option value="MONTH">Last 30 Days</option>
                <option value="ALL">All Time</option>
              </select>

              <button
                onClick={fetchLogs}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg 
                  transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Activity Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-10">
                  Action
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Business
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Details
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  IP Address
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    No activity logs found
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      {getActionIcon(log.action)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {log.userName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {log.userEmail}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {log.businessName ? (
                        <>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {log.businessName}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {log.tenantId}
                          </div>
                        </>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">Platform Admin</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className={`font-medium ${getActionColor(log.action)}`}>
                        {log.action.replace(/_/g, ' ')}
                      </div>
                      {log.details && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {log.details}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 dark:text-white font-mono">
                        {log.ipAddress}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(log.timestamp).toLocaleTimeString()}
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
};

export default AdminActivityLogs;
