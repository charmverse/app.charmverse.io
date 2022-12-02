import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/router';
import { useState } from 'react';

import { CenteredPageContent } from 'components/common/PageLayout/components/PageContent';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useForumFilters } from 'hooks/useForumFilters';
import useRoles from 'hooks/useRoles';
import type { CategoryIdQuery } from 'lib/forums/posts/listForumPosts';

import DesktopFilterMenu from './components/Filters/FilterList';
import MobileFilterMenu from './components/Filters/FilterSelect';
import ForumPosts from './components/ForumPosts';

export default function ForumPage() {
  const [search, setSearch] = useState('');
  const router = useRouter();

  const currentSpace = useCurrentSpace();
  const { categories } = useForumFilters();

  const [categoryId, setCategoryId] = useState<CategoryIdQuery>(router.query.categoryIds as CategoryIdQuery);

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
