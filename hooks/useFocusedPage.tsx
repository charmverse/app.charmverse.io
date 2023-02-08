import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useCurrentSpace } from './useCurrentSpace';

// keep track of the focused page (may be different from what's in the URL or header)

type IFocusedPageContext = {
  currentPageId: string;
  setCurrentPageId: Dispatch<SetStateAction<string>>;
};

export const FocusedPageContext = createContext<Readonly<IFocusedPageContext>>({
  currentPageId: '',
  setCurrentPageId: () => ''
});

export function CurrentPageProvider({ children }: { children: ReactNode }) {
  const currentSpace = useCurrentSpace();
  const [currentPageId, setCurrentPageId] = useState<string>('');
  const currentSpaceId = useRef<undefined | string>();

  useEffect(() => {
    currentSpaceId.current = currentSpace?.id;
  }, [currentSpace]);

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
