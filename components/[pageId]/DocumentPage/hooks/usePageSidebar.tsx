import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type PageSidebarView = 'comments' | 'suggestions' | 'proposal_evaluation' | 'reward_evaluation';

export type IPageSidebarContext = {
  activeView: PageSidebarView | null;
  setActiveView: (view: PageSidebarView | null | ((view: PageSidebarView | null) => PageSidebarView | null)) => void;
  isInsideDialog?: boolean;
  closeSidebar: () => void;
};

export const PageSidebarContext = createContext<IPageSidebarContext | null>(null);

export function PageSidebarProvider({ children }: { children: ReactNode }) {
  const [activeView, setActiveView] = useState<IPageSidebarContext['activeView']>(null);

  const _setActiveView = useCallback(
    (view: PageSidebarView | null | ((view: PageSidebarView | null) => PageSidebarView | null)) => {
      // handle case when a callback is used as the new value
      if (typeof view === 'function') {
        return setActiveView((prevView) => {
          return view(prevView);
        });
      } else {
        return setActiveView(view);
      }
    },
    [setActiveView]
  );

  const closeSidebar = useCallback(() => {
    _setActiveView(null);
  }, [_setActiveView]);

  const value = useMemo<IPageSidebarContext>(
    () => ({
      activeView,
      setActiveView: _setActiveView,
      closeSidebar
    }),
    [activeView, _setActiveView, closeSidebar]
  );

  return <PageSidebarContext.Provider value={value}>{children}</PageSidebarContext.Provider>;
}

export function usePageSidebar() {
  const context = useContext(PageSidebarContext);
  if (!context) {
    throw new Error('usePageSidebar must be used within a PageSidebarProvider');
  }
  return context;
}
