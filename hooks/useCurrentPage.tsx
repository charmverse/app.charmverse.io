import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';
// keep track of the focused page (may be different from what's in the URL or header)

type ICurrentPageContext = {
  currentPageId: string;
  setCurrentPageId: Dispatch<SetStateAction<string>>;
};

export const CurrentPageContext = createContext<Readonly<ICurrentPageContext>>({
  currentPageId: '',
  setCurrentPageId: () => ''
});

export function CurrentPageProvider({ children }: { children: ReactNode }) {
  const [currentPageId, setCurrentPageId] = useState<string>('');

  const value: ICurrentPageContext = useMemo(
    () => ({
      currentPageId,
      setCurrentPageId
    }),
    [currentPageId]
  );

  return <CurrentPageContext.Provider value={value}>{children}</CurrentPageContext.Provider>;
}

export const useCurrentPage = () => useContext(CurrentPageContext);
