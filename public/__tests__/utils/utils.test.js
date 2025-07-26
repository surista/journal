import { 
  formatDuration, 
  formatDate, 
  generateId, 
  debounce,
  calculateStreak,
  escapeHtml 
} from '../../src/utils/utils.js';

describe('Utils', () => {
  describe('formatDuration', () => {
    test('formats seconds correctly', () => {
      expect(formatDuration(45)).toBe('0:45');
      expect(formatDuration(0)).toBe('0:00');
    });

    test('formats minutes correctly', () => {
      expect(formatDuration(60)).toBe('1:00');
      expect(formatDuration(90)).toBe('1:30');
      expect(formatDuration(125)).toBe('2:05');
    });

    test('formats hours correctly', () => {
      expect(formatDuration(3600)).toBe('1:00:00');
      expect(formatDuration(3665)).toBe('1:01:05');
      expect(formatDuration(7200)).toBe('2:00:00');
    });

    test('handles edge cases', () => {
      expect(formatDuration(null)).toBe('0:00');
      expect(formatDuration(undefined)).toBe('0:00');
      expect(formatDuration(-10)).toBe('0:00');
      expect(formatDuration('not a number')).toBe('0:00');
    });
  });

  describe('formatDate', () => {
    test('formats date correctly', () => {
      const date = new Date('2025-01-25T10:30:00');
      expect(formatDate(date)).toMatch(/Jan 25, 2025/);
    });

    test('handles invalid dates', () => {
      expect(formatDate('invalid')).toBe('Invalid Date');
      expect(formatDate(null)).toBe('Invalid Date');
    });
  });

  describe('generateId', () => {
    test('generates unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    test('generates IDs of correct format', () => {
      const id = generateId();
      expect(id).toMatch(/^[a-z0-9]{6,}$/);
    });
  });

  describe('debounce', () => {
    jest.useFakeTimers();

    test('delays function execution', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(50);
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(50);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('cancels previous calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('first');
      jest.advanceTimersByTime(50);
      debouncedFn('second');
      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('second');
    });

    jest.useRealTimers();
  });

  describe('escapeHtml', () => {
    test('escapes HTML characters', () => {
      expect(escapeHtml('<script>alert("XSS")</script>')).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
      expect(escapeHtml("It's a test")).toBe('It&#39;s a test');
    });

    test('handles edge cases', () => {
      expect(escapeHtml('')).toBe('');
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
      expect(escapeHtml(123)).toBe('123');
    });
  });

  describe('calculateStreak', () => {
    test('calculates consecutive days correctly', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const sessions = [
        { date: today.toISOString() },
        { date: yesterday.toISOString() },
        { date: twoDaysAgo.toISOString() }
      ];

      expect(calculateStreak(sessions)).toBe(3);
    });

    test('breaks streak on missing days', () => {
      const today = new Date();
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const sessions = [
        { date: today.toISOString() },
        { date: twoDaysAgo.toISOString() }
      ];

      expect(calculateStreak(sessions)).toBe(1);
    });

    test('handles empty sessions', () => {
      expect(calculateStreak([])).toBe(0);
      expect(calculateStreak(null)).toBe(0);
      expect(calculateStreak(undefined)).toBe(0);
    });
  });
});