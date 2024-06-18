import { useCallback, useEffect, useMemo, useState } from 'react';

export const DEFAULT_PAGE_SIZE = 50;

type Config = {
  pageSize?: number;
  initialPage?: number;
};

export function usePaginatedData<T>(sourceData: T[], config: Config = {}) {
  const [pageSize, setPageSize] = useState(config.pageSize || DEFAULT_PAGE_SIZE);
  const [visiblePagesCount, setVisiblePagesCount] = useState(config.initialPage || 1);

  useEffect(() => {
    setVisiblePagesCount(1);
  }, [config?.pageSize]);

  const data = useMemo(() => {
    const start = 0;
    const end = start + pageSize * visiblePagesCount;
    return sourceData.slice(start, end);
  }, [pageSize, sourceData, visiblePagesCount]);

  const moreCount = Math.min(pageSize, sourceData.length - data.length);
  const hasNextPage = moreCount > 0;

  const showNextPage = useCallback(() => {
    if (hasNextPage) {
      setVisiblePagesCount((prev) => prev + 1);
    }
  }, [hasNextPage]);

  return { data, visiblePagesCount, hasNextPage, showNextPage, moreCount, pageSize, setPageSize };
}
