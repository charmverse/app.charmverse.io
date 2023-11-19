import { isEqual } from 'lodash';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useLocalStorage } from 'hooks/useLocalStorage';
import type { ISortOption } from 'lib/focalboard/boardView';
import type { FilterGroup } from 'lib/focalboard/filterGroup';

export type DbViewLocalOptions = {
  localSort: ISortOption[] | null;
  setLocalSort: (sort: ISortOption[] | null) => void;
  localFilters: FilterGroup | null;
  setLocalFilters: (filters: FilterGroup | null) => void;
  setViewId: (viewId: string | null) => void;
  viewId: string | null;
  resetLocalSettings: () => void;

  globalSort: ISortOption[] | null;
  setGlobalSort: (sort: ISortOption[] | null) => void;
  globalFilters: FilterGroup | null;
  setGlobalFilters: (filters: FilterGroup | null) => void;
  hasLocalFiltersEnabled: boolean;
  hasLocalSortEnabled: boolean;
};

export const DbViewSettingsContext = createContext<Readonly<DbViewLocalOptions>>({} as DbViewLocalOptions);

export function DbViewSettingsProvider({ children }: { children: ReactNode }) {
  const [viewId, setViewId] = useState<null | string>(null);
  const [localFilters, setLocalFilters] = useLocalStorage<FilterGroup | null>(
    viewId ? `db-view-filters-${viewId}` : null,
    null
  );
  const [localSort, setLocalSort] = useLocalStorage<ISortOption[] | null>(
    viewId ? `db-view-sort-${viewId}` : null,
    null
  );
  const [globalFilters, setGlobalFilters] = useState<FilterGroup | null>(null);
  const [globalSort, setGlobalSort] = useState<ISortOption[] | null>(null);

  useEffect(() => {
    setGlobalFilters(null);
    setGlobalSort(null);
  }, [viewId]);

  const resetLocalSettings = useCallback(() => {
    if (!viewId) return;

    setLocalFilters(null);
    setLocalSort(null);
  }, [setLocalFilters, setLocalSort, viewId]);

  const hasLocalFiltersEnabled = useMemo(() => {
    return !!localFilters && localFilters.filters.length > 0 && !isEqual(localFilters, globalFilters);
  }, [globalFilters, localFilters]);

  const hasLocalSortEnabled = useMemo(() => {
    return !!localSort && localSort.length > 0 && !isEqual(localSort, globalSort);
  }, [globalSort, localSort]);

  const value = useMemo(
    () => ({
      setViewId,
      localFilters,
      setLocalFilters,
      localSort,
      setLocalSort,
      viewId,
      resetLocalSettings,
      globalFilters,
      setGlobalFilters,
      globalSort,
      setGlobalSort,
      hasLocalFiltersEnabled,
      hasLocalSortEnabled
    }),
    [
      localFilters,
      setLocalFilters,
      localSort,
      setLocalSort,
      viewId,
      resetLocalSettings,
      globalFilters,
      globalSort,
      hasLocalFiltersEnabled,
      hasLocalSortEnabled
    ]
  );

  return <DbViewSettingsContext.Provider value={value}>{children}</DbViewSettingsContext.Provider>;
}

export function useLocalDbViewSettings(viewId?: string): DbViewLocalOptions | null {
  const ctx = useContext(DbViewSettingsContext);

  useEffect(() => {
    if (viewId) {
      ctx.setViewId(viewId);
    }
  }, [ctx, viewId]);

  // return null if there is no provider
  return 'viewId' in ctx ? ctx : null;
}
