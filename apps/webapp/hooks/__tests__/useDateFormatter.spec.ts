import { normalizeWhitespace } from '@packages/testing/normalizeWhitespace';
import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';

import { useDateFormatter } from 'hooks/useDateFormatter';
import { useUserPreferences } from 'hooks/useUserPreferences';

vi.mock('hooks/useUserPreferences', () => ({
  useUserPreferences: vi.fn()
}));

describe('useDateFormatter', () => {
  afterAll(() => {
    vi.restoreAllMocks();
  });

  test('should format date and time according to locale from user preferences', () => {
    (useUserPreferences as vi.Mock<any, any>).mockReturnValue({ userPreferences: { locale: 'en-US' } });
    const { result, rerender } = renderHook(() => useDateFormatter());
    const testDate = '2023-02-08T07:59:48.698Z';
    const testDate2 = '2023-02-28T17:59:48.698Z';

    expect(normalizeWhitespace(result.current.formatDateTime(testDate))).toEqual('2/8/23, 7:59 AM');
    expect(normalizeWhitespace(result.current.formatDateTime(testDate2))).toEqual('2/28/23, 5:59 PM');

    (useUserPreferences as vi.Mock<any, any>).mockReturnValue({ userPreferences: { locale: 'en-GB' } });
    rerender();

    expect(normalizeWhitespace(result.current.formatDateTime(testDate))).toEqual('08/02/2023, 07:59');
    expect(normalizeWhitespace(result.current.formatDateTime(testDate2))).toEqual('28/02/2023, 17:59');
  });

  test('should format date in user friendly format using locale from user preferences', () => {
    (useUserPreferences as vi.Mock<any, any>).mockReturnValue({ userPreferences: { locale: 'en-US' } });
    const currentYear = new Date().getFullYear();
    const { result, rerender } = renderHook(() => useDateFormatter());
    const testDate = `${currentYear}-02-08T07:59:48.698Z`;
    const testDate2 = `${currentYear}-11-28T17:59:48.698Z`;
    const testDatePastYear = '2020-03-08T03:30:48.698Z';

    expect(normalizeWhitespace(result.current.formatDate(testDate))).toEqual('Feb 8');
    expect(normalizeWhitespace(result.current.formatDate(testDate, { withYear: true }))).toEqual(
      `Feb 8, ${currentYear}`
    );
    expect(normalizeWhitespace(result.current.formatDate(testDate2))).toEqual('Nov 28');
    expect(normalizeWhitespace(result.current.formatDate(testDatePastYear))).toEqual('Mar 8, 2020');
    expect(normalizeWhitespace(result.current.formatDate(testDatePastYear, { withYear: false }))).toEqual('Mar 8');

    (useUserPreferences as vi.Mock<any, any>).mockReturnValue({ userPreferences: { locale: 'en-GB' } });
    rerender();

    expect(normalizeWhitespace(result.current.formatDate(testDate))).toEqual('8 Feb');
    expect(normalizeWhitespace(result.current.formatDate(testDate, { withYear: true }))).toEqual(
      `8 Feb ${currentYear}`
    );
    expect(normalizeWhitespace(result.current.formatDate(testDate2))).toEqual('28 Nov');
    expect(normalizeWhitespace(result.current.formatDate(testDatePastYear))).toEqual('8 Mar 2020');
    expect(normalizeWhitespace(result.current.formatDate(testDatePastYear, { withYear: false }))).toEqual('8 Mar');
  });

  test('should format time using locale from user preferences', () => {
    (useUserPreferences as vi.Mock<any, any>).mockReturnValue({ userPreferences: { locale: 'en-US' } });
    const { result, rerender } = renderHook(() => useDateFormatter());
    const testDate = '2023-02-08T07:59:48.698Z';
    const testDate2 = '2023-02-28T17:59:48.698Z';

    expect(normalizeWhitespace(result.current.formatTime(testDate))).toEqual('7:59 AM');
    expect(normalizeWhitespace(result.current.formatTime(testDate2))).toEqual('5:59 PM');

    (useUserPreferences as vi.Mock<any, any>).mockReturnValue({ userPreferences: { locale: 'en-GB' } });
    rerender();

    expect(normalizeWhitespace(result.current.formatTime(testDate))).toEqual('07:59');
    expect(normalizeWhitespace(result.current.formatTime(testDate2))).toEqual('17:59');
  });
});
