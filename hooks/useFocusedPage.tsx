import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';
// keep track of the focused page (may be different from what's in the URL or header)

type IFocusedPageContext = {
  currentPageId: string;
  setCurrentPageId: Dispatch<SetStateAction<string>>;
};

export const FocusedPageContext = createContext<Readonly<IFocusedPageContext>>({
  currentPageId: '',
  setCurrentPageId: () => ''
});

export function FocusedPageProvider({ children }: { children: ReactNode }) {
  const [currentPageId, setCurrentPageId] = useState<string>('');

  const value: IFocusedPageContext = useMemo(
    () => ({
      currentPageId,
      setCurrentPageId
    }),
    [currentPageId]
  );

  return <FocusedPageContext.Provider value={value}>{children}</FocusedPageContext.Provider>;
}

export const useFocusedPage = () => useContext(FocusedPageContext);
