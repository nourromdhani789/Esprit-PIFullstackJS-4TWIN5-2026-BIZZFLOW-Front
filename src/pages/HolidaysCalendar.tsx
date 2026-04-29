import { useState, useEffect } from 'react';
import { TunisianHolidaysCalendar } from '../components/tools';
import { holidaysService, HolidayWithMeta } from '../services/holidays.service';
import PageMeta from '../components/common/PageMeta';
import PageBreadcrumb from '../components/common/PageBreadCrumb';

export default function HolidaysCalendar() {
  const [upcoming, setUpcoming] = useState<HolidayWithMeta[]>([]);
  const [yearProgress, setYearProgress] = useState(0);

  useEffect(() => {
    holidaysService.getUpcomingHolidays(3).then(setUpcoming);
    
    // Calculate year progress
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31);
    const progress = ((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100;
    setYearProgress(Math.round(progress));
  }, []);

  return (
    <>
      <PageMeta
        title="Tunisia Holidays | BizFlow AI"
        description="Tunisian public holidays calendar with upcoming holiday notifications"
      />
      <PageBreadcrumb pageTitle="Tunisia Holidays" />

      <div className="p-4 min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            🇹🇳 Tunisia Holidays Calendar
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View Tunisian public holidays, upcoming events, and calendar planning.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Upcoming Holidays</p>
            <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">{upcoming.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Year Progress</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{yearProgress}%</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Current Year</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{new Date().getFullYear()}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Widget - Takes 1 column */}
          <div className="lg:col-span-1">
            <TunisianHolidaysCalendar />
          </div>

          {/* Next Holiday Info - Takes 2 columns */}
          <div className="lg:col-span-2 space-y-4">
            {upcoming.length > 0 && (
              <div className="bg-gradient-to-r from-brand-50 to-blue-50 dark:from-brand-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-brand-100 dark:border-brand-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  🎉 Next Holiday: {upcoming[0].localName}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {upcoming[0].name} - {upcoming[0].formattedDate}
                </p>
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 rounded-full text-sm font-medium">
                    {upcoming[0].daysUntil === 0 ? 'Today!' : upcoming[0].daysUntil === 1 ? 'Tomorrow' : `In ${upcoming[0].daysUntil} days`}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {upcoming[0].fixed ? 'Fixed Date' : 'Date may vary'}
                  </span>
                </div>
              </div>
            )}

            {/* Holiday Types Legend */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Holiday Types
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <span className="text-2xl">🇹🇳</span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">National</p>
                    <p className="text-xs text-gray-500">Independence, Republic Day</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <span className="text-2xl">🌙</span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Religious</p>
                    <p className="text-xs text-gray-500">Eid, Islamic New Year</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <span className="text-2xl">📅</span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Observance</p>
                    <p className="text-xs text-gray-500">Labour Day, Women's Day</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-2xl">🎉</span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Public</p>
                    <p className="text-xs text-gray-500">Other official holidays</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Upcoming Holidays
              </h3>
              <div className="space-y-3">
                {upcoming.slice(0, 3).map((holiday) => (
                  <div key={holiday.date} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">
                        {holidaysService.getHolidayIcon(holidaysService.getHolidayType(holiday))}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{holiday.localName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{holiday.formattedDate}</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded text-xs font-medium">
                      {holiday.daysUntil === 0 ? 'Today' : `${holiday.daysUntil}d`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
