import { cn, getOverallIntensity } from './utils';

describe('Utility Functions', () => {
  describe('cn', () => {
    it('combines class names correctly', () => {
      expect(cn('base', 'additional')).toBe('base additional');
    });

    it('handles conditional classes', () => {
      expect(cn('base', { 'conditional': true, 'not-included': false }))
        .toBe('base conditional');
    });

    it('handles undefined and null values', () => {
      expect(cn('base', undefined, null, 'valid')).toBe('base valid');
    });

    it('handles empty strings', () => {
      expect(cn('base', '', 'valid')).toBe('base valid');
    });
  });

  describe('getOverallIntensity', () => {
    it('calculates average intensity correctly', () => {
      const days = [
        { intensity: 'Easy' },
        { intensity: 'Medium' },
        { intensity: 'Hard' }
      ];
      expect(getOverallIntensity(days)).toBe(50);
    });

    it('handles empty array', () => {
      expect(getOverallIntensity([])).toBe(0);
    });

    it('handles undefined input', () => {
      expect(getOverallIntensity(undefined)).toBe(0);
    });

    it('handles unknown intensity values', () => {
      const days = [
        { intensity: 'Easy' },
        { intensity: 'Unknown' },
        { intensity: 'Hard' }
      ];
      expect(getOverallIntensity(days)).toBe(33);
    });

    it('handles rest days', () => {
      const days = [
        { intensity: 'Rest' },
        { intensity: 'Medium' },
        { intensity: 'Rest' }
      ];
      expect(getOverallIntensity(days)).toBe(17);
    });
  });
}); 