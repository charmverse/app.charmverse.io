import type { ReactNode, Dispatch, SetStateAction } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';
import { NonNullChain } from 'typescript';

import { useCurrentPage } from 'hooks/useCurrentPage';

import { useLastSidebarView } from './useLastSidebarView';

export type PageSidebarView = 'comments' | 'suggestions' | 'proposal_evaluation' | 'proposal_evaluation_settings';

export type IPageSidebarContext = {
  activeView: PageSidebarView | null;
  activeEvaluationId: string | null;
  setActiveView: (view: PageSidebarView | null | ((view: PageSidebarView | null) => PageSidebarView | null)) => void;
  isInsideDialog?: boolean;
  closeSidebar: () => void;
  openEvaluationSidebar: (evaluationId: string) => void;
  persistedActiveView: Record<string, PageSidebarView | null> | null;
  persistActiveView: Dispatch<SetStateAction<Record<string, PageSidebarView | null> | null>>;
};

export const PageSidebarContext = createContext<IPageSidebarContext>({
  activeView: null,
  activeEvaluationId: null,
  setActiveView: () => undefined,
  closeSidebar: () => undefined,
  openEvaluationSidebar: () => undefined,
  persistedActiveView: null,
  persistActiveView: () => undefined
});

export function PageSidebarProvider({ children }: { children: ReactNode }) {
  const [proposalEvaluationId, setProposalEvaluationId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<IPageSidebarContext['activeView']>(null);
  const { currentPageId } = useCurrentPage();
  const [persistedActiveView, persistActiveView] = useLastSidebarView();

  function _setActiveView(
    view: PageSidebarView | null | ((view: PageSidebarView | null) => PageSidebarView | null),
    evaluationId: string | null = null
  ) {
    if (currentPageId) {
      setProposalEvaluationId(evaluationId); // clear this value in case it was set before
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

  function openEvaluationSidebar(evaluationId: string) {
    _setActiveView('proposal_evaluation', evaluationId);
  }

  function closeSidebar() {
    _setActiveView(null);
  }

  const value = useMemo<IPageSidebarContext>(
    () => ({
      activeView,
      activeEvaluationId: proposalEvaluationId,
      setActiveView: _setActiveView,
      closeSidebar,
      openEvaluationSidebar,
      persistedActiveView,
      persistActiveView
    }),
    [activeView, currentPageId, proposalEvaluationId, setActiveView]
  );

  return <PageSidebarContext.Provider value={value}>{children}</PageSidebarContext.Provider>;
}

export function usePageSidebar() {
  return useContext(PageSidebarContext);
}
