import { ThreadWithCommentsAndAuthors } from 'lib/threads/interfaces';
import { ExtendedVote } from 'lib/votes/interfaces';
import { isSmallScreen } from 'lib/browser';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { useSWRConfig } from 'swr';
import { useVotes } from './useVotes';
import { usePages } from './usePages';
import { useThreads } from './useThreads';

export interface IPageActionDisplayContext {
  currentPageActionDisplay: null | 'polls' | 'comments',
  setCurrentPageActionDisplay: React.Dispatch<React.SetStateAction<IPageActionDisplayContext['currentPageActionDisplay']>>
}

export const PageActionDisplayContext = createContext<IPageActionDisplayContext>({
  currentPageActionDisplay: null,
  setCurrentPageActionDisplay: () => undefined
});

export function PageActionDisplayProvider ({ children }: { children: ReactNode }) {

  // only calculate once
  const smallScreen = useMemo(() => isSmallScreen(), []);
  const { currentPageId } = usePages();
  const { isValidating: isValidatingInlineComments } = useThreads();
  const { isValidating: isValidatingInlineVotes } = useVotes();
  const { cache } = useSWRConfig();
  const [currentPageActionDisplay, setCurrentPageActionDisplay] = useState<IPageActionDisplayContext['currentPageActionDisplay']>(null);

  // show page sidebar by default if there are comments or votes
  useEffect(() => {
    const highlightedCommentId = (new URLSearchParams(window.location.search)).get('commentId');
    if (currentPageId && !isValidatingInlineComments && !isValidatingInlineVotes && !smallScreen) {
      const cachedInlineVotesData: ExtendedVote[] = cache.get(`pages/${currentPageId}/votes`);
      const cachedInlineCommentData: ThreadWithCommentsAndAuthors[] | undefined = cache.get(`pages/${currentPageId}/threads`);
      // Vote takes precedence over comments, so if a page has in progress votes and unresolved comments, show the votes
      if (!highlightedCommentId && cachedInlineVotesData && cachedInlineVotesData.find(inlineVote => inlineVote.status === 'InProgress'
      // We don't want to open the sidebar for a proposal-type vote
      && inlineVote.context !== 'proposal')) {
        setCurrentPageActionDisplay('polls');
      }
      // For some reason we cant get the threads map using useThreads, its empty even after isValidating is true (data has loaded)
      else if (highlightedCommentId || (cachedInlineCommentData && cachedInlineCommentData.find(thread => thread && !thread.resolved))) {
        setCurrentPageActionDisplay('comments');
      }
      else {
        setCurrentPageActionDisplay(null);
      }
    }
  }, [isValidatingInlineComments, isValidatingInlineVotes, currentPageId]);

  const value = useMemo<IPageActionDisplayContext>(() => ({
    currentPageActionDisplay,
    setCurrentPageActionDisplay
  }), [currentPageActionDisplay]);

  return (
    <PageActionDisplayContext.Provider value={value}>
      {children}
    </PageActionDisplayContext.Provider>
  );
}

export function usePageActionDisplay () {
  return useContext(PageActionDisplayContext);
}
