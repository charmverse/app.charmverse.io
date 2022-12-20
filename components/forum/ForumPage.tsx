import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { CenteredPageContent } from 'components/common/PageLayout/components/PageContent';
import { usePostDialog } from 'components/forum/components/PostDialog/hooks/usePostDialog';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useForumCategories } from 'hooks/useForumCategories';
import type { CategoryIdQuery, PaginatedPostList } from 'lib/forums/posts/listForumPosts';
import type { Member } from 'lib/members/interfaces';
import { setUrlWithoutRerender } from 'lib/utilities/browser';

import { CategoryMenu } from './components/CategoryMenu';
import { CategorySelect } from './components/CategorySelect';
import CreateForumPost from './components/CreateForumPost';
import { ForumPostList } from './components/PostList/PostList';

export default function ForumPage() {
  const [search, setSearch] = useState('');
  const router = useRouter();
  const currentSpace = useCurrentSpace();
  const { categories } = useForumCategories();
  const categoryIds = router.query.categoryIds;
  const { showPost } = usePostDialog();
  const [posts, setPosts] = useState<PaginatedPostList<{ user?: Member }> | null>(null);

  function handleCategoryUpdate(categoryId: CategoryIdQuery) {
    const pathname = `/${currentSpace?.domain}/forum`;

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
    if (typeof router.query.pageId === 'string') {
      showPost({
        postId: router.query.pageId,
        onClose() {
          setUrlWithoutRerender(router.pathname, { pageId: null });
        }
      });
    }
  }, [router.query.pageId]);

  return (
    <CenteredPageContent>
      <Typography variant='h1' mb={2}>
        Forum
      </Typography>

      <TextField
        variant='outlined'
        placeholder='Search Posts, Comments and Members'
        onChange={(e) => {
          setSearch(e.target.value);
        }}
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
      <Grid container spacing={2}>
        <Grid item xs={12} lg={9}>
          <Box display={{ lg: 'none' }}>
            <CategorySelect categoryIdSelected={handleCategoryUpdate} selectedCategory={categoryIds} />
          </Box>
          <CreateForumPost setPosts={setPosts} />
          <ForumPostList posts={posts} setPosts={setPosts} search={search} categoryId={categoryIds} />
        </Grid>
        <Grid item xs={12} lg={3} display={{ xs: 'none', lg: 'initial' }}>
          <CategoryMenu />
        </Grid>
      </Grid>
    </CenteredPageContent>
  );
}
