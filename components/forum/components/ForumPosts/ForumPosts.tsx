import Alert from '@mui/material/Alert';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import LoadingComponent from 'components/common/LoadingComponent';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

import CreateForumPost from '../CreateForumPost';
import ForumPost from '../ForumPost/ForumPost';
import ForumPostSkeleton from '../ForumPostSkeleton';

interface ForumPostsProps {
  search: string;
}

export default function ForumPosts ({ search }: ForumPostsProps) {
  const currentSpace = useCurrentSpace();
  const { query } = useRouter();
  const querySort = query.filter;
  const queryCategory = query.category;

  const sortValue = useMemo(() => {
    if (querySort) {
      if (Array.isArray(querySort)) {
        return querySort[0];
      }
      else {
        return querySort;
      }
    }
    return undefined;
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

  const {
    data: townPosts,
    error: townPostsError,
    isValidating: isValidatingTownPosts
  } = useSWR(
    currentSpace ? 'forum/posts' : null,
    () => charmClient.forum.listForumPosts(currentSpace!.id, sortValue || 'popular', categoryValue)
  );

  if (isValidatingTownPosts) {
    return <LoadingComponent isLoading size={50} />;
  }

  if (townPostsError) {
    return (
      <Alert severity='error'>
        There was an unexpected error
      </Alert>
    );
  }

  if (!townPosts) {
    return null;
  }

  if (townPosts.length === 0) {
    return (
      <Alert severity='info'>
        There are no posts for this space.
      </Alert>
    );
  }

  return (
    <>
      <CreateForumPost />
      {townPosts.map(post => <ForumPost key={post.id} {...post} />)}
      <ForumPostSkeleton />
    </>
  );
}
