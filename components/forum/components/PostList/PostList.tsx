import ClearIcon from '@mui/icons-material/Clear';
import ReplayIcon from '@mui/icons-material/Replay';
import { Box, Divider, Typography, IconButton, Stack } from '@mui/material';
import type { AlertProps } from '@mui/material/Alert';
import MuiAlert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMembers } from 'hooks/useMembers';
import useOnScreen from 'hooks/useOnScreen';
import { useUser } from 'hooks/useUser';
import { useWebSocketClient } from 'hooks/useWebSocketClient';
import type { PaginatedPostList } from 'lib/forums/posts/listForumPosts';
import type { Member } from 'lib/members/interfaces';
import type { WebSocketPayload } from 'lib/websockets/interfaces';

import { PostCard } from './components/PostCard';
import { PostSkeleton } from './components/PostSkeleton';

interface ForumPostsProps {
  search: string;
  categoryId?: string;
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

export function ForumPostList({ search, categoryId }: ForumPostsProps) {
  const ref = useRef();
  const currentSpace = useCurrentSpace();
  const bottomPostReached = useOnScreen(ref);
  const [morePostsAvailable, setMorePostsAvailable] = useState(false);

  const { members } = useMembers();
  const { user } = useUser();
  const [posts, setPosts] = useState<PaginatedPostList | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { subscribe } = useWebSocketClient();

  useEffect(() => {
    // When loading mode changes, clear out the current list to switch between search and list data
    loadMorePosts(true);
  }, [search, categoryId]);

  function loadMorePosts(refetch = false) {
    if (currentSpace) {
      setIsLoadingMore(true);

      (!search
        ? charmClient.forum.listForumPosts({
            spaceId: currentSpace!.id,
            categoryId,
            count: resultsPerQuery,
            page: refetch ? undefined : posts?.cursor
          })
        : charmClient.forum.searchForumPosts({
            spaceId: currentSpace!.id,
            search,
            count: resultsPerQuery,
            page: refetch ? undefined : posts?.cursor,
            categoryId
          })
      )
        .then((foundPosts) => {
          if (error) {
            setError(null);
          }

          // UX improvement: add a delay so the user sees the post loading skeleton
          setTimeout(() => {
            setPosts((_prevList) => {
              if (!_prevList || refetch) {
                return foundPosts;
              }
              const filteredPosts = foundPosts.data.filter((post) => !_prevList?.data.find((i) => i.id === post.id));
              _prevList.cursor = foundPosts.cursor;

              const previousDataToKeep = !_prevList
                ? []
                : categoryId === undefined
                ? // No need for filtering since categoryId is undefined
                  _prevList.data
                : _prevList.data.filter((postPage) => {
                    if (typeof categoryId === 'string') {
                      return postPage.categoryId === categoryId;
                    } else if (categoryId === null) {
                      return !postPage.categoryId;
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
  }

  const currentCategoryId =
    typeof categoryId === 'string' ? categoryId : Array.isArray(categoryId) ? categoryId[0] : null;

  const handlePostPublishEvent = useCallback(
    (postWithPage: WebSocketPayload<'post_published'>) => {
      if (!currentCategoryId || postWithPage.categoryId === currentCategoryId) {
        if (postWithPage.createdBy === user?.id) {
          refreshPosts();
        } else {
          setMorePostsAvailable(true);
        }
      }
    },
    [user, categoryId]
  );

  function refreshPosts() {
    window.document.body.scrollIntoView({
      behavior: 'smooth'
    });
    loadMorePosts(true);
    setMorePostsAvailable(false);
  }

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
      members.length > 0 &&
      !isLoadingMore &&
      (!posts || (posts.hasNext && bottomPostReached))
    ) {
      loadMorePosts();
    }
  }, [bottomPostReached, members, currentSpace, isLoadingMore]);

  return (
    <>
      {error && <Alert severity='error'>There was an unexpected error while loading the posts</Alert>}
      {posts?.data.map((post) => (
        <PostCard key={post.id} user={members.find((member) => member.id === post.createdBy)} post={post} />
      ))}
      {isLoadingMore && <PostSkeleton />}
      {posts?.hasNext === false && (
        <>
          <Divider flexItem sx={{ mb: 4 }} />
          <Box display='flex' alignItems='center' justifyContent='center'>
            <Typography variant='body2' color='secondary'>
              No more posts to show
            </Typography>
          </Box>
        </>
      )}
      <Box ref={ref} display={isLoadingMore ? 'none' : 'block'} />

      <Stack spacing={2} sx={{ width: '100%', position: 'fixed', zIndex: 5000 }}>
        <Snackbar
          open={morePostsAvailable}
          autoHideDuration={10000}
          anchorOrigin={{
            horizontal: 'center',
            vertical: 'top'
          }}
          onClose={() => setMorePostsAvailable(false)}
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
                onClick={refreshPosts}
                size='small'
                startIcon={<ReplayIcon fontSize='small' />}
                color='inherit'
              >
                Fetch
              </Button>,
              <IconButton key='clear' onClick={() => setMorePostsAvailable(false)} color='inherit'>
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
