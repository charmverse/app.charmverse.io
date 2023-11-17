import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type PageSidebarView = 'comments' | 'suggestions' | 'proposal_evaluation';

export interface IPageSidebarContext {
  activeView: PageSidebarView | null;
  setActiveView: React.Dispatch<React.SetStateAction<IPageSidebarContext['activeView']>>;
  isInsideDialog?: boolean;
  closeSidebar: () => void;
}

export const PageSidebarContext = createContext<IPageSidebarContext>({
  activeView: null,
  setActiveView: () => undefined,
  closeSidebar: () => undefined
});

export function PageSidebarProvider({ children }: { children: ReactNode }) {
  const [activeView, setActiveView] = useState<IPageSidebarContext['activeView']>(null);

  function closeSidebar() {
    setActiveView(null);
  }

  const value = useMemo<IPageSidebarContext>(
    () => ({
      activeView,
      setActiveView,
      closeSidebar
    }),
    [activeView, setActiveView]
  );

  return <PageSidebarContext.Provider value={value}>{children}</PageSidebarContext.Provider>;
}

export function usePageSidebar() {
  return useContext(PageSidebarContext);
}
