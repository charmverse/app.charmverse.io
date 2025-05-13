import type { ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';

import { useLocalStorage } from './useLocalStorage';

type ViewsRecord = Record<string, null | string>;

interface IContext {
  viewsRecord: ViewsRecord;
  setViewsRecord: React.Dispatch<React.SetStateAction<ViewsRecord | null>>;
}

const ViewsContext = createContext<Readonly<IContext>>({
  viewsRecord: {},
  setViewsRecord: () => null
});

export function DatabaseViewsProvider({ children }: { children: ReactNode }) {
  const [viewsRecord, setViewsRecord] = useLocalStorage<ViewsRecord>('default-views', {});

  const value = useMemo(
    () => ({
      viewsRecord: viewsRecord ?? {},
      setViewsRecord
    }),
    [viewsRecord, setViewsRecord]
  );

  return (
    // eslint-disable-next-line
    <ViewsContext.Provider value={value}>{children}</ViewsContext.Provider>
  );
}

export const useDatabaseViews = () => useContext(ViewsContext);
