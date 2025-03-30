import { describe, it, expect } from 'vitest';
import { cn, formatDate, formatUTCDate } from './utils';

describe('cn utility', () => {
  it('should merge class names correctly', () => {
    expect(cn('base-class', 'additional-class')).toBe('base-class additional-class');
  });

  it('should handle conditional classes', () => {
    expect(cn('base-class', true && 'conditional-class')).toBe('base-class conditional-class');
    expect(cn('base-class', false && 'conditional-class')).toBe('base-class');
  });

  it('should handle multiple conditional classes', () => {
    expect(cn('base-class', true && 'class1', false && 'class2')).toBe('base-class class1');
  });

  it('should handle undefined and null values', () => {
    expect(cn('base-class', undefined, null)).toBe('base-class');
  });
});

describe('formatDate utility', () => {
  const testDate = new Date('2024-03-15T14:30:00');

  it('should format date with default options', () => {
    const result = formatDate(testDate);
    expect(result).toMatch(/March 15, 2024/);
    expect(result).toMatch(/14:30/);
  });

  it('should format date with custom options', () => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    const result = formatDate(testDate, options);
    expect(result).toMatch(/Mar 15, 2024/);
    expect(result).toMatch(/14:30/);
  });

  it('should handle string date input', () => {
    const result = formatDate('2024-03-15T14:30:00');
    expect(result).toMatch(/March 15, 2024/);
  });

  it('should handle number date input', () => {
    const result = formatDate(testDate.getTime());
    expect(result).toMatch(/March 15, 2024/);
  });

  it('should throw error for invalid date', () => {
    expect(() => formatDate('invalid-date')).toThrow(TypeError);
  });
});

describe('formatUTCDate utility', () => {
  const testDate = new Date('2024-03-15T14:30:00Z');

  it('should format date in UTC', () => {
    const result = formatUTCDate(testDate);
    expect(result).toMatch(/March 15, 2024/);
    expect(result).toMatch(/14:30/);
  });

  it('should format UTC date with custom options', () => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    const result = formatUTCDate(testDate, options);
    expect(result).toMatch(/Mar 15, 2024/);
    expect(result).toMatch(/14:30/);
  });

  it('should handle string UTC date input', () => {
    const result = formatUTCDate('2024-03-15T14:30:00Z');
    expect(result).toMatch(/March 15, 2024/);
  });

  it('should handle number UTC date input', () => {
    const result = formatUTCDate(testDate.getTime());
    expect(result).toMatch(/March 15, 2024/);
  });

  it('should throw error for invalid UTC date', () => {
    expect(() => formatUTCDate('invalid-date')).toThrow(TypeError);
  });
}); 