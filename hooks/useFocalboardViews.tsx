import { createContext, ReactNode, useContext, useMemo } from 'react';
import { useCurrentSpace } from './useCurrentSpace';
import { useLocalStorage } from './useLocalStorage';

type FocalboardViewsRecord = Record<string, null | string>;

interface IContext {
  focalboardViewsRecord: FocalboardViewsRecord,
  setFocalboardViewsRecord: React.Dispatch<React.SetStateAction<FocalboardViewsRecord>>
}

export const FocalboardViewsContext = createContext<Readonly<IContext>>({
  focalboardViewsRecord: {},
  setFocalboardViewsRecord: () => null
});

export function FocalboardViewsProvider ({ children }: { children: ReactNode }) {
  const [space] = useCurrentSpace();

  // No need to store charmverse.v1.undefined.default-views in ls so the 3rd argument is a boolean, which would be false if the current space hasn't been set yet
  const [focalboardViewsRecord, setFocalboardViewsRecord] = useLocalStorage<FocalboardViewsRecord>(`${space?.id}.default-views`, {}, Boolean(space?.id));

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
