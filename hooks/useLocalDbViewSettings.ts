import { useLocalStorage } from 'hooks/useLocalStorage';
import type { ISortOption } from 'lib/focalboard/boardView';
import type { FilterGroup } from 'lib/focalboard/filterGroup';

export type DbViewLocalOptions = {
  localSort: ISortOption[] | null;
  setLocalSort: (sort: ISortOption[] | null) => void;
  localFilters: FilterGroup | null;
  setLocalFilters: (filters: FilterGroup | null) => void;
};

export function useLocalDbViewSettings(viewId: string): DbViewLocalOptions {
  const [localFilters, setLocalFilters] = useLocalStorage<FilterGroup | null>(`db-view-filters-${viewId}`, null);
  const [localSort, setLocalSort] = useLocalStorage<ISortOption[] | null>(`db-view-sort-${viewId}`, null);

  return {
    localFilters,
    setLocalFilters,
    localSort,
    setLocalSort
  };
}
