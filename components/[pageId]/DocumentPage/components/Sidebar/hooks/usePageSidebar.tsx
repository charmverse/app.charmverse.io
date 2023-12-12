import type { ReactNode, Dispatch, SetStateAction } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';

import { useCurrentPage } from 'hooks/useCurrentPage';

import { useLastSidebarView } from './useLastSidebarView';

export type PageSidebarView = 'comments' | 'suggestions' | 'proposal_evaluation' | 'proposal_evaluation_settings';

export type IPageSidebarContext = {
  activeView: PageSidebarView | null;
  setActiveView: (view: PageSidebarView | null | ((view: PageSidebarView | null) => PageSidebarView | null)) => void;
  isInsideDialog?: boolean;
  closeSidebar: () => void;
  persistedActiveView: Record<string, PageSidebarView | null> | null;
  persistActiveView: Dispatch<SetStateAction<Record<string, PageSidebarView | null> | null>>;
};

export const PageSidebarContext = createContext<IPageSidebarContext>({
  activeView: null,
  setActiveView: () => undefined,
  closeSidebar: () => undefined,
  persistedActiveView: null,
  persistActiveView: () => undefined
});

export function PageSidebarProvider({ children }: { children: ReactNode }) {
  const [activeView, setActiveView] = useState<IPageSidebarContext['activeView']>(null);
  const { currentPageId } = useCurrentPage();
  const [persistedActiveView, persistActiveView] = useLastSidebarView();

  function _setActiveView(view: PageSidebarView | null | ((view: PageSidebarView | null) => PageSidebarView | null)) {
    if (currentPageId) {
      // handle case when a callback is used as the new value
      if (typeof view === 'function') {
        return setActiveView((prevView) => {
          const newValue = view(prevView);
          persistActiveView({
            [currentPageId]: newValue
          });
          return newValue;
        });
      } else {
        persistActiveView({
          [currentPageId]: view
        });
        return setActiveView(view);
      }
    }
  }

  function closeSidebar() {
    _setActiveView(null);
  }

  const value = useMemo<IPageSidebarContext>(
    () => ({
      activeView,
      setActiveView: _setActiveView,
      closeSidebar,
      persistedActiveView,
      persistActiveView
    }),
    [activeView, currentPageId, setActiveView]
  );

  return <PageSidebarContext.Provider value={value}>{children}</PageSidebarContext.Provider>;
}

export function usePageSidebar() {
  return useContext(PageSidebarContext);
}
