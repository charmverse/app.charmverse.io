import { useLocalStorage } from 'hooks/useLocalStorage';

export function useLocalDbViewSettings(viewId: string) {
  const [localFilters, setLocalFilters] = useLocalStorage(`db-view-filters-${viewId}`, null);
  const [localSort, setLocalSort] = useLocalStorage(`db-view-sort-${viewId}`, null);

  return {
    localFilters,
    setLocalFilters,
    localSort,
    setLocalSort
  };
}
