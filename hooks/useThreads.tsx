import useSWR from 'swr';
import charmClient from 'charmClient';
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useMemo, useState } from 'react';
import type { ThreadWithComments } from 'pages/api/pages/[id]/threads';
import { PageContent } from 'models';
import { usePages } from './usePages';

type IContext = {
  isValidating: boolean,
  threads: Record<string, ThreadWithComments | undefined>,
  setThreads: Dispatch<SetStateAction<Record<string, ThreadWithComments | undefined>>>,
  addComment: (threadId: string, commentContent: PageContent) => Promise<void>,
  editComment: (threadId: string, commentId: string, commentContent: PageContent) => Promise<void>,
  deleteComment: (threadId: string, commentId: string) => Promise<void>,
  resolveThread: (threadId: string) => Promise<void>,
  deleteThread: (threadId: string) => Promise<void>,
};

export const ThreadsContext = createContext<Readonly<IContext>>({
  isValidating: true,
  threads: {},
  setThreads: () => undefined,
  addComment: () => undefined as any,
  editComment: () => undefined as any,
  deleteComment: () => undefined as any,
  resolveThread: () => undefined as any,
  deleteThread: () => undefined as any
});

export function ThreadsProvider ({ children }: { children: ReactNode }) {
  const { currentPageId } = usePages();
  const [threads, setThreads] = useState<Record<string, ThreadWithComments | undefined>>({});

  const { data, isValidating } = useSWR(() => currentPageId ? `pages/${currentPageId}/threads` : null, () => charmClient.getPageThreads(currentPageId), { revalidateOnFocus: false });
  useEffect(() => {
    setThreads(data?.reduce((acc, page) => ({ ...acc, [page.id]: page }), {}) || {});
  }, [data]);

  async function addComment (threadId: string, commentContent: PageContent) {
    const thread = threads[threadId];
    if (thread) {
      try {
        const comment = await charmClient.addComment({
          content: commentContent,
          threadId: thread.id,
          pageId: currentPageId
        });

        setThreads((_threads) => ({ ..._threads,
          [thread.id]: {
            ...thread,
            comments: [...thread.comments, comment]
          } }));
      }
      catch (_) {
        //
      }
    }
  }

  async function editComment (threadId: string, editedCommentId: string, commentContent: PageContent) {
    const thread = threads[threadId];
    if (thread) {
      try {
        await charmClient.editComment(editedCommentId, commentContent);
        setThreads((_threads) => ({ ..._threads,
          [thread.id]: {
            ...thread,
            comments: thread.comments
              .map(comment => comment.id === editedCommentId ? ({ ...comment, content: commentContent, updatedAt: new Date() }) : comment)
          } }));
      }
      catch (_) {
        //
      }
    }
  }

  async function deleteComment (threadId: string, commentId: string) {
    const thread = threads[threadId];
    if (thread) {
      const comment = thread.comments.find(_comment => _comment.id === commentId);
      if (comment) {
        try {
          await charmClient.deleteComment(comment.id);
          const threadWithoutComment = {
            ...thread,
            comments: thread.comments.filter(_comment => _comment.id !== comment.id)
          };
          setThreads((_threads) => ({ ..._threads, [thread.id]: threadWithoutComment }));
        }
        catch (_) {
          //
        }
      }
    }
  }

  async function resolveThread (threadId: string) {
    const thread = threads[threadId];

    if (thread) {
      try {
        await charmClient.updateThread(thread.id, {
          resolved: !thread.resolved
        });
        setThreads((_threads) => ({ ..._threads,
          [thread.id]: {
            ...thread,
            resolved: !thread.resolved
          } }));
      }
      catch (_) {
        //
      }
    }
  }

  async function deleteThread (threadId: string) {
    const thread = threads[threadId];

    if (thread) {
      try {
        await charmClient.deleteThread(thread.id);
        delete threads[thread.id];
        setThreads({ ...threads });
      }
      catch (_) {
        //
      }
    }
  }

  const value: IContext = useMemo(() => ({
    threads,
    setThreads,
    addComment,
    editComment,
    deleteComment,
    resolveThread,
    deleteThread,
    isValidating
  }), [currentPageId, threads, isValidating]);

  return (
    <ThreadsContext.Provider value={value}>
      {children}
    </ThreadsContext.Provider>
  );
}

export const useThreads = () => useContext(ThreadsContext);
