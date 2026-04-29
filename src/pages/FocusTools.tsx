import { PomodoroTimer, SessionTaskList } from '../components/tools';
import PageMeta from '../components/common/PageMeta';
import PageBreadcrumb from '../components/common/PageBreadCrumb';

export default function FocusTools() {
  return (
    <>
      <PageMeta
        title="Focus Tools | BizFlow AI"
        description="Pomodoro timer and session-based task management for productivity"
      />
      <PageBreadcrumb pageTitle="Focus Tools" />

      <div className="p-4 min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            🎯 Focus & Productivity
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Boost your productivity with focus timer and session task management.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PomodoroTimer />
          <SessionTaskList />
        </div>

        {/* Footer Info */}
        <div className="mt-8 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              Tasks are stored in memory only and will be cleared when you refresh the page.
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
