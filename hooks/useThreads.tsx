import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { KeyedMutator } from 'swr';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { useCurrentPage } from 'hooks/useCurrentPage';
import { useMembers } from 'hooks/useMembers';
import type { PageContent } from 'lib/prosemirror/interfaces';
import type { ThreadWithCommentsAndAuthors, ThreadWithComments } from 'lib/threads/interfaces';
import type { WebSocketPayload } from 'lib/websockets/interfaces';

import { useCurrentSpace } from './useCurrentSpace';
import { useWebSocketClient } from './useWebSocketClient';

type IContext = {
  isValidating: boolean;
  threads: Record<string, ThreadWithCommentsAndAuthors | undefined>;
  setThreads: Dispatch<SetStateAction<Record<string, ThreadWithCommentsAndAuthors | undefined>>>;
  addComment: (threadId: string, commentContent: PageContent) => Promise<void>;
  editComment: (threadId: string, commentId: string, commentContent: PageContent) => Promise<void>;
  deleteComment: (threadId: string, commentId: string) => Promise<void>;
  resolveThread: (threadId: string) => Promise<void>;
  deleteThread: (threadId: string) => Promise<void>;
  refetchThreads: KeyedMutator<ThreadWithComments[]>;
};

export function getThreadsKey(pageId: string) {
  return `pages/${pageId}/threads`;
}

export const ThreadsContext = createContext<Readonly<IContext>>({
  isValidating: true,
  threads: {},
  setThreads: () => undefined,
  addComment: () => undefined as any,
  editComment: () => undefined as any,
  deleteComment: () => undefined as any,
  resolveThread: () => undefined as any,
  deleteThread: () => undefined as any,
  refetchThreads: undefined as any
});

type CommentThreadsMap = Record<string, ThreadWithCommentsAndAuthors | undefined>;

export function ThreadsProvider({ children }: { children: ReactNode }) {
  const { currentPageId } = useCurrentPage();
  const [threads, setThreads] = useState<CommentThreadsMap>({});
  const { members } = useMembers();
  const { subscribe } = useWebSocketClient();
  const { spaceRole } = useCurrentSpace();

  const { data, isValidating, mutate } = useSWR(
    () => (currentPageId ? getThreadsKey(currentPageId) : null),
    () => charmClient.comments.getThreads(currentPageId),
    { revalidateOnFocus: false }
  );

  function populateThreads(_threads: ThreadWithComments[]): CommentThreadsMap {
    const threadsAndAuthors = _threads.reduce<CommentThreadsMap>((acc, thread) => {
      const newThread: ThreadWithCommentsAndAuthors = {
        ...thread,
        comments: thread.comments.map((comment) => ({
          ...comment,
          user: members.find((m) => m.id === comment.userId) || ({} as any)
        }))
      };
      acc[thread.id] = newThread;
      return acc;
    }, {});
    return threadsAndAuthors;
  }

  const threadsUpdatedHandler = useCallback(
    (payload: WebSocketPayload<'threads_updated'>) => {
      if (payload.pageId === currentPageId) {
        mutate();
      }
    },
    [currentPageId]
  );

  useEffect(() => {
    if (spaceRole && !spaceRole.isGuest) {
      const unsubscribeFromThreadsUpdatedEvent = subscribe('threads_updated', threadsUpdatedHandler);

      return () => {
        unsubscribeFromThreadsUpdatedEvent();
      };
    }
  }, [spaceRole, currentPageId]);

  useEffect(() => {
    if (data) {
      setThreads(populateThreads(data));
    }
  }, [data]);

  async function addComment(threadId: string, commentContent: PageContent) {
    const thread = threads[threadId];
    if (thread) {
      const comment = await charmClient.comments.addComment({
        content: commentContent,
        threadId: thread.id
      });

      setThreads((_threads) => {
        thread.comments.push({
          ...comment,
          user: members.find((m) => m.id === comment.userId) || ({} as any)
        });
        return {
          ..._threads,
          [thread.id]: thread
        };
      });
    }
  }

  async function editComment(threadId: string, editedCommentId: string, commentContent: PageContent) {
    const thread = threads[threadId];
    if (thread) {
      await charmClient.comments.editComment(editedCommentId, commentContent);
      setThreads((_threads) => ({
        ..._threads,
        [thread.id]: {
          ...thread,
          comments: thread.comments.map((comment) =>
            comment.id === editedCommentId ? { ...comment, content: commentContent, updatedAt: new Date() } : comment
          )
        }
      }));
    }
  }

  async function deleteComment(threadId: string, commentId: string) {
    const thread = threads[threadId];
    if (thread) {
      const comment = thread.comments.find((_comment) => _comment.id === commentId);
      if (comment) {
        await charmClient.comments.deleteComment(comment.id);
        const threadWithoutComment = {
          ...thread,
          comments: thread.comments.filter((_comment) => _comment.id !== comment.id)
        };
        setThreads((_threads) => ({ ..._threads, [thread.id]: threadWithoutComment }));
      }
    }
  }

  async function resolveThread(threadId: string) {
    const thread = threads[threadId];

    if (thread) {
      await charmClient.comments.resolveThread(thread.id, {
        resolved: !thread.resolved
      });
      setThreads((_threads) => ({
        ..._threads,
        [thread.id]: {
          ...thread,
          resolved: !thread.resolved
        }
      }));
    }
  }

  async function deleteThread(threadId: string) {
    const thread = threads[threadId];

    if (thread) {
      await charmClient.comments.deleteThread(thread.id);
      delete threads[thread.id];
      setThreads({ ...threads });
    }
  }

  const value: IContext = useMemo(
    () => ({
      threads,
      setThreads,
      addComment,
      editComment,
      deleteComment,
      resolveThread,
      deleteThread,
      isValidating,
      refetchThreads: mutate
    }),
    [currentPageId, threads, isValidating]
  );

  return <ThreadsContext.Provider value={value}>{children}</ThreadsContext.Provider>;
}

export const useThreads = () => useContext(ThreadsContext);
