import { ThreadWithCommentsAndAuthors } from 'lib/threads/interfaces';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { useSWRConfig } from 'swr';
import { usePages } from './usePages';
import { useThreads } from './useThreads';

export interface IPageActionDisplayContext {
  currentPageActionDisplay: null | 'votes' | 'comments',
  setCurrentPageActionDisplay: React.Dispatch<React.SetStateAction<IPageActionDisplayContext['currentPageActionDisplay']>>
}

export const PageActionDisplay = createContext<IPageActionDisplayContext>({
  currentPageActionDisplay: 'votes',
  setCurrentPageActionDisplay: () => undefined
});

export function CommentThreadsListDisplayProvider ({ children }: { children: ReactNode }) {
  const { currentPageId } = usePages();
  const { isValidating } = useThreads();
  const { cache } = useSWRConfig();

  const [currentPageActionDisplay, setCurrentPageActionDisplay] = useState<IPageActionDisplayContext['currentPageActionDisplay']>(null);
  useEffect(() => {
    if (currentPageId) {
      // For some reason we cant get the threads map using useThreads, its empty even after isValidating is true (data has loaded)
      const cachedData: ThreadWithCommentsAndAuthors[] | undefined = cache.get(`pages/${currentPageId}/threads`);
      if (cachedData && cachedData.filter(thread => thread && !thread.resolved).length > 0) {
        setCurrentPageActionDisplay('comments');
      }
    }
  }, [isValidating, currentPageId]);

  const value = useMemo<IPageActionDisplayContext>(() => ({
    currentPageActionDisplay,
    setCurrentPageActionDisplay
  }), [currentPageActionDisplay]);

  return (
    <PageActionDisplay.Provider value={value}>
      {children}
    </PageActionDisplay.Provider>
  );
}

export function usePageActionDisplay () {
  return useContext(PageActionDisplay);
}
