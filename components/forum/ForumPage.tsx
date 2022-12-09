import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { usePageDialog } from 'components/common/PageDialog/hooks/usePageDialog';
import { CenteredPageContent } from 'components/common/PageLayout/components/PageContent';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useForumCategories } from 'hooks/useForumCategories';
import type { CategoryIdQuery } from 'lib/forums/posts/listForumPosts';
import { setUrlWithoutRerender } from 'lib/utilities/browser';

import DesktopFilterMenu from './components/ForumFilterList';
import MobileFilterMenu from './components/ForumFilterSelect';
import ForumPosts from './components/ForumPosts';

export default function ForumPage() {
  const [search, setSearch] = useState('');
  const router = useRouter();

  const currentSpace = useCurrentSpace();
  const { showPage } = usePageDialog();
  const { categories } = useForumCategories();
  const categoryIds = router.query.categoryIds ?? [];

  // eslint-disable-next-line @typescript-eslint/no-shadow
  function handleCategoryUpdate(categoryId: CategoryIdQuery) {
    const pathname = `/${currentSpace!.domain}/forum`;

    if (categoryId === null) {
      router.push({
        pathname,
        query: { categoryIds: null }
      });
    } else if (typeof categoryId === 'string' && categories?.some((c) => c.id === categoryId)) {
      router.push({
        pathname,
        query: { categoryIds: categoryId }
      });
    } else {
      router.push({
        pathname
      });
    }
  }

  useEffect(() => {
    if (typeof router.query.postId === 'string') {
      showPage({
        pageId: router.query.postId,
        onClose() {
          setUrlWithoutRerender(router.pathname, { postId: null });
        }
      });
    }
  }, [router.query.postId]);

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
            <MobileFilterMenu categoryIdSelected={handleCategoryUpdate} selectedCategory={categoryIds} />
          </Box>
          <ForumPosts search={search} categoryId={categoryIds} />
        </Grid>
        <Grid item xs={12} lg={3} display={{ xs: 'none', lg: 'initial' }}>
          <DesktopFilterMenu />
        </Grid>
      </Grid>
    </CenteredPageContent>
  );
}
