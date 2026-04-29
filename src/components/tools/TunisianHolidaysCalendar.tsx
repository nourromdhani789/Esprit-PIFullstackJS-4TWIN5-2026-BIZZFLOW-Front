import { useState, useEffect, useCallback } from 'react';
import { holidaysService, Holiday, HolidayWithMeta } from '../../services/holidays.service';

interface TunisianHolidaysCalendarProps {
  className?: string;
}

export function TunisianHolidaysCalendar({ className = '' }: TunisianHolidaysCalendarProps) {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [upcomingHolidays, setUpcomingHolidays] = useState<HolidayWithMeta[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // Fetch holidays
  const fetchHolidays = useCallback(async () => {
    setIsLoading(true);
    try {
      const [allHolidays, upcoming] = await Promise.all([
        holidaysService.getCalendarHolidays(currentYear),
        holidaysService.getUpcomingHolidays(5)
      ]);
      setHolidays(allHolidays);
      setUpcomingHolidays(upcoming);
    } catch (error) {
      console.error('Failed to fetch holidays:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentYear]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  // Calendar helpers
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const isHoliday = (day: number): Holiday | null => {
    const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return holidays.find(h => h.date === dateString) || null;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Navigation
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  // Render calendar grid
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];
    const today = new Date();
    const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;

    // Empty cells for days before the first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const holiday = isHoliday(day);
      const isToday = isCurrentMonth && today.getDate() === day;
      const holidayType = holiday ? holidaysService.getHolidayType(holiday) : null;
      const holidayColor = holidayType ? holidaysService.getHolidayColor(holidayType) : '';

      days.push(
        <button
          key={day}
          onClick={() => holiday && setSelectedHoliday(holiday)}
          className={`
            h-10 w-10 rounded-lg text-sm font-medium relative
            flex items-center justify-center
            transition-all duration-200
            ${isToday 
              ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30' 
              : holiday 
                ? `${holidayColor} border hover:scale-105`
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }
          `}
        >
          {day}
          {holiday && (
            <span className="absolute -top-1 -right-1 w-3 h-3 text-xs">
              {holidaysService.getHolidayIcon(holidayType!)}
            </span>
          )}
        </button>
      );
    }

    return days;
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🇹🇳</span>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Tunisia Holidays
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
            className="p-2 text-gray-500 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
            title={viewMode === 'calendar' ? 'List view' : 'Calendar view'}
          >
            {viewMode === 'calendar' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && (
        <>
          {/* Calendar View */}
          {viewMode === 'calendar' && (
            <>
              {/* Calendar Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={goToPreviousMonth}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="text-center">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {monthNames[currentMonth]} {currentYear}
                  </h4>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={goToToday}
                    className="px-3 py-1.5 text-sm text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
                  >
                    Today
                  </button>
                  <button
                    onClick={goToNextMonth}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map(day => (
                  <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {renderCalendar()}
              </div>

              {/* Legend */}
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-red-100 border border-red-200" />
                  <span className="text-gray-600 dark:text-gray-400">National</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200" />
                  <span className="text-gray-600 dark:text-gray-400">Religious</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-blue-100 border border-blue-200" />
                  <span className="text-gray-600 dark:text-gray-400">Observance</span>
                </div>
              </div>
            </>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {upcomingHolidays.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-3xl mb-2 block">🎉</span>
                  <p className="text-gray-500 dark:text-gray-400">No upcoming holidays</p>
                </div>
              ) : (
                upcomingHolidays.map((holiday) => {
                  const type = holidaysService.getHolidayType(holiday);
                  const colorClass = holidaysService.getHolidayColor(type);
                  
                  return (
                    <button
                      key={holiday.date}
                      onClick={() => setSelectedHoliday(holiday)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border hover:shadow-sm transition-all text-left"
                    >
                      <span className="text-2xl">{holidaysService.getHolidayIcon(type)}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {holiday.localName}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {holiday.formattedDate}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${colorClass}`}>
                        {holiday.daysUntil === 0 
                          ? 'Today!' 
                          : holiday.daysUntil === 1 
                            ? 'Tomorrow' 
                            : `In ${holiday.daysUntil} days`}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* Upcoming Preview (Calendar Mode) */}
          {viewMode === 'calendar' && upcomingHolidays.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Up Next
              </h4>
              <div className="flex items-center gap-3 p-3 bg-brand-50 dark:bg-brand-900/20 rounded-xl">
                <span className="text-2xl">
                  {holidaysService.getHolidayIcon(holidaysService.getHolidayType(upcomingHolidays[0]))}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {upcomingHolidays[0].localName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {upcomingHolidays[0].formattedDate}
                  </p>
                </div>
                <span className="text-sm font-medium text-brand-600 dark:text-brand-400">
                  {upcomingHolidays[0].daysUntil === 0 
                    ? 'Today!' 
                    : upcomingHolidays[0].daysUntil === 1 
                      ? 'Tomorrow' 
                      : `In ${upcomingHolidays[0].daysUntil}d`}
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Holiday Detail Modal */}
      {selectedHoliday && (
        <div className="fixed inset-0 bg-black/50 z-[999999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl">
                  {holidaysService.getHolidayIcon(holidaysService.getHolidayType(selectedHoliday))}
                </span>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedHoliday.localName}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {holidaysService.formatHolidayDate(selectedHoliday.date)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedHoliday(null)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">English Name</p>
                <p className="text-gray-900 dark:text-white">{selectedHoliday.name}</p>
              </div>

              <div className="flex gap-3">
                <div className="flex-1 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
                  <p className="text-gray-900 dark:text-white capitalize">
                    {holidaysService.getHolidayType(selectedHoliday)}
                  </p>
                </div>
                <div className="flex-1 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Fixed Date</p>
                  <p className="text-gray-900 dark:text-white">
                    {selectedHoliday.fixed ? 'Yes' : 'Varies'}
                  </p>
                </div>
              </div>

              {selectedHoliday.launchYear && (
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">First Observed</p>
                  <p className="text-gray-900 dark:text-white">{selectedHoliday.launchYear}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
