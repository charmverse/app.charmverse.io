import { ThreadWithComments } from 'pages/api/pages/[id]/threads';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { useSWRConfig } from 'swr';
import { usePages } from './usePages';
import { useThreads } from './useThreads';

interface IContext {
  showingCommentThreadsList: boolean,
  setShowingCommentThreadsList: React.Dispatch<React.SetStateAction<boolean>>
}

export const CommentThreadsListDisplayContext = createContext<IContext>({
  setShowingCommentThreadsList: () => undefined,
  showingCommentThreadsList: false
});

export function CommentThreadsListDisplayProvider ({ children }: { children: ReactNode }) {
  const { currentPageId } = usePages();
  const { isValidating } = useThreads();
  const { cache } = useSWRConfig();

  const [showingCommentThreadsList, setShowingCommentThreadsList] = useState(false);
  useEffect(() => {
    if (currentPageId) {
      // For some reason we cant get the threads map using useThreads, its empty even after isValidating is true (data has loaded)
      const cachedData: ThreadWithComments[] | undefined = cache.get(`pages/${currentPageId}/threads`);
      if (cachedData) {
        setShowingCommentThreadsList(cachedData.filter(thread => thread && !thread.resolved).length > 0);
      }
      else {
        setShowingCommentThreadsList(false);
      }
    }
  }, [isValidating, currentPageId]);

  const value = useMemo<IContext>(() => ({
    showingCommentThreadsList,
    setShowingCommentThreadsList
  }), [showingCommentThreadsList]);

  return (
    <CommentThreadsListDisplayContext.Provider value={value}>
      {children}
    </CommentThreadsListDisplayContext.Provider>
  );
}

export function useCommentThreadsListDisplay () {
  return useContext(CommentThreadsListDisplayContext);
}
