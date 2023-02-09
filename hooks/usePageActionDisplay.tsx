import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useSWRConfig } from 'swr';

import { useCurrentPage } from 'hooks/useCurrentPage';
import { useLgScreen } from 'hooks/useMediaScreens';
import type { ThreadWithCommentsAndAuthors } from 'lib/threads/interfaces';

import { useThreads } from './useThreads';
import { useVotes } from './useVotes';

export type PageAction = 'comments' | 'suggestions';

export interface IPageActionDisplayContext {
  currentPageActionDisplay: PageAction | null;
  setCurrentPageActionDisplay: React.Dispatch<
    React.SetStateAction<IPageActionDisplayContext['currentPageActionDisplay']>
  >;
}

const PageActionDisplayContext = createContext<IPageActionDisplayContext>({
  currentPageActionDisplay: null,
  setCurrentPageActionDisplay: () => undefined
});

export function PageActionDisplayProvider({ children }: { children: ReactNode }) {
  const isLargeScreen = useLgScreen();
  const { currentPageId } = useCurrentPage();
  const { isValidating: isValidatingInlineComments } = useThreads();
  const { isValidating: isValidatingInlineVotes } = useVotes();
  const { cache } = useSWRConfig();
  const [currentPageActionDisplay, setCurrentPageActionDisplay] =
    useState<IPageActionDisplayContext['currentPageActionDisplay']>(null);

  function updatePageActionDisplay() {
    const highlightedCommentId = new URLSearchParams(window.location.search).get('commentId');
    if (currentPageActionDisplay && !highlightedCommentId) {
      // dont redirect if sidebar is already open
      return;
    }

    if (currentPageId && !isValidatingInlineComments && !isValidatingInlineVotes) {
      const cachedInlineCommentData: ThreadWithCommentsAndAuthors[] | undefined = cache.get(
        `pages/${currentPageId}/threads`
      )?.data as ThreadWithCommentsAndAuthors[] | undefined;
      // For some reason we cant get the threads map using useThreads, its empty even after isValidating is true (data has loaded)
      if (
        highlightedCommentId ||
        (isLargeScreen && cachedInlineCommentData?.find((thread) => thread && !thread.resolved))
      ) {
        return setCurrentPageActionDisplay('comments');
      } else {
        return setCurrentPageActionDisplay(null);
      }
    }
  }

  // show page sidebar by default if there are comments or votes
  useEffect(() => {
    updatePageActionDisplay();
  }, [isValidatingInlineComments, isValidatingInlineVotes, currentPageId]);

  const value = useMemo<IPageActionDisplayContext>(
    () => ({
      currentPageActionDisplay,
      setCurrentPageActionDisplay
    }),
    [currentPageActionDisplay]
  );

  return <PageActionDisplayContext.Provider value={value}>{children}</PageActionDisplayContext.Provider>;
}

export function usePageActionDisplay() {
  return useContext(PageActionDisplayContext);
}
