import ClearIcon from '@mui/icons-material/Clear';
import ReplayIcon from '@mui/icons-material/Replay';
import { IconButton, Stack } from '@mui/material';
import type { AlertProps } from '@mui/material/Alert';
import MuiAlert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { Box } from '@mui/system';
import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMembers } from 'hooks/useMembers';
import useOnScreen from 'hooks/useOnScreen';
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

const Alert = forwardRef<HTMLDivElement, AlertProps>((props, ref) => {
  return <MuiAlert elevation={6} ref={ref} variant='filled' {...props} />;
});

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
  const [isOpen, setIsOpen] = useState(false);
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
        setIsOpen(true);
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
      <Stack spacing={2} sx={{ width: '100%', position: 'fixed', zIndex: 5000 }}>
        <Snackbar
          open={isOpen}
          autoHideDuration={10000}
          anchorOrigin={{
            horizontal: 'center',
            vertical: 'top'
          }}
          onClose={() => setIsOpen(false)}
          sx={{
            '& .MuiAlert-action': {
              alignItems: 'center',
              gap: 1
            }
          }}
        >
          <Alert
            action={[
              <Button
                key='reload'
                variant='outlined'
                onClick={() => {
                  if (createPostBoxRef.current) {
                    createPostBoxRef.current.scrollIntoView({
                      behavior: 'smooth'
                    });
                    loadMorePosts(true);
                    setIsOpen(false);
                  }
                }}
                size='small'
                startIcon={<ReplayIcon fontSize='small' />}
                color='inherit'
              >
                Fetch
              </Button>,
              <IconButton key='clear' onClick={() => setIsOpen(false)} color='inherit'>
                <ClearIcon fontSize='small' />
              </IconButton>
            ]}
            severity='info'
            sx={{ width: '100%', alignItems: 'center' }}
          >
            New posts ready to view
          </Alert>
        </Snackbar>
      </Stack>
    </>
  );
}
