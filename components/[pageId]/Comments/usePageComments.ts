import { useMemo, useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import type { CommentSortType } from 'components/common/comments/CommentSort';
import { processComments, sortComments } from 'components/common/comments/utils';

export function usePageComments(pageId: string) {
  const [commentSort, setCommentSort] = useState<CommentSortType>('latest');

  const { data, mutate, isValidating } = useSWR(`${pageId}/comments`, () => charmClient.pages.listComments(pageId));
  const isLoadingComments = !data && isValidating;

  const comments = useMemo(() => {
    if (data) {
      return sortComments({
        comments: processComments(data),
        sort: commentSort
      });
    }

    return [];
  }, [data, commentSort]);

  return {
    commentSort,
    setCommentSort,
    isLoadingComments,
    comments
  };
}
