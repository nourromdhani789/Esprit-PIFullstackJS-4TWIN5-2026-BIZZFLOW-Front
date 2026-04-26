import {
  PomodoroTimer,
  SessionTaskList,
  NewsWidget,
  CurrencyConverter,
  TunisianHolidaysCalendar
} from '../components/tools';
import PageMeta from '../components/common/PageMeta';
import PageBreadcrumb from '../components/common/PageBreadCrumb';

export default function ToolsDashboard() {
  return (
    <>
      <PageMeta
        title="Tools Dashboard | BizFlow AI"
        description="Productivity tools including Pomodoro timer, session tasks, currency converter, business news, and Tunisian holidays calendar"
      />
      <PageBreadcrumb pageTitle="Tools Dashboard" />

      <div className="p-4 min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            🛠️ Productivity Tools
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your personal workspace with focus timer, task management, and useful utilities.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column - Focus & Tasks (4 columns) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Pomodoro Timer */}
            <PomodoroTimer />
            
            {/* Session Task List */}
            <SessionTaskList />
          </div>

          {/* Middle Column - Currency & News (4 columns) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Currency Converter */}
            <CurrencyConverter />
            
            {/* Business News */}
            <NewsWidget />
          </div>

          {/* Right Column - Holidays (4 columns) */}
          <div className="lg:col-span-4">
            <TunisianHolidaysCalendar />
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              <strong>Note:</strong> Tasks are stored in memory only and will be cleared when you refresh the page. 
              Currency rates and news are fetched live from external APIs.
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
