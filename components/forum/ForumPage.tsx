import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { debounce } from 'lodash';
import { useRouter } from 'next/router';
import type { ChangeEvent } from 'react';
import { useRef, useEffect, useState } from 'react';

import { CenteredPageContent } from 'components/common/PageLayout/components/PageContent';
import { usePostDialog } from 'components/forum/components/PostDialog/hooks/usePostDialog';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useForumCategories } from 'hooks/useForumCategories';
import type { PostOrder } from 'lib/forums/posts/listForumPosts';
import { setUrlWithoutRerender } from 'lib/utilities/browser';

import { CategoryMenu } from './components/CategoryMenu';
import { CategorySelect } from './components/CategorySelect';
import CreateForumPost from './components/CreateForumPost';
import PostDialog from './components/PostDialog';
import { ForumPostList } from './components/PostList/PostList';

export function ForumPage() {
  const [search, setSearch] = useState('');
  const router = useRouter();
  const currentSpace = useCurrentSpace();
  const categoryId = router.query.categoryId as string | undefined;
  const sort = router.query.sort as PostOrder | undefined;
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const { showPost } = usePostDialog();
  const { categories } = useForumCategories();
  const currentCategory = categories.find((category) => category.id === categoryId);

  function handleSortUpdate(sortName?: PostOrder) {
    const pathname = `/${currentSpace?.domain}/forum`;

    if (sortName) {
      router.push({
        pathname,
        query: { sort: sortName }
      });
    } else {
      router.push({
        pathname
      });
    }
  }

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

  const debounceSearch = useRef(debounce((e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value), 400)).current;

  useEffect(() => {
    return () => {
      debounceSearch.cancel();
    };
  }, [debounceSearch]);

  return (
    <CenteredPageContent>
      <Typography variant='h1' mb={2}>
        {`${currentCategory ? `${currentCategory?.name} - ` : ''}Forum`}
      </Typography>

      <TextField
        variant='outlined'
        placeholder='Search posts'
        onChange={debounceSearch}
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
            <CategorySelect
              selectedCategory={currentCategory?.id}
              sort={sort}
              handleCategory={handleCategoryUpdate}
              handleSort={handleSortUpdate}
            />
          </Box>
          <CreateForumPost onClick={showNewPostPopup} />
          {currentSpace && <PostDialog open={showNewPostForm} onClose={hideNewPostPopup} spaceId={currentSpace.id} />}
          <ForumPostList search={search} categoryId={currentCategory?.id} sort={sort} />
        </Grid>
        <Grid item xs={12} lg={3} display={{ xs: 'none', lg: 'initial' }}>
          <CategoryMenu />
        </Grid>
      </Grid>
    </CenteredPageContent>
  );
}
