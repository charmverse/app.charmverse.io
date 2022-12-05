import ReplayIcon from '@mui/icons-material/Replay';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Router, { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';

import Button from 'components/common/Button';
import { CenteredPageContent } from 'components/common/PageLayout/components/PageContent';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useForumFilters } from 'hooks/useForumFilters';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import { useWebSocketClient } from 'hooks/useWebSocketClient';
import type { CategoryIdQuery } from 'lib/forums/posts/listForumPosts';
import type { WebSocketPayload } from 'lib/websockets/interfaces';

import DesktopFilterMenu from './components/Filters/FilterList';
import MobileFilterMenu from './components/Filters/FilterSelect';
import ForumPosts from './components/ForumPosts';

export default function ForumPage() {
  const [search, setSearch] = useState('');
  const router = useRouter();
  const { user } = useUser();
  const currentSpace = useCurrentSpace();
  const { categories } = useForumFilters();
  const { subscribe } = useWebSocketClient();
  const { setActions, showMessage } = useSnackbar();

  const [categoryId, setCategoryId] = useState<CategoryIdQuery>(router.query.categoryIds as CategoryIdQuery);

  const handleNewPostEvent = useCallback(
    (postWithPage: WebSocketPayload<'post_created'>) => {
      if (
        user &&
        postWithPage.page?.createdBy !== user.id &&
        (categoryId ? postWithPage.categoryId === categoryId : true)
      ) {
        setActions([
          <Button
            key='reload'
            variant='outlined'
            onClick={() => {
              Router.reload();
            }}
            size='small'
            startIcon={<ReplayIcon fontSize='small' />}
            color='inherit'
          >
            Reload
          </Button>
        ]);
        showMessage('New posts ready to view');
      }
    },
    [user, categoryId]
  );

  useEffect(() => {
    const unsubscribeFromNewPost = subscribe('post_created', handleNewPostEvent);
    return () => {
      unsubscribeFromNewPost();
    };
  }, [handleNewPostEvent]);

  // eslint-disable-next-line @typescript-eslint/no-shadow
  function handleCategoryUpdate(categoryId: CategoryIdQuery) {
    const pathname = `/${currentSpace!.domain}/forum`;

    if (categoryId === null) {
      router.push({
        pathname,
        query: { categoryIds: null }
      });
      setCategoryId(categoryId);
    } else if (typeof categoryId === 'string' && categories?.some((c) => c.id === categoryId)) {
      router.push({
        pathname,
        query: { categoryIds: categoryId }
      });
      setCategoryId(categoryId);
    } else {
      router.push({
        pathname
      });
      setCategoryId(undefined);
    }
  }

  return (
    <CenteredPageContent>
      <Typography variant='h1' mb={2}>
        Forum
      </Typography>
      {/** Re-enable once we support searching for posts
             <TextField
        variant='outlined'
        placeholder='Search Posts, Comments and Members'
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        sx={{ padding: '20px 0' }}
        InputProps={{
          endAdornment: (
            <InputAdornment position='end'>
              <SearchIcon color='secondary' fontSize='small' />
            </InputAdornment>
          )
        }}
      />
         */}
      <Grid container spacing={2}>
        <Grid item xs={12} lg={9}>
          <Box display={{ xs: 'block', lg: 'none' }}>
            <MobileFilterMenu categoryIdSelected={handleCategoryUpdate} selectedCategory={categoryId} />
          </Box>
          <ForumPosts search={search} categoryId={categoryId} />
        </Grid>
        <Grid item xs={12} lg={3} display={{ xs: 'none', lg: 'initial' }}>
          <DesktopFilterMenu categoryIdSelected={handleCategoryUpdate} selectedCategory={categoryId} />
        </Grid>
      </Grid>
    </CenteredPageContent>
  );
}
