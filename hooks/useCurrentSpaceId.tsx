import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';
// keep track of the focused page (may be different from what's in the URL or header)

type ICurrentSpaceContext = {
  currentSpaceId: string;
  setCurrentSpaceId: Dispatch<SetStateAction<string>>;
};

export const CurrentSpaceContext = createContext<Readonly<ICurrentSpaceContext>>({
  currentSpaceId: '',
  setCurrentSpaceId: () => ''
});

export function CurrentSpaceProvider({ children }: { children: ReactNode }) {
  const [currentSpaceId, setCurrentSpaceId] = useState<string>('');

  const value: ICurrentSpaceContext = useMemo(
    () => ({
      currentSpaceId,
      setCurrentSpaceId
    }),
    [currentSpaceId]
  );

  return <CurrentSpaceContext.Provider value={value}>{children}</CurrentSpaceContext.Provider>;
}

export const useCurrentSpaceId = () => useContext(CurrentSpaceContext);
