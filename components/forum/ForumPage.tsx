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
import { setUrlWithoutRerender } from 'lib/utilities/browser';

import { CategoryMenu } from './components/CategoryMenu';
import { CategorySelect } from './components/CategorySelect';
import CreateForumPost from './components/CreateForumPost';
import PostDialog from './components/PostDialog';
import { ForumPostList } from './components/PostList/PostList';

export default function ForumPage() {
  const [search, setSearch] = useState('');
  const router = useRouter();
  const currentSpace = useCurrentSpace();
  const categoryId = router.query.categoryId as string | undefined;
  const sort = router.query.sort as string | undefined;
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const { showPost } = usePostDialog();

  function handleCategoryUpdate(_categoryId?: string) {
    const pathname = `/${currentSpace?.domain}/forum`;

    if (_categoryId === null) {
      router.push({
        pathname,
        query: { _categoryId: null }
      });
    } else if (typeof _categoryId === 'string') {
      router.push({
        pathname,
        query: { _categoryId }
      });
    } else {
      router.push({
        pathname
      });
    }
  }

  function showNewPostPopup() {
    setShowNewPostForm(true);
  }

  function hideNewPostPopup() {
    setShowNewPostForm(false);
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
        placeholder='Search posts'
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
            <CategorySelect onSelect={handleCategoryUpdate} selectedCategory={categoryId} />
          </Box>
          <CreateForumPost onClick={showNewPostPopup} />
          {currentSpace && <PostDialog open={showNewPostForm} onClose={hideNewPostPopup} spaceId={currentSpace.id} />}
          <ForumPostList search={search} categoryId={categoryId} sort={sort} />
        </Grid>
        <Grid item xs={12} lg={3} display={{ xs: 'none', lg: 'initial' }}>
          <CategoryMenu />
        </Grid>
      </Grid>
    </CenteredPageContent>
  );
}
