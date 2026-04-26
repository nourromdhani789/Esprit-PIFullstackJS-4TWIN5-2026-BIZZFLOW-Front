// Nager.Date API Service - Tunisian Public Holidays
// No storage - fetches live data only
// No API key required

const NAGER_API_URL = 'https://date.nager.at/api/v3';

export interface Holiday {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  counties: string[] | null;
  launchYear: number | null;
  types: string[];
}

export interface HolidayWithMeta extends Holiday {
  daysUntil: number;
  isPast: boolean;
  formattedDate: string;
}

export const holidaysService = {
  // Country code for Tunisia
  TUNISIA_CODE: 'TN',

  // Fetch holidays for a specific year
  async getHolidays(year: number = new Date().getFullYear()): Promise<Holiday[]> {
    try {
      const response = await fetch(
        `${NAGER_API_URL}/PublicHolidays/${year}/${this.TUNISIA_CODE}`
      );
      
      if (!response.ok) {
        throw new Error(`Nager API error: ${response.status}`);
      }
      
      const holidays: Holiday[] = await response.json();
      return holidays;
    } catch (error) {
      console.error('Holidays fetch error:', error);
      return [];
    }
  },

  // Get upcoming holidays
  async getUpcomingHolidays(limit: number = 5): Promise<HolidayWithMeta[]> {
    const currentYear = new Date().getFullYear();
    const holidays = await this.getHolidays(currentYear);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return holidays
      .map(holiday => {
        const holidayDate = new Date(holiday.date);
        const diffTime = holidayDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return {
          ...holiday,
          daysUntil: diffDays,
          isPast: diffDays < 0,
          formattedDate: this.formatHolidayDate(holiday.date)
        };
      })
      .filter(h => !h.isPast) // Only future holidays
      .slice(0, limit);
  },

  // Get holidays for calendar display
  async getCalendarHolidays(year: number = new Date().getFullYear()): Promise<Holiday[]> {
    return this.getHolidays(year);
  },

  // Check if a specific date is a holiday
  async isHoliday(date: Date): Promise<Holiday | null> {
    const year = date.getFullYear();
    const holidays = await this.getHolidays(year);
    
    const dateString = date.toISOString().split('T')[0];
    return holidays.find(h => h.date === dateString) || null;
  },

  // Format date for display
  formatHolidayDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  },

  // Get days until holiday
  getDaysUntil(dateString: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const holiday = new Date(dateString);
    const diffTime = holiday.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  // Get holiday type/category
  getHolidayType(holiday: Holiday): string {
    const name = holiday.localName.toLowerCase();
    
    if (name.includes('aid') || name.includes('mawlid') || name.includes('muharram')) {
      return 'religious';
    }
    if (name.includes('révolution') || name.includes('indépendance') || name.includes('fête')) {
      return 'national';
    }
    if (name.includes('travail') || name.includes('femme')) {
      return 'observance';
    }
    return 'public';
  },

  // Get holiday color based on type
  getHolidayColor(type: string): string {
    switch (type) {
      case 'religious':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'national':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'observance':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  },

  // Get holiday icon based on type
  getHolidayIcon(type: string): string {
    switch (type) {
      case 'religious':
        return '🌙';
      case 'national':
        return '🇹🇳';
      case 'observance':
        return '📅';
      default:
        return '🎉';
    }
  },

};
