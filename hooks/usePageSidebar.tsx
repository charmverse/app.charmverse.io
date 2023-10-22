import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSWRConfig } from 'swr';

import { useCurrentPage } from 'hooks/useCurrentPage';
import { useLgScreen } from 'hooks/useMediaScreens';
import type { ThreadWithCommentsAndAuthors } from 'lib/threads/interfaces';

import { useThreads } from './useThreads';
import { useVotes } from './useVotes';

export type PageAction = 'comments' | 'suggestions';

export interface IPageSidebarContext {
  activeView: PageAction | null;
  setActiveView: React.Dispatch<React.SetStateAction<IPageSidebarContext['activeView']>>;
  isInsideDialog?: boolean;
}

export const PageSidebarContext = createContext<IPageSidebarContext>({
  activeView: null,
  setActiveView: () => undefined,
  isInsideDialog: false
});

export function PageSidebarProvider({ children, isInsideDialog }: { children: ReactNode; isInsideDialog?: boolean }) {
  const isLargeScreen = useLgScreen();
  const { currentPageId } = useCurrentPage();
  const { isValidating: isValidatingInlineComments } = useThreads();
  const { isValidating: isValidatingInlineVotes } = useVotes({ pageId: currentPageId });
  const { cache } = useSWRConfig();
  const [activeView, setActiveView] = useState<IPageSidebarContext['activeView']>(null);
  const commentPageActionToggledOnce = useRef<boolean>(false);

  // show page sidebar by default if there are comments or votes
  useEffect(() => {
    function setDefaultPageSidebar() {
      if (isInsideDialog) {
        // never show sidebar in dialog
        return;
      }
      const highlightedCommentId = new URLSearchParams(window.location.search).get('commentId');
      if (activeView && !highlightedCommentId) {
        // dont redirect if sidebar is already open
        return;
      }

      if (currentPageId && !isValidatingInlineComments && !isValidatingInlineVotes) {
        const cachedInlineCommentData: ThreadWithCommentsAndAuthors[] | undefined = cache.get(
          `pages/${currentPageId}/threads`
        )?.data as ThreadWithCommentsAndAuthors[] | undefined;
        // For some reason we cant get the threads map using useThreads, its empty even after isValidating is true (data has loaded)
        if (
          !commentPageActionToggledOnce.current &&
          (highlightedCommentId ||
            (isLargeScreen && cachedInlineCommentData?.some((thread) => thread && !thread.resolved)))
        ) {
          commentPageActionToggledOnce.current = true;
          return setActiveView('comments');
        } else {
          return setActiveView(null);
        }
      }
    }
    setDefaultPageSidebar();
  }, [isInsideDialog, isValidatingInlineComments, isValidatingInlineVotes, currentPageId]);

  const value = useMemo<IPageSidebarContext>(
    () => ({
      activeView,
      setActiveView,
      isInsideDialog
    }),
    [activeView, setActiveView, isInsideDialog]
  );

  return <PageSidebarContext.Provider value={value}>{children}</PageSidebarContext.Provider>;
}

export function usePageSidebar() {
  return useContext(PageSidebarContext);
}
