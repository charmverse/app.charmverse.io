import { renderHook, act } from '@testing-library/react';

import { usePaginatedData } from 'hooks/usePaginatedData';

describe('usePaginatedData', () => {
  test('should return paginated data portion according to actual page', () => {
    const testDataLength = 100;
    const testPageSize = 35;
    const sourceData = Array.from({ length: testDataLength }, (_, i) => ({ id: i, name: `name-${i}` }));
    const { result } = renderHook(() => usePaginatedData(sourceData, { pageSize: testPageSize }));

    expect(result.current.data).toEqual(sourceData.slice(0, testPageSize));
    expect(result.current.data.length).toEqual(testPageSize);
    expect(result.current.visiblePagesCount).toEqual(1);
    expect(result.current.hasNextPage).toEqual(true);
    expect(result.current.moreCount).toEqual(testPageSize);

    act(() => {
      result.current.showNextPage();
    });

    expect(result.current.data).toEqual(sourceData.slice(0, testPageSize * 2));
    expect(result.current.data.length).toEqual(testPageSize * 2);
    expect(result.current.visiblePagesCount).toEqual(2);
    expect(result.current.hasNextPage).toEqual(true);
    expect(result.current.moreCount).toEqual(30);

    act(() => {
      result.current.showNextPage();
    });

    expect(result.current.data).toEqual(sourceData.slice(0, testDataLength));
    expect(result.current.data.length).toEqual(testDataLength);
    expect(result.current.visiblePagesCount).toEqual(3);
    expect(result.current.hasNextPage).toEqual(false);
    expect(result.current.moreCount).toEqual(0);

    // we are on last page, so next call should not crash or change anything
    act(() => {
      result.current.showNextPage();
    });

    expect(result.current.data).toEqual(sourceData.slice(0, testDataLength));
    expect(result.current.data.length).toEqual(testDataLength);
    expect(result.current.visiblePagesCount).toEqual(3);
    expect(result.current.hasNextPage).toEqual(false);
    expect(result.current.moreCount).toEqual(0);
  });
});
