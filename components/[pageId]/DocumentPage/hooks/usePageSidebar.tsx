import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { useCurrentPage } from 'hooks/useCurrentPage';

import { useLastSidebarView } from './useLastSidebarView';

export type PageSidebarView = 'comments' | 'suggestions' | 'proposal_evaluation';

export type IPageSidebarContext = {
  activeView: PageSidebarView | null;
  setActiveView: (view: PageSidebarView | null) => void;
  isInsideDialog?: boolean;
  closeSidebar: () => void;
};

export const PageSidebarContext = createContext<IPageSidebarContext>({
  activeView: null,
  setActiveView: () => undefined,
  closeSidebar: () => undefined
});

export function PageSidebarProvider({ children }: { children: ReactNode }) {
  const [activeView, setActiveView] = useState<IPageSidebarContext['activeView']>(null);
  const { currentPageId } = useCurrentPage();
  const [, persistActiveView] = useLastSidebarView();

  function closeSidebar() {
    setActiveView(null);
  }

  function _setActiveView(view: PageSidebarView | null) {
    if (currentPageId) {
      persistActiveView({
        [currentPageId]: view
      });
    }
    return setActiveView(view);
  }

  const value = useMemo<IPageSidebarContext>(
    () => ({
      activeView,
      setActiveView: _setActiveView,
      closeSidebar
    }),
    [activeView, currentPageId, setActiveView]
  );

  return <PageSidebarContext.Provider value={value}>{children}</PageSidebarContext.Provider>;
}

export function usePageSidebar() {
  return useContext(PageSidebarContext);
}
