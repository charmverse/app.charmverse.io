import Alert from '@mui/material/Alert';
import { Box } from '@mui/system';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMembers } from 'hooks/useMembers';
import useOnScreen from 'hooks/useOnScreen';
import type { PaginatedPostList } from 'lib/forums/posts/listForumPosts';
import type { Member } from 'lib/members/interfaces';

import CreateForumPost from '../CreateForumPost';
import ForumPost from '../ForumPost/ForumPost';
import ForumPostSkeleton from '../ForumPostSkeleton';

interface ForumPostsProps {
  search: string;
}

const resultsPerQuery = 1;

// Add a manual delay so the user sees the post loading skeleton
const postRefreshTimeout = 1000;

export default function ForumPosts({ search }: ForumPostsProps) {
  const ref = useRef();
  const currentSpace = useCurrentSpace();
  const bottomPostReached = useOnScreen(ref);
  const { query } = useRouter();

  const queryCategory = query.category;

  // Re-enable sorting later on

  // const querySort = query.sort;
  // const sortValue = useMemo(() => {
  //   const defaultValue = 'Most popular';
  //   if (querySort) {
  //     if (Array.isArray(querySort)) {
  //       return querySort[0] || defaultValue;
  //     } else {
  //       return querySort;
  //     }
  //   }
  //   return 'Most popular';
  // }, [querySort]);

  const { members } = useMembers();

  const [posts, setPosts] = useState<PaginatedPostList<{ user?: Member }> | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const [isLoadingMore, setIsLoadingMore] = useState(false);

  function loadMorePosts() {
    setIsLoadingMore(true);
    charmClient.forum
      .listForumPosts({
        spaceId: currentSpace!.id,
        categoryIds: queryCategory,
        count: resultsPerQuery,
        page: posts?.cursor
      })
      .then((foundPosts) => {
        setError(null);

        // UX improvement: add a delay so the user sees the post loading skeleton
        setTimeout(() => {
          setPosts((_prevList) => {
            const filteredPosts = foundPosts.data
              .filter((post) => !posts?.data.find((i) => i.id === post.id))
              .map((post) => {
                const user = members.find((member) => member.id === post.createdBy);
                return { ...post, user };
              });

            if (!_prevList) {
              return foundPosts;
            }

            _prevList.cursor = foundPosts.cursor;
            _prevList.data = [..._prevList.data, ...filteredPosts];
            _prevList.hasNext = foundPosts.hasNext;

            return {
              ..._prevList
            };
          });
          setIsLoadingMore(false);
        }, postRefreshTimeout);
      })
      .catch((err) => {
        setError(err);
        setIsLoadingMore(false);
      });
  }

  useEffect(() => {
    if (
      currentSpace &&
      members &&
      members?.length > 0 &&
      !isLoadingMore &&
      (!posts || (posts.hasNext && bottomPostReached))
    ) {
      loadMorePosts();
    }
  }, [bottomPostReached, members, currentSpace, posts, isLoadingMore]);

  return (
    <>
      <CreateForumPost />
      {error && <Alert severity='error'>There was an unexpected error while loading the posts</Alert>}

      {posts?.data.map((post) => (
        <ForumPost key={post.id} {...post} />
      ))}
      {isLoadingMore && <ForumPostSkeleton />}
      <Box ref={ref}>{posts?.hasNext === false && <Alert severity='info'>End of the forum</Alert>}</Box>
    </>
  );
}
