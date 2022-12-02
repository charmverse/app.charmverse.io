import Alert from '@mui/material/Alert';
import { Box } from '@mui/system';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMembers } from 'hooks/useMembers';
import useOnScreen from 'hooks/useOnScreen';
import type { CategoryIdQuery, PaginatedPostList } from 'lib/forums/posts/listForumPosts';
import type { Member } from 'lib/members/interfaces';

import CreateForumPost from '../CreateForumPost';
import ForumPost from '../ForumPost/ForumPost';
import ForumPostSkeleton from '../ForumPostSkeleton';

interface ForumPostsProps {
  search: string;
  categoryId?: CategoryIdQuery;
}

const resultsPerQuery = 10;

// Add a manual delay so the user sees the post loading skeleton
const generatePostRefreshTimeout = () => {
  const delay = Math.min(Math.random() * 2 * 1500);

  if (delay < 500) {
    return 500;
  } else if (delay > 1000) {
    return 1000;
  } else {
    return delay;
  }
};

export default function ForumPosts({ search, categoryId }: ForumPostsProps) {
  const ref = useRef();
  const currentSpace = useCurrentSpace();
  const bottomPostReached = useOnScreen(ref);

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
        categoryIds: categoryId,
        count: resultsPerQuery,
        page: posts?.cursor
      })
      .then((foundPosts) => {
        setError(null);

        // UX improvement: add a delay so the user sees the post loading skeleton
        setTimeout(() => {
          setPosts((_prevList) => {
            const filteredPosts = foundPosts.data.filter((post) => !posts?.data.find((i) => i.id === post.id));

            if (!_prevList) {
              return foundPosts;
            }

            _prevList.cursor = foundPosts.cursor;

            const previousDataToKeep = !_prevList
              ? []
              : categoryId === undefined
              ? // No need for filtering since categoryId is undefined
                _prevList.data
              : _prevList.data.filter((postPage) => {
                  if (typeof categoryId === 'string') {
                    return postPage.post.categoryId === categoryId;
                  } else if (categoryId instanceof Array && postPage.post.categoryId) {
                    return categoryId.includes(postPage.post.categoryId);
                  } else if (categoryId === null) {
                    return !postPage.post.categoryId;
                  }
                  return false;
                });

            _prevList.data = [...previousDataToKeep, ...filteredPosts].map((post) => {
              const user = members.find((member) => member.id === post.createdBy);
              return { ...post, user };
            });
            _prevList.hasNext = foundPosts.hasNext;

            return {
              ..._prevList
            };
          });
          setIsLoadingMore(false);
        }, generatePostRefreshTimeout());
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
  }, [bottomPostReached, members, currentSpace, posts, isLoadingMore, categoryId]);

  return (
    <>
      <CreateForumPost />
      {error && <Alert severity='error'>There was an unexpected error while loading the posts</Alert>}

      {posts?.data.map((post) => (
        <ForumPost key={post.id} {...post} />
      ))}
      {isLoadingMore && <ForumPostSkeleton />}
      <Box ref={ref}>{posts?.hasNext === false && <Alert severity='info'>No more posts to show</Alert>}</Box>
    </>
  );
}
