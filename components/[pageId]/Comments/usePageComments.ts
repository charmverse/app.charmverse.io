import { useCallback, useMemo, useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import type { CommentSortType } from 'components/common/comments/CommentSort';
import { getUpdatedCommentVote, processComments, sortComments } from 'components/common/comments/utils';
import type { CommentContent } from 'lib/comments';

export function usePageComments(pageId: string) {
  const [commentSort, setCommentSort] = useState<CommentSortType>('latest');

  const { data, mutate, isValidating } = useSWR(`${pageId}/comments`, () => charmClient.pages.listComments(pageId));
  const isLoadingComments = !data && isValidating;

  const comments = useMemo(() => {
    if (data) {
      return sortComments({
        comments: processComments({ comments: data, sort: commentSort }),
        sort: commentSort
      });
    }

    return [];
  }, [data, commentSort]);

  const addComment = useCallback(
    async (comment: CommentContent) => {
      const newComment = await charmClient.pages.createComment({ pageId, comment });
      mutate((existingComments) => (existingComments ? [...existingComments, newComment] : [newComment]));
    },
    [mutate, pageId]
  );

  const updateComment = useCallback(
    async (comment: CommentContent & { id: string }) => {
      const updatedComment = await charmClient.pages.updateComment({ pageId, ...comment });
      mutate((existingComments) => {
        if (!existingComments) {
          return undefined;
        }

        return existingComments.map((c) => (c.id === updatedComment.id ? { ...c, ...updatedComment } : c));
      });
    },
    [mutate, pageId]
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      await charmClient.pages.deleteComment({ pageId, commentId });
      mutate((existingComments) => (existingComments ? existingComments.filter((c) => c.id !== commentId) : undefined));
    },
    [mutate, pageId]
  );

  const voteComment = useCallback(
    async ({ commentId, upvoted }: { commentId: string; upvoted: boolean | null }) => {
      await charmClient.pages.voteComment({ pageId, commentId, upvoted });

      mutate((existingComments) => {
        if (!existingComments) {
          return undefined;
        }

        return existingComments.map((c) => (c.id === commentId ? { ...c, ...getUpdatedCommentVote(c, upvoted) } : c));
      });
    },
    [mutate, pageId]
  );

  return {
    commentSort,
    setCommentSort,
    isLoadingComments,
    comments,
    addComment,
    deleteComment,
    updateComment,
    voteComment
  };
}
