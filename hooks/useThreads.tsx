import useSWR from 'swr';
import charmClient from 'charmClient';
import { useRouter } from 'next/router';
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useMemo, useState } from 'react';
import { ThreadWithComments } from 'pages/api/pages/[id]/threads';
import { usePages } from './usePages';

type IContext = {
  threads: Record<string, ThreadWithComments | undefined>,
  setThreads: Dispatch<SetStateAction<Record<string, ThreadWithComments | undefined>>>,
};

const refreshInterval = 1000 * 5 * 60; // 5 minutes

export const ThreadsContext = createContext<Readonly<IContext>>({
  threads: {},
  setThreads: () => undefined
});

export function ThreadsProvider ({ children }: { children: ReactNode }) {
  const { currentPageId } = usePages();
  const [threads, setThreads] = useState<Record<string, ThreadWithComments | undefined>>({});
  const router = useRouter();

  const { data } = useSWR(() => currentPageId ? `pages/${currentPageId}/threads` : null, () => charmClient.getPageThreads(currentPageId), { refreshInterval });
  useEffect(() => {
    setThreads(data?.reduce((acc, page) => ({ ...acc, [page.id]: page }), {}) || {});
  }, [data]);

  const value: IContext = useMemo(() => ({
    threads,
    setThreads
  }), [currentPageId, threads, router]);

  return (
    <ThreadsContext.Provider value={value}>
      {children}
    </ThreadsContext.Provider>
  );
}

export const useThreads = () => useContext(ThreadsContext);
