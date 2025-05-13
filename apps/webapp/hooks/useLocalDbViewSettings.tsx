import { isEqual } from 'lodash';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useLocalStorage } from 'hooks/useLocalStorage';
import type { ISortOption } from '@packages/databases/boardView';
import type { FilterGroup } from '@packages/databases/filterGroup';

export type DbViewLocalOptions = {
  localSort: ISortOption[] | null;
  setLocalSort: (sort: ISortOption[] | null) => void;
  localFilters: FilterGroup | null;
  setLocalFilters: (filters: FilterGroup | null) => void;
  setViewId: (viewId: string | null) => void;
  viewId: string | null;
  resetLocalSettings: () => void;
  hasLocalFiltersEnabled: (globalFilters: FilterGroup) => boolean;
  hasLocalSortEnabled: (globalSort: ISortOption[]) => boolean;
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

  const resetLocalSettings = useCallback(() => {
    if (!viewId) return;

    setLocalFilters(null);
    setLocalSort(null);
  }, [setLocalFilters, setLocalSort, viewId]);

  const hasLocalFiltersEnabled = useCallback(
    (globalFilters: FilterGroup) => {
      return !!localFilters && !isEqual(localFilters, globalFilters);
    },
    [localFilters]
  );

  const hasLocalSortEnabled = useCallback(
    (globalSort: ISortOption[]) => {
      return !!localSort && !isEqual(localSort, globalSort);
    },
    [localSort]
  );

  const value = useMemo(
    () => ({
      setViewId,
      localFilters,
      setLocalFilters,
      localSort,
      setLocalSort,
      viewId,
      resetLocalSettings,
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
      hasLocalFiltersEnabled,
      hasLocalSortEnabled
    ]
  );

  return <DbViewSettingsContext.Provider value={value}>{children}</DbViewSettingsContext.Provider>;
}

export function useLocalDbViewSettings(viewId?: string): DbViewLocalOptions | null {
  const ctx = useContext(DbViewSettingsContext);

  useEffect(() => {
    if (viewId && ctx.setViewId) {
      ctx.setViewId(viewId);
    }
  }, [ctx, viewId]);

  // return null if there is no provider
  return 'viewId' in ctx ? ctx : null;
}
