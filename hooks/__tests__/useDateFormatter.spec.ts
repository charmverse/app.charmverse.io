import { renderHook } from '@testing-library/react';

import { useDateFormatter } from 'hooks/useDateFormatter';
import { useUserPreferences } from 'hooks/useUserPreferences';

jest.mock('hooks/useUserPreferences', () => ({
  useUserPreferences: jest.fn()
}));

describe('useDateFormatter', () => {
  afterAll(() => {
    jest.restoreAllMocks();
  });

  test('should format date and time according to locale from user preferences', () => {
    (useUserPreferences as jest.Mock<any, any>).mockReturnValue({ userPreferences: { locale: 'en-US' } });
    const { result, rerender } = renderHook(() => useDateFormatter());
    const testDate = '2023-02-08T07:59:48.698Z';
    const testDate2 = '2023-02-28T17:59:48.698Z';

    expect(result.current.formatDateTime(testDate)).toEqual('2/8/23, 7:59 AM');
    expect(result.current.formatDateTime(testDate2)).toEqual('2/28/23, 5:59 PM');

    (useUserPreferences as jest.Mock<any, any>).mockReturnValue({ userPreferences: { locale: 'en-GB' } });
    rerender();

    expect(result.current.formatDateTime(testDate)).toEqual('08/02/2023, 07:59');
    expect(result.current.formatDateTime(testDate2)).toEqual('28/02/2023, 17:59');
  });

  test('should format date in user friendly format using locale from user preferences', () => {
    (useUserPreferences as jest.Mock<any, any>).mockReturnValue({ userPreferences: { locale: 'en-US' } });
    const { result, rerender } = renderHook(() => useDateFormatter());
    const testDate = '2023-02-08T07:59:48.698Z';
    const testDate2 = '2023-11-28T17:59:48.698Z';

    expect(result.current.formatDate(testDate)).toEqual('Feb 8');
    expect(result.current.formatDate(testDate, { withYear: true })).toEqual('Feb 8, 2023');
    expect(result.current.formatDate(testDate2)).toEqual('Nov 28');

    (useUserPreferences as jest.Mock<any, any>).mockReturnValue({ userPreferences: { locale: 'en-GB' } });
    rerender();

    expect(result.current.formatDate(testDate)).toEqual('8 Feb');
    expect(result.current.formatDate(testDate, { withYear: true })).toEqual('8 Feb 2023');
    expect(result.current.formatDate(testDate2)).toEqual('28 Nov');
  });

  test('should format time using locale from user preferences', () => {
    (useUserPreferences as jest.Mock<any, any>).mockReturnValue({ userPreferences: { locale: 'en-US' } });
    const { result, rerender } = renderHook(() => useDateFormatter());
    const testDate = '2023-02-08T07:59:48.698Z';
    const testDate2 = '2023-02-28T17:59:48.698Z';

    expect(result.current.formatTime(testDate)).toEqual('7:59 AM');
    expect(result.current.formatTime(testDate2)).toEqual('5:59 PM');

    (useUserPreferences as jest.Mock<any, any>).mockReturnValue({ userPreferences: { locale: 'en-GB' } });
    rerender();

    expect(result.current.formatTime(testDate)).toEqual('07:59');
    expect(result.current.formatTime(testDate2)).toEqual('17:59');
  });
});
