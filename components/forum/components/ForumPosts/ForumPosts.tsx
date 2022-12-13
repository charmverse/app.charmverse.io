import ReplayIcon from '@mui/icons-material/Replay';
import Alert from '@mui/material/Alert';
import { Box } from '@mui/system';
import { useCallback, useEffect, useRef, useState } from 'react';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMembers } from 'hooks/useMembers';
import useOnScreen from 'hooks/useOnScreen';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import { useWebSocketClient } from 'hooks/useWebSocketClient';
import type { CategoryIdQuery, PaginatedPostList } from 'lib/forums/posts/listForumPosts';
import type { Member } from 'lib/members/interfaces';
import type { WebSocketPayload } from 'lib/websockets/interfaces';

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
  const createPostBoxRef = useRef<HTMLDivElement>(null);
  const { setActions, showMessage, setOrigin } = useSnackbar();

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
  const { user } = useUser();
  const [posts, setPosts] = useState<PaginatedPostList<{ user?: Member }> | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { subscribe } = useWebSocketClient();

  function loadMorePosts(refetch = false) {
    setIsLoadingMore(true);

    charmClient.forum
      .listForumPosts({
        spaceId: currentSpace!.id,
        categoryIds: categoryId,
        count: resultsPerQuery,
        page: refetch ? undefined : posts?.cursor
      })
      .then((foundPosts) => {
        setError(null);

        // UX improvement: add a delay so the user sees the post loading skeleton
        setTimeout(() => {
          setPosts((_prevList) => {
            if (!_prevList || refetch) {
              return foundPosts;
            }
            const filteredPosts = foundPosts.data.filter((post) => !posts?.data.find((i) => i.id === post.id));
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
              return { ...post, user: members.find((member) => member.id === post.createdBy) };
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

  const currentCategoryId =
    typeof categoryId === 'string' ? categoryId : Array.isArray(categoryId) ? categoryId[0] : null;

  const handlePostPublishEvent = useCallback(
    (postWithPage: WebSocketPayload<'post_published'>) => {
      if (
        user &&
        postWithPage?.createdBy !== user.id &&
        (currentCategoryId ? postWithPage.categoryId === currentCategoryId : true)
      ) {
        setActions([
          <Button
            key='reload'
            variant='outlined'
            onClick={() => {
              if (createPostBoxRef.current) {
                createPostBoxRef.current.scrollIntoView({
                  behavior: 'smooth'
                });
                loadMorePosts(true);
              }
            }}
            size='small'
            startIcon={<ReplayIcon fontSize='small' />}
            color='inherit'
          >
            Fetch
          </Button>
        ]);
        setOrigin({
          horizontal: 'center',
          vertical: 'top'
        });
        showMessage('New posts ready to view');
      }
    },
    [user, categoryId]
  );

  useEffect(() => {
    const unsubscribeFromPostPublishEvent = subscribe('post_published', handlePostPublishEvent);
    return () => {
      unsubscribeFromPostPublishEvent();
    };
  }, [handlePostPublishEvent]);

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
      <CreateForumPost ref={createPostBoxRef} />
      {error && <Alert severity='error'>There was an unexpected error while loading the posts</Alert>}

      {posts?.data.map((post) => (
        <ForumPost key={post.id} user={members.find((member) => member.id === post.createdBy)} {...post} />
      ))}
      {isLoadingMore && <ForumPostSkeleton />}
      <Box ref={ref}>{posts?.hasNext === false && <Alert severity='info'>No more posts to show</Alert>}</Box>
    </>
  );
}
