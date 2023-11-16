import type { ReactNode } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';

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
  isInsideDialog: false,
  closeSidebar: () => undefined
});

export function PageSidebarProvider({ children, isInsideDialog }: { children: ReactNode; isInsideDialog?: boolean }) {
  const [activeView, setActiveView] = useState<IPageSidebarContext['activeView']>(null);

  function closeSidebar() {
    setActiveView(null);
  }

  const value = useMemo<IPageSidebarContext>(
    () => ({
      activeView,
      setActiveView,
      isInsideDialog,
      closeSidebar
    }),
    [activeView, setActiveView, isInsideDialog]
  );

  return <PageSidebarContext.Provider value={value}>{children}</PageSidebarContext.Provider>;
}

export function usePageSidebar() {
  return useContext(PageSidebarContext);
}
