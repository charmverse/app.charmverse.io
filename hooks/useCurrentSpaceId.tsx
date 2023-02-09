import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';
// keep track of the focused page (may be different from what's in the URL or header)

type ICurrentSpaceContext = {
  currentSpaceId: string;
  setcurrentSpaceId: Dispatch<SetStateAction<string>>;
};

export const CurrentSpaceContext = createContext<Readonly<ICurrentSpaceContext>>({
  currentSpaceId: '',
  setcurrentSpaceId: () => ''
});

export function CurrentSpaceProvider({ children }: { children: ReactNode }) {
  const [currentSpaceId, setcurrentSpaceId] = useState<string>('');

  const value: ICurrentSpaceContext = useMemo(
    () => ({
      currentSpaceId,
      setcurrentSpaceId
    }),
    [currentSpaceId]
  );

  return <CurrentSpaceContext.Provider value={value}>{children}</CurrentSpaceContext.Provider>;
}

export const useCurrentSpaceId = () => useContext(CurrentSpaceContext);
