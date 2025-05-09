import { log } from '@charmverse/core/log';
import type { PostCategory } from '@charmverse/core/prisma';
import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { debounce } from 'lodash';
import type { ChangeEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

import charmClient from 'charmClient';
import { CenteredPageContent } from 'components/common/PageLayout/components/PageContent';
import { usePostDialog } from 'components/forum/components/PostDialog/hooks/usePostDialog';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useForumCategories } from 'hooks/useForumCategories';
import { usePageTitle } from 'hooks/usePageTitle';
import type { PostSortOption } from '@packages/lib/forums/posts/constants';
import { setUrlWithoutRerender } from '@packages/lib/utils/browser';

import { CategoryMenu } from './components/CategoryMenu';
import { CategoryNotificationToggle } from './components/CategoryNotificationToggle';
import { CategorySelect } from './components/CategorySelect';
import { CreateForumPost } from './components/CreateForumPost';
import { PostSkeleton } from './components/PostList/components/PostSkeleton';
import { ForumPostList } from './components/PostList/PostList';
import { usePostCategoryPermissions } from './hooks/usePostCategoryPermissions';

export function ForumPage() {
  const [search, setSearch] = useState('');
  const { navigateToSpacePath, router } = useCharmRouter();
  const { space: currentSpace } = useCurrentSpace();
  const sort = router.query.sort as PostSortOption | undefined;
  const { createPost, hidePost, showPost } = usePostDialog();
  const { categories, isLoading: isCategoriesLoading, getPostableCategories } = useForumCategories();
  const [, setPageTitle] = usePageTitle();
  const [currentCategory, setCurrentCategory] = useState<PostCategory | null>(null);

  const { permissions: currentCategoryPermissions } = usePostCategoryPermissions(currentCategory?.id ?? null);
  // Allow user to create a post either if they are in "All categories and there is at least one category they can post to, OR they are in a specific category and they have permission to post there"
  let disableCreatePost = false;
  let disabledCreatePostTooltip = '';

  if (getPostableCategories().length === 0) {
    disableCreatePost = true;
    disabledCreatePostTooltip = 'You cannot create posts in this space';
  } else if (currentCategory && currentCategoryPermissions?.create_post === false) {
    disableCreatePost = true;
    disabledCreatePostTooltip = `You do not have permission to create posts in the ${currentCategory.name} category`;
  }

  function setCategoryFromPath() {
    const categoryPath = router.query.categoryPath as string | undefined;
    const category = !categoryPath
      ? null
      : categories.find((_category) => _category.path === categoryPath || _category.name === categoryPath);
    setCurrentCategory(category ?? null);

    // User tried to navigate to a category they cannot access or does not exist, redirect them to forum home
    if (category === undefined && !isCategoriesLoading && currentSpace) {
      navigateToSpacePath(`/forum`);
    } else if (category && currentSpace) {
      charmClient.track.trackAction('main_feed_filtered', {
        categoryName: category.name,
        spaceId: currentSpace.id
      });
    }
  }

  function showNewPostPopup() {
    if (currentSpace) {
      createPost({
        spaceId: currentSpace.id,
        category: currentCategory
      });
    }
  }

  useEffect(() => {
    if (!router.isReady) {
      return;
    }
    if (typeof router.query.postId === 'string') {
      showPost({
        postId: router.query.postId,
        onClose() {
          setUrlWithoutRerender(router.pathname, { postId: null });
        }
      });
    } else if (!router.query.postId) {
      hidePost();
    }
  }, [router.isReady, router.query.postId]);

  const debounceSearch = useRef(debounce((e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value), 400)).current;

  useEffect(() => {
    return () => {
      debounceSearch.cancel();
    };
  }, [debounceSearch]);

  useEffect(() => {
    if (currentCategory?.name) {
      setPageTitle(currentCategory.name);
    }
  }, [currentCategory?.name]);

  useEffect(() => {
    setCategoryFromPath();
  }, [categories, router.query]);

  useEffect(() => {
    // show New popup if user navigated to /forum?new=1
    if (router.query.new && currentSpace) {
      showNewPostPopup();
    }
  }, [router.isReady, !!currentSpace]);

  return (
    <CenteredPageContent style={{ width: 1100 }}>
      <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
        <span>
          <Typography variant='h1' mb={2}>
            {currentCategory ? currentCategory?.name : 'All categories'}
          </Typography>
          {currentCategory?.description && (
            <Typography data-test='current-category-description' variant='body1' mt={2}>
              {currentCategory.description}
            </Typography>
          )}
        </span>
        {currentCategory && <CategoryNotificationToggle categoryId={currentCategory.id} />}
      </Box>
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
      <Box display='flex' gap={4}>
        <Box
          sx={{
            width: {
              xs: '100%',
              md: 640
            }
          }}
        >
          <Box display={{ md: 'none' }}>
            <CategorySelect selectedCategoryId={currentCategory?.id} selectedSort={sort} />
          </Box>
          <CreateForumPost
            disabled={disableCreatePost}
            disabledTooltip={disabledCreatePostTooltip}
            onClick={showNewPostPopup}
          />
          {isCategoriesLoading ? (
            <PostSkeleton />
          ) : (
            <ForumPostList search={search} categoryId={currentCategory?.id} sort={sort} />
          )}
        </Box>
        <Box flexGrow={1} display={{ xs: 'none', md: 'initial' }}>
          <CategoryMenu selectedSort={sort} selectedCategoryId={currentCategory?.id} />
        </Box>
      </Box>
    </CenteredPageContent>
  );
}
