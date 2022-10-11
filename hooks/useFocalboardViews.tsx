import type { ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';

import { useLocalStorage } from './useLocalStorage';

type FocalboardViewsRecord = Record<string, null | string>;

interface IContext {
  focalboardViewsRecord: FocalboardViewsRecord;
  setFocalboardViewsRecord: React.Dispatch<React.SetStateAction<FocalboardViewsRecord>>;
}

export const FocalboardViewsContext = createContext<Readonly<IContext>>({
  focalboardViewsRecord: {},
  setFocalboardViewsRecord: () => null
});

export function FocalboardViewsProvider ({ children }: { children: ReactNode }) {
  const [focalboardViewsRecord, setFocalboardViewsRecord] = useLocalStorage<FocalboardViewsRecord>('default-views', {});

  const value = useMemo(() => ({
    focalboardViewsRecord,
    setFocalboardViewsRecord
  }), [focalboardViewsRecord]);

  return (
    // eslint-disable-next-line
    <FocalboardViewsContext.Provider value={value}>
      {children}
    </FocalboardViewsContext.Provider>
  );
}

export const useFocalboardViews = () => useContext(FocalboardViewsContext);
