import { useCallback, useMemo, useState } from 'react';

const DEFAULT_PAGE_SIZE = 100;

type Config = {
  pageSize?: number;
  initialPage?: number;
};

export function usePaginatedData<T>(sourceData: T[], config: Config = {}) {
  const pageSize = config.pageSize || DEFAULT_PAGE_SIZE;
  const [currentPage, setCurrentPage] = useState(config.initialPage || 1);

  const data = useMemo(() => {
    const start = 0;
    const end = start + pageSize * currentPage;
    return sourceData.slice(start, end);
  }, [currentPage, pageSize, sourceData]);

  const moreCount = Math.min(pageSize, sourceData.length - data.length);
  const hasNextPage = moreCount > 0;

  const showNextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [hasNextPage]);

  return { data, currentPage, hasNextPage, showNextPage, moreCount };
}
