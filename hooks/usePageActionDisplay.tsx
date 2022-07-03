import { ThreadWithCommentsAndAuthors } from 'lib/threads/interfaces';
import { ExtendedVote } from 'lib/votes/interfaces';
import { useRouter } from 'next/router';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { useSWRConfig } from 'swr';
import { useInlineVotes } from './useInlineVotes';
import { usePages } from './usePages';
import { useThreads } from './useThreads';

export interface IPageActionDisplayContext {
  currentPageActionDisplay: null | 'votes' | 'comments',
  setCurrentPageActionDisplay: React.Dispatch<React.SetStateAction<IPageActionDisplayContext['currentPageActionDisplay']>>
}

export const PageActionDisplayContext = createContext<IPageActionDisplayContext>({
  currentPageActionDisplay: null,
  setCurrentPageActionDisplay: () => undefined
});

export function PageActionDisplayProvider ({ children }: { children: ReactNode }) {
  const { currentPageId } = usePages();
  const { isValidating: isValidatingInlineComments } = useThreads();
  const { isValidating: isValidatingInlineVotes } = useInlineVotes();
  const { cache } = useSWRConfig();
  const [currentPageActionDisplay, setCurrentPageActionDisplay] = useState<IPageActionDisplayContext['currentPageActionDisplay']>(null);
  useEffect(() => {
    const highlightedCommentId = (new URLSearchParams(window.location.search)).get('commentId');

    if (currentPageId && !isValidatingInlineComments && !isValidatingInlineVotes) {
      const cachedInlineVotesData: ExtendedVote[] = cache.get(`pages/${currentPageId}/inline-votes`);
      const cachedInlineCommentData: ThreadWithCommentsAndAuthors[] | undefined = cache.get(`pages/${currentPageId}/threads`);
      // Vote takes precedence over comments, so if a page has in progress votes and unresolved comments, show the votes
      if (!highlightedCommentId && cachedInlineVotesData && cachedInlineVotesData.find(inlineVote => inlineVote.status === 'InProgress')) {
        setCurrentPageActionDisplay('votes');
      }
      // For some reason we cant get the threads map using useThreads, its empty even after isValidating is true (data has loaded)
      else if (highlightedCommentId || (cachedInlineCommentData && cachedInlineCommentData.find(thread => thread && !thread.resolved))) {
        setCurrentPageActionDisplay('comments');
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
