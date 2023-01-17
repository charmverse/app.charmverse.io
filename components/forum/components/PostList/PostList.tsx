import ClearIcon from '@mui/icons-material/Clear';
import ReplayIcon from '@mui/icons-material/Replay';
import { Box, Divider, Typography, IconButton, Stack } from '@mui/material';
import type { AlertProps } from '@mui/material/Alert';
import MuiAlert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useSWRInfinite from 'swr/infinite';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useForumCategories } from 'hooks/useForumCategories';
import { useMembers } from 'hooks/useMembers';
import useOnScreen from 'hooks/useOnScreen';
import { useUser } from 'hooks/useUser';
import { useWebSocketClient } from 'hooks/useWebSocketClient';
import type { PostOrder } from 'lib/forums/posts/listForumPosts';
import type { WebSocketPayload } from 'lib/websockets/interfaces';

import { PostCard } from './components/PostCard';
import { PostSkeleton } from './components/PostSkeleton';

interface ForumPostsProps {
  search: string;
  categoryId?: string;
  sort?: PostOrder;
}

const resultsPerQuery = 10;

const Alert = forwardRef<HTMLDivElement, AlertProps>((props, ref) => {
  return <MuiAlert elevation={6} ref={ref} variant='filled' {...props} />;
});

export function ForumPostList({ search, categoryId, sort }: ForumPostsProps) {
  const ref = useRef();
  const currentSpace = useCurrentSpace();
  const bottomPostReached = useOnScreen(ref);
  const [morePostsAvailable, setMorePostsAvailable] = useState(false);
  const { members } = useMembers();
  const { user } = useUser();
  const { subscribe } = useWebSocketClient();
  const { categories } = useForumCategories();

  const {
    data: postsData,
    error: postsError,
    size: postsSize,
    setSize: setPostsSize,
    isLoading: isLoadingPosts,
    mutate: mutatePosts
  } = useSWRInfinite(
    (index) =>
      currentSpace && !search
        ? `forums/posts?spaceId=${currentSpace?.id}&page=${index}&category=${categoryId}&sort=${sort}`
        : null,
    (args) =>
      charmClient.forum.listForumPosts({
        spaceId: currentSpace?.id ?? '',
        categoryId: args.arguments.categoryId,
        count: resultsPerQuery,
        page: args.arguments.page,
        sort: args.arguments.sort
      })
  );

  const {
    data: searchData,
    error: searchError,
    size: searchSize,
    setSize: setSearchSize,
    isLoading: isLoadingSearch
  } = useSWRInfinite(
    (index) => (currentSpace && search ? { url: 'forums/posts/search', arguments: { page: index, search } } : null),
    (args) =>
      charmClient.forum.searchForumPosts({
        spaceId: currentSpace!.id,
        search: args.arguments.search,
        count: resultsPerQuery,
        page: args.arguments.page
      })
  );

  const dataError =
    postsError?.message ?? searchError?.message ?? 'There was an unexpected error while loading the posts';

  const hasNext = useMemo(
    () => (search && searchData ? searchData.at(-1)?.hasNext === true : postsData?.at(-1)?.hasNext === true),
    [search, postsData, searchData]
  );

  const postsToShow = (search && searchData ? searchData : postsData ?? []).map((post) => post.data).flat();

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
    mutatePosts();
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
      bottomPostReached &&
      !isLoadingPosts &&
      !isLoadingSearch &&
      hasNext
    ) {
      if (search) {
        setSearchSize(searchSize + 1);
      } else {
        setPostsSize(postsSize + 1);
      }
    }
  }, [currentSpace, members, bottomPostReached, isLoadingPosts, isLoadingSearch, hasNext]);

  return (
    <>
      {(postsError || searchError) && <Alert severity='error'>{dataError}</Alert>}
      {postsToShow.map((post) => (
        <PostCard
          key={post.id}
          user={members.find((item) => item.id === post.createdBy)}
          category={categories.find((cat) => cat.id === post.categoryId)}
          post={post}
        />
      ))}
      {(isLoadingPosts || isLoadingSearch) && !hasNext && <PostSkeleton />}
      {!hasNext && (
        <>
          <Divider flexItem sx={{ mb: 4 }} />
          <Box display='flex' alignItems='center' justifyContent='center'>
            <Typography variant='body2' color='secondary'>
              {search && postsToShow.length === 0 ? 'Your search results are empty' : 'No more posts to show'}
            </Typography>
          </Box>
        </>
      )}
      <Box ref={ref} display={isLoadingPosts || isLoadingSearch || !hasNext ? 'none' : 'block'} />

      <Stack spacing={2} sx={{ width: '100%', position: 'fixed', zIndex: 5000 }}>
        <Snackbar
          open={morePostsAvailable && !search}
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
