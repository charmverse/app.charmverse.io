import Alert from '@mui/material/Alert';
import { Box } from '@mui/system';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef } from 'react';
import useSWRInfinite from 'swr/infinite';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import useOnScreen from 'hooks/useOnScreen';

import CreateForumPost from '../CreateForumPost';
import ForumPost from '../ForumPost/ForumPost';
import ForumPostSkeleton from '../ForumPostSkeleton';

interface ForumPostsProps {
  search: string;
}

const count = 15;

export default function ForumPosts ({ search }: ForumPostsProps) {
  const ref = useRef();
  const currentSpace = useCurrentSpace();
  const { query } = useRouter();
  const querySort = query.sort;
  const queryCategory = query.category;

  const isVisible = useOnScreen(ref);

  const sortValue = useMemo(() => {
    const defaultValue = 'Most popular';
    if (querySort) {
      if (Array.isArray(querySort)) {
        return querySort[0] || defaultValue;
      }
      else {
        return querySort;
      }
    }
    return 'Most popular';
  }, [querySort]);

  const categoryValue = useMemo(() => {
    if (queryCategory) {
      if (Array.isArray(queryCategory)) {
        return queryCategory[0];
      }
      else {
        return queryCategory;
      }
    }
    return undefined;
  }, [queryCategory]);

  const { data, error, size, setSize, isValidating } = useSWRInfinite(
    (index) => currentSpace ? { url: 'forum/posts', arguments: { page: index + 1 } } : null,
    (args) => charmClient.forum.listForumPosts(currentSpace!.id, sortValue || 'Most Popular', categoryValue, count, args.arguments.page)
  );

  const posts = data ? [...data].flat() : [];
  const isLoadingInitialData = !data && !error;
  const isLoadingMore = isLoadingInitialData || (size > 0 && data && typeof data[size - 1] === 'undefined');
  const isEmpty = data?.[0]?.length === 0;
  const isReachingEnd = isEmpty || (data && data[data.length - 1]?.length < count);
  const isRefreshing = isValidating && data && data.length === size;

  useEffect(() => {
    if (isVisible && !isReachingEnd && data && !isRefreshing && !isLoadingMore) {
      setSize(size + 1);
    }
  }, [isVisible, isRefreshing, isReachingEnd, data, isLoadingMore]);

  if (error) {
    return (
      <Alert severity='error'>
        There was an unexpected error
      </Alert>
    );
  }

  return (
    <>
      <CreateForumPost />
      {posts.map(post => <ForumPost key={post.id} {...post} />)}
      {isLoadingMore && (
        <ForumPostSkeleton />
      )}
      <Box ref={ref}>
        {isReachingEnd && (
          <Alert severity='info'>End of the forum</Alert>
        )}
      </Box>
    </>
  );
}
