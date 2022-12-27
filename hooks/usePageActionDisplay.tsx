import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useSWRConfig } from 'swr';

import type { ThreadWithCommentsAndAuthors } from 'lib/threads/interfaces';
import { isSmallScreen } from 'lib/utilities/browser';
import type { ExtendedVote } from 'lib/votes/interfaces';

import { usePages } from './usePages';
import { useThreads } from './useThreads';
import { useVotes } from './useVotes';

export type PageAction = 'polls' | 'comments' | 'suggestions';

export interface IPageActionDisplayContext {
  currentPageActionDisplay: PageAction | null;
  setCurrentPageActionDisplay: React.Dispatch<
    React.SetStateAction<IPageActionDisplayContext['currentPageActionDisplay']>
  >;
  updatePageActionDisplay: (defaultAction: PageAction | null) => void;
}

export const PageActionDisplayContext = createContext<IPageActionDisplayContext>({
  currentPageActionDisplay: null,
  setCurrentPageActionDisplay: () => undefined,
  updatePageActionDisplay: () => null
});

export function PageActionDisplayProvider({ children }: { children: ReactNode }) {
  // only calculate once
  const smallScreen = useMemo(() => isSmallScreen(), []);
  const { currentPageId } = usePages();
  const { isValidating: isValidatingInlineComments } = useThreads();
  const { isValidating: isValidatingInlineVotes } = useVotes();
  const { cache } = useSWRConfig();
  const [currentPageActionDisplay, setCurrentPageActionDisplay] =
    useState<IPageActionDisplayContext['currentPageActionDisplay']>(null);

  function updatePageActionDisplay(defaultAction: PageAction | null = null) {
    const highlightedCommentId = new URLSearchParams(window.location.search).get('commentId');
    if (currentPageActionDisplay) {
      // dont redirect if sidebar is already open
      return setCurrentPageActionDisplay(null);
    }
    if (currentPageId && !isValidatingInlineComments && !isValidatingInlineVotes && !smallScreen) {
      const cachedInlineVotesData: ExtendedVote[] = cache.get(`pages/${currentPageId}/votes`)?.data;
      const cachedInlineCommentData: ThreadWithCommentsAndAuthors[] | undefined = cache.get(
        `pages/${currentPageId}/threads`
      )?.data;

      // Vote takes precedence over comments, so if a page has in progress votes and unresolved comments, show the votes
      if (
        !highlightedCommentId &&
        cachedInlineVotesData &&
        cachedInlineVotesData.find(
          (inlineVote) =>
            inlineVote.status === 'InProgress' &&
            // We don't want to open the sidebar for a proposal-type vote
            inlineVote.context !== 'proposal'
        )
      ) {
        return setCurrentPageActionDisplay('polls');
      }
      // For some reason we cant get the threads map using useThreads, its empty even after isValidating is true (data has loaded)
      else if (
        highlightedCommentId ||
        (cachedInlineCommentData && cachedInlineCommentData.find((thread) => thread && !thread.resolved))
      ) {
        return setCurrentPageActionDisplay('comments');
      } else {
        return setCurrentPageActionDisplay(defaultAction);
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
      updatePageActionDisplay,
      setCurrentPageActionDisplay
    }),
    [currentPageActionDisplay]
  );

  return <PageActionDisplayContext.Provider value={value}>{children}</PageActionDisplayContext.Provider>;
}

export function usePageActionDisplay() {
  return useContext(PageActionDisplayContext);
}
