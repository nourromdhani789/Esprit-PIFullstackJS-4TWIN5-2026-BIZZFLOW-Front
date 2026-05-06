import { holidaysService } from '../holidays.service';

describe('HolidaysService', () => {
  describe('TUNISIA_CODE', () => {
    it('should be TN', () => {
      expect(holidaysService.TUNISIA_CODE).toBe('TN');
    });
  });

  describe('formatHolidayDate', () => {
    it('should format date string', () => {
      const result = holidaysService.formatHolidayDate('2024-03-20');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
  });

  describe('getDaysUntil', () => {
    it('should return positive number for future date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const result = holidaysService.getDaysUntil(futureDate.toISOString());
      expect(result).toBeGreaterThan(0);
    });

    it('should return negative number for past date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30);
      const result = holidaysService.getDaysUntil(pastDate.toISOString());
      expect(result).toBeLessThan(0);
    });
  });

  describe('getHolidayType', () => {
    it('should identify religious holidays', () => {
      const result = holidaysService.getHolidayType({ localName: 'Aid El Fitr' } as any);
      expect(result).toBe('religious');
    });

    it('should identify religious holidays with mawlid', () => {
      const result = holidaysService.getHolidayType({ localName: 'Mawlid' } as any);
      expect(result).toBe('religious');
    });

    it('should identify religious holidays with muharram', () => {
      const result = holidaysService.getHolidayType({ localName: 'Muharram' } as any);
      expect(result).toBe('religious');
    });

    it('should identify national holidays with révolution', () => {
      const result = holidaysService.getHolidayType({ localName: 'Révolution' } as any);
      expect(result).toBe('national');
    });

    it('should identify national holidays with indépendance', () => {
      const result = holidaysService.getHolidayType({ localName: 'Indépendance' } as any);
      expect(result).toBe('national');
    });

    it('should identify national holidays with fête', () => {
      const result = holidaysService.getHolidayType({ localName: 'Fête nationale' } as any);
      expect(result).toBe('national');
    });

    it('should identify "Fête du travail" as national (contains fête)', () => {
      const result = holidaysService.getHolidayType({ localName: 'Fête du travail' } as any);
      expect(result).toBe('national');
    });

    it('should identify observance holidays with femme', () => {
      const result = holidaysService.getHolidayType({ localName: 'Journée de la femme' } as any);
      expect(result).toBe('observance');
    });

    it('should identify observance holidays with travail (without fête)', () => {
      const result = holidaysService.getHolidayType({ localName: 'Journée du travail' } as any);
      expect(result).toBe('observance');
    });

    it('should return public for unknown types', () => {
      const result = holidaysService.getHolidayType({ localName: 'Some random day' } as any);
      expect(result).toBe('public');
    });
  });

  describe('getHolidayColor', () => {
    it('should return religious color', () => {
      const result = holidaysService.getHolidayColor('religious');
      expect(result).toContain('emerald');
    });

    it('should return national color', () => {
      const result = holidaysService.getHolidayColor('national');
      expect(result).toContain('red');
    });

    it('should return observance color', () => {
      const result = holidaysService.getHolidayColor('observance');
      expect(result).toContain('blue');
    });

    it('should return default color', () => {
      const result = holidaysService.getHolidayColor('other');
      expect(result).toContain('gray');
    });
  });

  describe('getHolidayIcon', () => {
    it('should return religious icon', () => {
      expect(holidaysService.getHolidayIcon('religious')).toBe('🌙');
    });
    it('should return national icon', () => {
      expect(holidaysService.getHolidayIcon('national')).toBe('🇹🇳');
    });
    it('should return observance icon', () => {
      expect(holidaysService.getHolidayIcon('observance')).toBe('📅');
    });
    it('should return default icon', () => {
      expect(holidaysService.getHolidayIcon('other')).toBe('🎉');
    });
  });
});
