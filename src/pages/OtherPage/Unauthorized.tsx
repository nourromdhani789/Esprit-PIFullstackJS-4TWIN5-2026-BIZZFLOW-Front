import React from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { isAdminRole, getHomeRouteForRole } from '../../config/menuConfig';

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoHome = () => {
    if (user) {
      const homeRoute = getHomeRouteForRole(user.roleId as any);
      navigate(homeRoute);
    } else {
      navigate('/signin');
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full px-6 py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-xl text-center">
        {/* Lock Icon */}
        <div className="mx-auto w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
          <svg
            className="w-10 h-10 text-red-600 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Access Denied
        </h1>

        {/* Error Code */}
        <p className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
          403 - Unauthorized
        </p>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          You don't have permission to access this page. This area is restricted to{' '}
          {user ? (
            isAdminRole(user.roleId as any) ? (
              <span className="font-semibold">Platform Administrators</span>
            ) : (
              <span className="font-semibold">Business Users</span>
            )
          ) : (
            <span className="font-semibold">authenticated users</span>
          )}.
        </p>

        {/* User Info (if logged in) */}
        {user && (
          <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Logged in as:{' '}
              <span className="font-semibold text-gray-900 dark:text-white">
                {user.firstName} {user.lastName}
              </span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Role:{' '}
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 mt-1">
                {user.roleId}
              </span>
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleGoHome}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Go to Dashboard
          </button>
          <button
            onClick={handleGoBack}
            className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Go Back
          </button>
        </div>

        {/* Help Link */}
        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          Need help? Contact{' '}
          <a
            href="mailto:support@platform.com"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            Platform Support
          </a>
        </p>
      </div>
    </div>
  );
};

export default Unauthorized;
